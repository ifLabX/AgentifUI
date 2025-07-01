// --- BEGIN COMMENT ---
// SSO协议配置模板定义
// 提供各种SSO协议的默认配置模板和验证规则
// --- END COMMENT ---
import type { SsoProvider } from '@lib/types/sso/admin-types';

// --- BEGIN COMMENT ---
// 协议配置模板接口
// --- END COMMENT ---
export interface ProtocolTemplate {
  name: string;
  description: string;
  icon: string;
  defaultSettings: {
    protocol_config: {
      base_url?: string;
      version?: string;
      timeout?: number;
      endpoints?: {
        [key: string]: string;
      };
      attributes_mapping?: {
        [key: string]: string;
      };
    };
    security: {
      require_https: boolean;
      validate_certificates: boolean;
      allowed_redirect_hosts?: string[];
      pkce_enabled?: boolean;
      state_parameter?: boolean;
    };
    ui: {
      icon?: string;
      theme?: string;
      description?: string;
    };
  };
  requiredFields: string[];
  optionalFields: string[];
  validationRules: {
    [key: string]: (value: any) => boolean | string;
  };
}

// --- BEGIN COMMENT ---
// CAS协议配置模板
// --- END COMMENT ---
export const CAS_TEMPLATE: ProtocolTemplate = {
  name: 'CAS',
  description: 'Central Authentication Service - 中央认证服务',
  icon: '🏛️',
  defaultSettings: {
    protocol_config: {
      base_url: '',
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
  },
  requiredFields: ['base_url'],
  optionalFields: ['version', 'timeout'],
  validationRules: {
    base_url: (value: string) => {
      if (!value) return '基础URL为必填项';
      try {
        new URL(value);
        return true;
      } catch {
        return '请输入有效的URL格式';
      }
    },
    version: (value: string) => {
      return (
        ['1.0', '2.0', '3.0'].includes(value) || '支持的版本: 1.0, 2.0, 3.0'
      );
    },
  },
};

// --- BEGIN COMMENT ---
// OIDC协议配置模板
// --- END COMMENT ---
export const OIDC_TEMPLATE: ProtocolTemplate = {
  name: 'OIDC',
  description: 'OpenID Connect - 基于OAuth2的身份认证协议',
  icon: '🔐',
  defaultSettings: {
    protocol_config: {
      base_url: '',
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
  },
  requiredFields: ['base_url', 'client_id', 'client_secret'],
  optionalFields: ['scope', 'response_type', 'issuer'],
  validationRules: {
    base_url: (value: string) => {
      if (!value) return 'OIDC服务器地址为必填项';
      try {
        new URL(value);
        return true;
      } catch {
        return '请输入有效的URL格式';
      }
    },
    client_id: (value: string) => {
      return (value && value.length > 0) || '客户端ID为必填项';
    },
    client_secret: (value: string) => {
      return (value && value.length > 0) || '客户端密钥为必填项';
    },
  },
};

// --- BEGIN COMMENT ---
// SAML协议配置模板 (预留)
// --- END COMMENT ---
export const SAML_TEMPLATE: ProtocolTemplate = {
  name: 'SAML',
  description: 'Security Assertion Markup Language - 安全断言标记语言',
  icon: '🛡️',
  defaultSettings: {
    protocol_config: {
      base_url: '',
      timeout: 10000,
      endpoints: {
        sso: '/sso',
        slo: '/slo',
        metadata: '/metadata',
      },
      attributes_mapping: {
        employee_id: 'NameID',
        username: 'uid',
        full_name: 'displayName',
        email: 'mail',
      },
    },
    security: {
      require_https: true,
      validate_certificates: true,
      allowed_redirect_hosts: [],
    },
    ui: {
      icon: '🛡️',
      theme: 'accent',
      description: 'SAML认证系统',
    },
  },
  requiredFields: ['base_url'],
  optionalFields: ['entity_id', 'metadata_url'],
  validationRules: {
    base_url: (value: string) => {
      if (!value) return 'SAML服务器地址为必填项';
      try {
        new URL(value);
        return true;
      } catch {
        return '请输入有效的URL格式';
      }
    },
  },
};

// --- BEGIN COMMENT ---
// OAuth2协议配置模板
// --- END COMMENT ---
export const OAUTH2_TEMPLATE: ProtocolTemplate = {
  name: 'OAuth2',
  description: 'OAuth 2.0 - 开放授权标准',
  icon: '🔑',
  defaultSettings: {
    protocol_config: {
      base_url: '',
      timeout: 10000,
      endpoints: {
        authorization: '/oauth/authorize',
        token: '/oauth/token',
        userinfo: '/api/user',
        logout: '/logout',
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
      theme: 'tertiary',
      description: 'OAuth2认证系统',
    },
  },
  requiredFields: ['base_url', 'client_id', 'client_secret'],
  optionalFields: ['scope', 'response_type'],
  validationRules: {
    base_url: (value: string) => {
      if (!value) return 'OAuth2服务器地址为必填项';
      try {
        new URL(value);
        return true;
      } catch {
        return '请输入有效的URL格式';
      }
    },
    client_id: (value: string) => {
      return (value && value.length > 0) || '客户端ID为必填项';
    },
    client_secret: (value: string) => {
      return (value && value.length > 0) || '客户端密钥为必填项';
    },
  },
};

// --- BEGIN COMMENT ---
// 协议模板集合
// --- END COMMENT ---
export const PROTOCOL_TEMPLATES = {
  CAS: CAS_TEMPLATE,
  OIDC: OIDC_TEMPLATE,
  SAML: SAML_TEMPLATE,
  OAuth2: OAUTH2_TEMPLATE,
} as const;

// --- BEGIN COMMENT ---
// 协议模板助手函数
// --- END COMMENT ---
export class ProtocolTemplateHelper {
  /**
   * 获取支持的协议列表
   */
  static getSupportedProtocols(): string[] {
    return Object.keys(PROTOCOL_TEMPLATES);
  }

  /**
   * 根据协议类型获取模板
   */
  static getTemplate(protocol: string): ProtocolTemplate | null {
    return (
      PROTOCOL_TEMPLATES[protocol as keyof typeof PROTOCOL_TEMPLATES] || null
    );
  }

  /**
   * 创建默认的提供商配置
   */
  static createDefaultProvider(protocol: string, name: string): any {
    const template = this.getTemplate(protocol);
    if (!template) {
      throw new Error(`不支持的协议: ${protocol}`);
    }

    return {
      name,
      protocol: protocol,
      settings: template.defaultSettings,
      enabled: false,
      display_order: 0,
      button_text: `使用${name}登录`,
    };
  }

  /**
   * 验证协议配置
   */
  static validateProtocolConfig(
    protocol: string,
    config: any
  ): { valid: boolean; errors: string[] } {
    const template = this.getTemplate(protocol);
    if (!template) {
      return { valid: false, errors: [`不支持的协议: ${protocol}`] };
    }

    const errors: string[] = [];

    // 检查必填字段
    for (const field of template.requiredFields) {
      if (!config[field]) {
        errors.push(`缺少必填字段: ${field}`);
      }
    }

    // 运行验证规则
    for (const [field, validator] of Object.entries(template.validationRules)) {
      if (config[field] !== undefined) {
        const result = validator(config[field]);
        if (result !== true) {
          errors.push(
            typeof result === 'string' ? result : `字段 ${field} 验证失败`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 获取协议描述信息
   */
  static getProtocolInfo(
    protocol: string
  ): { name: string; description: string; icon: string } | null {
    const template = this.getTemplate(protocol);
    if (!template) {
      return null;
    }

    return {
      name: template.name,
      description: template.description,
      icon: template.icon,
    };
  }
}
