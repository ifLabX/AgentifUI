/**
 * 数据库类型定义
 *
 * 本文件定义了与数据库表结构对应的TypeScript类型
 * 所有与数据库交互的代码都应使用这些类型，确保类型安全
 */

// 枚举类型
export type UserRole = 'admin' | 'manager' | 'user';
export type AccountStatus = 'active' | 'suspended' | 'pending';
// export type OrgMemberRole = 'owner' | 'admin' | 'member'; // 已删除：不再使用组织成员角色
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'error';

// 🎯 更新：SSO协议类型，新增CAS协议支持
// 基于最新迁移文件，支持CAS、SAML、OAuth2、OIDC四种协议
export type SsoProtocol = 'CAS' | 'SAML' | 'OAuth2' | 'OIDC';

// 🎯 新增：应用执行相关的枚举类型
// 用于工作流和文本生成应用的执行记录管理
export type ExecutionType = 'workflow' | 'text-generation';
export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'stopped'
  | 'deleted';

// 🎯 更新：用户Profile接口，新增employee_number字段
// 支持SSO用户的学工号管理
export interface Profile {
  id: string;
  email?: string;
  full_name?: string | null;
  username?: string;
  avatar_url?: string | null;
  auth_source: string;
  phone?: string | null;
  department?: string | null;
  job_title?: string | null;
  created_at: string;
  updated_at: string;
  role: UserRole;
  status: AccountStatus;
  last_login: string | null;
  sso_provider_id: string | null;
  employee_number?: string | null; // 新增：学工号字段，用于SSO用户身份标识
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

// 🎯 群组权限管理 - 简化版权限系统
// 替代复杂的组织架构，使用简单的群组概念
export type AppVisibility = 'public' | 'group_only' | 'private';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
}

export interface GroupAppPermission {
  id: string;
  group_id: string;
  service_instance_id: string;
  is_enabled: boolean;
  usage_quota: number | null; // NULL表示无限制
  used_count: number;
  created_at: string;
}

// 聊天和消息
export interface Conversation {
  id: string;
  user_id: string;
  ai_config_id: string | null;
  title: string;
  summary: string | null;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  status: string;
  // 以下是新增字段，用于支持与 Dify 的集成
  // external_id: Dify 中的会话 ID
  // app_id: 关联的 Dify 应用 ID
  // last_message_preview: 最后一条消息的预览，用于在侧边栏显示
  // metadata: 存储额外的元数据，如固定状态等
  external_id: string | null;
  app_id: string | null;
  last_message_preview: string | null;
  metadata?: Record<string, any>;
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
  // 以下是新增字段，用于支持与 Dify 的集成
  // external_id: Dify 中的消息 ID
  // token_count: 消息的 token 数量，用于统计使用量
  // is_synced: 消息是否已同步到 Dify
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
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// 🎯 服务实例配置类型定义
// 用于规范ServiceInstance.config字段的结构
export interface ServiceInstanceConfig {
  // 应用元数据配置
  app_metadata?: {
    // 应用类型：模型切换 | 应用市场
    app_type?: 'model' | 'marketplace';

    // 🎯 新增：Dify应用类型（必选字段）
    // 基于Dify官方API文档的五种应用类型
    dify_apptype?:
      | 'chatbot'
      | 'agent'
      | 'chatflow'
      | 'workflow'
      | 'text-generation';

    // 是否为常用模型（用于优先预加载）
    is_common_model?: boolean;

    // 是否为应用市场应用
    is_marketplace_app?: boolean;

    // 应用标签（用于分类和搜索）
    tags?: string[];

    // 模型类型（如果是模型类型的应用）
    model_type?: string;

    // 应用图标URL
    icon_url?: string;

    // 应用简介
    brief_description?: string;

    // 其他自定义元数据
    [key: string]: any;
  };

  // 🎯 新增：Dify应用参数配置（替代API调用）
  // 这些参数原本需要调用Dify API获取，现在可以直接在数据库中配置
  // 使用标准的Dify API接口规范
  dify_parameters?: {
    // 开场白配置
    opening_statement?: string;

    // 推荐问题列表
    suggested_questions?: string[];

    // 文件上传配置
    file_upload?: {
      image?: {
        enabled: boolean;
        number_limits: number;
        transfer_methods: ('remote_url' | 'local_file')[];
      };
      document?: {
        enabled: boolean;
        number_limits: number;
        transfer_methods: ('remote_url' | 'local_file')[];
      };
      audio?: {
        enabled: boolean;
        number_limits: number;
        transfer_methods: ('remote_url' | 'local_file')[];
      };
      video?: {
        enabled: boolean;
        number_limits: number;
        transfer_methods: ('remote_url' | 'local_file')[];
      };
    };
  };

  // 其他配置
  [key: string]: any;
}

// 🎯 扩展ServiceInstance接口，添加可见性字段
export interface ServiceInstance {
  id: string;
  provider_id: string;
  display_name: string | null;
  description: string | null;
  instance_id: string;
  api_path: string;
  is_default: boolean;
  visibility: AppVisibility; // 新增字段
  config: ServiceInstanceConfig;
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

// 🎯 SSO配置接口类型定义
// 基于最新的SSO配置管理系统设计
// 🎯 SSO提供商settings字段的标准化配置结构
// 统一管理协议配置、安全设置和UI配置
export interface SsoProviderSettings {
  // 协议配置
  protocol_config: {
    base_url: string; // SSO服务器基础URL
    version?: string; // 协议版本（如CAS 2.0/3.0）
    timeout?: number; // 请求超时时间（毫秒）
    endpoints: {
      login: string; // 登录端点路径
      logout: string; // 注销端点路径
      validate: string; // 票据验证端点路径
      validate_v3?: string; // CAS 3.0验证端点（可选）
      metadata?: string; // 元数据端点路径（SAML使用）
    };
    attributes_mapping: {
      employee_id: string; // 工号字段映射
      username: string; // 用户名字段映射
      full_name: string; // 全名字段映射
      email?: string; // 邮箱字段映射（可选）
    };
    // 协议特定配置
    scope?: string; // OIDC scope参数
    response_type?: string; // OIDC response_type参数
    issuer?: string; // OIDC issuer URL
    entity_id?: string; // SAML entity ID
    sso_url?: string; // SAML SSO URL
  };

  // 安全配置
  security: {
    require_https: boolean; // 是否要求HTTPS连接
    validate_certificates: boolean; // 是否验证SSL证书
    allowed_redirect_hosts?: string[]; // 允许的重定向主机白名单
  };

  // UI配置
  ui: {
    icon?: string; // 按钮图标（emoji或图片URL）
    logo_url?: string; // 机构logo图片URL
    description?: string; // 详细描述文本
    theme?: string; // 按钮主题：primary/secondary/default/outline
  };

  // 其他扩展配置
  [key: string]: any;
}

// 🎯 更新：SSO提供商接口，新增display_order和button_text字段
// 支持动态SSO配置管理
export interface SsoProvider {
  id: string;
  name: string;
  protocol: SsoProtocol;
  settings: SsoProviderSettings; // 使用标准化配置结构
  client_id: string | null; // OAuth2/OIDC客户端ID（预留）
  client_secret: string | null; // OAuth2/OIDC客户端密钥（预留）
  metadata_url: string | null; // SAML元数据URL（预留）
  enabled: boolean;
  display_order: number; // 新增：登录页面显示顺序
  button_text: string | null; // 新增：登录按钮显示文本
  created_at: string;
  updated_at: string;
}

// 🎯 新增：公开SSO提供商视图接口
// 用于登录页面安全访问，包含过滤敏感信息后的完整settings
export interface PublicSsoProvider {
  id: string;
  name: string;
  protocol: SsoProtocol;
  enabled: boolean;
  display_order: number;
  button_text: string | null;
  settings: any; // 过滤敏感信息后的完整settings
  created_at: string;
}

// 🎯 新增：创建SSO提供商时的数据类型
export interface CreateSsoProviderData {
  name: string;
  protocol: SsoProtocol;
  settings: SsoProviderSettings;
  client_id?: string | null;
  client_secret?: string | null;
  metadata_url?: string | null;
  enabled?: boolean;
  display_order?: number;
  button_text?: string | null;
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

// 🎯 新增：应用执行记录接口
// 用于存储工作流和文本生成应用的执行历史
// 这些应用类型不同于对话类应用，每次执行都是独立的任务
export interface AppExecution {
  id: string;
  user_id: string;
  service_instance_id: string;
  execution_type: ExecutionType;
  external_execution_id: string | null; // workflow_run_id 或 message_id
  task_id: string | null; // Dify 返回的 task_id（主要用于workflow）
  title: string;
  inputs: Record<string, any>; // 输入参数
  outputs: Record<string, any> | null; // 输出结果
  status: ExecutionStatus;
  error_message: string | null;
  total_steps: number; // workflow的步骤数，text-generation为0
  total_tokens: number;
  elapsed_time: number | null; // 执行耗时（秒）
  metadata: Record<string, any>; // 扩展字段，如标签、备注等
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// 🎯 用户可访问应用的扩展信息 - 群组版本
export interface UserAccessibleApp {
  service_instance_id: string;
  display_name: string | null;
  description: string | null;
  instance_id: string;
  api_path: string;
  visibility: AppVisibility;
  config: ServiceInstanceConfig;
  usage_quota: number | null;
  used_count: number;
  quota_remaining: number | null;
  group_name: string | null;
}

// 🎯 应用权限检查结果 - 简化版本
export interface AppPermissionCheck {
  has_access: boolean;
  // permission_level: AppPermissionLevel | null; // ❌ 已删除
  quota_remaining: number | null;
  error_message: string | null;
}

// 数据库类型命名空间
export namespace Database {
  export interface Tables {
    profiles: Profile;
    user_preferences: UserPreference;
    groups: Group;
    group_members: GroupMember;
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
    app_executions: AppExecution;
    group_app_permissions: GroupAppPermission;
    user_accessible_apps: UserAccessibleApp;
    app_permission_checks: AppPermissionCheck;
  }
}
