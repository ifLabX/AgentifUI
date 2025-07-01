// --- BEGIN COMMENT ---
// SSO服务统一导出文件
// 提供服务工厂和便捷的访问接口
// --- END COMMENT ---

// 核心服务
export { BaseSSOService } from './core/base-sso-service';
export { SSOServiceFactory } from './core/service-factory';
export { SSOUrlBuilder } from './core/url-builder';

// 协议服务
export { CASService } from './auth/cas-service';
export { OIDCService } from './auth/oidc-service';

// 数据服务
export { SSODatabaseService } from './data/sso-database-service';

// 用户服务
export { UserSyncService } from './user/user-sync-service';
export type { UserSyncResult, UserSyncConfig } from './user/user-sync-service';

// 便捷的服务创建函数
export async function createSSOService(
  provider: import('@lib/types/sso/admin-types').SsoProvider
) {
  const { SSOServiceFactory } = await import('./core/service-factory');
  return await SSOServiceFactory.createService(provider);
}

// 便捷的数据库服务创建函数
export function createSSODatabaseService(isServer: boolean = true) {
  const { SSODatabaseService } = require('./data/sso-database-service');
  return new SSODatabaseService(isServer);
}

// 便捷的用户同步服务创建函数
export function createUserSyncService(
  config?: Partial<import('./user/user-sync-service').UserSyncConfig>
) {
  const { UserSyncService } = require('./user/user-sync-service');
  return new UserSyncService(config);
}
