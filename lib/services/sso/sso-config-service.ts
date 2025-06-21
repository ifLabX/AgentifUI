// --- BEGIN COMMENT ---
// SSO配置服务
// 统一管理SSO提供商配置，提供缓存和验证功能
// --- END COMMENT ---

import { 
  getAllSSOProviders, 
  getSSOProviderById,
  getSSOProviderByName,
  validateProviderConfig,
  testProviderConnection,
  type SSOProviderFilters,
  type ValidationResult,
  type TestResult
} from '@lib/db/sso-providers';
import type { SsoProvider, SsoProtocol } from '@lib/types/database';

// --- BEGIN COMMENT ---
// 🎯 SSO配置服务类
// 提供缓存机制和统一的配置管理接口
// --- END COMMENT ---
export class SSOConfigService {
  // 缓存配置
  private static cache = new Map<string, SsoProvider>();
  private static cacheExpiry = 5 * 60 * 1000; // 5分钟缓存
  private static lastCacheUpdate = 0;
  
  // 启用状态缓存
  private static enabledProvidersCache: SsoProvider[] | null = null;
  private static enabledProvidersCacheTime = 0;

  // --- BEGIN COMMENT ---
  // 🎯 获取所有启用的SSO提供商
  // 带缓存机制，减少数据库查询
  // --- END COMMENT ---
  static async getEnabledProviders(): Promise<SsoProvider[]> {
    try {
      // 检查缓存是否有效
      if (this.isEnabledProvidersCacheValid()) {
        return this.enabledProvidersCache!;
      }

      console.log('Fetching enabled SSO providers from database...');
      const providers = await getAllSSOProviders({
        enabled: true,
        orderBy: 'display_order',
        orderDirection: 'asc'
      });

      // 更新缓存
      this.enabledProvidersCache = providers;
      this.enabledProvidersCacheTime = Date.now();

      console.log(`Loaded ${providers.length} enabled SSO providers`);
      return providers;
    } catch (error) {
      console.error('Failed to get enabled SSO providers:', error);
      throw error;
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 根据ID获取SSO提供商配置（带缓存）
  // --- END COMMENT ---
  static async getProviderById(id: string): Promise<SsoProvider | null> {
    try {
      // 检查缓存
      if (this.isCacheValid() && this.cache.has(id)) {
        return this.cache.get(id)!;
      }

      console.log(`Fetching SSO provider ${id} from database...`);
      const provider = await getSSOProviderById(id);

      // 更新缓存
      if (provider) {
        this.cache.set(id, provider);
        this.lastCacheUpdate = Date.now();
      }

      return provider;
    } catch (error) {
      console.error(`Failed to get SSO provider ${id}:`, error);
      throw error;
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 根据名称获取SSO提供商配置
  // 用于向后兼容，查找特定提供商（如北京信息科技大学）
  // --- END COMMENT ---
  static async getProviderByName(name: string): Promise<SsoProvider | null> {
    try {
      console.log(`Fetching SSO provider by name: ${name}`);
      const provider = await getSSOProviderByName(name);
      
      // 如果找到，也加入缓存
      if (provider) {
        this.cache.set(provider.id, provider);
        this.lastCacheUpdate = Date.now();
      }

      return provider;
    } catch (error) {
      console.error(`Failed to get SSO provider by name ${name}:`, error);
      throw error;
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 获取所有SSO提供商（管理用）
  // 支持筛选和搜索
  // --- END COMMENT ---
  static async getAllProviders(filters?: SSOProviderFilters): Promise<SsoProvider[]> {
    try {
      console.log('Fetching all SSO providers for management...', filters);
      return await getAllSSOProviders(filters);
    } catch (error) {
      console.error('Failed to get all SSO providers:', error);
      throw error;
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 验证SSO配置
  // 支持多种验证规则
  // --- END COMMENT ---
  static async validateConfig(
    protocol: SsoProtocol,
    settings: any
  ): Promise<ValidationResult> {
    try {
      console.log(`Validating SSO config for protocol: ${protocol}`);
      
      const result = await validateProviderConfig(protocol, settings);
      
      // 添加额外的业务验证
      if (result.isValid) {
        const additionalValidation = this.performAdditionalValidation(protocol, settings);
        if (additionalValidation.warnings) {
          result.warnings = [...(result.warnings || []), ...additionalValidation.warnings];
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to validate SSO config:', error);
      return {
        isValid: false,
        errors: ['配置验证过程中发生错误']
      };
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 测试SSO连接
  // 验证配置的可达性
  // --- END COMMENT ---
  static async testConnection(providerId: string): Promise<TestResult> {
    try {
      console.log(`Testing SSO connection for provider: ${providerId}`);
      return await testProviderConnection(providerId);
    } catch (error) {
      console.error(`Failed to test SSO connection for ${providerId}:`, error);
      return {
        success: false,
        message: '连接测试过程中发生错误',
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 清除所有缓存
  // 配置更新时调用
  // --- END COMMENT ---
  static clearCache(): void {
    console.log('Clearing SSO config cache...');
    this.cache.clear();
    this.lastCacheUpdate = 0;
    this.enabledProvidersCache = null;
    this.enabledProvidersCacheTime = 0;
  }

  // --- BEGIN COMMENT ---
  // 🎯 清除特定提供商的缓存
  // --- END COMMENT ---
  static clearProviderCache(providerId: string): void {
    console.log(`Clearing cache for SSO provider: ${providerId}`);
    this.cache.delete(providerId);
    // 清除启用提供商缓存，因为可能影响列表
    this.enabledProvidersCache = null;
    this.enabledProvidersCacheTime = 0;
  }

  // --- BEGIN COMMENT ---
  // 🎯 预热缓存
  // 应用启动时调用，预加载常用配置
  // --- END COMMENT ---
  static async warmupCache(): Promise<void> {
    try {
      console.log('Warming up SSO config cache...');
      
      // 预加载启用的提供商
      await this.getEnabledProviders();
      
      // 预加载北京信息科技大学配置（向后兼容）
      const bistuProvider = await this.getProviderByName('北京信息科技大学');
      if (bistuProvider) {
        console.log('Loaded BISTU SSO provider for compatibility');
      }

      console.log('SSO config cache warmup completed');
    } catch (error) {
      console.error('Failed to warmup SSO config cache:', error);
      // 不抛出错误，避免影响应用启动
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 获取缓存统计信息
  // 用于监控和调试
  // --- END COMMENT ---
  static getCacheStats() {
    return {
      cacheSize: this.cache.size,
      lastCacheUpdate: this.lastCacheUpdate,
      cacheAge: Date.now() - this.lastCacheUpdate,
      isCacheValid: this.isCacheValid(),
      enabledProvidersCached: this.enabledProvidersCache !== null,
      enabledProvidersCacheAge: Date.now() - this.enabledProvidersCacheTime,
      isEnabledProvidersCacheValid: this.isEnabledProvidersCacheValid()
    };
  }

  // --- BEGIN COMMENT ---
  // 🎯 私有方法：检查缓存是否有效
  // --- END COMMENT ---
  private static isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpiry;
  }

  // --- BEGIN COMMENT ---
  // 🎯 私有方法：检查启用提供商缓存是否有效
  // --- END COMMENT ---
  private static isEnabledProvidersCacheValid(): boolean {
    return this.enabledProvidersCache !== null && 
           Date.now() - this.enabledProvidersCacheTime < this.cacheExpiry;
  }

  // --- BEGIN COMMENT ---
  // 🎯 私有方法：执行额外的业务验证
  // --- END COMMENT ---
  private static performAdditionalValidation(
    protocol: SsoProtocol, 
    settings: any
  ): { warnings?: string[] } {
    const warnings: string[] = [];

    // 检查生产环境安全设置
    if (process.env.NODE_ENV === 'production') {
      const security = settings.security;
      if (!security?.require_https) {
        warnings.push('生产环境建议启用HTTPS要求');
      }
      if (!security?.validate_certificates) {
        warnings.push('生产环境建议启用SSL证书验证');
      }
    }

    // 检查协议特定的最佳实践
    switch (protocol) {
      case 'CAS':
        if (settings.protocol_config?.version === '2.0') {
          warnings.push('建议使用CAS 3.0以获得更好的属性支持');
        }
        break;
      case 'OIDC':
        const scope = settings.protocol_config?.scope;
        if (!scope || !scope.includes('profile')) {
          warnings.push('建议在OIDC scope中包含profile以获取用户信息');
        }
        break;
    }

    return warnings.length > 0 ? { warnings } : {};
  }

  // --- BEGIN COMMENT ---
  // 🎯 检查提供商是否存在并启用
  // 快速检查方法，用于API路由
  // --- END COMMENT ---
  static async isProviderAvailable(providerId: string): Promise<boolean> {
    try {
      const provider = await this.getProviderById(providerId);
      return provider !== null && provider.enabled;
    } catch (error) {
      console.error(`Failed to check provider availability ${providerId}:`, error);
      return false;
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 获取提供商的基本信息（不含敏感配置）
  // 用于前端显示
  // --- END COMMENT ---
  static async getProviderPublicInfo(providerId: string) {
    try {
      const provider = await this.getProviderById(providerId);
      if (!provider) {
        return null;
      }

      return {
        id: provider.id,
        name: provider.name,
        protocol: provider.protocol,
        buttonText: provider.button_text || provider.name,
        displayOrder: provider.display_order,
        enabled: provider.enabled,
        ui: provider.settings.ui || {}
      };
    } catch (error) {
      console.error(`Failed to get provider public info ${providerId}:`, error);
      return null;
    }
  }
} 