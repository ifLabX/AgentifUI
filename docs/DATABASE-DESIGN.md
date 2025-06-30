# AgentifUI 数据库设计文档

本文档详细描述了 AgentifUI 平台的数据库设计，包括表结构、关系、安全机制和特性。本文档与当前数据库状态完全同步，包含所有已应用的迁移文件。

**文档更新日期**: 2025-06-30
**数据库版本**: 包含至 20250630034523_fix_group_members_foreign_key.sql 的所有迁移

## 目录

1. [核心表结构](#核心表结构)
   - [用户和身份管理](#用户和身份管理)
   - [群组和成员管理](#群组和成员管理)
   - [聊天和消息](#聊天和消息)
   - [API密钥管理](#api密钥管理)
   - [SSO认证](#sso认证)
   - [存储和文件管理](#存储和文件管理)
   - [其他表](#其他表)
2. [数据库特性](#数据库特性)
   - [安全机制](#安全机制)
   - [数据完整性](#数据完整性)
   - [自动化功能](#自动化功能)
3. [用户管理系统](#用户管理系统)
   - [管理员视图](#管理员视图)
   - [权限保护机制](#权限保护机制)
   - [安全函数](#安全函数)
4. [初始数据](#初始数据)
5. [设计特点](#设计特点)
6. [ER图](#er图)

## 核心表结构

### 用户和身份管理

#### profiles

扩展自 `auth.users`，包含用户的基本信息和状态。

| 字段名          | 类型                     | 描述         | 约束                                                      |
| --------------- | ------------------------ | ------------ | --------------------------------------------------------- |
| id              | UUID                     | 用户ID       | 主键，引用 auth.users(id)                                 |
| full_name       | TEXT                     | 用户全名     |                                                           |
| username        | TEXT                     | 用户名       | 唯一                                                      |
| avatar_url      | TEXT                     | 头像URL      |                                                           |
| email           | TEXT                     | 用户邮箱     | 从 auth.users 同步                                        |
| phone           | TEXT                     | 用户手机号   | 从 auth.users 同步                                        |
| role            | user_role                | 用户角色     | DEFAULT 'user'::user_role                                 |
| status          | account_status           | 账号状态     | DEFAULT 'active'::account_status                          |
| created_at      | TIMESTAMP WITH TIME ZONE | 创建时间     | DEFAULT CURRENT_TIMESTAMP                                 |
| updated_at      | TIMESTAMP WITH TIME ZONE | 更新时间     | DEFAULT CURRENT_TIMESTAMP                                 |
| last_login      | TIMESTAMP WITH TIME ZONE | 最后登录时间 |                                                           |
| auth_source     | TEXT                     | 认证来源     | DEFAULT 'email'，支持 email/google/github/phone/bistu_sso |
| sso_provider_id | UUID                     | SSO提供商ID  | 引用 sso_providers(id)                                    |
| employee_number | TEXT                     | 学工号       | 北京信息科技大学统一身份标识，唯一约束                    |

**枚举类型定义：**

- `user_role`: ENUM ('admin', 'manager', 'user')
- `account_status`: ENUM ('active', 'suspended', 'pending')

#### user_preferences

存储用户界面和功能偏好设置。

| 字段名                | 类型                     | 描述       | 约束                      |
| --------------------- | ------------------------ | ---------- | ------------------------- |
| id                    | UUID                     | 偏好设置ID | 主键                      |
| user_id               | UUID                     | 用户ID     | 引用 auth.users(id)，唯一 |
| theme                 | TEXT                     | 界面主题   | DEFAULT 'light'           |
| language              | TEXT                     | 界面语言   | DEFAULT 'zh-CN'           |
| notification_settings | JSONB                    | 通知设置   | DEFAULT '{}'              |
| ai_preferences        | JSONB                    | AI偏好设置 | DEFAULT '{}'              |
| updated_at            | TIMESTAMP WITH TIME ZONE | 更新时间   | DEFAULT CURRENT_TIMESTAMP |

### 群组和成员管理

#### groups

存储群组信息，替代复杂的组织架构。

| 字段名      | 类型                     | 描述     | 约束                      |
| ----------- | ------------------------ | -------- | ------------------------- |
| id          | UUID                     | 群组ID   | 主键                      |
| name        | TEXT                     | 群组名称 | NOT NULL                  |
| description | TEXT                     | 群组描述 |                           |
| created_by  | UUID                     | 创建者ID | 引用 auth.users(id)       |
| created_at  | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP |

#### group_members

存储群组成员关系，简化的成员管理。

| 字段名     | 类型                     | 描述     | 约束                        |
| ---------- | ------------------------ | -------- | --------------------------- |
| id         | UUID                     | 关系ID   | 主键                        |
| group_id   | UUID                     | 群组ID   | 引用 groups(id)，NOT NULL   |
| user_id    | UUID                     | 用户ID   | 引用 profiles(id)，NOT NULL |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP   |
|            |                          |          | UNIQUE(group_id, user_id)   |

### 群组应用权限管理

#### group_app_permissions

存储群组级应用访问权限，实现简化的权限控制。

| 字段名              | 类型                     | 描述       | 约束                                  |
| ------------------- | ------------------------ | ---------- | ------------------------------------- |
| id                  | UUID                     | 权限ID     | 主键                                  |
| group_id            | UUID                     | 群组ID     | 引用 groups(id)，NOT NULL             |
| service_instance_id | UUID                     | 服务实例ID | 引用 service_instances(id)，NOT NULL  |
| is_enabled          | BOOLEAN                  | 是否启用   | DEFAULT TRUE                          |
| usage_quota         | INTEGER                  | 使用配额   | NULL表示无限制                        |
| used_count          | INTEGER                  | 已使用次数 | DEFAULT 0                             |
| created_at          | TIMESTAMP WITH TIME ZONE | 创建时间   | DEFAULT CURRENT_TIMESTAMP             |
|                     |                          |            | UNIQUE(group_id, service_instance_id) |

**权限控制说明：**

- **简化设计**: 基于群组的二元权限控制（启用/禁用）
- **配额管理**: 支持群组级使用配额限制
- **权限逻辑**: public(全员) | group_only(群组成员) | private(管理员)

**外键关系修复（20250630034523）：**

- **问题修复**: `group_members.user_id` 外键从 `auth.users(id)` 修改为 `profiles(id)`
- **解决原因**: 确保群组成员查询时可以正确关联 profiles 表获取用户信息
- **影响范围**: 修复了群组成员列表查询中的关系查询错误
- **安全保证**: 保持级联删除行为，确保用户删除时清理群组成员关系

### 聊天和消息

#### conversations

存储用户与AI的对话会话。

| 字段名       | 类型                     | 描述     | 约束                          |
| ------------ | ------------------------ | -------- | ----------------------------- |
| id           | UUID                     | 对话ID   | 主键                          |
| user_id      | UUID                     | 用户ID   | 引用 auth.users(id)，NOT NULL |
| ai_config_id | UUID                     | AI配置ID | 引用 ai_configs(id)           |
| title        | TEXT                     | 对话标题 | NOT NULL                      |
| summary      | TEXT                     | 对话摘要 |                               |
| settings     | JSONB                    | 对话设置 | DEFAULT '{}'                  |
| created_at   | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP     |
| updated_at   | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT CURRENT_TIMESTAMP     |
| status       | TEXT                     | 对话状态 | DEFAULT 'active'              |

#### messages

存储对话中的消息。

| 字段名          | 类型                     | 描述     | 约束                             |
| --------------- | ------------------------ | -------- | -------------------------------- |
| id              | UUID                     | 消息ID   | 主键                             |
| conversation_id | UUID                     | 对话ID   | 引用 conversations(id)，NOT NULL |
| user_id         | UUID                     | 用户ID   | 引用 auth.users(id)              |
| role            | message_role             | 消息角色 | NOT NULL                         |
| content         | TEXT                     | 消息内容 | NOT NULL                         |
| metadata        | JSONB                    | 元数据   | DEFAULT '{}'                     |
| created_at      | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP        |
| status          | message_status           | 消息状态 | DEFAULT 'sent'                   |

### API密钥管理

#### providers

存储API服务提供商信息。

| 字段名     | 类型                     | 描述           | 约束                                     |
| ---------- | ------------------------ | -------------- | ---------------------------------------- |
| id         | UUID                     | 提供商ID       | 主键                                     |
| name       | TEXT                     | 提供商名称     | NOT NULL，唯一                           |
| type       | TEXT                     | 提供商类型     | NOT NULL                                 |
| base_url   | TEXT                     | 基础URL        | NOT NULL                                 |
| auth_type  | TEXT                     | 认证类型       | NOT NULL                                 |
| is_active  | BOOLEAN                  | 是否激活       | DEFAULT TRUE                             |
| is_default | BOOLEAN                  | 是否默认提供商 | DEFAULT FALSE                            |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间       | DEFAULT NOW()                            |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间       | DEFAULT NOW()                            |
|            |                          |                | UNIQUE INDEX: 系统中只能有一个默认提供商 |

#### service_instances

存储服务实例信息。

| 字段名       | 类型                     | 描述       | 约束                                                           |
| ------------ | ------------------------ | ---------- | -------------------------------------------------------------- |
| id           | UUID                     | 实例ID     | 主键                                                           |
| provider_id  | UUID                     | 提供商ID   | 引用 providers(id)                                             |
| display_name | TEXT                     | 显示名称   | DEFAULT ''                                                     |
| description  | TEXT                     | 描述       | DEFAULT ''                                                     |
| instance_id  | TEXT                     | 实例标识符 | NOT NULL                                                       |
| api_path     | TEXT                     | API路径    | DEFAULT ''                                                     |
| is_default   | BOOLEAN                  | 是否默认   | DEFAULT FALSE                                                  |
| visibility   | TEXT                     | 应用可见性 | DEFAULT 'public'，CHECK IN ('public', 'group_only', 'private') |
| config       | JSONB                    | 配置参数   | DEFAULT '{}'                                                   |
| created_at   | TIMESTAMP WITH TIME ZONE | 创建时间   | DEFAULT NOW()                                                  |
| updated_at   | TIMESTAMP WITH TIME ZONE | 更新时间   | DEFAULT NOW()                                                  |
|              |                          |            | UNIQUE(provider_id, instance_id)                               |
|              |                          |            | UNIQUE INDEX: 每个提供商最多一个默认应用                       |

**应用可见性说明：**

- `public`: 公开应用，所有用户可见
- `group_only`: 群组应用，只有群组成员可见
- `private`: 私有应用，仅管理员可见

#### api_keys

存储API密钥。

| 字段名              | 类型                     | 描述         | 约束                       |
| ------------------- | ------------------------ | ------------ | -------------------------- |
| id                  | UUID                     | 密钥ID       | 主键                       |
| provider_id         | UUID                     | 提供商ID     | 引用 providers(id)         |
| service_instance_id | UUID                     | 服务实例ID   | 引用 service_instances(id) |
| user_id             | UUID                     | 用户ID       | 引用 auth.users(id)        |
| key_value           | TEXT                     | 加密的密钥值 | NOT NULL                   |
| is_default          | BOOLEAN                  | 是否默认     | DEFAULT FALSE              |
| usage_count         | INTEGER                  | 使用次数     | DEFAULT 0                  |
| last_used_at        | TIMESTAMP WITH TIME ZONE | 最后使用时间 |                            |
| created_at          | TIMESTAMP WITH TIME ZONE | 创建时间     | DEFAULT NOW()              |
| updated_at          | TIMESTAMP WITH TIME ZONE | 更新时间     | DEFAULT NOW()              |

### SSO认证

#### sso_providers

存储SSO提供商信息，支持多种单点登录协议和动态配置管理。

| 字段名        | 类型                     | 描述         | 约束                                                                  |
| ------------- | ------------------------ | ------------ | --------------------------------------------------------------------- |
| id            | UUID                     | 提供商ID     | 主键，用于API路由(/api/sso/{id}/\*)和服务实例缓存                     |
| name          | TEXT                     | 提供商名称   | NOT NULL，用于管理界面展示和日志记录                                  |
| protocol      | sso_protocol             | 协议类型     | NOT NULL，决定使用哪个服务实现类                                      |
| settings      | JSONB                    | 统一配置结构 | NOT NULL，DEFAULT '{}'，包含protocol_config、security、ui三个主要部分 |
| client_id     | TEXT                     | 客户端ID     | OAuth2/OIDC协议使用，CAS协议不使用此字段                              |
| client_secret | TEXT                     | 客户端密钥   | OAuth2/OIDC协议使用，建议加密存储                                     |
| metadata_url  | TEXT                     | 元数据URL    | SAML协议使用，用于自动配置端点信息                                    |
| enabled       | BOOLEAN                  | 是否启用     | DEFAULT TRUE，false时不会在登录页面显示且API拒绝访问                  |
| display_order | INTEGER                  | 显示顺序     | DEFAULT 0，登录页面按钮显示顺序（数字越小越靠前）                     |
| button_text   | TEXT                     | 按钮文本     | 登录按钮显示文本，为空时使用name字段值，支持多语言                    |
| created_at    | TIMESTAMP WITH TIME ZONE | 创建时间     | DEFAULT CURRENT_TIMESTAMP                                             |
| updated_at    | TIMESTAMP WITH TIME ZONE | 更新时间     | DEFAULT CURRENT_TIMESTAMP                                             |

**枚举类型定义：**

- `sso_protocol`: ENUM ('OIDC', 'SAML', 'CAS')

#### domain_sso_mappings

存储域名到SSO提供商的映射。

| 字段名          | 类型                     | 描述        | 约束                             |
| --------------- | ------------------------ | ----------- | -------------------------------- |
| id              | UUID                     | 映射ID      | 主键                             |
| domain          | TEXT                     | 域名        | NOT NULL，唯一                   |
| sso_provider_id | UUID                     | SSO提供商ID | 引用 sso_providers(id)，NOT NULL |
| enabled         | BOOLEAN                  | 是否启用    | DEFAULT TRUE                     |
| created_at      | TIMESTAMP WITH TIME ZONE | 创建时间    | DEFAULT CURRENT_TIMESTAMP        |
| updated_at      | TIMESTAMP WITH TIME ZONE | 更新时间    | DEFAULT CURRENT_TIMESTAMP        |

#### auth_settings

存储全局认证设置。

| 字段名                     | 类型                     | 描述         | 约束                             |
| -------------------------- | ------------------------ | ------------ | -------------------------------- |
| id                         | UUID                     | 设置ID       | 主键                             |
| allow_email_registration   | BOOLEAN                  | 允许邮箱注册 | DEFAULT FALSE                    |
| allow_phone_registration   | BOOLEAN                  | 允许手机注册 | DEFAULT FALSE                    |
| allow_password_login       | BOOLEAN                  | 允许密码登录 | DEFAULT TRUE                     |
| require_email_verification | BOOLEAN                  | 要求邮箱验证 | DEFAULT TRUE                     |
| password_policy            | JSONB                    | 密码策略     | DEFAULT '{"min_length": 8, ...}' |
| created_at                 | TIMESTAMP WITH TIME ZONE | 创建时间     | DEFAULT CURRENT_TIMESTAMP        |
| updated_at                 | TIMESTAMP WITH TIME ZONE | 更新时间     | DEFAULT CURRENT_TIMESTAMP        |

### 存储和文件管理

AgentifUI 使用 Supabase Storage 进行文件存储管理，主要用于用户头像上传。存储系统采用公共存储桶设计，支持灵活的权限控制和安全策略。

#### 存储桶配置

**avatars 存储桶**

| 配置项         | 值                                                       | 描述                           |
| -------------- | -------------------------------------------------------- | ------------------------------ |
| 存储桶ID       | `avatars`                                                | 存储桶唯一标识符               |
| 存储桶名称     | `avatars`                                                | 存储桶显示名称                 |
| 公共访问       | `true`                                                   | 启用公共访问，任何人可查看头像 |
| 文件大小限制   | `5242880` (5MB)                                          | 单个文件最大大小               |
| 允许的MIME类型 | `['image/jpeg', 'image/jpg', 'image/png', 'image/webp']` | 支持的图片格式                 |
| 文件路径结构   | `user-{用户ID}/{时间戳}.{扩展名}`                        | 用户隔离的文件路径             |

### 其他表

#### ai_configs

存储AI服务配置。

| 字段名     | 类型                     | 描述     | 约束                      |
| ---------- | ------------------------ | -------- | ------------------------- |
| id         | UUID                     | 配置ID   | 主键                      |
| provider   | TEXT                     | 提供商   | NOT NULL                  |
| app_id     | TEXT                     | 应用ID   |                           |
| api_key    | TEXT                     | API密钥  | NOT NULL                  |
| api_url    | TEXT                     | API URL  | NOT NULL                  |
| settings   | JSONB                    | 配置设置 | DEFAULT '{}'              |
| enabled    | BOOLEAN                  | 是否启用 | DEFAULT TRUE              |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT CURRENT_TIMESTAMP |

#### api_logs

存储API调用日志。

| 字段名          | 类型                     | 描述       | 约束                      |
| --------------- | ------------------------ | ---------- | ------------------------- |
| id              | UUID                     | 日志ID     | 主键                      |
| user_id         | UUID                     | 用户ID     | 引用 auth.users(id)       |
| conversation_id | UUID                     | 对话ID     | 引用 conversations(id)    |
| provider        | TEXT                     | 提供商     | NOT NULL                  |
| endpoint        | TEXT                     | 端点       | NOT NULL                  |
| request         | JSONB                    | 请求内容   | DEFAULT '{}'              |
| response        | JSONB                    | 响应内容   | DEFAULT '{}'              |
| status_code     | INTEGER                  | 状态码     |                           |
| latency_ms      | INTEGER                  | 延迟(毫秒) |                           |
| created_at      | TIMESTAMP WITH TIME ZONE | 创建时间   | DEFAULT CURRENT_TIMESTAMP |

## 数据库特性

### 安全机制

#### 行级安全性(RLS)

所有表都启用了行级安全性策略，确保数据访问安全：

1. **用户数据**
   - 用户只能查看和更新自己的资料
   - 用户只能查看和更新自己的偏好设置

2. **群组数据**
   - 群组成员可以查看群组信息
   - 只有管理员可以管理群组
   - 群组成员可以查看成员列表

3. **对话和消息**
   - 用户只能查看、更新和删除自己的对话
   - 用户只能查看自己对话中的消息

4. **API密钥和配置**
   - 管理员可以进行所有操作（增删改查）
   - 服务端（未认证请求）和已认证用户可以读取配置信息
   - 这种设计支持API路由访问Dify配置，同时保持安全控制

5. **SSO配置**
   - 只有管理员可以访问和管理SSO提供商配置
   - 只有管理员可以访问和管理域名映射
   - 只有管理员可以访问和管理认证设置

6. **群组应用权限**
   - 用户只能查看自己所属群组的应用权限
   - 管理员可以管理所有群组的应用权限
   - 权限检查基于用户群组成员身份

#### 加密存储

API密钥使用AES-256-GCM加密算法存储，格式为"iv:authTag:encryptedData"，确保即使数据库被泄露，密钥也不会被直接获取。

### 数据完整性

#### 外键约束

表间关系通过外键约束维护，确保数据一致性：

- 级联删除：当父记录被删除时，相关子记录也会被删除
- 设置为NULL：某些情况下，当父记录被删除时，子记录的外键字段会被设置为NULL

#### 唯一约束

多个表包含唯一约束，确保数据唯一性：

- 用户名唯一性约束
- 域名唯一性约束
- 服务实例在同一提供商下实例ID唯一
- 群组成员在同一群组中唯一
- **默认应用唯一性约束**：每个提供商最多只能有一个默认服务实例（通过部分唯一索引实现）

### 自动化功能

#### 触发器

系统使用多个触发器实现自动化功能和数据完整性保护：

1. **用户管理触发器**
   - `handle_new_user`: 用户注册时自动创建profiles记录，优先使用用户提供的username
   - `handle_user_deletion_prep`: 用户删除前处理权限转移，防止孤儿数据

2. **群组管理触发器**
   - `handle_group_member_deletion`: 群组成员删除后自动清理孤儿群组
   - `validate_group_member_operations`: 验证群组成员操作，确保不会移除最后一个创建者

3. **消息管理触发器**
   - `set_message_synced_on_update`: 自动维护消息同步状态和时间戳
   - `update_conversation_last_message_preview`: 自动更新对话的最后消息预览

4. **更新时间戳触发器**
   - 自动更新表记录的updated_at字段
   - 应用于所有主要表

5. **数据清理和维护函数**
   - `cleanup_orphan_data`: 清理孤儿数据（群组、AI配置、消息）
   - `safe_cleanup_orphan_data`: 安全的批量清理，支持dry_run模式

6. **服务实例管理函数**
   - `set_default_service_instance(target_instance_id uuid, target_provider_id uuid)`: 原子性地设置默认服务实例，确保同一提供商只有一个默认实例

7. **群组权限管理函数**
   - `get_user_accessible_apps(user_id UUID)`: 获取用户可访问的应用列表，基于群组权限和应用可见性
   - `check_user_app_permission(user_id UUID, app_instance_id TEXT)`: 检查用户对特定应用的访问权限
   - `increment_app_usage(user_id UUID, app_instance_id TEXT)`: 增加应用使用计数，支持配额管理

## 用户管理系统

### 管理员视图

#### 用户数据访问

管理员功能通过以下方式实现用户数据访问：

**管理员功能实现：**

- 管理员通过 `lib/db/users.ts` 中的 `getUserList` 函数获取用户数据
- 使用 RLS 策略控制数据访问权限
- 管理员可以访问包括 `auth.users` 表中的邮箱、手机号等敏感信息
- 普通用户只能访问自己的数据

### 权限保护机制

#### 角色更新保护

**触发器函数：** `validate_role_update()`

防止管理员进行危险的角色操作：

1. **自我保护**：管理员不能修改自己的角色
2. **管理员保护**：不能降级其他管理员的权限
3. **权限验证**：只有管理员可以修改用户角色

#### 用户删除保护

**触发器函数：** `validate_user_deletion()`

防止删除关键用户：

1. **自我保护**：管理员不能删除自己的账号
2. **管理员保护**：不能删除其他管理员账号
3. **权限验证**：只有管理员可以删除用户

### 安全函数

#### 管理员权限检查

**函数：** `public.is_admin()`

#### 批量角色更新

**函数：** `safe_batch_update_role(target_user_ids UUID[], target_role user_role)`

安全的批量角色更新函数，包含完整的权限检查。

#### 用户统计函数

**函数：** `get_user_stats()`

为管理员提供用户统计信息。

#### SSO用户管理

**函数：** `find_user_by_employee_number(emp_num TEXT)`

根据学工号查找用户信息，专用于北信科SSO登录。

**函数：** `create_sso_user(emp_number TEXT, user_name TEXT, sso_provider_uuid UUID)`

为SSO用户创建新账户，用于首次登录。

## 初始数据

系统预设了以下初始数据：

### 默认AI配置(Dify)

```sql
INSERT INTO ai_configs (id, provider, app_id, api_key, api_url, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'dify',
  'default',
  'your_dify_api_key_here',
  'https://api.dify.ai',
  '{"model": "gpt-3.5-turbo", "temperature": 0.7}'
);
```

### SSO示例配置

```sql
INSERT INTO sso_providers (id, name, protocol, settings, client_id, client_secret, metadata_url, enabled)
VALUES
  (
    '00000000-0000-0000-0000-000000000002',
    'Azure AD 示例',
    'OIDC',
    '{"tenant_id": "common", "authorization_endpoint": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"}',
    'azure-client-id-example',
    'azure-client-secret-example',
    'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
    true
  );
```

### 默认认证设置

```sql
INSERT INTO auth_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001');
```

## 设计特点

### 模块化设计

数据库设计采用模块化方法，清晰分离不同功能领域：

- 用户和身份管理
- 群组和成员管理
- 聊天和消息
- API密钥管理
- SSO认证

### 简化架构

系统采用简化的群组权限架构：

- 每个群组有简单的成员关系
- 群组对应用有二元权限控制
- 支持三种应用可见性：public、group_only、private

### 灵活的API密钥管理

API密钥管理系统设计灵活，支持多种场景：

- 支持多提供商和多服务实例
- 加密存储确保安全性
- 支持用户级配置
- 可扩展的配置参数

### 完善的SSO集成

SSO认证系统支持多种认证方式：

- 支持SAML、OAuth2和OIDC协议
- 基于域名的自动路由
- 可配置的认证策略
- 与用户资料无缝集成

### 可扩展性

数据库设计考虑了未来扩展的需求：

- JSON/JSONB字段用于存储灵活配置
- 预留了扩展字段和设置
- 模块化设计便于添加新功能

## ER图

```
+---------------+       +----------------+       +---------------+
| profiles      |       | groups         |       | group_members |
+---------------+       +----------------+       +---------------+
| id            |<---+  | id             |<------| group_id      |
| full_name     |    |  | name           |       | user_id       |
| username      |    |  | description    |       | created_at    |
| avatar_url    |    |  | created_by     |       +---------------+
| role          |    |  | created_at     |       |               |
| status        |    |  |                |       | group_app_permissions |
| created_at    |    |  |                |       +---------------+
| updated_at    |    |  |                |       | id            |
| last_login    |    |  |                |<------| group_id      |
| auth_source   |    |  |                |       | service_instance_id |
| sso_provider_id|    |  |                |       | is_enabled    |
| employee_number|    |  |                |       | usage_quota   |
+---------------+    |  |                |       | used_count    |
                     |  |                |       | created_at    |
                     |  |                |       +---------------+
+---------------+    |  |                |       |               |
| conversations |    |  |                |       | ai_configs    |
+---------------+    |  |                |       +---------------+
| id            |    |  |                |       | id            |
| user_id       |----+  |                |       | provider      |
| ai_config_id  |       |                |       | app_id        |
| title         |       |                |       | api_key       |
| summary       |       |                |       | api_url       |
| settings      |       |                |       | settings      |
| created_at    |       |                |       | enabled       |
| updated_at    |       |                |       | created_at    |
| status        |       |                |       | updated_at    |
+---------------+       |                |       +---------------+
      |               |                |       |               |
      |               |                |       | providers     |
      v               |                |       +---------------+
+---------------+       |                |       | id            |
| messages      |       |                |       | name          |
+---------------+       |                |       | type          |
| id            |       |                |       | base_url      |
| conversation_id|       |                |       | auth_type     |
| user_id       |       |                |       | is_active     |
| role          |       |                |       | created_at    |
| content       |       |                |       | updated_at    |
| metadata      |       |                |       +---------------+
| created_at    |       |                |       |               |
| status        |       |                |       | service_instances|
+---------------+       |                |       +---------------+
                       |                |       | id            |
+---------------+       |                |       | provider_id   |
| user_preferences|       |                |       | display_name  |
+---------------+       |                |       | description   |
| id            |       |                |       | instance_id   |
| user_id       |       |                |       | api_path      |
| theme         |       |                |       | is_default    |
| language      |       |                |       | visibility    |
| notification_settings|       |                |       | config        |
| ai_preferences|       |                |       | created_at    |
| updated_at    |       |                |       | updated_at    |
+---------------+       |                |       +---------------+
                       |                |       |               |
+---------------+       |                |       | api_keys      |
| sso_providers |       |                |       +---------------+
+---------------+       |                |       | id            |
| id            |       |                |       | provider_id   |
| name          |       |                |       | service_instance_id|
| protocol      |       |                |       | user_id       |
| settings      |       |                |       | key_value     |
| client_id     |       |                |       | is_default    |
| client_secret |       |                |       | usage_count   |
| metadata_url  |       |                |       | last_used_at  |
| enabled       |       |                |       | created_at    |
| display_order |       |                |       | updated_at    |
| button_text   |       |                |       +---------------+
| created_at    |       |                |       |               |
| updated_at    |       |                |       | domain_sso_mappings|
+---------------+       |                |       +---------------+
      |               |                |       | id            |
      |               |                |       | domain        |
      v               |                |       | sso_provider_id|
+---------------+       |                |       | enabled       |
| domain_sso_mappings|               |                |       | created_at    |
+---------------+               |                |       | updated_at    |
| id            |               |                |       +---------------+
| domain        |               |                |       |               |
| sso_provider_id|               |                |       | auth_settings |
| enabled       |               |                |       +---------------+
| created_at    |               |                |       | id            |
| updated_at    |               |                |       | allow_email_registration|
+---------------+               |                |       | allow_phone_registration|
                               |                |       | allow_password_login|
                               |                |       | require_email_verification|
                               |                |       | password_policy|
                               |                |       | created_at    |
                               |                |       | updated_at    |
                               |                |       +---------------+
```

这个数据库设计为 AgentifUI 平台提供了简化但功能完整的基础，支持用户管理、群组协作、AI对话、SSO认证和API集成等核心功能。设计注重简洁性、安全性和可扩展性，便于未来功能扩展和维护。
