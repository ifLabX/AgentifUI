// --- BEGIN COMMENT ---
// SSO管理系统类型定义
// 确保与数据库sso_providers表结构完全匹配
// 支持实现方案v3.1中的所有功能需求
// --- END COMMENT ---
import type { SsoProtocol as DatabaseSsoProtocol } from '@lib/types/database';

// --- BEGIN COMMENT ---
// 从数据库类型中引入SSO协议枚举，确保类型一致性
// --- END COMMENT ---
export type SsoProtocol = DatabaseSsoProtocol;

// --- BEGIN COMMENT ---
// SSO提供商接口 - 与数据库sso_providers表完全匹配
// --- END COMMENT ---
export interface SsoProvider {
  id: string;
  name: string;
  protocol: SsoProtocol; // 'CAS' | 'OIDC' | 'SAML' | 'OAuth2'
  settings: SsoProviderSettings; // JSONB类型的统一配置结构
  client_id: string | null; // OAuth2/OIDC协议使用
  client_secret: string | null; // OAuth2/OIDC协议使用，建议加密存储
  metadata_url: string | null; // SAML协议使用
  enabled: boolean; // 是否启用，默认true
  display_order: number; // 登录页面显示顺序，默认0
  button_text: string | null; // 登录按钮显示文本，为空时使用name字段值
  created_at: string;
  updated_at: string;
}

// --- BEGIN COMMENT ---
// SSO提供商settings字段的标准化配置结构
// 对应实现方案中的三层架构设计：protocol_config + security + ui
// --- END COMMENT ---
export interface SsoProviderSettings {
  // 协议配置 - 核心技术参数
  protocol_config: ProtocolConfig;
  // 安全配置 - 安全策略和验证
  security: SecurityConfig;
  // UI配置 - 用户界面和展示
  ui: UIConfig;
}

// --- BEGIN COMMENT ---
// 协议配置接口 - 支持所有SSO协议的通用配置
// --- END COMMENT ---
export interface ProtocolConfig {
  base_url: string; // SSO服务器基础URL，必填
  version?: string; // 协议版本，如CAS 2.0/3.0
  timeout?: number; // 请求超时时间（毫秒），默认10000
  endpoints: {
    login: string; // 登录端点路径
    logout: string; // 注销端点路径
    validate: string; // 票据验证端点路径
    [key: string]: string; // 支持协议特定的其他端点
  };
  attributes_mapping: {
    employee_id: string; // 工号字段映射
    username: string; // 用户名字段映射
    full_name: string; // 全名字段映射
    email?: string; // 邮箱字段映射（可选）
    [key: string]: string | undefined; // 支持其他自定义字段映射
  };
  // 协议特定配置
  scope?: string; // OIDC/OAuth2 scope参数
  response_type?: string; // OIDC/OAuth2 response_type参数
  issuer?: string; // OIDC issuer URL
  entity_id?: string; // SAML entity ID
  sso_url?: string; // SAML SSO URL
}

// --- BEGIN COMMENT ---
// 安全配置接口 - 安全策略和验证设置
// --- END COMMENT ---
export interface SecurityConfig {
  require_https: boolean; // 是否要求HTTPS连接
  validate_certificates: boolean; // 是否验证SSL证书
  allowed_redirect_hosts?: string[]; // 允许的重定向主机白名单
  pkce_enabled?: boolean; // OIDC PKCE启用（可选）
  state_parameter?: boolean; // 是否使用state参数（可选）
}

// --- BEGIN COMMENT ---
// UI配置接口 - 用户界面和展示设置
// --- END COMMENT ---
export interface UIConfig {
  icon?: string; // 按钮图标（emoji或图片URL）
  theme?: string; // 按钮主题：primary/secondary/default/outline
  description?: string; // 详细描述文本
  logo_url?: string; // 机构logo图片URL（可选）
}

// --- BEGIN COMMENT ---
// SSO用户信息接口 - 认证成功后返回的用户信息
// --- END COMMENT ---
export interface SSOUserInfo {
  id: string; // 用户唯一标识
  username: string; // 用户名
  email: string | null; // 邮箱地址（可能为空）
  name: string; // 显示名称
  provider: string; // 提供商名称
  raw: Record<string, any>; // 原始认证响应数据
}

// --- BEGIN COMMENT ---
// 创建SSO提供商请求接口 - 用于API请求
// --- END COMMENT ---
export interface CreateSsoProviderRequest {
  name: string;
  protocol: SsoProtocol;
  settings: SsoProviderSettings;
  client_id?: string;
  client_secret?: string;
  metadata_url?: string;
  enabled?: boolean;
  display_order?: number;
  button_text?: string;
}

// --- BEGIN COMMENT ---
// 更新SSO提供商请求接口 - 用于API请求
// --- END COMMENT ---
export interface UpdateSsoProviderRequest {
  name?: string;
  protocol?: SsoProtocol;
  settings?: Partial<SsoProviderSettings>;
  client_id?: string;
  client_secret?: string;
  metadata_url?: string;
  enabled?: boolean;
  display_order?: number;
  button_text?: string;
}

// --- BEGIN COMMENT ---
// SSO提供商列表响应接口 - 用于API响应
// --- END COMMENT ---
export interface SsoProvidersListResponse {
  success: boolean;
  data: SsoProvider[];
  total?: number;
  message?: string;
}

// --- BEGIN COMMENT ---
// SSO提供商详情响应接口 - 用于API响应
// --- END COMMENT ---
export interface SsoProviderResponse {
  success: boolean;
  data?: SsoProvider;
  message?: string;
}

// --- BEGIN COMMENT ---
// 启用的SSO提供商接口 - 用于登录页面展示
// --- END COMMENT ---
export interface EnabledSsoProvider {
  id: string;
  name: string;
  protocol: SsoProtocol;
  button_text: string; // 已处理为非空值
  display_order: number;
  ui_settings: UIConfig;
}

// --- BEGIN COMMENT ---
// SSO管理员权限验证结果接口
// --- END COMMENT ---
export interface SsoAdminAuthResult {
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
}
