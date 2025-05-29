# Supabase 数据库文档

本文档记录了项目中的数据库结构、功能和使用方法。

## 数据库概述

本系统使用 Supabase 作为后端数据库服务，包含用户管理、对话管理、API 密钥管理等多个功能模块。数据库设计遵循关系型数据库的最佳实践，并使用行级安全策略 (RLS) 确保数据安全。

## 核心数据表结构

### 用户和身份管理

1. `profiles` 表：
   - 主要字段：`id`, `full_name`, `username`, `avatar_url`, `role`, `status`, `created_at`, `updated_at`, `last_login`, `auth_source`, `sso_provider_id`
   - `role` 字段可能的值为 `'user'` 或 `'admin'`，默认值为 `'user'`
   - `status` 字段可能的值为 `'active'`, `'suspended'` 或 `'pending'`

2. `user_preferences` 表：
   - 主要字段：`id`, `user_id`, `theme`, `language`, `notification_settings`, `ai_preferences`, `updated_at`
   - 存储用户的个性化设置和偏好

### 对话和消息管理

1. `conversations` 表：
   - 主要字段：`id`, `org_id`, `user_id`, `ai_config_id`, `title`, `summary`, `settings`, `created_at`, `updated_at`, `status`
   - Dify 集成字段：`external_id`, `app_id`, `last_message_preview`, `metadata`
   - `metadata` 字段 (JSONB 类型)：存储对话的额外元数据，如是否置顶、标签、归档状态、最后活跃时间等。示例：`{"pinned":true,"tags":["重要"],"archived":false,"last_active_at":"2024-05-22T12:00:00Z"}`。该字段支持灵活扩展，便于前端自定义对话属性。
   - `last_message_preview` 字段：用于在侧边栏等位置展示对话的最后一条消息摘要。20250522193000 迁移后，该字段格式已调整为 JSONB，包含 `content`（消息内容预览）、`role`（消息角色）、`created_at`（消息时间）等。例如：`{"content":"你好，有什么可以帮您？","role":"assistant","created_at":"2024-05-22T19:30:00Z"}`。这样便于前端直接渲染不同角色和时间的消息预览。

2. `messages` 表：
   - 主要字段：`id`, `conversation_id`, `user_id`, `role`, `content`, `metadata`, `created_at`, `status`
   - Dify 集成字段：`external_id`, `token_count`, `is_synced`
   - `role` 字段可能的值为 `'user'`, `'assistant'` 或 `'system'`
   - `status` 字段可能的值为 `'sent'`, `'delivered'` 或 `'error'`
   - `metadata` 字段 (JSONB 类型)：用于存储消息的附加信息，如消息来源、编辑历史、引用内容等。该字段为可选，便于后续功能扩展。
   - 触发器说明：自 20250521125100_add_message_trigger.sql 起，`messages` 表增加了触发器（如 `set_message_synced_on_update`、`update_conversation_last_message_preview` 等），用于自动维护消息同步状态、更新时间戳、以及在新消息插入或更新时自动刷新 `conversations.last_message_preview` 字段。这些触发器确保数据一致性和前端展示的实时性，无需手动维护。

### API 密钥管理

1. `providers` 表：
   - 主要字段：`id`, `name`, `type`, `base_url`, `auth_type`, `is_active`, `created_at`, `updated_at`
   - 存储 API 服务提供商信息，如 Dify

2. `service_instances` 表：
   - 主要字段：`id`, `provider_id`, `name`, `display_name`, `description`, `instance_id`, `api_path`, `is_default`, `config`, `created_at`, `updated_at`
   - 存储特定服务提供商的实例配置
   - `provider_id` 和 `instance_id` 组合具有唯一性约束
   - **默认应用唯一性约束**：通过部分唯一索引确保每个提供商最多只能有一个默认应用（`is_default = TRUE`）

3. `api_keys` 表：
   - 主要字段：`id`, `provider_id`, `service_instance_id`, `user_id`, `key_value`, `is_default`, `usage_count`, `last_used_at`, `created_at`, `updated_at`
   - 存储用于访问外部 API 的密钥

### 组织和成员管理

1. `organizations` 表：
   - 主要字段：`id`, `name`, `logo_url`, `settings`, `created_at`, `updated_at`

2. `org_members` 表：
   - 主要字段：`id`, `org_id`, `user_id`, `role`, `created_at`, `updated_at`
   - `role` 字段可能的值为 `'owner'`, `'admin'` 或 `'member'`

### SSO 认证

1. `sso_providers` 表：
   - 主要字段：`id`, `name`, `protocol`, `settings`, `client_id`, `client_secret`, `metadata_url`, `enabled`, `created_at`, `updated_at`
   - `protocol` 字段可能的值为 `'SAML'`, `'OAuth2'` 或 `'OIDC'`

2. `domain_sso_mappings` 表：
   - 主要字段：`id`, `domain`, `sso_provider_id`, `enabled`, `created_at`, `updated_at`

## 行级安全策略 (RLS)

系统使用行级安全策略确保数据安全：

1. `conversations` 和 `messages` 表：
   - 用户只能查看、创建、更新和删除自己的对话和消息
   - 消息的访问权限通过关联的对话进行控制

2. 管理员专属表：
   - `api_keys`, `providers`, `service_instances` 表只对管理员开放
   - 普通用户无法访问这些表

## 管理员功能

### 管理员角色

管理员角色具有特殊权限，可以管理 API 密钥、服务提供商和服务实例等敏感资源。

### 管理员设置函数

系统提供了一个 SQL 函数用于将用户设置为管理员：

```sql
public.initialize_admin(admin_email TEXT)
```

#### 参数

- `admin_email`: 要设置为管理员的用户电子邮件地址

#### 返回值

- 无返回值 (VOID)

#### 使用示例

```sql
-- 将指定邮箱的用户设置为管理员
SELECT public.initialize_admin('user@example.com');
```

#### 函数行为

1. 根据提供的电子邮件地址在 `auth.users` 表中查找用户 ID
2. 如果用户不存在，抛出异常
3. 如果用户存在，更新 `profiles` 表中对应用户的 `role` 字段为 `'admin'`
4. 输出通知消息确认用户已设置为管理员

### 管理员权限验证

前端应用通过 `useAdminAuth` Hook 来验证当前用户是否具有管理员权限：

```typescript
const { isAdmin, isLoading, error } = useAdminAuth();

// 使用示例
if (!isAdmin) return <AccessDenied />;
```

## Dify 集成

系统与 Dify AI 平台集成，相关数据结构包括：

1. 在 `conversations` 表中添加：
   - `external_id`: 存储 Dify 中的会话 ID
   - `app_id`: 关联的 Dify 应用 ID
   - `last_message_preview`: 最后一条消息的预览，用于在侧边栏显示

2. 在 `messages` 表中添加：
   - `external_id`: Dify 中的消息 ID
   - `token_count`: 消息的 token 数量，用于统计使用量
   - `is_synced`: 消息是否已同步到 Dify

3. 初始化 Dify 配置数据：
   - 在 `providers` 表中创建 Dify 提供商记录
   - 在 `service_instances` 表中创建默认服务实例
   - 在 `api_keys` 表中存储 API 密钥

## 注意事项

1. 管理员设置是一项敏感操作，应该只由系统管理员执行
2. 管理员用户可以访问和修改系统中的敏感配置，如 API 密钥
3. 确保在生产环境中谨慎使用管理员设置函数
4. API 密钥等敏感信息应该妥善保管，避免泄露

## 数据库触发器和自动化功能

系统使用多个触发器实现自动化功能和数据完整性保护：

### 用户管理触发器

1. **用户注册触发器** (`handle_new_user`)：
   - 当新用户注册时，自动创建 profiles 记录
   - 优先使用用户提供的 username，如果为空则生成默认值（格式：`user_前8位UUID`）
   - 自动同步用户元数据（full_name, avatar_url 等）

2. **用户删除前处理** (`handle_user_deletion_prep`)：
   - 在删除用户前处理组织权限转移
   - 如果用户是组织 owner，自动将权限转移给其他 admin 或 member
   - 确保组织不会因为 owner 删除而变成孤儿组织

### 组织管理触发器

1. **组织成员删除后清理** (`handle_org_member_deletion`)：
   - 当组织成员被删除后，检查组织是否还有其他成员
   - 如果没有其他成员，自动删除孤儿组织及其相关数据
   - 通过级联删除自动清理 ai_configs 等关联数据

2. **组织成员操作验证** (`validate_org_member_operations`)：
   - 确保不会移除组织的最后一个 owner
   - 保护组织的基本管理结构

### 消息管理触发器

1. **消息同步状态维护** (`set_message_synced_on_update`)：
   - 自动维护消息的同步状态和时间戳
   - 确保与外部系统（如 Dify）的数据一致性

2. **对话预览更新** (`update_conversation_last_message_preview`)：
   - 在新消息插入或更新时自动刷新 `conversations.last_message_preview` 字段
   - 确保前端展示的实时性，无需手动维护

### 数据清理和维护

系统提供了专门的维护函数：

1. **孤儿数据清理** (`cleanup_orphan_data`)：
   - 清理没有成员的组织
   - 清理孤儿 AI 配置
   - 清理没有对话的孤儿消息

2. **安全批量清理** (`safe_cleanup_orphan_data`)：
   - 支持 dry_run 模式，可以预览清理结果
   - 带事务控制的安全清理操作

## 行级安全策略 (RLS) 更新

### API 配置访问策略

为了支持服务端 API 路由访问 Dify 配置，系统更新了以下表的 RLS 策略：

1. **providers 表**：
   - 管理员可以进行所有操作
   - 允许服务端（未认证请求）和已认证用户读取提供商信息

2. **service_instances 表**：
   - 管理员可以进行所有操作
   - 允许服务端和已认证用户读取服务实例信息

3. **api_keys 表**：
   - 管理员可以进行所有操作
   - 允许服务端和已认证用户读取 API 密钥（仅读取，不能修改）

这些策略确保了 API 路由可以正常访问 Dify 配置，同时保持了适当的安全控制。

## 相关迁移文件

数据库结构和函数在以下迁移文件中定义：

### 基础结构
- `/supabase/migrations/20250501000000_init.sql`: 初始化基础表结构
- `/supabase/migrations/20250502000000_sso_config.sql`: SSO 认证配置

### 用户和权限管理
- `/supabase/migrations/20250508134000_create_profile_trigger.sql`: 创建用户资料触发器
- `/supabase/migrations/20250508140000_fix_profiles_schema.sql`: 修复用户资料表结构
- `/supabase/migrations/20250508141000_profiles_schema.sql`: 用户资料表结构调整
- `/supabase/migrations/20250508174000_add_admin_role.sql`: 添加管理员角色和相关函数
- `/supabase/migrations/20250524193208_fix_username_sync.sql`: 修复用户名同步逻辑
- `/supabase/migrations/20250524195000_fix_profiles_foreign_key.sql`: 修复 profiles 表外键约束
- `/supabase/migrations/20250524200000_fix_user_deletion_trigger.sql`: 修复用户删除触发器

### API 密钥管理
- `/supabase/migrations/20250508165500_api_key_management.sql`: API 密钥管理
- `/supabase/migrations/20250508181700_fix_api_keys_schema.sql`: 修复 API 密钥表结构
- `/supabase/migrations/20250508182400_fix_api_key_encryption.sql`: 修复 API 密钥加密
- `/supabase/migrations/20250508183400_extend_service_instances.sql`: 扩展服务实例表
- `/supabase/migrations/20250524230000_fix_dify_config_rls.sql`: 修复 Dify 配置相关表的 RLS 策略

### 对话和消息管理
- `/supabase/migrations/20250513104549_extend_conversations_messages.sql`: 扩展对话和消息表
- `/supabase/migrations/20250515132500_add_metadata_to_conversations.sql`: 添加元数据字段到对话表
- `/supabase/migrations/20250521125100_add_message_trigger.sql`: 增加 messages 表触发器，自动维护同步状态和 last_message_preview
- `/supabase/migrations/20250522193000_update_message_preview_format.sql`: 调整 conversations.last_message_preview 字段为 JSONB 格式，支持更丰富的消息预览内容

### 数据完整性和清理
- `/supabase/migrations/20250524194000_improve_cascade_deletion.sql`: 改进级联删除逻辑，处理孤儿组织和 AI 配置问题
- `/supabase/migrations/20250529151826_ensure_default_service_instance_constraint.sql`: 确保默认服务实例的唯一性约束，防止同一提供商下存在多个默认应用
