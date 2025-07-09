/**
 * 通用CAS统一认证服务
 * 支持标准CAS 2.0/3.0协议的客户端，配置化实现
 */
import { createClient } from '@lib/supabase/server';
import type { SsoProvider } from '@lib/types/database';
import { XMLParser } from 'fast-xml-parser';

// 通用CAS配置接口
export interface CASConfig {
  id: string; // SSO提供商ID
  name: string; // 提供商名称
  baseUrl: string; // CAS服务器基础URL
  serviceUrl: string; // 应用回调服务URL
  version: '2.0' | '3.0'; // CAS协议版本
  timeout: number; // 请求超时时间
  endpoints: {
    login: string;
    logout: string;
    validate: string;
    validate_v3?: string;
  };
  attributesMapping: {
    employee_id: string; // 学工号字段映射
    username: string; // 用户名字段映射
    full_name: string; // 全名字段映射
    email: string; // 邮箱字段映射
  };
  emailDomain: string; // 邮箱域名
}

// CAS返回的用户信息接口
export interface CASUserInfo {
  employeeNumber: string; // 学工号（主要标识）
  username: string; // 用户名
  success: boolean; // 验证是否成功
  attributes?: {
    name?: string; // 真实姓名
    username?: string; // 用户名
    [key: string]: any; // 其他可能的属性
  };
  rawResponse?: string; // 原始XML响应（调试用）
}

// CAS验证错误类型
export interface CASValidationError {
  code: string;
  message: string;
  details?: any;
}

/**
 * 通用CAS服务实现类
 */
export class GenericCASService {
  private config: CASConfig;
  private xmlParser: XMLParser;

  constructor(config: CASConfig) {
    this.config = config;

    // 初始化XML解析器，配置适合CAS响应的选项
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: false, // 禁用属性值自动类型转换
      trimValues: true,
    });
  }

  /**
   * 生成CAS登录URL
   * @param returnUrl 登录成功后重定向的URL（可选）
   * @returns CAS登录页面URL
   */
  generateLoginURL(returnUrl?: string): string {
    try {
      // 构建service参数，如果有returnUrl则附加到回调URL上
      const serviceUrl = returnUrl
        ? `${this.config.serviceUrl}?returnUrl=${encodeURIComponent(returnUrl)}`
        : this.config.serviceUrl;

      const params = new URLSearchParams({
        service: serviceUrl,
      });

      const loginUrl = `${this.config.baseUrl}${this.config.endpoints.login}?${params.toString()}`;

      console.log(
        `Generated CAS login URL for ${this.config.name}: ${loginUrl}`
      );
      return loginUrl;
    } catch (error) {
      console.error(
        `Failed to generate login URL for ${this.config.name}:`,
        error
      );
      throw new Error(
        `Failed to generate CAS login URL: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 生成CAS注销URL
   * @param returnUrl 注销后重定向的URL（可选）
   * @returns CAS注销页面URL
   */
  generateLogoutURL(returnUrl?: string): string {
    try {
      const params = new URLSearchParams();

      if (returnUrl) {
        params.set('service', returnUrl);
      }

      const logoutUrl = `${this.config.baseUrl}${this.config.endpoints.logout}${params.toString() ? '?' + params.toString() : ''}`;

      console.log(
        `Generated CAS logout URL for ${this.config.name}: ${logoutUrl}`
      );
      return logoutUrl;
    } catch (error) {
      console.error(
        `Failed to generate logout URL for ${this.config.name}:`,
        error
      );
      throw new Error(
        `Failed to generate CAS logout URL: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 验证CAS ticket并获取用户信息
   * @param ticket CAS返回的票据
   * @param service 服务URL（必须与登录时的service参数一致）
   * @returns 用户信息或验证失败结果
   */
  async validateTicket(ticket: string, service: string): Promise<CASUserInfo> {
    if (!ticket || !service) {
      console.error('Missing required parameters for ticket validation');
      return {
        employeeNumber: '',
        username: '',
        success: false,
      };
    }

    try {
      // 构建验证请求参数
      const params = new URLSearchParams({
        service: service,
        ticket: ticket,
      });

      // 根据配置选择验证端点
      const validateEndpoint =
        this.config.version === '3.0'
          ? this.config.endpoints.validate_v3 || this.config.endpoints.validate
          : this.config.endpoints.validate;

      const validateUrl = `${this.config.baseUrl}${validateEndpoint}?${params.toString()}`;

      console.log(
        `Validating ticket for ${this.config.name} at: ${validateUrl.replace(/ticket=[^&]+/, 'ticket=***')}`
      );

      // 发送验证请求
      const response = await fetch(validateUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/xml, text/xml',
          'User-Agent': 'AgentifUI-CAS-SSO-Client/1.0',
        },
        // 设置超时时间避免长时间等待
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      console.log(`Received CAS validation response from ${this.config.name}`);

      // 在CAS服务层也打印原始XML响应，方便调试
      console.log(`=== ${this.config.name} CAS服务层收到的原始XML ===`);
      console.log(xmlText);
      console.log(`=== ${this.config.name} CAS服务层XML响应结束 ===`);

      return this.parseValidationResponse(xmlText);
    } catch (error) {
      console.error(
        `CAS ticket validation failed for ${this.config.name}:`,
        error
      );
      return {
        employeeNumber: '',
        username: '',
        success: false,
        attributes: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * 解析CAS验证响应XML
   * @private
   * @param xmlText CAS返回的XML响应
   * @returns 解析后的用户信息
   */
  private parseValidationResponse(xmlText: string): CASUserInfo {
    try {
      console.log(`Parsing CAS response XML for ${this.config.name}...`);

      // 打印XML解析前的原始内容长度和前100个字符预览
      console.log(`XML长度: ${xmlText.length} 字符`);
      console.log(
        `XML预览: ${xmlText.substring(0, 200)}${xmlText.length > 200 ? '...' : ''}`
      );

      const parsed = this.xmlParser.parse(xmlText);

      // 打印解析后的完整JSON结构
      console.log(`=== ${this.config.name} XML解析后的完整结构 ===`);
      console.log(JSON.stringify(parsed, null, 2));
      console.log('=== 解析结构结束 ===');

      const serviceResponse = parsed['cas:serviceResponse'];

      if (!serviceResponse) {
        throw new Error('Invalid CAS response: missing cas:serviceResponse');
      }

      // 检查认证成功的情况
      if (serviceResponse['cas:authenticationSuccess']) {
        const success = serviceResponse['cas:authenticationSuccess'];
        const user = success['cas:user'];
        const attributes = success['cas:attributes'] || {};

        // 根据配置的属性映射提取用户信息
        const employeeNumber = String(
          this.extractAttribute(
            attributes,
            this.config.attributesMapping.employee_id
          ) ||
            user ||
            ''
        );
        const username = String(
          this.extractAttribute(
            attributes,
            this.config.attributesMapping.username
          ) ||
            user ||
            ''
        );
        const fullName = String(
          this.extractAttribute(
            attributes,
            this.config.attributesMapping.full_name
          ) || ''
        );

        console.log(
          `CAS authentication successful for ${this.config.name} - user: ${username}, employee: ${employeeNumber}, name: ${fullName}`
        );

        return {
          username,
          employeeNumber,
          success: true,
          attributes: {
            name: fullName,
            username: username,
            // 保存所有属性以备后续使用，移除 cas: 前缀
            ...Object.keys(attributes).reduce(
              (acc, key) => {
                if (key.startsWith('cas:')) {
                  const cleanKey = key.replace('cas:', '');
                  acc[cleanKey] = String(attributes[key] || '');
                }
                return acc;
              },
              {} as Record<string, any>
            ),
          },
          rawResponse: xmlText,
        };
      }
      // 检查认证失败的情况
      else if (serviceResponse['cas:authenticationFailure']) {
        const failure = serviceResponse['cas:authenticationFailure'];
        const errorCode = failure['@_code'] || 'UNKNOWN_ERROR';
        const errorMessage =
          typeof failure === 'string'
            ? failure
            : failure['#text'] || 'Authentication failed';

        console.error(
          `CAS authentication failed for ${this.config.name}: ${errorCode} - ${errorMessage}`
        );

        return {
          employeeNumber: '',
          username: '',
          success: false,
          attributes: {
            error_code: errorCode,
            error_message: errorMessage,
          },
          rawResponse: xmlText,
        };
      }

      throw new Error(
        'Unexpected CAS response format: no success or failure element found'
      );
    } catch (error) {
      console.error(
        `Failed to parse CAS response for ${this.config.name}:`,
        error
      );
      return {
        employeeNumber: '',
        username: '',
        success: false,
        attributes: {
          parse_error: error instanceof Error ? error.message : String(error),
        },
        rawResponse: xmlText,
      };
    }
  }

  /**
   * 从CAS属性中提取指定字段值
   * @private
   * @param attributes CAS属性对象
   * @param fieldName 字段名（支持cas:前缀）
   * @returns 字段值
   */
  private extractAttribute(attributes: any, fieldName: string): any {
    // 优先查找带cas:前缀的字段
    const casFieldName = fieldName.startsWith('cas:')
      ? fieldName
      : `cas:${fieldName}`;
    if (attributes[casFieldName] !== undefined) {
      return attributes[casFieldName];
    }

    // 回退到不带前缀的字段
    const plainFieldName = fieldName.replace('cas:', '');
    if (attributes[plainFieldName] !== undefined) {
      return attributes[plainFieldName];
    }

    return undefined;
  }

  /**
   * 获取当前配置信息
   * @returns 配置对象（敏感信息已屏蔽）
   */
  getConfig(): Partial<CASConfig> {
    return {
      id: this.config.id,
      name: this.config.name,
      baseUrl: this.config.baseUrl,
      version: this.config.version,
      // serviceUrl 可能包含敏感信息，仅返回域名部分
      serviceUrl: new URL(this.config.serviceUrl).origin + '/***',
    };
  }
}

/**
 * CAS配置服务 - 从数据库读取SSO提供商配置
 */
export class CASConfigService {
  /**
   * 根据提供商ID获取CAS配置
   * 使用安全的SECURITY DEFINER函数获取配置
   * @param providerId SSO提供商ID
   * @returns CAS配置对象
   */
  static async getCASConfig(providerId: string): Promise<CASConfig> {
    const supabase = await createClient();

    // 使用安全的SECURITY DEFINER函数获取完整配置
    const { data: providers, error } = await supabase.rpc(
      'get_sso_provider_config',
      { provider_id_param: providerId }
    );

    if (error) {
      throw new Error(`Failed to get CAS provider config: ${error.message}`);
    }

    const provider = providers?.[0];
    if (!provider || provider.protocol !== 'CAS') {
      throw new Error(`CAS provider not found or disabled: ${providerId}`);
    }

    const settings = provider.settings as any;
    const protocolConfig = settings.protocol_config || {};

    // 获取当前应用URL用于构建回调地址
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error(
        'NEXT_PUBLIC_APP_URL environment variable is required for SSO configuration'
      );
    }

    return {
      id: provider.id,
      name: provider.name,
      baseUrl: protocolConfig.base_url || '',
      serviceUrl: `${appUrl}/api/sso/${provider.id}/callback`,
      version: protocolConfig.version || '2.0',
      timeout: protocolConfig.timeout || 10000,
      endpoints: {
        login: protocolConfig.endpoints?.login || '/login',
        logout: protocolConfig.endpoints?.logout || '/logout',
        validate: protocolConfig.endpoints?.validate || '/serviceValidate',
        validate_v3:
          protocolConfig.endpoints?.validate_v3 || '/p3/serviceValidate',
      },
      attributesMapping: {
        employee_id:
          protocolConfig.attributes_mapping?.employee_id || 'cas:user',
        username: protocolConfig.attributes_mapping?.username || 'cas:username',
        full_name: protocolConfig.attributes_mapping?.full_name || 'cas:name',
        email: protocolConfig.attributes_mapping?.email || 'cas:mail',
      },
      emailDomain:
        this.extractEmailDomain(protocolConfig.base_url) || 'example.com',
    };
  }

  /**
   * 根据名称查找CAS提供商
   * @param name 提供商名称
   * @returns SSO提供商信息
   */
  static async findCASProviderByName(
    name: string
  ): Promise<SsoProvider | null> {
    const supabase = await createClient();

    const { data: provider, error } = await supabase
      .from('sso_providers')
      .select('*')
      .eq('name', name)
      .eq('protocol', 'CAS')
      .eq('enabled', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return provider;
  }

  /**
   * 获取所有启用的CAS提供商
   * @returns CAS提供商列表
   */
  static async getEnabledCASProviders(): Promise<SsoProvider[]> {
    const supabase = await createClient();

    const { data: providers, error } = await supabase
      .from('sso_providers')
      .select('*')
      .eq('protocol', 'CAS')
      .eq('enabled', true)
      .order('display_order');

    if (error) {
      throw error;
    }

    return providers || [];
  }

  /**
   * 创建通用CAS服务实例
   * @param providerId SSO提供商ID
   * @returns GenericCASService实例
   */
  static async createCASService(
    providerId: string
  ): Promise<GenericCASService> {
    const config = await this.getCASConfig(providerId);
    return new GenericCASService(config);
  }

  /**
   * 从基础URL提取邮箱域名
   * @private
   * @param baseUrl CAS服务器基础URL
   * @returns 邮箱域名
   */
  private static extractEmailDomain(baseUrl: string): string {
    try {
      const url = new URL(baseUrl);
      const hostname = url.hostname;
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        return parts.slice(-2).join('.');
      }
      return hostname;
    } catch {
      return 'example.com';
    }
  }
}
