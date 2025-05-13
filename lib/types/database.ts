/**
 * 数据库类型定义
 * 
 * 本文件定义了与数据库表结构对应的TypeScript类型
 * 所有与数据库交互的代码都应使用这些类型，确保类型安全
 */

// 枚举类型
export type UserRole = 'admin' | 'user';
export type AccountStatus = 'active' | 'suspended' | 'pending';
export type OrgMemberRole = 'owner' | 'admin' | 'member';
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'error';
export type SsoProtocol = 'SAML' | 'OAuth2' | 'OIDC';

// 用户和身份管理
export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  auth_source: string;
  sso_provider_id: string | null;
}

export interface UserPreference {
  id: string;
  user_id: string;
  theme: string;
  language: string;
  notification_settings: Record<string, any>;
  ai_preferences: Record<string, any>;
  updated_at: string;
}

// 组织和成员管理
export interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgMemberRole;
  created_at: string;
  updated_at: string;
}

// 聊天和消息
export interface Conversation {
  id: string;
  org_id: string | null;
  user_id: string;
  ai_config_id: string | null;
  title: string;
  summary: string | null;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  status: string;
  // --- BEGIN COMMENT ---
  // 以下是新增字段，用于支持与 Dify 的集成
  // external_id: Dify 中的会话 ID
  // app_id: 关联的 Dify 应用 ID
  // last_message_preview: 最后一条消息的预览，用于在侧边栏显示
  // --- END COMMENT ---
  external_id: string | null;
  app_id: string | null;
  last_message_preview: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string | null;
  role: MessageRole;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
  status: MessageStatus;
  // --- BEGIN COMMENT ---
  // 以下是新增字段，用于支持与 Dify 的集成
  // external_id: Dify 中的消息 ID
  // token_count: 消息的 token 数量，用于统计使用量
  // is_synced: 消息是否已同步到 Dify
  // --- END COMMENT ---
  external_id: string | null;
  token_count: number | null;
  is_synced: boolean;
}

// API密钥管理
export interface Provider {
  id: string;
  name: string;
  type: string;
  base_url: string;
  auth_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceInstance {
  id: string;
  provider_id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  instance_id: string;
  api_path: string;
  is_default: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  provider_id: string;
  service_instance_id: string | null;
  user_id: string | null;
  key_value: string;
  is_default: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

// SSO认证
export interface SsoProvider {
  id: string;
  name: string;
  protocol: SsoProtocol;
  settings: Record<string, any>;
  client_id: string | null;
  client_secret: string | null;
  metadata_url: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DomainSsoMapping {
  id: string;
  domain: string;
  sso_provider_id: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthSettings {
  id: string;
  allow_email_registration: boolean;
  allow_phone_registration: boolean;
  allow_password_login: boolean;
  require_email_verification: boolean;
  password_policy: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// 其他表
export interface AiConfig {
  id: string;
  org_id: string | null;
  provider: string;
  app_id: string | null;
  api_key: string;
  api_url: string;
  settings: Record<string, any>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiLog {
  id: string;
  user_id: string | null;
  conversation_id: string | null;
  provider: string;
  endpoint: string;
  request: Record<string, any>;
  response: Record<string, any>;
  status_code: number | null;
  latency_ms: number | null;
  created_at: string;
}

// 数据库类型命名空间
export namespace Database {
  export interface Tables {
    profiles: Profile;
    user_preferences: UserPreference;
    organizations: Organization;
    org_members: OrgMember;
    conversations: Conversation;
    messages: Message;
    providers: Provider;
    service_instances: ServiceInstance;
    api_keys: ApiKey;
    sso_providers: SsoProvider;
    domain_sso_mappings: DomainSsoMapping;
    auth_settings: AuthSettings;
    ai_configs: AiConfig;
    api_logs: ApiLog;
  }
}
