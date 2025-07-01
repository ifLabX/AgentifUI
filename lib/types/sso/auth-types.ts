// --- BEGIN COMMENT ---
// SSO认证流程类型定义
// 支持CAS、OIDC、SAML等协议的认证参数和响应
// --- END COMMENT ---

// --- BEGIN COMMENT ---
// SSO认证参数接口 - 支持不同协议的认证参数
// --- END COMMENT ---
export interface SSOAuthParams {
  // CAS协议参数
  ticket?: string; // CAS票据
  service?: string; // CAS服务地址

  // OIDC/OAuth2协议参数
  code?: string; // 授权码
  state?: string; // 状态参数

  // 通用参数
  returnUrl?: string; // 返回地址

  // 扩展参数
  [key: string]: any;
}

// --- BEGIN COMMENT ---
// SSO认证验证结果接口
// --- END COMMENT ---
export interface SSOValidationResult {
  success: boolean;
  userInfo?: SSOUserInfo;
  error?: string;
}

// --- BEGIN COMMENT ---
// SSO用户信息接口 - 从admin-types重新导出以避免循环依赖
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
// SSO环境配置接口
// --- END COMMENT ---
export interface SSOEnvironmentConfig {
  readonly appUrl: string; // 应用基础URL
  readonly enabledProtocols: string[]; // 启用的协议列表
  readonly defaultTimeout: number; // 默认超时时间
}

// --- BEGIN COMMENT ---
// CAS认证响应接口
// --- END COMMENT ---
export interface CASValidationResponse {
  success: boolean;
  user?: string;
  attributes?: Record<string, string>;
  error?: string;
}

// --- BEGIN COMMENT ---
// OIDC Token响应接口
// --- END COMMENT ---
export interface OIDCTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

// --- BEGIN COMMENT ---
// OIDC用户信息响应接口
// --- END COMMENT ---
export interface OIDCUserInfoResponse {
  sub: string; // 用户唯一标识
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  nickname?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string;
  website?: string;
  email?: string;
  email_verified?: boolean;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  address?: {
    formatted?: string;
    street_address?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
  updated_at?: number;
  [key: string]: any; // 支持自定义声明
}

// --- BEGIN COMMENT ---
// SSO错误类型枚举
// --- END COMMENT ---
export enum SSOErrorType {
  INVALID_TICKET = 'INVALID_TICKET',
  INVALID_SERVICE = 'INVALID_SERVICE',
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_DISABLED = 'PROVIDER_DISABLED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  USER_CREATION_FAILED = 'USER_CREATION_FAILED',
  SESSION_CREATION_FAILED = 'SESSION_CREATION_FAILED',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

// --- BEGIN COMMENT ---
// SSO错误接口
// --- END COMMENT ---
export interface SSOError {
  type: SSOErrorType;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// --- BEGIN COMMENT ---
// SSO登录状态枚举
// --- END COMMENT ---
export enum SSOLoginStatus {
  PENDING = 'PENDING',
  REDIRECTING = 'REDIRECTING',
  VALIDATING = 'VALIDATING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

// --- BEGIN COMMENT ---
// SSO登录状态接口
// --- END COMMENT ---
export interface SSOLoginState {
  status: SSOLoginStatus;
  providerId?: string;
  returnUrl?: string;
  error?: SSOError;
  userInfo?: SSOUserInfo;
}

// --- BEGIN COMMENT ---
// URL构建选项接口
// --- END COMMENT ---
export interface URLBuildOptions {
  providerId: string;
  returnUrl?: string;
  additionalParams?: Record<string, string>;
}
