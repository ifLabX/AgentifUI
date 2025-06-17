/**
 * 数据库类型定义
 * 
 * 本文件定义了与数据库表结构对应的TypeScript类型
 * 所有与数据库交互的代码都应使用这些类型，确保类型安全
 */

// 枚举类型
export type UserRole = 'admin' | 'manager' | 'user';
export type AccountStatus = 'active' | 'suspended' | 'pending';
export type OrgMemberRole = 'owner' | 'admin' | 'member';
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'error';
export type SsoProtocol = 'SAML' | 'OAuth2' | 'OIDC';

// --- BEGIN COMMENT ---
// 🎯 新增：应用执行相关的枚举类型
// 用于工作流和文本生成应用的执行记录管理
// --- END COMMENT ---
export type ExecutionType = 'workflow' | 'text-generation';
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'stopped' | 'deleted';

// 用户和身份管理
export interface Profile {
  id: string;
  email?: string;
  full_name?: string | null;
  username?: string;
  avatar_url?: string;
  auth_source: string;
  phone?: string;
  department?: string;
  job_title?: string;
  created_at: string;
  updated_at: string;
  role: UserRole;
  status: AccountStatus;
  last_login: string | null;
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
  department: string | null;
  job_title: string | null;
  created_at: string;
  updated_at: string;
}

// --- BEGIN COMMENT ---
// 🎯 更新：部门应用权限管理
// 改为基于部门的权限控制，更符合实际业务需求
// --- END COMMENT ---
// --- BEGIN COMMENT ---
// 🎯 应用权限级别类型 - 已删除，简化权限设计
// export type AppPermissionLevel = 'full' | 'read_only' | 'restricted';
// --- END COMMENT ---
export type AppVisibility = 'public' | 'org_only' | 'private';

// --- BEGIN COMMENT ---
// 🎯 部门应用权限接口 - 简化版本
// 删除了混淆的permission_level字段，只保留核心的is_enabled和usage_quota
// --- END COMMENT ---
export interface DepartmentAppPermission {
  id: string;
  org_id: string;
  department: string;
  service_instance_id: string;
  is_enabled: boolean;
  // permission_level: AppPermissionLevel; // ❌ 已删除 - 造成混淆的字段
  usage_quota: number | null; // NULL表示无限制
  used_count: number;
  quota_reset_date: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
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
  // --- BEGIN COMMENT ---
  // 以下是新增字段，用于支持与 Dify 的集成
  // external_id: Dify 中的会话 ID
  // app_id: 关联的 Dify 应用 ID
  // last_message_preview: 最后一条消息的预览，用于在侧边栏显示
  // metadata: 存储额外的元数据，如固定状态等
  // --- END COMMENT ---
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
  // --- BEGIN COMMENT ---
  // 以下是新增字段，用于支持与 Dify 的集成
  // external_id: Dify 中的消息 ID
  // token_count: 消息的 token 数量，用于统计使用量
  // is_synced: 消息是否已同步到 Dify
  // sequence_order: 消息序列顺序，用于优化排序性能（0=用户消息，1=助手消息，2=系统消息）
  // --- END COMMENT ---
  external_id: string | null;
  token_count: number | null;
  is_synced: boolean;
  sequence_order: number;
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

// --- BEGIN COMMENT ---
// 🎯 服务实例配置类型定义
// 用于规范ServiceInstance.config字段的结构
// --- END COMMENT ---
export interface ServiceInstanceConfig {
  // 应用元数据配置
  app_metadata?: {
    // 应用类型：模型切换 | 应用市场
    app_type?: 'model' | 'marketplace';
    
    // --- BEGIN COMMENT ---
    // 🎯 新增：Dify应用类型（必选字段）
    // 基于Dify官方API文档的五种应用类型
    // --- END COMMENT ---
    dify_apptype?: 'chatbot' | 'agent' | 'chatflow' | 'workflow' | 'text-generation';
    
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
  
  // --- BEGIN COMMENT ---
  // 🎯 新增：Dify应用参数配置（替代API调用）
  // 这些参数原本需要调用Dify API获取，现在可以直接在数据库中配置
  // 使用标准的Dify API接口规范
  // --- END COMMENT ---
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

// --- BEGIN COMMENT ---
// 🎯 扩展ServiceInstance接口，添加可见性字段
// --- END COMMENT ---
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

// --- BEGIN COMMENT ---
// 🎯 新增：应用执行记录接口
// 用于存储工作流和文本生成应用的执行历史
// 这些应用类型不同于对话类应用，每次执行都是独立的任务
// --- END COMMENT ---
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

// --- BEGIN COMMENT ---
// 🎯 用户可访问应用的扩展信息
// 简化版本：删除了permission_level字段
// --- END COMMENT ---
export interface UserAccessibleApp {
  service_instance_id: string;
  display_name: string | null;
  description: string | null;
  instance_id: string;
  api_path: string;
  visibility: AppVisibility;
  config: ServiceInstanceConfig;
  // permission_level: AppPermissionLevel; // ❌ 已删除
  usage_quota: number | null;
  used_count: number;
  quota_remaining: number | null;
  department: string | null;
  org_name: string | null;
}

// --- BEGIN COMMENT ---
// 🎯 应用权限检查结果 - 简化版本
// --- END COMMENT ---
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
    app_executions: AppExecution;
    department_app_permissions: DepartmentAppPermission;
    user_accessible_apps: UserAccessibleApp;
    app_permission_checks: AppPermissionCheck;
  }
}
