// --- BEGIN COMMENT ---
// CAS SSO服务实现
// 继承BaseSSOService，实现CAS协议的具体逻辑
// --- END COMMENT ---

import { XMLParser } from 'fast-xml-parser';
import { BaseSSOService, type SSOUserInfo } from './base-sso-service';

// --- BEGIN COMMENT ---
// 🎯 CAS服务实现类
// 支持CAS 2.0和3.0协议
// --- END COMMENT ---
export class CASService extends BaseSSOService {
  private xmlParser: XMLParser;

  constructor(config: any) {
    super(config);
    
    // 验证配置
    this.validateConfig();
    
    // 初始化XML解析器
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: false,
    });

    this.logAuthEvent('CAS service initialized', {
      version: this.config.settings.protocol_config.version || '2.0',
      baseUrl: this.config.settings.protocol_config.base_url
    });
  }

  // --- BEGIN COMMENT ---
  // 🎯 生成CAS登录URL
  // --- END COMMENT ---
  generateLoginURL(returnUrl?: string): string {
    try {
      const protocolConfig = this.config.settings.protocol_config;
      const safeReturnUrl = this.validateReturnUrl(returnUrl);
      const serviceUrl = this.generateCallbackURL(safeReturnUrl);
      
      const params = new URLSearchParams({ service: serviceUrl });
      const loginEndpoint = protocolConfig.endpoints?.login || '/login';
      const loginUrl = `${protocolConfig.base_url}${loginEndpoint}?${params.toString()}`;
      
      this.logAuthEvent('Generated login URL', {
        returnUrl: safeReturnUrl,
        serviceUrl,
        loginUrl: loginUrl.replace(/ticket=[^&]*/, 'ticket=***') // 隐藏敏感信息
      });
      
      return loginUrl;
    } catch (error) {
      this.logAuthEvent('Failed to generate login URL', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 生成CAS注销URL
  // --- END COMMENT ---
  generateLogoutURL(returnUrl?: string): string {
    try {
      const protocolConfig = this.config.settings.protocol_config;
      const params = new URLSearchParams();
      
      if (returnUrl) {
        const safeReturnUrl = this.validateReturnUrl(returnUrl);
        // 对于CAS注销，使用完整URL而不是相对路径
        const appUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (appUrl) {
          params.set('service', `${appUrl}${safeReturnUrl}`);
        }
      }

      const logoutEndpoint = protocolConfig.endpoints?.logout || '/logout';
      const logoutUrl = `${protocolConfig.base_url}${logoutEndpoint}${params.toString() ? '?' + params.toString() : ''}`;
      
      this.logAuthEvent('Generated logout URL', {
        returnUrl,
        logoutUrl
      });
      
      return logoutUrl;
    } catch (error) {
      this.logAuthEvent('Failed to generate logout URL', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 验证CAS认证回调
  // --- END COMMENT ---
  async validateAuth(params: { ticket: string; service: string }): Promise<SSOUserInfo> {
    const { ticket, service } = params;
    
    try {
      this.logAuthEvent('Starting CAS ticket validation', {
        hasTicket: !!ticket,
        serviceUrl: service
      });

      if (!ticket) {
        throw new Error('CAS ticket is missing');
      }

      if (!service) {
        throw new Error('Service URL is missing');
      }

      const protocolConfig = this.config.settings.protocol_config;
      const version = protocolConfig.version || '2.0';
      
      // 根据版本选择验证端点
      const validateEndpoint = version === '3.0' 
        ? (protocolConfig.endpoints?.validate_v3 || '/p3/serviceValidate')
        : (protocolConfig.endpoints?.validate || '/serviceValidate');

      const validateParams = new URLSearchParams({ service, ticket });
      const validateUrl = `${protocolConfig.base_url}${validateEndpoint}?${validateParams.toString()}`;
      
      this.logAuthEvent('Validating ticket with CAS server', {
        version,
        endpoint: validateEndpoint,
        validateUrl: validateUrl.replace(/ticket=[^&]*/, 'ticket=***')
      });

      // 发送验证请求
      const response = await fetch(validateUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml, text/xml',
          'User-Agent': 'AgentifUI-SSO-Client/2.0',
        },
        signal: AbortSignal.timeout(protocolConfig.timeout || 10000),
      });

      if (!response.ok) {
        throw new Error(`CAS server responded with ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      this.logAuthEvent('Received CAS validation response', {
        status: response.status,
        hasContent: !!xmlText
      });

      return this.parseValidationResponse(xmlText);
    } catch (error) {
      return this.handleAuthError(error instanceof Error ? error : new Error(String(error)), 'validateAuth');
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 解析CAS验证响应
  // --- END COMMENT ---
  private parseValidationResponse(xmlText: string): SSOUserInfo {
    try {
      const parsed = this.xmlParser.parse(xmlText);
      const serviceResponse = parsed['cas:serviceResponse'];

      if (!serviceResponse) {
        throw new Error('Invalid CAS response format: missing cas:serviceResponse');
      }

      // 认证成功的情况
      if (serviceResponse['cas:authenticationSuccess']) {
        const success = serviceResponse['cas:authenticationSuccess'];
        const user = success['cas:user'];
        const attributes = success['cas:attributes'] || {};

        if (!user) {
          throw new Error('CAS response missing user information');
        }

        const mapping = this.config.settings.protocol_config.attributes_mapping || {};
        const userInfo: SSOUserInfo = {
          username: String(user),
          employeeNumber: String(user), // 默认使用用户名作为工号
          fullName: String(attributes[mapping.full_name || 'cas:name'] || user),
          email: attributes[mapping.email || 'cas:mail'] ? String(attributes[mapping.email || 'cas:mail']) : undefined,
          success: true,
          attributes: this.cleanAttributes(attributes),
          rawResponse: xmlText,
        };

        this.logAuthEvent('CAS authentication successful', {
          username: userInfo.username,
          employeeNumber: userInfo.employeeNumber,
          hasFullName: !!userInfo.fullName,
          hasEmail: !!userInfo.email,
          attributeCount: Object.keys(userInfo.attributes || {}).length
        });

        return userInfo;
      }

      // 认证失败的情况
      if (serviceResponse['cas:authenticationFailure']) {
        const failure = serviceResponse['cas:authenticationFailure'];
        const errorCode = failure['@_code'] || 'UNKNOWN_ERROR';
        const errorMessage = typeof failure === 'string' ? failure : failure['#text'] || 'Authentication failed';

        this.logAuthEvent('CAS authentication failed', {
          errorCode,
          errorMessage
        });

        return {
          employeeNumber: '',
          username: '',
          success: false,
          errorMessage: `CAS认证失败: ${errorMessage}`,
          attributes: {
            error_code: errorCode,
            error_message: errorMessage,
          },
          rawResponse: xmlText,
        };
      }

      throw new Error('Unexpected CAS response format: no success or failure element');
    } catch (error) {
      this.logAuthEvent('Failed to parse CAS response', {
        error: error instanceof Error ? error.message : String(error),
        responseLength: xmlText.length
      });

      return {
        employeeNumber: '',
        username: '',
        success: false,
        errorMessage: '解析CAS响应失败',
        attributes: { 
          parse_error: error instanceof Error ? error.message : String(error),
          response_preview: xmlText.substring(0, 200) // 只记录前200字符
        },
        rawResponse: xmlText,
      };
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 清理CAS属性数据
  // 移除cas:前缀，统一属性格式
  // --- END COMMENT ---
  private cleanAttributes(attributes: any): Record<string, any> {
    const cleaned: Record<string, any> = {};
    
    Object.keys(attributes).forEach(key => {
      const cleanKey = key.startsWith('cas:') ? key.replace('cas:', '') : key;
      const value = attributes[key];
      
      // 确保值是字符串
      cleaned[cleanKey] = value !== null && value !== undefined ? String(value) : '';
    });

    return cleaned;
  }

  // --- BEGIN COMMENT ---
  // 🎯 重写配置验证，添加CAS特定检查
  // --- END COMMENT ---
  protected validateConfig(): void {
    super.validateConfig();
    
    const protocolConfig = this.config.settings.protocol_config;
    
    // CAS特定验证
    if (!protocolConfig.endpoints) {
      throw new Error('CAS endpoints configuration is missing');
    }

    const requiredEndpoints = ['login', 'logout', 'validate'] as const;
    for (const endpoint of requiredEndpoints) {
      if (!protocolConfig.endpoints[endpoint as keyof typeof protocolConfig.endpoints]) {
        throw new Error(`CAS ${endpoint} endpoint is missing`);
      }
    }

    // 验证版本
    const version = protocolConfig.version || '2.0';
    if (!['2.0', '3.0'].includes(version)) {
      throw new Error(`Unsupported CAS version: ${version}`);
    }

    // 验证属性映射
    if (!protocolConfig.attributes_mapping) {
      console.warn('CAS attributes mapping is not configured, using defaults');
    }

    this.logAuthEvent('CAS configuration validated', {
      version,
      hasAttributesMapping: !!protocolConfig.attributes_mapping,
      endpointsConfigured: Object.keys(protocolConfig.endpoints)
    });
  }

  // --- BEGIN COMMENT ---
  // 🎯 获取CAS特定的配置信息
  // --- END COMMENT ---
  getCASConfig() {
    const protocolConfig = this.config.settings.protocol_config;
    return {
      version: protocolConfig.version || '2.0',
      baseUrl: protocolConfig.base_url,
      endpoints: protocolConfig.endpoints,
      timeout: protocolConfig.timeout || 10000,
      attributesMapping: protocolConfig.attributes_mapping || {},
      securitySettings: this.config.settings.security || {}
    };
  }

  // --- BEGIN COMMENT ---
  // 🎯 测试CAS服务器连接
  // 验证登录端点的可达性
  // --- END COMMENT ---
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const protocolConfig = this.config.settings.protocol_config;
      const loginEndpoint = protocolConfig.endpoints?.login || '/login';
      const testUrl = `${protocolConfig.base_url}${loginEndpoint}`;
      
      this.logAuthEvent('Testing CAS server connection', { testUrl });
      
      const startTime = Date.now();
      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(protocolConfig.timeout || 10000)
      });
      const responseTime = Date.now() - startTime;

      const result = {
        success: response.ok,
        message: response.ok ? '连接成功' : `HTTP ${response.status}: ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          responseTime,
          url: testUrl,
          headers: Object.fromEntries(response.headers.entries())
        }
      };

      this.logAuthEvent('CAS connection test completed', {
        success: result.success,
        status: response.status,
        responseTime
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logAuthEvent('CAS connection test failed', { error: errorMessage });
      
      return {
        success: false,
        message: `连接失败: ${errorMessage}`,
        details: { error: errorMessage }
      };
    }
  }
} 