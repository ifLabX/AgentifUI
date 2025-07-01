// --- BEGIN COMMENT ---
// SSO提供商服务门面
// 提供静态方法接口，简化API层的调用
// 封装数据库服务，提供更高级的业务逻辑
// --- END COMMENT ---
import type { SsoProtocol, SsoProvider } from '@lib/types/sso/admin-types';

import { SSODatabaseService } from './sso-database-service';

// --- BEGIN COMMENT ---
// SSO提供商服务类
// 提供静态方法接口，用于API层调用
// --- END COMMENT ---
export class SSOProviderService {
  // --- BEGIN COMMENT ---
  // 获取所有SSO提供商
  // --- END COMMENT ---
  static async getProviders(): Promise<SsoProvider[]> {
    const dbService = new SSODatabaseService(true);
    return await dbService.getAllProviders();
  }

  // --- BEGIN COMMENT ---
  // 根据ID获取提供商
  // --- END COMMENT ---
  static async getProviderById(id: string): Promise<SsoProvider | null> {
    const dbService = new SSODatabaseService(true);
    return await dbService.getProviderById(id);
  }

  // --- BEGIN COMMENT ---
  // 获取启用的提供商
  // --- END COMMENT ---
  static async getEnabledProviders(): Promise<SsoProvider[]> {
    const dbService = new SSODatabaseService(true);
    return await dbService.getActiveProviders();
  }

  // --- BEGIN COMMENT ---
  // 创建新的SSO提供商
  // --- END COMMENT ---
  static async createProvider(
    data: Omit<SsoProvider, 'id' | 'created_at' | 'updated_at'>
  ): Promise<SsoProvider> {
    const dbService = new SSODatabaseService(true);

    // 验证配置格式
    const validation = await dbService.validateProviderConfig(
      data as SsoProvider
    );
    if (!validation.valid) {
      throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
    }

    return await dbService.createProvider(data);
  }

  // --- BEGIN COMMENT ---
  // 更新SSO提供商
  // --- END COMMENT ---
  static async updateProvider(
    id: string,
    data: Partial<SsoProvider>
  ): Promise<SsoProvider> {
    const dbService = new SSODatabaseService(true);

    // 如果有设置更新，需要验证配置
    if (data.settings || data.protocol) {
      const existing = await dbService.getProviderById(id);
      if (!existing) {
        throw new Error('提供商不存在');
      }

      const updatedProvider = { ...existing, ...data } as SsoProvider;
      const validation =
        await dbService.validateProviderConfig(updatedProvider);
      if (!validation.valid) {
        throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
      }
    }

    return await dbService.updateProvider(id, data);
  }

  // --- BEGIN COMMENT ---
  // 删除SSO提供商
  // --- END COMMENT ---
  static async deleteProvider(id: string): Promise<void> {
    const dbService = new SSODatabaseService(true);
    return await dbService.deleteProvider(id);
  }

  // --- BEGIN COMMENT ---
  // 根据协议类型获取提供商
  // --- END COMMENT ---
  static async getProvidersByProtocol(
    protocol: SsoProtocol
  ): Promise<SsoProvider[]> {
    const dbService = new SSODatabaseService(true);
    return await dbService.getProvidersByProtocol(protocol);
  }

  // --- BEGIN COMMENT ---
  // 切换提供商状态
  // --- END COMMENT ---
  static async toggleProviderStatus(id: string): Promise<SsoProvider> {
    const dbService = new SSODatabaseService(true);
    return await dbService.toggleProviderStatus(id);
  }

  // --- BEGIN COMMENT ---
  // 验证提供商配置
  // --- END COMMENT ---
  static async validateProviderConfig(
    provider: SsoProvider
  ): Promise<{ valid: boolean; errors: string[] }> {
    const dbService = new SSODatabaseService(true);
    return await dbService.validateProviderConfig(provider);
  }

  // --- BEGIN COMMENT ---
  // 检查提供商名称是否已存在
  // --- END COMMENT ---
  static async isProviderNameExists(
    name: string,
    excludeId?: string
  ): Promise<boolean> {
    const dbService = new SSODatabaseService(true);
    return await dbService.isProviderNameExists(name, excludeId);
  }
}
