// --- BEGIN COMMENT ---
// 北京信息科技大学CAS统一认证服务
// 实现标准CAS 2.0/3.0协议的客户端
// --- END COMMENT ---
import { XMLParser } from 'fast-xml-parser';

// --- BEGIN COMMENT ---
// SSO配置接口
// --- END COMMENT ---
export interface BistuSSOConfig {
  baseUrl: string; // CAS服务器基础URL
  serviceUrl: string; // 应用回调服务URL
  version?: '2.0' | '3.0'; // CAS协议版本，默认2.0
}

// --- BEGIN COMMENT ---
// CAS返回的用户信息接口
// --- END COMMENT ---
export interface BistuUserInfo {
  employeeNumber: string; // 学工号（主要标识）
  username: string; // 用户名
  success: boolean; // 验证是否成功
  attributes?: {
    name?: string; // 真实姓名（来自cas:name）
    username?: string; // 学工号（来自cas:username）
    [key: string]: any; // 其他可能的属性
  };
  rawResponse?: string; // 原始XML响应（调试用）
}

// --- BEGIN COMMENT ---
// CAS验证错误类型
// --- END COMMENT ---
export interface CASValidationError {
  code: string;
  message: string;
  details?: any;
}

// --- BEGIN COMMENT ---
// 北京信息科技大学CAS服务实现类
// --- END COMMENT ---
export class BistuCASService {
  private config: BistuSSOConfig;
  private xmlParser: XMLParser;

  constructor(config: BistuSSOConfig) {
    this.config = {
      ...config,
      version: config.version || '2.0', // 默认使用CAS 2.0
    };

    // --- BEGIN COMMENT ---
    // 初始化XML解析器，配置适合CAS响应的选项
    // 禁用属性值解析，确保文本内容保持原始类型
    // --- END COMMENT ---
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
      // --- BEGIN COMMENT ---
      // 构建service参数，如果有returnUrl则附加到回调URL上
      // --- END COMMENT ---
      const serviceUrl = returnUrl
        ? `${this.config.serviceUrl}?returnUrl=${encodeURIComponent(returnUrl)}`
        : this.config.serviceUrl;

      const params = new URLSearchParams({
        service: serviceUrl,
      });

      const loginUrl = `${this.config.baseUrl}/login?${params.toString()}`;

      console.log(`Generated CAS login URL: ${loginUrl}`);
      return loginUrl;
    } catch (error) {
      console.error('Failed to generate login URL:', error);
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

      const logoutUrl = `${this.config.baseUrl}/logout${params.toString() ? '?' + params.toString() : ''}`;

      console.log(`Generated CAS logout URL: ${logoutUrl}`);
      return logoutUrl;
    } catch (error) {
      console.error('Failed to generate logout URL:', error);
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
  async validateTicket(
    ticket: string,
    service: string
  ): Promise<BistuUserInfo> {
    if (!ticket || !service) {
      console.error('Missing required parameters for ticket validation');
      return {
        employeeNumber: '',
        username: '',
        success: false,
      };
    }

    try {
      // --- BEGIN COMMENT ---
      // 构建验证请求参数
      // --- END COMMENT ---
      const params = new URLSearchParams({
        service: service,
        ticket: ticket,
      });

      // --- BEGIN COMMENT ---
      // 根据配置选择验证端点
      // --- END COMMENT ---
      const validateEndpoint =
        this.config.version === '3.0'
          ? '/p3/serviceValidate'
          : '/serviceValidate';

      const validateUrl = `${this.config.baseUrl}${validateEndpoint}?${params.toString()}`;

      console.log(
        `Validating ticket at: ${validateUrl.replace(/ticket=[^&]+/, 'ticket=***')}`
      );

      // --- BEGIN COMMENT ---
      // 发送验证请求
      // --- END COMMENT ---
      const response = await fetch(validateUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/xml, text/xml',
          'User-Agent': 'AgentifUI-BISTU-SSO-Client/1.0',
        },
        // --- BEGIN COMMENT ---
        // 设置超时时间避免长时间等待
        // --- END COMMENT ---
        signal: AbortSignal.timeout(10000), // 10秒超时
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      console.log('Received CAS validation response');

      // --- BEGIN COMMENT ---
      // 在CAS服务层也打印原始XML响应，方便调试
      // --- END COMMENT ---
      console.log('=== CAS服务层收到的原始XML ===');
      console.log(xmlText);
      console.log('=== CAS服务层XML响应结束 ===');

      return this.parseValidationResponse(xmlText);
    } catch (error) {
      console.error('CAS ticket validation failed:', error);
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
  private parseValidationResponse(xmlText: string): BistuUserInfo {
    try {
      console.log('Parsing CAS response XML...');

      // --- BEGIN COMMENT ---
      // 打印XML解析前的原始内容长度和前100个字符预览
      // --- END COMMENT ---
      console.log(`XML长度: ${xmlText.length} 字符`);
      console.log(
        `XML预览: ${xmlText.substring(0, 200)}${xmlText.length > 200 ? '...' : ''}`
      );

      const parsed = this.xmlParser.parse(xmlText);

      // --- BEGIN COMMENT ---
      // 打印解析后的完整JSON结构
      // --- END COMMENT ---
      console.log('=== XML解析后的完整结构 ===');
      console.log(JSON.stringify(parsed, null, 2));
      console.log('=== 解析结构结束 ===');
      const serviceResponse = parsed['cas:serviceResponse'];

      if (!serviceResponse) {
        throw new Error('Invalid CAS response: missing cas:serviceResponse');
      }

      // --- BEGIN COMMENT ---
      // 检查认证成功的情况
      // --- END COMMENT ---
      if (serviceResponse['cas:authenticationSuccess']) {
        const success = serviceResponse['cas:authenticationSuccess'];
        const user = success['cas:user'];
        const attributes = success['cas:attributes'] || {};

        // --- BEGIN COMMENT ---
        // 提取用户信息，根据北信科CAS实际返回结果：
        // - cas:user 是学工号（如：2021011221）
        // - cas:attributes 包含 cas:name（真实姓名）和 cas:username（学工号）
        // 确保所有字段都转换为字符串类型
        // --- END COMMENT ---
        const username = String(user || ''); // cas:user 字段，实际是学工号，确保为字符串
        const employeeNumber = String(user || ''); // 学工号就是 cas:user 字段的值，确保为字符串
        const realName = String(attributes['cas:name'] || ''); // 真实姓名
        const casUsername = String(attributes['cas:username'] || ''); // CAS中的username字段，通常也是学工号

        console.log(
          `CAS authentication successful for user: ${username}, employee: ${employeeNumber}, name: ${realName}, cas:username: ${casUsername}`
        );

        return {
          username,
          employeeNumber,
          success: true,
          attributes: {
            name: realName,
            username: casUsername, // cas:username字段，确保为字符串类型
            // --- BEGIN COMMENT ---
            // 保存所有属性以备后续使用，移除 cas: 前缀
            // --- END COMMENT ---
            ...Object.keys(attributes).reduce(
              (acc, key) => {
                if (key.startsWith('cas:')) {
                  const cleanKey = key.replace('cas:', '');
                  acc[cleanKey] = String(attributes[key] || ''); // 确保所有值都是字符串
                }
                return acc;
              },
              {} as Record<string, any>
            ),
          },
          rawResponse: xmlText,
        };
      }
      // --- BEGIN COMMENT ---
      // 检查认证失败的情况
      // --- END COMMENT ---
      else if (serviceResponse['cas:authenticationFailure']) {
        const failure = serviceResponse['cas:authenticationFailure'];
        const errorCode = failure['@_code'] || 'UNKNOWN_ERROR';
        const errorMessage =
          typeof failure === 'string'
            ? failure
            : failure['#text'] || 'Authentication failed';

        console.error(
          `CAS authentication failed: ${errorCode} - ${errorMessage}`
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
      console.error('Failed to parse CAS response:', error);
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
   * 验证学工号格式是否正确
   * @param employeeNumber 学工号
   * @returns 是否有效
   */
  static validateEmployeeNumber(employeeNumber: string): boolean {
    if (!employeeNumber || typeof employeeNumber !== 'string') {
      return false;
    }

    // --- BEGIN COMMENT ---
    // 根据北信科实际测试结果，学工号为10位数字（如：2021011221）
    // --- END COMMENT ---
    const pattern = /^\d{10}$/;
    return pattern.test(employeeNumber.trim());
  }

  /**
   * 获取当前配置信息
   * @returns 配置对象（敏感信息已屏蔽）
   */
  getConfig(): Partial<BistuSSOConfig> {
    return {
      baseUrl: this.config.baseUrl,
      version: this.config.version,
      // serviceUrl 可能包含敏感信息，仅返回域名部分
      serviceUrl: new URL(this.config.serviceUrl).origin + '/***',
    };
  }
}

// --- BEGIN COMMENT ---
// 创建默认的BISTU CAS服务实例
// 使用环境变量配置，便于部署时调整
// --- END COMMENT ---
export function createBistuCASService(): BistuCASService {
  // --- BEGIN COMMENT ---
  // ⚠️ 需要配置的环境变量:
  // BISTU_SSO_BASE_URL: 北信科CAS服务器地址，默认 https://sso.bistu.edu.cn
  // NEXT_PUBLIC_APP_URL: 当前应用的URL，用于构建回调地址
  // --- END COMMENT ---
  const baseUrl = process.env.BISTU_SSO_BASE_URL || 'https://sso.bistu.edu.cn';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL environment variable is required for SSO configuration'
    );
  }

  return new BistuCASService({
    baseUrl,
    serviceUrl: `${appUrl}/api/sso/bistu/callback`,
    version: '2.0', // 可通过环境变量 BISTU_CAS_VERSION 调整
  });
}
