# LLM EduHub 数据库设计文档

本文档详细描述了 LLM EduHub 平台的数据库设计，包括表结构、关系、安全机制和特性。

## 目录

1. [核心表结构](#核心表结构)
   - [用户和身份管理](#用户和身份管理)
   - [组织和成员管理](#组织和成员管理)
   - [聊天和消息](#聊天和消息)
   - [API密钥管理](#api密钥管理)
   - [SSO认证](#sso认证)
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

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | UUID | 用户ID | 主键，引用 auth.users(id) |
| full_name | TEXT | 用户全名 | |
| username | TEXT | 用户名 | 唯一 |
| avatar_url | TEXT | 头像URL | |
| role | user_role | 用户角色 | DEFAULT 'user'::user_role |
| status | account_status | 账号状态 | DEFAULT 'active'::account_status |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT CURRENT_TIMESTAMP |
| last_login | TIMESTAMP WITH TIME ZONE | 最后登录时间 | |
| auth_source | TEXT | 认证来源 | DEFAULT 'password' |
| sso_provider_id | UUID | SSO提供商ID | 引用 sso_providers(id) |

**枚举类型定义：**
- `user_role`: ENUM ('admin', 'manager', 'user')
- `account_status`: ENUM ('active', 'suspended', 'pending')

#### user_preferences

存储用户界面和功能偏好设置。

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | UUID | 偏好设置ID | 主键 |
| user_id | UUID | 用户ID | 引用 auth.users(id)，唯一 |
| theme | TEXT | 界面主题 | DEFAULT 'light' |
| language | TEXT | 界面语言 | DEFAULT 'zh-CN' |
| notification_settings | JSONB | 通知设置 | DEFAULT '{}' |
| ai_preferences | JSONB | AI偏好设置 | DEFAULT '{}' |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT CURRENT_TIMESTAMP |

### 组织和成员管理

#### organizations

存储组织信息。

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | UUID | 组织ID | 主键 |
| name | TEXT | 组织名称 | NOT NULL |
| logo_url | TEXT | 组织Logo URL | |
| settings | JSONB | 组织设置 | DEFAULT '{}' |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT CURRENT_TIMESTAMP |

#### org_members

存储组织成员关系。

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | UUID | 关系ID | 主键 |
| org_id | UUID | 组织ID | 引用 organizations(id)，NOT NULL |
| user_id | UUID | 用户ID | 引用 auth.users(id)，NOT NULL |
| role | org_member_role | 成员角色 | DEFAULT 'member' |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT CURRENT_TIMESTAMP |
| | | | UNIQUE(org_id, user_id) |

### 聊天和消息

#### conversations

存储用户与AI的对话会话。

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | UUID | 对话ID | 主键 |
| org_id | UUID | 组织ID | 引用 organizations(id) |
| user_id | UUID | 用户ID | 引用 auth.users(id)，NOT NULL |
| ai_config_id | UUID | AI配置ID | 引用 ai_configs(id) |
| title | TEXT | 对话标题 | NOT NULL |
| summary | TEXT | 对话摘要 | |
| settings | JSONB | 对话设置 | DEFAULT '{}' |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT CURRENT_TIMESTAMP |
| status | TEXT | 对话状态 | DEFAULT 'active' |

#### messages

存储对话中的消息。

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | UUID | 消息ID | 主键 |
| conversation_id | UUID | 对话ID | 引用 conversations(id)，NOT NULL |
| user_id | UUID | 用户ID | 引用 auth.users(id) |
| role | message_role | 消息角色 | NOT NULL |
| content | TEXT | 消息内容 | NOT NULL |
| metadata | JSONB | 元数据 | DEFAULT '{}' |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| status | message_status | 消息状态 | DEFAULT 'sent' |

### API密钥管理

#### providers

存储API服务提供商信息。

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | UUID | 提供商ID | 主键 |
| name | TEXT | 提供商名称 | NOT NULL，唯一 |
| type | TEXT | 提供商类型 | NOT NULL |
| base_url | TEXT | 基础URL | NOT NULL |
| auth_type | TEXT | 认证类型 | NOT NULL |
| is_active | BOOLEAN | 是否激活 | DEFAULT TRUE |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT NOW() |

#### service_instances

存储服务实例信息。

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | UUID | 实例ID | 主键 |
| provider_id | UUID | 提供商ID | 引用 providers(id) |
| display_name | TEXT | 显示名称 | DEFAULT '' |
| description | TEXT | 描述 | DEFAULT '' |
| instance_id | TEXT | 实例标识符 | NOT NULL |
| api_path | TEXT | API路径 | DEFAULT '' |
| is_default | BOOLEAN | 是否默认 | DEFAULT FALSE |
| config | JSONB | 配置参数 | DEFAULT '{}' |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT NOW() |
| | | | UNIQUE(provider_id, instance_id) |
| | | | UNIQUE INDEX: 每个提供商最多一个默认应用 |

#### api_keys

存储API密钥。

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | UUID | 密钥ID | 主键 |
| provider_id | UUID | 提供商ID | 引用 providers(id) |
| service_instance_id | UUID | 服务实例ID | 引用 service_instances(id) |
| user_id | UUID | 用户ID | 引用 auth.users(id) |
| key_value | TEXT | 加密的密钥值 | NOT NULL |
| is_default | BOOLEAN | 是否默认 | DEFAULT FALSE |
| usage_count | INTEGER | 使用次数 | DEFAULT 0 |
| last_used_at | TIMESTAMP WITH TIME ZONE | 最后使用时间 | |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT NOW() |

### SSO认证

#### sso_providers

存储SSO提供商信息。

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | UUID | 提供商ID | 主键 |
| name | TEXT | 提供商名称 | NOT NULL |
| protocol | sso_protocol | 协议类型 | NOT NULL |
| settings | JSONB | 配置设置 | NOT NULL，DEFAULT '{}' |
| client_id | TEXT | 客户端ID | |
| client_secret | TEXT | 客户端密钥 | |
| metadata_url | TEXT | 元数据URL | |
| enabled | BOOLEAN | 是否启用 | DEFAULT TRUE |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT CURRENT_TIMESTAMP |

#### domain_sso_mappings

存储域名到SSO提供商的映射。

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | UUID | 映射ID | 主键 |
| domain | TEXT | 域名 | NOT NULL，唯一 |
| sso_provider_id | UUID | SSO提供商ID | 引用 sso_providers(id)，NOT NULL |
| enabled | BOOLEAN | 是否启用 | DEFAULT TRUE |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT CURRENT_TIMESTAMP |

#### auth_settings

存储全局认证设置。

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | UUID | 设置ID | 主键 |
| allow_email_registration | BOOLEAN | 允许邮箱注册 | DEFAULT FALSE |
| allow_phone_registration | BOOLEAN | 允许手机注册 | DEFAULT FALSE |
| allow_password_login | BOOLEAN | 允许密码登录 | DEFAULT TRUE |
| require_email_verification | BOOLEAN | 要求邮箱验证 | DEFAULT TRUE |
| password_policy | JSONB | 密码策略 | DEFAULT '{"min_length": 8, ...}' |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT CURRENT_TIMESTAMP |

### 其他表

#### ai_configs

存储组织级别的AI服务配置。

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | UUID | 配置ID | 主键 |
| org_id | UUID | 组织ID | 引用 organizations(id) |
| provider | TEXT | 提供商 | NOT NULL |
| app_id | TEXT | 应用ID | |
| api_key | TEXT | API密钥 | NOT NULL |
| api_url | TEXT | API URL | NOT NULL |
| settings | JSONB | 配置设置 | DEFAULT '{}' |
| enabled | BOOLEAN | 是否启用 | DEFAULT TRUE |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT CURRENT_TIMESTAMP |

#### api_logs

存储API调用日志。

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | UUID | 日志ID | 主键 |
| user_id | UUID | 用户ID | 引用 auth.users(id) |
| conversation_id | UUID | 对话ID | 引用 conversations(id) |
| provider | TEXT | 提供商 | NOT NULL |
| endpoint | TEXT | 端点 | NOT NULL |
| request | JSONB | 请求内容 | DEFAULT '{}' |
| response | JSONB | 响应内容 | DEFAULT '{}' |
| status_code | INTEGER | 状态码 | |
| latency_ms | INTEGER | 延迟(毫秒) | |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP |

## 数据库特性

### 安全机制

#### 行级安全性(RLS)

所有表都启用了行级安全性策略，确保数据访问安全：

1. **用户数据**
   - 用户只能查看和更新自己的资料
   - 用户只能查看和更新自己的偏好设置

2. **组织数据**
   - 组织成员可以查看组织信息
   - 组织管理员可以更新组织信息
   - 组织成员可以查看成员列表

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
- 组织成员在同一组织中唯一
- **默认应用唯一性约束**：每个提供商最多只能有一个默认服务实例（通过部分唯一索引实现）

### 自动化功能

#### 触发器

系统使用多个触发器实现自动化功能和数据完整性保护：

1. **用户管理触发器**
   - `handle_new_user`: 用户注册时自动创建profiles记录，优先使用用户提供的username
   - `handle_user_deletion_prep`: 用户删除前处理组织权限转移，防止孤儿组织

2. **组织管理触发器**
   - `handle_org_member_deletion`: 组织成员删除后自动清理孤儿组织
   - `validate_org_member_operations`: 验证组织成员操作，确保不会移除最后一个owner

3. **消息管理触发器**
   - `set_message_synced_on_update`: 自动维护消息同步状态和时间戳
   - `update_conversation_last_message_preview`: 自动更新对话的最后消息预览

4. **更新时间戳触发器**
   - 自动更新表记录的updated_at字段
   - 应用于所有主要表

5. **数据清理和维护函数**
   - `cleanup_orphan_data`: 清理孤儿数据（组织、AI配置、消息）
   - `safe_cleanup_orphan_data`: 安全的批量清理，支持dry_run模式

6. **服务实例管理函数**
   - `set_default_service_instance(target_instance_id uuid, target_provider_id uuid)`: 原子性地设置默认服务实例，确保同一提供商只有一个默认实例。该函数在事务中执行两个操作：首先将同一提供商的所有实例设为非默认，然后将指定实例设为默认，防止并发操作导致的数据不一致问题。

## 用户管理系统

### 管理员视图

#### admin_user_management_view

为管理员提供安全的用户管理视图，包含完整的用户信息（包括来自 `auth.users` 表的敏感数据）。

**视图结构：**
```sql
CREATE OR REPLACE VIEW public.admin_user_management_view AS
SELECT 
  p.id,
  p.full_name,
  p.username,
  p.avatar_url,
  p.role,
  p.status,
  p.created_at,
  p.updated_at,
  p.last_login,
  p.auth_source,
  p.sso_provider_id,
  au.email,                    -- 真实邮箱地址
  au.phone,                    -- 真实手机号
  au.email_confirmed_at,       -- 邮箱确认时间
  au.phone_confirmed_at,       -- 手机确认时间
  au.last_sign_in_at          -- 最后登录时间
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
-- 视图级别的权限控制：只有管理员能看到数据
WHERE EXISTS (
  SELECT 1 FROM profiles admin_check 
  WHERE admin_check.id = auth.uid() 
  AND admin_check.role = 'admin'
);
```

**安全特性：**
- 使用 `SECURITY DEFINER` 模式访问 `auth.users` 表
- 视图级别的权限检查，非管理员查询返回空结果
- 包含真实的邮箱地址和最后登录时间
- 解决了 Supabase 安全警告同时保留完整功能

**权限设置：**
```sql
REVOKE ALL ON public.admin_user_management_view FROM anon;
REVOKE ALL ON public.admin_user_management_view FROM authenticated;
GRANT SELECT ON public.admin_user_management_view TO authenticated;
```

### 权限保护机制

#### 角色更新保护

**触发器函数：** `validate_role_update()`

防止管理员进行危险的角色操作：

1. **自我保护**：管理员不能修改自己的角色
2. **管理员保护**：不能降级其他管理员的权限
3. **权限验证**：只有管理员可以修改用户角色

```sql
CREATE TRIGGER validate_role_update_trigger
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_update();
```

#### 用户删除保护

**触发器函数：** `validate_user_deletion()`

防止删除关键用户：

1. **自我保护**：管理员不能删除自己的账号
2. **管理员保护**：不能删除其他管理员账号
3. **权限验证**：只有管理员可以删除用户

```sql
CREATE TRIGGER validate_user_deletion_trigger
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_deletion();
```

### 安全函数

#### 管理员权限检查

**函数：** `auth.is_admin()`

```sql
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 批量角色更新

**函数：** `safe_batch_update_role(target_user_ids UUID[], target_role user_role)`

安全的批量角色更新函数，包含完整的权限检查：

1. **权限验证**：只有管理员可以执行批量操作
2. **自我保护**：不能在批量操作中包含自己
3. **管理员保护**：不能在批量操作中降级其他管理员
4. **原子性**：所有更新在单个事务中完成

**返回值：** 成功更新的用户数量

#### 用户统计函数

**函数：** `get_user_stats()`

为管理员提供用户统计信息：

```json
{
  "totalUsers": 150,
  "activeUsers": 140,
  "suspendedUsers": 8,
  "pendingUsers": 2,
  "adminUsers": 3,
  "managerUsers": 12,
  "regularUsers": 135,
  "newUsersToday": 5,
  "newUsersThisWeek": 23,
  "newUsersThisMonth": 67
}
```

**安全特性：**
- 只有管理员可以访问统计数据
- 使用 `SECURITY DEFINER` 模式确保权限
- 返回 JSON 格式便于前端处理

#### 管理员初始化

**函数：** `initialize_admin(admin_email TEXT)`

用于将指定邮箱的用户设置为管理员：

```sql
SELECT public.initialize_admin('admin@example.com');
```

**安全考虑：**
- 只能由数据库管理员执行
- 验证用户存在性
- 提供操作确认通知

### 数据库安全最佳实践

1. **最小权限原则**：
   - 匿名用户无法访问任何管理功能
   - 普通用户只能访问自己的数据
   - 管理员通过严格的权限检查访问管理功能

2. **防御性编程**：
   - 所有管理函数都包含权限验证
   - 使用触发器防止危险操作
   - 视图级别的安全控制

3. **审计和监控**：
   - 所有敏感操作都有日志记录
   - 触发器确保数据完整性
   - 函数返回操作结果便于监控

4. **数据隔离**：
   - 使用 RLS (Row Level Security) 策略
   - 视图级别的权限控制
   - 敏感数据的访问控制

## 初始数据

系统预设了以下初始数据：

### 默认组织

```sql
INSERT INTO organizations (id, name, logo_url)
VALUES ('00000000-0000-0000-0000-000000000001', '默认组织', 'https://via.placeholder.com/150');
```

### 默认AI配置(Dify)

```sql
INSERT INTO ai_configs (id, org_id, provider, app_id, api_key, api_url, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
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
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Google Workspace 示例',
    'OAuth2',
    '{"authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth"}',
    'google-client-id-example',
    'google-client-secret-example',
    'https://accounts.google.com/.well-known/openid-configuration',
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
- 组织和成员管理
- 聊天和消息
- API密钥管理
- SSO认证

这种模块化设计便于扩展和维护，可以独立升级或修改各个模块。

### 多租户架构

系统支持多组织和组织内多用户的多租户架构：

- 每个组织有自己的成员和设置
- 组织内用户可以共享资源
- 数据隔离通过RLS实现

### 灵活的API密钥管理

API密钥管理系统设计灵活，支持多种场景：

- 支持多提供商和多服务实例
- 加密存储确保安全性
- 支持用户级和组织级配置
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
| profiles      |       | organizations  |       | org_members   |
+---------------+       +----------------+       +---------------+
| id            |<---+  | id             |<------| org_id        |
| full_name     |    |  | name           |       | user_id       |
| username      |    |  | logo_url       |       | role          |
| avatar_url    |    |  | settings       |       | created_at    |
| role          |    |  | created_at     |       | updated_at    |
| status        |    |  | updated_at     |       +---------------+
| created_at    |    |  |                |       |               |
| updated_at    |    |  |                |       | ai_configs    |
| last_login    |    |  |                |       | id            |
| auth_source   |    |  |                |       | org_id        |
| sso_provider_id|    |  |                |       | provider      |
+---------------+    |  |                |       | app_id        |
| conversations |    |  |                |       | api_key       |
+---------------+    |  |                |       | api_url       |
| id            |    |  |                |       | settings      |
| org_id        |    |  |                |       | enabled       |
| user_id       |----+  |                |       | created_at    |
| ai_config_id  |       |                |       | updated_at    |
| title         |       |                |       +---------------+
| summary       |       |                |       | providers     |
| settings      |       |                |       | id            |
| created_at    |       |                |       | name          |
| updated_at    |       |                |       | type          |
| status        |       |                |       | base_url      |
+---------------+       |                |       | auth_type     |
      |               |                |       | is_active     |
      |               |                |       | created_at    |
      |               |                |       | updated_at    |
      v               |                |       |               |
+---------------+       |                |       | service_instances|
| messages      |       |                |       | id            |
+---------------+       |                |       | provider_id   |
| id            |       |                |       | name          |
| conversation_id|       |                |       | display_name  |
| user_id       |       |                |       | description   |
| role          |       |                |       | instance_id   |
| content       |       |                |       | api_path      |
| metadata      |       |                |       | is_default    |
| created_at    |       |                |       | config        |
| status        |       |                |       | created_at    |
| updated_at    |       |                |       | updated_at    |
+---------------+       |                |       |               |
| user_preferences|       |                |       |               |
+---------------+       |                |       |               |
| id            |       |                |       |               |
| user_id       |       |                |       |               |
| theme         |       |                |       |               |
| language      |       |                |       |               |
| notification_settings|       |                |       |               |
| ai_preferences|       |                |       |               |
| updated_at    |       |                |       |               |
+---------------+       |                |       |               |
| sso_providers |       |                |       |               |
+---------------+       |                |       |               |
| id            |       |                |       |               |
| name          |       |                |       |               |
| protocol      |       |                |       |               |
| settings      |       |                |       |               |
| client_id     |       |                |       |               |
| client_secret |       |                |       |               |
| metadata_url  |       |                |       |               |
| enabled       |       |                |       |               |
| created_at    |       |                |       |               |
| updated_at    |       |                |       |               |
+---------------+       |                |       |               |
      |               |                |       |               |
      |               |                |       |               |
      v               v                v               |
+---------------+               +---------------+       |
| domain_sso_mappings|               | api_keys      |       |
+---------------+               | id            |       |
| id            |               | provider_id   |       |
| domain        |               | service_instance_id|       |
| sso_provider_id|               | user_id       |       |
| enabled       |               | key_value     |       |
| created_at    |               | is_default    |       |
| updated_at    |               | usage_count   |       |
+---------------+               | last_used_at  |       |
```

这个数据库设计为 LLM EduHub 平台提供了坚实的基础，支持用户管理、组织协作、AI对话、SSO认证和API集成等核心功能。设计注重安全性、可扩展性和模块化，便于未来功能扩展和维护。
