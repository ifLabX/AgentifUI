// --- BEGIN COMMENT ---
// SSO服务层统一导出
// 提供所有SSO相关服务的统一入口
// --- END COMMENT ---

// 基础服务和接口
export { BaseSSOService, type SSOServiceConfig, type SSOUserInfo } from './base-sso-service';

// 配置服务
export { SSOConfigService } from './sso-config-service';

// 服务工厂
export { SSOServiceFactory } from './sso-service-factory';

// 协议实现
export { CASService } from './cas-sso-service';

// 导入服务类用于内部使用
import { SSOConfigService } from './sso-config-service';
import { SSOServiceFactory } from './sso-service-factory';
import type { SsoProvider } from '@lib/types/database';

// --- BEGIN COMMENT ---
// 🎯 向后兼容的便捷函数
// 保持现有代码的兼容性
// --- END COMMENT ---

/**
 * 创建北京信息科技大学CAS服务实例（向后兼容）
 * @deprecated 推荐使用 SSOServiceFactory.createServiceByName('北京信息科技大学')
 */
export async function createBistuCASService() {
  console.warn('createBistuCASService is deprecated, use SSOServiceFactory.createServiceByName instead');
  
  try {
    // 尝试从数据库获取配置
    const service = await SSOServiceFactory.createServiceByName('北京信息科技大学');
    return service;
  } catch (error) {
    console.error('Failed to create BISTU CAS service from database:', error);
    
    // 回退到环境变量配置
    console.warn('Falling back to environment variable configuration for BISTU CAS');
    throw new Error('BISTU SSO provider not found in database. Please configure it through the admin interface.');
  }
}

/**
 * 获取所有启用的SSO提供商（用于登录页面）
 */
export async function getEnabledSSOProviders() {
  return SSOConfigService.getEnabledProviders();
}

/**
 * 检查SSO提供商是否可用
 */
export async function isProviderAvailable(providerId: string) {
  return SSOConfigService.isProviderAvailable(providerId);
}

/**
 * 预热SSO服务缓存
 * 建议在应用启动时调用
 */
export async function warmupSSOServices() {
  await Promise.all([
    SSOConfigService.warmupCache(),
    SSOServiceFactory.preloadServices()
  ]);
}

/**
 * 清除所有SSO缓存
 * 配置更新后调用
 */
export function clearSSOCache() {
  SSOServiceFactory.clearCache();
}

/**
 * 获取SSO系统状态信息
 * 用于监控和调试
 */
export async function getSSOSystemStatus() {
  try {
    const enabledProviders = await SSOConfigService.getEnabledProviders();
    const cacheStats = SSOServiceFactory.getCacheStats();
    const supportedProtocols = SSOServiceFactory.getSupportedProtocols();

    return {
      status: 'healthy',
      enabledProvidersCount: enabledProviders.length,
      enabledProviders: enabledProviders.map((p: SsoProvider) => ({
        id: p.id,
        name: p.name,
        protocol: p.protocol,
        displayOrder: p.display_order
      })),
      cacheStats,
      supportedProtocols,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
} 