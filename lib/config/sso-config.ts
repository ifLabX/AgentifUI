// --- BEGIN COMMENT ---
// SSO环境配置管理
// 解决NEXT_PUBLIC_APP_URL构建service地址的核心问题
// 确保认证流程稳定和安全
// --- END COMMENT ---
import type { SSOEnvironmentConfig } from '@lib/types/sso/auth-types';

// --- BEGIN COMMENT ---
// SSO环境配置获取函数
// 核心功能：正确处理NEXT_PUBLIC_APP_URL，解决认证失败问题
// --- END COMMENT ---
export function getSSOConfig(): SSOEnvironmentConfig {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL environment variable is required for SSO. ' +
        "Please set it to your application's base URL (e.g., https://example.com)"
    );
  }

  // --- BEGIN COMMENT ---
  // 标准化URL格式：移除末尾斜杠，确保URL格式一致
  // 这是解决service参数构建问题的关键步骤
  // --- END COMMENT ---
  const normalizedAppUrl = appUrl.replace(/\/$/, '');

  // --- BEGIN COMMENT ---
  // 验证URL格式的有效性
  // --- END COMMENT ---
  try {
    new URL(normalizedAppUrl);
  } catch (error) {
    throw new Error(
      `Invalid NEXT_PUBLIC_APP_URL format: ${appUrl}. ` +
        'Please provide a valid URL (e.g., https://example.com)'
    );
  }

  return {
    appUrl: normalizedAppUrl,
    enabledProtocols: (
      process.env.SSO_ENABLED_PROTOCOLS || 'CAS,OIDC,SAML,OAuth2'
    ).split(','),
    defaultTimeout: parseInt(process.env.SSO_DEFAULT_TIMEOUT || '10000'),
  };
}

// --- BEGIN COMMENT ---
// 验证SSO配置有效性
// --- END COMMENT ---
export function validateSSOConfig(): boolean {
  try {
    const config = getSSOConfig();

    // 验证必要配置项
    if (!config.appUrl) {
      console.error('SSO Config Error: appUrl is required');
      return false;
    }

    if (config.defaultTimeout < 1000) {
      console.error('SSO Config Error: defaultTimeout must be at least 1000ms');
      return false;
    }

    if (!config.enabledProtocols.length) {
      console.error('SSO Config Error: at least one protocol must be enabled');
      return false;
    }

    return true;
  } catch (error) {
    console.error('SSO Config Validation Failed:', error);
    return false;
  }
}

// --- BEGIN COMMENT ---
// 开发环境配置检查和警告
// --- END COMMENT ---
export function checkDevelopmentConfig(): void {
  if (process.env.NODE_ENV === 'development') {
    const config = getSSOConfig();

    if (
      config.appUrl.includes('localhost') ||
      config.appUrl.includes('127.0.0.1')
    ) {
      console.warn(
        '⚠️  SSO Development Warning: Using localhost URL for SSO. ' +
          'Some SSO providers may not accept localhost callbacks. ' +
          'Consider using ngrok or similar tools for testing.'
      );
    }

    if (
      !config.appUrl.startsWith('https://') &&
      !config.appUrl.includes('localhost')
    ) {
      console.warn(
        '⚠️  SSO Security Warning: Using HTTP instead of HTTPS. ' +
          'Most SSO providers require HTTPS in production.'
      );
    }
  }
}

// --- BEGIN COMMENT ---
// 获取SSO配置的安全版本（不包含敏感信息）
// 用于前端调试和日志记录
// --- END COMMENT ---
export function getSSOConfigSafe() {
  const config = getSSOConfig();
  return {
    appUrl: config.appUrl,
    enabledProtocols: config.enabledProtocols,
    defaultTimeout: config.defaultTimeout,
    isProduction: process.env.NODE_ENV === 'production',
    hasHttps: config.appUrl.startsWith('https://'),
  };
}
