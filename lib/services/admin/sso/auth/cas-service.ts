// --- BEGIN COMMENT ---
// CAS协议服务实现
// 核心功能：正确处理CAS认证流程，解决service参数构建问题
// 支持CAS 2.0和3.0协议，确保与北京信息科技大学等CAS系统兼容
// --- END COMMENT ---
import type { SSOUserInfo, SsoProvider } from '@lib/types/sso/admin-types';
import type {
  CASValidationResponse,
  SSOAuthParams,
} from '@lib/types/sso/auth-types';

import { BaseSSOService } from '../core/base-sso-service';

// --- BEGIN COMMENT ---
// CAS协议服务类
// 继承BaseSSOService，实现CAS协议特定的认证逻辑
// --- END COMMENT ---
export class CASService extends BaseSSOService {
  constructor(provider: SsoProvider) {
    super(provider);
    // 验证CAS特定配置
    this.validateCASConfig();
  }

  // --- BEGIN COMMENT ---
  // 生成CAS登录URL
  // 核心修复：使用正确的service参数构建
  // --- END COMMENT ---
  generateLoginURL(returnUrl?: string): string {
    this.validateProviderConfig();

    const config = this.getProtocolConfig();
    const serviceUrl = this.urlBuilder.buildCASServiceUrl(
      this.provider.id,
      returnUrl
    );

    // 构建CAS登录URL
    const loginUrl = new URL(config.endpoints.login, config.base_url);
    loginUrl.searchParams.set('service', serviceUrl);

    this.log('info', 'Generated CAS login URL', {
      providerId: this.provider.id,
      serviceUrl,
      loginUrl: loginUrl.toString(),
    });

    return loginUrl.toString();
  }

  // --- BEGIN COMMENT ---
  // 验证CAS认证票据
  // 核心功能：处理CAS回调，验证票据有效性
  // --- END COMMENT ---
  async validateAuth(params: SSOAuthParams): Promise<SSOUserInfo> {
    this.validateProviderConfig();
    this.validateAuthParams(params, ['ticket', 'service']);

    const { ticket, service } = params;

    // 验证service参数是否为合法的回调URL
    if (!this.urlBuilder.isValidCallbackUrl(service!)) {
      throw new Error(`Invalid service URL: ${service}`);
    }

    this.log('info', 'Starting CAS ticket validation', {
      providerId: this.provider.id,
      ticket: ticket!.substring(0, 10) + '...',
      service,
    });

    try {
      const userInfo = await this.validateCASTicket(ticket!, service!);

      this.log('info', 'CAS validation successful', {
        providerId: this.provider.id,
        username: userInfo.username,
      });

      return userInfo;
    } catch (error) {
      this.log('error', 'CAS validation failed', {
        providerId: this.provider.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // --- BEGIN COMMENT ---
  // 验证CAS票据的核心实现
  // --- END COMMENT ---
  private async validateCASTicket(
    ticket: string,
    service: string
  ): Promise<SSOUserInfo> {
    const config = this.getProtocolConfig();
    const version = config.version || '2.0';

    // 根据CAS版本选择验证端点
    const validateEndpoint =
      version === '3.0' && config.endpoints.validate_v3
        ? config.endpoints.validate_v3
        : config.endpoints.validate;

    // 构建验证URL
    const validateUrl = new URL(validateEndpoint, config.base_url);
    validateUrl.searchParams.set('ticket', ticket);
    validateUrl.searchParams.set('service', service);

    // 对于CAS 3.0，添加format参数
    if (version === '3.0') {
      validateUrl.searchParams.set('format', 'JSON');
    }

    this.log('info', 'Validating CAS ticket', {
      validateUrl: validateUrl.toString(),
      version,
    });

    try {
      const response = await fetch(
        validateUrl.toString(),
        this.buildRequestOptions()
      );

      if (!response.ok) {
        throw new Error(
          `CAS validation request failed: ${response.status} ${response.statusText}`
        );
      }

      const responseText = await response.text();

      return version === '3.0'
        ? this.parseCAS3Response(responseText)
        : this.parseCAS2Response(responseText);
    } catch (error) {
      throw this.handleRequestError(error, 'CAS ticket validation');
    }
  }

  // --- BEGIN COMMENT ---
  // 解析CAS 2.0响应
  // 格式：yes\nusername 或 no\n
  // --- END COMMENT ---
  private parseCAS2Response(responseText: string): SSOUserInfo {
    const lines = responseText.trim().split('\n');

    if (lines.length < 2 || lines[0] !== 'yes') {
      throw new Error(
        'CAS authentication failed: Invalid or negative response'
      );
    }

    const username = lines[1];
    if (!username) {
      throw new Error('CAS authentication failed: No username in response');
    }

    // 使用属性映射构建用户信息
    const rawData = {
      'cas:user': username,
      'cas:username': username,
      'cas:name': username,
    };

    const mappedData = this.mapUserAttributes(rawData);

    return {
      id: mappedData.id || username,
      username: mappedData.username || username,
      email: mappedData.email || null,
      name: mappedData.name || username,
      provider: this.provider.name,
      raw: { cas_response: responseText, cas_version: '2.0' },
    };
  }

  // --- BEGIN COMMENT ---
  // 解析CAS 3.0响应 (JSON格式)
  // --- END COMMENT ---
  private parseCAS3Response(responseText: string): SSOUserInfo {
    try {
      const response = JSON.parse(responseText);

      if (!response.serviceResponse) {
        throw new Error('Invalid CAS 3.0 response format');
      }

      const serviceResponse = response.serviceResponse;

      if (serviceResponse.authenticationFailure) {
        const failure = serviceResponse.authenticationFailure;
        throw new Error(
          `CAS authentication failed: ${failure.description || failure.code}`
        );
      }

      if (!serviceResponse.authenticationSuccess) {
        throw new Error('CAS authentication failed: No success response');
      }

      const success = serviceResponse.authenticationSuccess;
      const username = success.user;

      if (!username) {
        throw new Error(
          'CAS authentication failed: No username in success response'
        );
      }

      // 处理属性
      const attributes = success.attributes || {};
      const rawData = {
        'cas:user': username,
        'cas:username': username,
        'cas:name': attributes.name || attributes.displayName || username,
        'cas:mail': attributes.mail || attributes.email,
        ...attributes,
      };

      const mappedData = this.mapUserAttributes(rawData);

      return {
        id: mappedData.id || username,
        username: mappedData.username || username,
        email: mappedData.email || null,
        name: mappedData.name || username,
        provider: this.provider.name,
        raw: { cas_response: responseText, cas_version: '3.0', attributes },
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('CAS 3.0 response is not valid JSON');
      }
      throw error;
    }
  }

  // --- BEGIN COMMENT ---
  // 验证CAS特定配置
  // --- END COMMENT ---
  private validateCASConfig(): void {
    const config = this.getProtocolConfig();
    const endpoints = config.endpoints;

    if (!endpoints.login) {
      throw new Error(
        `CAS provider ${this.provider.name} requires login endpoint`
      );
    }

    if (!endpoints.validate) {
      throw new Error(
        `CAS provider ${this.provider.name} requires validate endpoint`
      );
    }

    const mapping = config.attributes_mapping;
    if (!mapping.employee_id && !mapping.username) {
      throw new Error(
        `CAS provider ${this.provider.name} requires employee_id or username mapping`
      );
    }

    // 验证CAS版本
    const version = config.version;
    if (version && !['2.0', '3.0'].includes(version)) {
      throw new Error(
        `CAS provider ${this.provider.name} has invalid version: ${version}`
      );
    }
  }

  // --- BEGIN COMMENT ---
  // 获取CAS版本信息
  // --- END COMMENT ---
  getCASVersion(): string {
    return this.getProtocolConfig().version || '2.0';
  }

  // --- BEGIN COMMENT ---
  // 检查是否支持CAS 3.0特性
  // --- END COMMENT ---
  supportsCAS3Features(): boolean {
    return (
      this.getCASVersion() === '3.0' &&
      !!this.getProtocolConfig().endpoints.validate_v3
    );
  }
}
