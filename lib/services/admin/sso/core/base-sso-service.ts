// --- BEGIN COMMENT ---
// SSO服务抽象基类
// 为所有SSO协议（CAS、OIDC、SAML、OAuth2）提供统一接口
// 确保实现的一致性和可扩展性
// --- END COMMENT ---
import type { SSOUserInfo, SsoProvider } from '@lib/types/sso/admin-types';
import type { SSOAuthParams } from '@lib/types/sso/auth-types';

import { SSOUrlBuilder } from './url-builder';

// --- BEGIN COMMENT ---
// SSO服务抽象基类
// 所有具体的SSO协议服务都必须继承此类
// --- END COMMENT ---
export abstract class BaseSSOService {
  protected provider: SsoProvider;
  protected urlBuilder: SSOUrlBuilder;

  constructor(provider: SsoProvider) {
    this.provider = provider;
    this.urlBuilder = new SSOUrlBuilder();
  }

  // --- BEGIN COMMENT ---
  // 抽象方法：生成登录URL
  // 每个协议的实现必须提供具体的登录URL生成逻辑
  // --- END COMMENT ---
  abstract generateLoginURL(returnUrl?: string): string;

  // --- BEGIN COMMENT ---
  // 抽象方法：验证认证信息
  // 每个协议的实现必须提供具体的认证验证逻辑
  // --- END COMMENT ---
  abstract validateAuth(params: SSOAuthParams): Promise<SSOUserInfo>;

  // --- BEGIN COMMENT ---
  // 生成注销URL（通用实现）
  // 大多数协议的注销逻辑相似，可以使用通用实现
  // --- END COMMENT ---
  generateLogoutURL(returnUrl?: string): string {
    const config = this.provider.settings.protocol_config;

    if (!config.endpoints.logout) {
      throw new Error(
        `Logout endpoint not configured for provider: ${this.provider.name}`
      );
    }

    const logoutUrl = new URL(config.endpoints.logout, config.base_url);

    if (returnUrl) {
      const safeReturnUrl = this.urlBuilder.buildSafeReturnUrl(returnUrl);
      logoutUrl.searchParams.set('service', safeReturnUrl);
    }

    return logoutUrl.toString();
  }

  // --- BEGIN COMMENT ---
  // 获取提供商信息
  // --- END COMMENT ---
  getProvider(): SsoProvider {
    return this.provider;
  }

  // --- BEGIN COMMENT ---
  // 获取协议配置
  // --- END COMMENT ---
  getProtocolConfig() {
    return this.provider.settings.protocol_config;
  }

  // --- BEGIN COMMENT ---
  // 获取安全配置
  // --- END COMMENT ---
  getSecurityConfig() {
    return this.provider.settings.security;
  }

  // --- BEGIN COMMENT ---
  // 获取UI配置
  // --- END COMMENT ---
  getUIConfig() {
    return this.provider.settings.ui;
  }

  // --- BEGIN COMMENT ---
  // 验证提供商配置的完整性
  // --- END COMMENT ---
  protected validateProviderConfig(): void {
    if (!this.provider.enabled) {
      throw new Error(`SSO provider is disabled: ${this.provider.name}`);
    }

    const config = this.provider.settings.protocol_config;

    if (!config.base_url) {
      throw new Error(
        `Base URL not configured for provider: ${this.provider.name}`
      );
    }

    if (!config.endpoints) {
      throw new Error(
        `Endpoints not configured for provider: ${this.provider.name}`
      );
    }

    // 验证HTTPS要求
    if (
      this.provider.settings.security.require_https &&
      !config.base_url.startsWith('https://')
    ) {
      throw new Error(`HTTPS is required for provider: ${this.provider.name}`);
    }
  }

  // --- BEGIN COMMENT ---
  // 验证认证参数
  // --- END COMMENT ---
  protected validateAuthParams(
    params: SSOAuthParams,
    requiredParams: string[]
  ): void {
    for (const param of requiredParams) {
      if (!params[param]) {
        throw new Error(`Missing required authentication parameter: ${param}`);
      }
    }
  }

  // --- BEGIN COMMENT ---
  // 构建带超时的HTTP请求选项
  // --- END COMMENT ---
  protected buildRequestOptions(
    additionalHeaders?: Record<string, string>
  ): RequestInit {
    const config = this.provider.settings.protocol_config;
    const timeout = config.timeout || 10000;

    const headers: Record<string, string> = {
      'User-Agent': 'AgentifUI-SSO/1.0',
      Accept: 'text/plain,application/json',
      ...additionalHeaders,
    };

    return {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(timeout),
    };
  }

  // --- BEGIN COMMENT ---
  // 处理HTTP请求错误
  // --- END COMMENT ---
  protected handleRequestError(error: any, context: string): Error {
    if (error.name === 'AbortError') {
      return new Error(
        `${context} timed out after ${this.provider.settings.protocol_config.timeout || 10000}ms`
      );
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new Error(`${context} network error: ${error.message}`);
    }

    return new Error(`${context} failed: ${error.message || error}`);
  }

  // --- BEGIN COMMENT ---
  // 映射用户属性
  // 根据提供商配置的属性映射转换原始用户数据
  // --- END COMMENT ---
  protected mapUserAttributes(
    rawData: Record<string, any>
  ): Partial<SSOUserInfo> {
    const mapping = this.provider.settings.protocol_config.attributes_mapping;

    return {
      id: rawData[mapping.employee_id] || rawData[mapping.username],
      username: rawData[mapping.username],
      name: rawData[mapping.full_name] || rawData[mapping.username],
      email: mapping.email ? rawData[mapping.email] : null,
      provider: this.provider.name,
      raw: rawData,
    };
  }

  // --- BEGIN COMMENT ---
  // 日志记录方法
  // --- END COMMENT ---
  protected log(
    level: 'info' | 'warn' | 'error',
    message: string,
    data?: any
  ): void {
    const logMessage = `[SSO-${this.provider.protocol}] ${message}`;

    switch (level) {
      case 'info':
        console.log(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'error':
        console.error(logMessage, data);
        break;
    }
  }
}
