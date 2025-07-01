// --- BEGIN COMMENT ---
// SSO服务工厂
// 根据协议类型创建对应的SSO服务实例
// 支持所有协议的统一创建和管理
// --- END COMMENT ---
import type { SsoProtocol, SsoProvider } from '@lib/types/sso/admin-types';

import { BaseSSOService } from './base-sso-service';

// --- BEGIN COMMENT ---
// 动态导入具体协议服务，避免循环依赖
// --- END COMMENT ---
let CASService: any;
let OIDCService: any;
let SAMLService: any;

// --- BEGIN COMMENT ---
// SSO服务工厂类
// 负责根据协议类型创建对应的服务实例
// --- END COMMENT ---
export class SSOServiceFactory {
  // --- BEGIN COMMENT ---
  // 创建SSO服务实例
  // 根据提供商的协议类型返回对应的服务实现
  // --- END COMMENT ---
  static async createService(provider: SsoProvider): Promise<BaseSSOService> {
    // 验证提供商基本信息
    if (!provider) {
      throw new Error('Provider is required');
    }

    if (!provider.protocol) {
      throw new Error('Provider protocol is required');
    }

    if (!provider.enabled) {
      throw new Error(`Provider is disabled: ${provider.name}`);
    }

    // 根据协议类型创建对应的服务
    switch (provider.protocol) {
      case 'CAS':
        return await this.createCASService(provider);

      case 'OIDC':
        return await this.createOIDCService(provider);

      case 'OAuth2':
        // OAuth2使用OIDC服务实现
        return await this.createOIDCService(provider);

      case 'SAML':
        return await this.createSAMLService(provider);

      default:
        throw new Error(`Unsupported SSO protocol: ${provider.protocol}`);
    }
  }

  // --- BEGIN COMMENT ---
  // 创建CAS服务实例
  // --- END COMMENT ---
  private static async createCASService(
    provider: SsoProvider
  ): Promise<BaseSSOService> {
    if (!CASService) {
      // 动态导入CAS服务，避免循环依赖
      const { CASService: CASServiceClass } = await import(
        '../auth/cas-service'
      );
      CASService = CASServiceClass;
    }

    return new CASService(provider);
  }

  // --- BEGIN COMMENT ---
  // 创建OIDC服务实例
  // --- END COMMENT ---
  private static async createOIDCService(
    provider: SsoProvider
  ): Promise<BaseSSOService> {
    if (!OIDCService) {
      // 动态导入OIDC服务，避免循环依赖
      const { OIDCService: OIDCServiceClass } = await import(
        '../auth/oidc-service'
      );
      OIDCService = OIDCServiceClass;
    }

    return new OIDCService(provider);
  }

  // --- BEGIN COMMENT ---
  // 创建SAML服务实例
  // --- END COMMENT ---
  private static async createSAMLService(
    provider: SsoProvider
  ): Promise<BaseSSOService> {
    // 暂时抛出错误，SAML服务尚未实现
    throw new Error(
      `SAML protocol is not yet implemented for provider: ${provider.name}`
    );
  }

  // --- BEGIN COMMENT ---
  // 获取支持的协议列表
  // --- END COMMENT ---
  static getSupportedProtocols(): SsoProtocol[] {
    return ['CAS', 'OIDC', 'SAML', 'OAuth2'];
  }

  // --- BEGIN COMMENT ---
  // 检查协议是否被支持
  // --- END COMMENT ---
  static isProtocolSupported(protocol: string): protocol is SsoProtocol {
    return this.getSupportedProtocols().includes(protocol as SsoProtocol);
  }

  // --- BEGIN COMMENT ---
  // 验证提供商配置是否符合协议要求
  // --- END COMMENT ---
  static validateProviderForProtocol(provider: SsoProvider): void {
    const protocol = provider.protocol;
    const config = provider.settings.protocol_config;

    switch (protocol) {
      case 'CAS':
        this.validateCASProvider(provider);
        break;

      case 'OIDC':
      case 'OAuth2':
        this.validateOIDCProvider(provider);
        break;

      case 'SAML':
        this.validateSAMLProvider(provider);
        break;

      default:
        throw new Error(`Unknown protocol: ${protocol}`);
    }
  }

  // --- BEGIN COMMENT ---
  // 验证CAS提供商配置
  // --- END COMMENT ---
  private static validateCASProvider(provider: SsoProvider): void {
    const config = provider.settings.protocol_config;
    const endpoints = config.endpoints;

    if (!endpoints.login) {
      throw new Error('CAS provider requires login endpoint');
    }

    if (!endpoints.validate) {
      throw new Error('CAS provider requires validate endpoint');
    }

    if (
      !config.attributes_mapping.employee_id &&
      !config.attributes_mapping.username
    ) {
      throw new Error('CAS provider requires employee_id or username mapping');
    }
  }

  // --- BEGIN COMMENT ---
  // 验证OIDC/OAuth2提供商配置
  // --- END COMMENT ---
  private static validateOIDCProvider(provider: SsoProvider): void {
    if (!provider.client_id) {
      throw new Error('OIDC/OAuth2 provider requires client_id');
    }

    if (!provider.client_secret) {
      throw new Error('OIDC/OAuth2 provider requires client_secret');
    }

    const config = provider.settings.protocol_config;

    if (provider.protocol === 'OIDC' && !config.issuer) {
      throw new Error('OIDC provider requires issuer URL');
    }

    const endpoints = config.endpoints;
    if (!endpoints.authorization || !endpoints.token) {
      throw new Error(
        'OIDC/OAuth2 provider requires authorization and token endpoints'
      );
    }
  }

  // --- BEGIN COMMENT ---
  // 验证SAML提供商配置
  // --- END COMMENT ---
  private static validateSAMLProvider(provider: SsoProvider): void {
    if (!provider.metadata_url) {
      throw new Error('SAML provider requires metadata_url');
    }

    const config = provider.settings.protocol_config;

    if (!config.entity_id) {
      throw new Error('SAML provider requires entity_id');
    }
  }

  // --- BEGIN COMMENT ---
  // 获取协议的默认配置模板
  // --- END COMMENT ---
  static getProtocolTemplate(protocol: SsoProtocol) {
    switch (protocol) {
      case 'CAS':
        return {
          protocol_config: {
            version: '2.0',
            timeout: 10000,
            endpoints: {
              login: '/login',
              logout: '/logout',
              validate: '/serviceValidate',
            },
            attributes_mapping: {
              employee_id: 'cas:user',
              username: 'cas:username',
              full_name: 'cas:name',
              email: 'cas:mail',
            },
          },
          security: {
            require_https: true,
            validate_certificates: true,
            allowed_redirect_hosts: [],
          },
          ui: {
            icon: '🏛️',
            theme: 'primary',
            description: 'CAS统一认证系统',
          },
        };

      case 'OIDC':
        return {
          protocol_config: {
            scope: 'openid profile email',
            response_type: 'code',
            timeout: 10000,
            endpoints: {
              authorization: '/auth',
              token: '/token',
              userinfo: '/userinfo',
              logout: '/logout',
            },
            attributes_mapping: {
              employee_id: 'sub',
              username: 'preferred_username',
              full_name: 'name',
              email: 'email',
            },
          },
          security: {
            require_https: true,
            validate_certificates: true,
            pkce_enabled: true,
            state_parameter: true,
          },
          ui: {
            icon: '🔐',
            theme: 'secondary',
            description: 'OIDC认证系统',
          },
        };

      case 'OAuth2':
        return {
          protocol_config: {
            scope: 'read:user user:email',
            response_type: 'code',
            timeout: 10000,
            endpoints: {
              authorization: '/oauth/authorize',
              token: '/oauth/token',
              userinfo: '/user',
            },
            attributes_mapping: {
              employee_id: 'id',
              username: 'login',
              full_name: 'name',
              email: 'email',
            },
          },
          security: {
            require_https: true,
            validate_certificates: true,
            state_parameter: true,
          },
          ui: {
            icon: '🔑',
            theme: 'accent',
            description: 'OAuth2认证系统',
          },
        };

      case 'SAML':
        return {
          protocol_config: {
            timeout: 10000,
            endpoints: {
              sso: '/sso',
              slo: '/slo',
            },
            attributes_mapping: {
              employee_id: 'urn:oid:0.9.2342.19200300.100.1.1',
              username: 'urn:oid:0.9.2342.19200300.100.1.1',
              full_name: 'urn:oid:2.5.4.3',
              email: 'urn:oid:1.2.840.113549.1.9.1',
            },
          },
          security: {
            require_https: true,
            validate_certificates: true,
          },
          ui: {
            icon: '🏢',
            theme: 'tertiary',
            description: 'SAML认证系统',
          },
        };

      default:
        throw new Error(`No template available for protocol: ${protocol}`);
    }
  }
}
