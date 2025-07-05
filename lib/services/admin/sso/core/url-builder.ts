// --- BEGIN COMMENT ---
// SSO URL构建工具
// 核心功能：正确构建CAS service参数，解决认证失败问题
// 确保所有SSO协议的URL构建都正确和安全
// --- END COMMENT ---
import { getSSOConfig } from '@lib/config/sso-config';
import type {
  SSOEnvironmentConfig,
  URLBuildOptions,
} from '@lib/types/sso/auth-types';

// --- BEGIN COMMENT ---
// SSO URL构建器类
// 负责构建所有SSO相关的URL，特别是解决CAS service参数问题
// --- END COMMENT ---
export class SSOUrlBuilder {
  private readonly config: SSOEnvironmentConfig;

  constructor() {
    this.config = getSSOConfig();
  }

  // --- BEGIN COMMENT ---
  // 构建SSO登录URL
  // 用于重定向用户到管理界面的SSO登录页面
  // --- END COMMENT ---
  buildLoginUrl(providerId: string, returnUrl?: string): string {
    const baseUrl = `${this.config.appUrl}/api/sso/${providerId}/login`;

    if (returnUrl) {
      const url = new URL(baseUrl);
      url.searchParams.set('returnUrl', returnUrl);
      return url.toString();
    }

    return baseUrl;
  }

  // --- BEGIN COMMENT ---
  // 构建SSO回调URL (CAS service参数) - 核心修复
  // 这是解决CAS认证失败问题的关键方法
  // --- END COMMENT ---
  buildCallbackUrl(providerId: string): string {
    return `${this.config.appUrl}/api/sso/${providerId}/callback`;
  }

  // --- BEGIN COMMENT ---
  // 构建CAS service参数 - 解决认证失败问题的核心方法
  // service参数必须与CAS服务器验证时使用的URL完全一致
  // --- END COMMENT ---
  buildCASServiceUrl(providerId: string, returnUrl?: string): string {
    const callbackUrl = this.buildCallbackUrl(providerId);

    if (returnUrl) {
      const url = new URL(callbackUrl);
      url.searchParams.set('returnUrl', returnUrl);
      return url.toString();
    }

    return callbackUrl;
  }

  // --- BEGIN COMMENT ---
  // 构建SSO注销URL
  // --- END COMMENT ---
  buildLogoutUrl(providerId: string, returnUrl?: string): string {
    const baseUrl = `${this.config.appUrl}/api/sso/${providerId}/logout`;

    if (returnUrl) {
      const url = new URL(baseUrl);
      url.searchParams.set('returnUrl', returnUrl);
      return url.toString();
    }

    return baseUrl;
  }

  // --- BEGIN COMMENT ---
  // 验证URL是否为允许的回调地址
  // 安全检查：确保回调URL属于当前应用域名
  // --- END COMMENT ---
  isValidCallbackUrl(url: string): boolean {
    try {
      console.log('isValidCallbackUrl', url);
      console.log('this.config.appUrl', this.config.appUrl);
      const parsedUrl = new URL(url);
      const configUrl = new URL(this.config.appUrl);

      // 检查协议和主机是否匹配
      return (
        parsedUrl.origin === configUrl.origin &&
        parsedUrl.pathname.startsWith('/api/sso/')
      );
    } catch {
      return false;
    }
  }

  // --- BEGIN COMMENT ---
  // 验证返回URL是否安全
  // 防止开放重定向攻击
  // --- END COMMENT ---
  isValidReturnUrl(returnUrl: string): boolean {
    try {
      // 相对路径URL（推荐）
      if (returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
        return true;
      }

      // 绝对URL需要验证域名
      const parsedUrl = new URL(returnUrl);
      const configUrl = new URL(this.config.appUrl);

      return parsedUrl.origin === configUrl.origin;
    } catch {
      return false;
    }
  }

  // --- BEGIN COMMENT ---
  // 构建安全的返回URL
  // 如果提供的返回URL不安全，返回默认的安全URL
  // --- END COMMENT ---
  buildSafeReturnUrl(returnUrl?: string): string {
    const defaultReturnUrl = '/admin/sso';

    if (!returnUrl) {
      return defaultReturnUrl;
    }

    return this.isValidReturnUrl(returnUrl) ? returnUrl : defaultReturnUrl;
  }

  // --- BEGIN COMMENT ---
  // 构建带参数的URL
  // 通用方法：安全地向URL添加查询参数
  // --- END COMMENT ---
  buildUrlWithParams(baseUrl: string, params: Record<string, string>): string {
    try {
      const url = new URL(baseUrl);

      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(key, value);
        }
      });

      return url.toString();
    } catch (error) {
      console.error('Failed to build URL with params:', error);
      return baseUrl;
    }
  }

  // --- BEGIN COMMENT ---
  // 获取URL构建配置信息（用于调试）
  // --- END COMMENT ---
  getConfig(): SSOEnvironmentConfig {
    return { ...this.config };
  }

  // --- BEGIN COMMENT ---
  // 构建管理界面专用的SSO URL
  // 专门用于管理员访问SSO提供商管理页面
  // --- END COMMENT ---
  buildAdminSSOUrl(
    action: 'list' | 'create' | 'edit',
    providerId?: string
  ): string {
    const baseUrl = `${this.config.appUrl}/admin/sso`;

    switch (action) {
      case 'list':
        return `${baseUrl}/providers`;
      case 'create':
        return `${baseUrl}/providers/create`;
      case 'edit':
        if (!providerId) {
          throw new Error('Provider ID is required for edit action');
        }
        return `${baseUrl}/providers/${providerId}`;
      default:
        return baseUrl;
    }
  }

  // --- BEGIN COMMENT ---
  // 构建API端点URL
  // 用于前端调用管理API
  // --- END COMMENT ---
  buildAPIUrl(endpoint: string, params?: Record<string, string>): string {
    const baseUrl = `${this.config.appUrl}/api/admin/sso/${endpoint}`;

    if (params) {
      return this.buildUrlWithParams(baseUrl, params);
    }

    return baseUrl;
  }
}
