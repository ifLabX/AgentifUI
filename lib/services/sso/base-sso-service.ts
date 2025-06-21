// --- BEGIN COMMENT ---
// SSO服务基础抽象类
// 定义所有SSO协议实现的统一接口
// --- END COMMENT ---

import type { SsoProvider, SsoProviderSettings } from '@lib/types/database';

// --- BEGIN COMMENT ---
// 🎯 SSO服务配置接口
// --- END COMMENT ---
export interface SSOServiceConfig {
  providerId: string;
  provider: SsoProvider;
  settings: SsoProviderSettings;
}

// --- BEGIN COMMENT ---
// 🎯 SSO用户信息接口
// 统一各协议返回的用户数据格式
// --- END COMMENT ---
export interface SSOUserInfo {
  employeeNumber: string;         // 工号/学号
  username: string;               // 用户名
  fullName?: string;              // 全名
  email?: string;                 // 邮箱
  success: boolean;               // 认证是否成功
  attributes?: Record<string, any>; // 原始属性数据
  rawResponse?: string;           // 原始响应数据（用于调试）
  errorMessage?: string;          // 错误信息
}

// --- BEGIN COMMENT ---
// 🎯 SSO服务抽象基类
// 所有SSO协议实现都必须继承此类
// --- END COMMENT ---
export abstract class BaseSSOService {
  protected config: SSOServiceConfig;
  
  constructor(config: SSOServiceConfig) {
    this.config = config;
  }

  // --- BEGIN COMMENT ---
  // 🎯 抽象方法：生成登录URL
  // 各协议需要实现自己的登录URL生成逻辑
  // --- END COMMENT ---
  abstract generateLoginURL(returnUrl?: string): string;

  // --- BEGIN COMMENT ---
  // 🎯 抽象方法：生成注销URL
  // 各协议需要实现自己的注销URL生成逻辑
  // --- END COMMENT ---
  abstract generateLogoutURL(returnUrl?: string): string;

  // --- BEGIN COMMENT ---
  // 🎯 抽象方法：验证认证回调
  // 各协议需要实现自己的票据/令牌验证逻辑
  // --- END COMMENT ---
  abstract validateAuth(params: Record<string, any>): Promise<SSOUserInfo>;

  // --- BEGIN COMMENT ---
  // 🎯 获取服务配置信息（脱敏版本）
  // 用于调试和监控，隐藏敏感信息
  // --- END COMMENT ---
  getConfig(): Partial<SSOServiceConfig> {
    return {
      providerId: this.config.providerId,
      provider: {
        ...this.config.provider,
        settings: {
          ...this.config.provider.settings,
          protocol_config: {
            ...this.config.provider.settings.protocol_config,
            // 隐藏敏感的base_url详细信息
            base_url: this.config.provider.settings.protocol_config.base_url 
              ? new URL(this.config.provider.settings.protocol_config.base_url).origin + '/***'
              : 'undefined',
          }
        }
      }
    };
  }

  // --- BEGIN COMMENT ---
  // 🎯 获取提供商基本信息
  // --- END COMMENT ---
  getProviderInfo() {
    return {
      id: this.config.provider.id,
      name: this.config.provider.name,
      protocol: this.config.provider.protocol,
      enabled: this.config.provider.enabled,
      buttonText: this.config.provider.button_text || this.config.provider.name,
      displayOrder: this.config.provider.display_order
    };
  }

  // --- BEGIN COMMENT ---
  // 🎯 验证配置完整性
  // 检查必要的配置项是否存在
  // --- END COMMENT ---
  protected validateConfig(): void {
    if (!this.config.provider) {
      throw new Error('SSO provider configuration is missing');
    }

    if (!this.config.provider.enabled) {
      throw new Error(`SSO provider "${this.config.provider.name}" is disabled`);
    }

    if (!this.config.settings.protocol_config) {
      throw new Error('Protocol configuration is missing');
    }

    if (!this.config.settings.protocol_config.base_url) {
      throw new Error('Base URL is required');
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 生成回调URL
  // 统一的回调URL生成逻辑
  // --- END COMMENT ---
  protected generateCallbackURL(returnUrl?: string): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is required');
    }

    const callbackUrl = `${appUrl}/api/sso/${this.config.providerId}/callback`;
    
    if (returnUrl) {
      return `${callbackUrl}?returnUrl=${encodeURIComponent(returnUrl)}`;
    }
    
    return callbackUrl;
  }

  // --- BEGIN COMMENT ---
  // 🎯 验证重定向URL安全性
  // 防止开放重定向攻击
  // --- END COMMENT ---
  protected validateReturnUrl(returnUrl: string | null | undefined): string {
    const allowedReturnUrls = ['/chat', '/dashboard', '/settings', '/apps', '/'];
    
    if (!returnUrl || !returnUrl.startsWith('/')) {
      return '/chat';
    }
    
    const isValidReturnUrl = allowedReturnUrls.includes(returnUrl) || 
      returnUrl.startsWith('/chat/') ||
      returnUrl.startsWith('/apps/');
      
    return isValidReturnUrl ? returnUrl : '/chat';
  }

  // --- BEGIN COMMENT ---
  // 🎯 记录认证日志
  // 用于审计和调试
  // --- END COMMENT ---
  protected logAuthEvent(event: string, details?: Record<string, any>): void {
    console.log(`[SSO-${this.config.provider.protocol}] ${event}`, {
      providerId: this.config.providerId,
      providerName: this.config.provider.name,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  // --- BEGIN COMMENT ---
  // 🎯 处理认证错误
  // 统一的错误处理和日志记录
  // --- END COMMENT ---
  protected handleAuthError(error: Error, context: string): SSOUserInfo {
    this.logAuthEvent(`Authentication failed in ${context}`, {
      error: error.message,
      stack: error.stack
    });

    return {
      employeeNumber: '',
      username: '',
      success: false,
      errorMessage: error.message,
      attributes: { 
        error_context: context,
        error_type: error.constructor.name 
      }
    };
  }
} 