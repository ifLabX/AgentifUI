// --- BEGIN COMMENT ---
// SSO服务工厂
// 根据配置动态创建不同协议的SSO服务实例
// --- END COMMENT ---

import { SSOConfigService } from './sso-config-service';
import { BaseSSOService, type SSOServiceConfig } from './base-sso-service';
import { CASService } from './cas-sso-service';
import type { SsoProvider } from '@lib/types/database';

// --- BEGIN COMMENT ---
// 🎯 SSO服务工厂类
// 提供服务实例缓存和动态创建功能
// --- END COMMENT ---
export class SSOServiceFactory {
  // 服务实例缓存
  private static serviceCache = new Map<string, BaseSSOService>();
  private static cacheExpiry = 10 * 60 * 1000; // 10分钟缓存
  private static serviceCacheTime = new Map<string, number>();

  // --- BEGIN COMMENT ---
  // 🎯 根据提供商ID创建服务实例
  // 主要入口方法，支持缓存
  // --- END COMMENT ---
  static async createService(providerId: string): Promise<BaseSSOService> {
    try {
      // 检查缓存
      if (this.isServiceCacheValid(providerId)) {
        const cachedService = this.serviceCache.get(providerId);
        if (cachedService) {
          console.log(`Using cached SSO service for provider: ${providerId}`);
          return cachedService;
        }
      }

      console.log(`Creating new SSO service for provider: ${providerId}`);
      
      // 获取提供商配置
      const provider = await SSOConfigService.getProviderById(providerId);
      if (!provider) {
        throw new Error(`SSO provider ${providerId} not found`);
      }

      if (!provider.enabled) {
        throw new Error(`SSO provider "${provider.name}" is disabled`);
      }

      // 创建服务实例
      const service = this.createServiceInstance(provider);
      
      // 缓存服务实例
      this.serviceCache.set(providerId, service);
      this.serviceCacheTime.set(providerId, Date.now());

      console.log(`Created ${provider.protocol} service for provider: ${provider.name}`);
      return service;
    } catch (error) {
      console.error(`Failed to create SSO service for provider ${providerId}:`, error);
      throw error;
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 根据提供商名称创建服务实例
  // 用于向后兼容
  // --- END COMMENT ---
  static async createServiceByName(providerName: string): Promise<BaseSSOService> {
    try {
      console.log(`Creating SSO service by name: ${providerName}`);
      
      const provider = await SSOConfigService.getProviderByName(providerName);
      if (!provider) {
        throw new Error(`SSO provider "${providerName}" not found`);
      }

      return this.createService(provider.id);
    } catch (error) {
      console.error(`Failed to create SSO service by name ${providerName}:`, error);
      throw error;
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 预创建所有启用的服务实例
  // 用于应用启动时的预热
  // --- END COMMENT ---
  static async preloadServices(): Promise<void> {
    try {
      console.log('Preloading SSO services...');
      
      const enabledProviders = await SSOConfigService.getEnabledProviders();
      const preloadPromises = enabledProviders.map(provider => 
        this.createService(provider.id).catch(error => {
          console.error(`Failed to preload service for ${provider.name}:`, error);
          return null;
        })
      );

      const results = await Promise.allSettled(preloadPromises);
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      
      console.log(`Preloaded ${successCount}/${enabledProviders.length} SSO services`);
    } catch (error) {
      console.error('Failed to preload SSO services:', error);
      // 不抛出错误，避免影响应用启动
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 清除所有服务缓存
  // 配置更新时调用
  // --- END COMMENT ---
  static clearCache(): void {
    console.log('Clearing SSO service cache...');
    this.serviceCache.clear();
    this.serviceCacheTime.clear();
    
    // 同时清理配置服务缓存
    SSOConfigService.clearCache();
  }

  // --- BEGIN COMMENT ---
  // 🎯 清除特定提供商的服务缓存
  // --- END COMMENT ---
  static clearServiceCache(providerId: string): void {
    console.log(`Clearing service cache for provider: ${providerId}`);
    this.serviceCache.delete(providerId);
    this.serviceCacheTime.delete(providerId);
    
    // 同时清理配置缓存
    SSOConfigService.clearProviderCache(providerId);
  }

  // --- BEGIN COMMENT ---
  // 🎯 获取缓存统计信息
  // --- END COMMENT ---
  static getCacheStats() {
    const stats = {
      serviceCacheSize: this.serviceCache.size,
      cachedProviders: Array.from(this.serviceCache.keys()),
      cacheDetails: Array.from(this.serviceCacheTime.entries()).map(([providerId, time]) => ({
        providerId,
        cacheTime: time,
        cacheAge: Date.now() - time,
        isValid: this.isServiceCacheValid(providerId)
      }))
    };

    return {
      ...stats,
      configCacheStats: SSOConfigService.getCacheStats()
    };
  }

  // --- BEGIN COMMENT ---
  // 🎯 私有方法：根据提供商配置创建具体的服务实例
  // --- END COMMENT ---
  private static createServiceInstance(provider: SsoProvider): BaseSSOService {
    const config: SSOServiceConfig = {
      providerId: provider.id,
      provider: provider,
      settings: provider.settings
    };

    switch (provider.protocol) {
      case 'CAS':
        return new CASService(config);
        
      case 'OIDC':
        // TODO: 实现OIDC服务
        throw new Error('OIDC protocol service not implemented yet');
        
      case 'SAML':
        // TODO: 实现SAML服务
        throw new Error('SAML protocol service not implemented yet');
        
      case 'OAuth2':
        // TODO: 实现OAuth2服务
        throw new Error('OAuth2 protocol service not implemented yet');
        
      default:
        throw new Error(`Unsupported SSO protocol: ${provider.protocol}`);
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 私有方法：检查服务缓存是否有效
  // --- END COMMENT ---
  private static isServiceCacheValid(providerId: string): boolean {
    const cacheTime = this.serviceCacheTime.get(providerId);
    if (!cacheTime) {
      return false;
    }
    
    return Date.now() - cacheTime < this.cacheExpiry;
  }

  // --- BEGIN COMMENT ---
  // 🎯 获取所有可用的协议类型
  // 用于管理界面显示
  // --- END COMMENT ---
  static getSupportedProtocols() {
    return [
      {
        protocol: 'CAS',
        name: 'CAS 2.0/3.0',
        description: '中央认证服务协议，广泛用于高校统一认证系统',
        implemented: true
      },
      {
        protocol: 'OIDC',
        name: 'OpenID Connect',
        description: '基于OAuth 2.0的身份认证协议，支持现代Web应用',
        implemented: false
      },
      {
        protocol: 'SAML',
        name: 'SAML 2.0',
        description: '安全断言标记语言，企业级SSO标准',
        implemented: false
      },
      {
        protocol: 'OAuth2',
        name: 'OAuth 2.0',
        description: '开放授权标准，支持第三方应用授权',
        implemented: false
      }
    ];
  }

  // --- BEGIN COMMENT ---
  // 🎯 检查协议是否已实现
  // --- END COMMENT ---
  static isProtocolSupported(protocol: string): boolean {
    const supportedProtocols = this.getSupportedProtocols();
    const protocolInfo = supportedProtocols.find(p => p.protocol === protocol);
    return protocolInfo?.implemented || false;
  }

  // --- BEGIN COMMENT ---
  // 🎯 验证提供商配置并创建临时服务实例
  // 用于配置测试，不缓存
  // --- END COMMENT ---
  static createTemporaryService(provider: SsoProvider): BaseSSOService {
    try {
      console.log(`Creating temporary service for testing: ${provider.name}`);
      
      if (!this.isProtocolSupported(provider.protocol)) {
        throw new Error(`Protocol ${provider.protocol} is not yet implemented`);
      }

      return this.createServiceInstance(provider);
    } catch (error) {
      console.error(`Failed to create temporary service:`, error);
      throw error;
    }
  }
} 