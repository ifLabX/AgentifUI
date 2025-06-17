# AgentifUI 数据库设计文档

本文档详细描述了 AgentifUI 平台的数据库设计，包括表结构、关系、安全机制和特性。本文档与当前数据库状态完全同步，包含所有已应用的迁移文件。

**文档更新日期**: 2025-06-17  
**数据库版本**: 包含至 20250617140818_drop_sso_views.sql 的所有迁移

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
| email | TEXT | 用户邮箱 | 从 auth.users 同步 |
| phone | TEXT | 用户手机号 | 从 auth.users 同步 |
| role | user_role | 用户角色 | DEFAULT 'user'::user_role |
| status | account_status | 账号状态 | DEFAULT 'active'::account_status |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT CURRENT_TIMESTAMP |
| last_login | TIMESTAMP WITH TIME ZONE | 最后登录时间 | |
| auth_source | TEXT | 认证来源 | DEFAULT 'email'，支持 email/google/github/phone/bistu_sso |
| sso_provider_id | UUID | SSO提供商ID | 引用 sso_providers(id) |
| employee_number | TEXT | 学工号 | 北京信息科技大学统一身份标识，唯一约束 |

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

存储组织成员关系，支持用户在同一组织的多个部门任职。

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | UUID | 关系ID | 主键 |
| org_id | UUID | 组织ID | 引用 organizations(id)，NOT NULL |
| user_id | UUID | 用户ID | 引用 auth.users(id)，NOT NULL |
| role | org_member_role | 成员角色 | DEFAULT 'member' |
| department | TEXT | 部门名称 | |
| job_title | TEXT | 职位名称 | |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT CURRENT_TIMESTAMP |
| | | | UNIQUE(org_id, user_id, department) |

**多部门支持特性**：
- 用户可以在同一组织的多个部门任职
- 每个用户在同一组织的每个部门只能有一条记录
- 权限检查时取用户的第一个部门记录
- 支持灵活的组织架构管理

**枚举类型定义：**
- `org_member_role`: ENUM ('owner', 'admin', 'member')

### 部门应用权限管理

#### department_app_permissions

存储部门级应用访问权限，实现精确的权限控制。**重要：此表不包含任何自动生成的虚拟数据，所有权限记录都必须通过管理界面手动配置。**

| 字段名 | 类型 | 描述 | 约束 |
|--------|------|------|------|
| id | UUID | 权限ID | 主键 |
| org_id | UUID | 组织ID | 引用 organizations(id)，NOT NULL |
| department | TEXT | 部门名称 | NOT NULL |
| service_instance_id | UUID | 服务实例ID | 引用 service_instances(id)，NOT NULL |
| is_enabled | BOOLEAN | 是否启用 | DEFAULT TRUE |
| ~~permission_level~~ | ~~TEXT~~ | ~~权限级别~~ | ~~已移除，简化权限设计~~ |
| usage_quota | INTEGER | 月度使用配额 | NULL表示无限制 |
| used_count | INTEGER | 当月已使用次数 | DEFAULT 0 |
| quota_reset_date | DATE | 配额重置日期 | DEFAULT CURRENT_DATE |
| settings | JSONB | 扩展配置 | DEFAULT '{}' |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT CURRENT_TIMESTAMP |
| | | | UNIQUE(org_id, department, service_instance_id) |

**权限控制说明：**
- **简化设计**: 移除了混淆的permission_level字段，采用更简洁的权限控制
- **二元权限**: 通过is_enabled字段控制部门是否可以访问应用
- **配额管理**: 通过usage_quota和used_count字段管理使用配额

**权限配置原则：**
- **手动配置**: 所有权限记录必须通过管理界面手动创建
- **无虚拟数据**: 系统不会自动为组织×部门×应用的组合创建权限记录
- **默认拒绝**: 如果部门没有权限记录，则无法访问org_only类型的应用
- **精确控制**: 管理员可以精确控制哪些部门可以访问哪些应用

**应用可见性控制：**
- `public`: 所有用户可见，无需权限检查
- `org_only`: 只有在department_app_permissions表中有启用权限记录的部门成员可见
- `private`: 私有应用（预留功能）

**最新迁移更新 (2025-06-11)**：
- **权限设计简化**: 移除混淆的permission_level字段，采用更简洁的二元权限控制
- **多部门支持**: 用户可以在同一组织的多个部门任职
- **权限精确控制**: 基于三元组(org_id + department + service_instance_id)的权限管理
- **RLS策略修复**: 修复了普通用户无法查看组织信息的问题
- **安全视图优化**: 修复security_definer视图警告，明确指定为SECURITY INVOKER
- **管理员视图清理**: 移除了过时的admin_user_management_view，改用函数方式

**索引优化：**
- `idx_dept_app_permissions_org_dept`: (org_id, department)
- `idx_dept_app_permissions_service_instance_id`: (service_instance_id)
- `idx_dept_app_permissions_enabled`: (org_id, department, is_enabled)

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
| is_default | BOOLEAN | 是否默认提供商 | DEFAULT FALSE |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT NOW() |
| | | | UNIQUE INDEX: 系统中只能有一个默认提供商 |

**默认提供商管理特性：**
- **唯一性约束**：通过部分唯一索引确保系统中只有一个默认提供商（`is_default = TRUE`）
- **自动管理**：触发器自动确保设置新默认提供商时，其他提供商的默认状态被清除
- **删除保护**：删除默认提供商时，自动将第一个活跃提供商设为新的默认提供商
- **数据完整性**：确保系统始终有且仅有一个默认提供商（当存在活跃提供商时）

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
| visibility | TEXT | 应用可见性 | DEFAULT 'public'，CHECK IN ('public', 'org_only', 'private') |
| config | JSONB | 配置参数 | DEFAULT '{}' |
| created_at | TIMESTAMP WITH TIME ZONE | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMP WITH TIME ZONE | 更新时间 | DEFAULT NOW() |
| | | | UNIQUE(provider_id, instance_id) |
| | | | UNIQUE INDEX: 每个提供商最多一个默认应用 |

**应用可见性说明：**
- `public`: 公开应用，所有用户可见
- `org_only`: 组织应用，只有被授权的部门成员可见
- `private`: 私有应用，预留给未来扩展

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

存储SSO提供商信息，支持多种单点登录协议。

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

**枚举类型定义：**
- `sso_protocol`: ENUM ('OIDC', 'SAML', 'CAS')

**协议支持说明：**
- `OIDC`: OpenID Connect 协议
- `SAML`: SAML 2.0 协议  
- `CAS`: CAS 2.0/3.0 协议（支持北京信息科技大学统一认证）

**北信CAS配置示例：**
```json
{
  "base_url": "https://sso.bistu.edu.cn",
  "login_endpoint": "/login",
  "logout_endpoint": "/logout", 
  "validate_endpoint": "/serviceValidate",
  "validate_endpoint_v3": "/p3/serviceValidate",
  "version": "2.0",
  "attributes_enabled": true,
  "support_attributes": ["employeeNumber", "log_username"]
}
```

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

4. **组织和成员数据**
   - **org_members表**：管理员查看所有，普通用户查看自己的记录
   - **organizations表**：管理员查看所有组织，普通用户查看自己所属的组织
   - 修复了普通用户无法查看组织信息的问题

5. **API密钥和配置**
   - 管理员可以进行所有操作（增删改查）
   - 服务端（未认证请求）和已认证用户可以读取配置信息
   - 这种设计支持API路由访问Dify配置，同时保持安全控制

6. **SSO配置**
   - 只有管理员可以访问和管理SSO提供商配置
   - 只有管理员可以访问和管理域名映射
   - 只有管理员可以访问和管理认证设置

7. **部门应用权限**
   - 用户只能查看自己部门的应用权限
   - 组织管理员可以管理所有部门的应用权限
   - 权限检查基于用户所属组织和部门

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

7. **部门权限管理函数**
   - `get_user_accessible_apps(user_id UUID)`: 获取用户可访问的应用列表，基于部门权限和应用可见性
   - `check_user_app_permission(user_id UUID, app_instance_id TEXT)`: 检查用户对特定应用的访问权限
   - `increment_app_usage(user_id UUID, app_instance_id TEXT)`: 增加应用使用计数，支持配额管理
   - `reset_monthly_quotas()`: 重置所有部门的月度使用配额

## 用户管理系统

### 管理员视图

#### 用户数据访问

管理员功能通过以下方式实现用户数据访问：

**管理员功能实现：**
- 管理员通过 `lib/db/users.ts` 中的 `getUserList` 函数获取用户数据
- 使用 RLS 策略控制数据访问权限
- 管理员可以访问包括 `auth.users` 表中的邮箱、手机号等敏感信息
- 普通用户只能访问自己的数据

**安全控制：**
- 所有管理员操作都需要进行权限验证
- 使用数据库函数封装敏感操作
- 前端通过中间件验证管理员身份

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

#### SSO用户管理

**函数：** `find_user_by_employee_number(emp_num TEXT)`

根据学工号查找用户信息，专用于北信SSO登录：

```sql
SELECT * FROM find_user_by_employee_number('2021011221');
```

**返回字段：**
- `user_id`: 用户UUID
- `full_name`: 用户全名
- `username`: 用户名
- `employee_number`: 学工号
- `last_login`: 最后登录时间
- `auth_source`: 认证来源
- `status`: 账户状态

**安全特性：**
- 使用 `SECURITY DEFINER` 模式
- 只返回活跃状态用户
- 验证学工号格式

**函数：** `create_sso_user(emp_number TEXT, user_name TEXT, sso_provider_uuid UUID)`

为SSO用户创建新账户，用于首次登录：

```sql
SELECT create_sso_user('2021011221', 'zhang.san', '10000000-0000-0000-0000-000000000001');
```

**特性：**
- 自动处理用户名冲突（添加数字后缀）
- 验证学工号唯一性
- 自动设置认证来源为 'bistu_sso'
- 设置初始登录时间

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

## 最新迁移文件记录

以下是包含在当前数据库版本中的所有迁移文件（按时间顺序）：

### 2025-06-10 重大更新 - 组织权限管理系统
- `20250610120000_add_org_app_permissions.sql`: 初始组织级权限系统
- `20250610120001_redesign_department_permissions.sql`: 重新设计的部门级权限系统
- `20250610130000_add_department_permission_management.sql`: 添加部门权限管理函数
- `20250610133559_simplify_department_permissions.sql`: 简化部门权限表结构
- `20250610140000_clean_virtual_department_permissions.sql`: 清理虚拟权限数据
- `20250610160000_fix_organization_creation_policy.sql`: 修复组织创建RLS策略
- `20250610161000_fix_org_members_policy.sql`: 修复成员表RLS策略
- `20250610162000_fix_infinite_recursion_policy.sql`: 修复策略递归问题
- `20250610163000_completely_fix_recursion.sql`: 完全修复递归问题
- `20250610164000_complete_rls_reset.sql`: 完整RLS策略重置
- `20250610165000_final_cleanup_all_policies.sql`: 最终策略清理
- `20250610165100_cleanup_remaining_policy.sql`: 清理剩余策略
- `20250610170000_enable_multi_department_membership.sql`: 启用多部门成员支持
- `20250610180000_fix_organization_select_for_users.sql`: 修复普通用户组织查看权限

### 历史迁移文件
- `20250501000000_init.sql`: 初始化基础表结构
- `20250502000000_sso_config.sql`: SSO认证配置
- `20250508134000_create_profile_trigger.sql`: 用户资料触发器
- `20250508140000_fix_profiles_schema.sql`: 修复用户资料表
- `20250508141000_profiles_schema.sql`: 用户资料表调整
- `20250508165500_api_key_management.sql`: API密钥管理
- `20250508174000_add_admin_role.sql`: 管理员角色
- `20250508181700_fix_api_keys_schema.sql`: 修复API密钥表
- `20250508182400_fix_api_key_encryption.sql`: API密钥加密
- `20250508183400_extend_service_instances.sql`: 扩展服务实例表
- `20250513104549_extend_conversations_messages.sql`: 扩展对话消息表
- `20250515132500_add_metadata_to_conversations.sql`: 对话元数据
- `20250521125100_add_message_trigger.sql`: 消息触发器
- `20250522193000_update_message_preview_format.sql`: 消息预览格式
- `20250524193208_fix_username_sync.sql`: 用户名同步
- `20250524194000_improve_cascade_deletion.sql`: 改进级联删除
- `20250524195000_fix_profiles_foreign_key.sql`: 修复外键约束
- `20250524200000_fix_user_deletion_trigger.sql`: 用户删除触发器
- `20250524230000_fix_dify_config_rls.sql`: Dify配置RLS
- `20250527180000_fix_org_members_rls_recursion.sql`: 修复成员RLS递归
- `20250529151826_ensure_default_service_instance_constraint.sql`: 默认服务实例约束
- `20250529151827_add_set_default_service_instance_function.sql`: 设置默认服务实例函数
- `20250529153000_add_user_management_views.sql`: 用户管理视图
- `20250529154000_update_profiles_table.sql`: 更新用户资料表
- `20250529170443_fix_user_list_function.sql`: 修复用户列表函数
- `20250529170559_simplify_user_list_function.sql`: 简化用户列表函数
- `20250529171148_cleanup_unused_functions.sql`: 清理未使用函数
- `20250530000000_fix_role_constraint.sql`: 修复角色约束
- `20250530010000_add_role_update_protection.sql`: 角色更新保护
- `20250601000100_fix_user_view_security.sql`: 修复用户视图安全
- `20250601000200_fix_user_functions_quick.sql`: 快速修复用户函数
- `20250601000500_restore_admin_user_view.sql`: 恢复管理员视图
- `20250601000600_fix_view_permissions.sql`: 修复视图权限
- `20250601000700_remove_name_field_from_service_instances.sql`: 移除服务实例name字段
- `20250601000800_fix_sso_provider_id_type_conversion.sql`: 修复SSO提供商ID类型
- `20250601124105_add_app_executions_table.sql`: 应用执行记录表
- `20250601125239_add_missing_indexes.sql`: 添加缺失索引
- `20250601130228_secure_admin_view_completely.sql`: 完全安全的管理员视图
- `20250601130708_fix_function_compatibility.sql`: 修复函数兼容性
- `20250601130929_restore_admin_view_temporarily.sql`: 临时恢复管理员视图
- `20250607215513_add_deleted_status.sql`: 添加删除状态
- `20250608155950_remove_message_preview_trigger.sql`: 移除消息预览触发器
- `20250609151944_oauth_support_enhancement.sql`: OAuth支持增强
- `20250609160000_fix_phone_auth_trigger.sql`: 修复手机认证触发器
- `20250609161000_implement_phone_auth_trigger.sql`: 实现手机认证触发器
- `20250609162000_verify_and_fix_enum.sql`: 验证修复枚举
- `20250609163000_final_handle_new_user_fix.sql`: 最终用户处理修复
- `20250609173820_clean_auth_support.sql`: 清理认证支持
- `20250609174230_fix_enum_reference.sql`: 修复枚举引用
- `20250609214000_add_admin_user_functions.sql`: 添加管理员用户函数
- `20250609214100_fix_org_members_foreign_key.sql`: 修复组织成员外键

### 2025-06-17 SSO集成更新 - 北京信息科技大学CAS认证
- `20250617185201_fix_enum_transaction_issue.sql`: 修复PostgreSQL枚举类型事务问题，添加CAS协议支持
- `20250617185202_add_bistu_sso_data.sql`: 北信SSO集成数据迁移，添加学工号字段、SSO函数和配置
- `20250617140818_drop_sso_views.sql`: 清理SSO统计视图，简化数据库对象
- `20250609214200_remove_deprecated_admin_views.sql`: 移除过时管理员视图
- `20250609214300_fix_admin_users_function_types.sql`: 修复管理员用户函数类型
- `20250609214400_fix_phone_column_type.sql`: 修复手机号列类型
- `20250609213759_activate_organization_features.sql`: 激活组织功能
- `20250610000000_add_safe_user_deletion.sql`: 添加安全用户删除
- `20250610113034_add_auth_source_realtime_sync.sql`: 添加认证源实时同步
- `20250610120000_add_org_app_permissions.sql`: 添加组织应用权限
- `20250610120001_redesign_department_permissions.sql`: 重新设计部门权限
- `20250610130000_add_department_permission_management.sql`: 添加部门权限管理
- `20250610133559_simplify_department_permissions.sql`: 简化部门权限设计
- `20250610140000_clean_virtual_department_permissions.sql`: 清理虚拟部门权限
- `20250610160000_fix_organization_creation_policy.sql`: 修复组织创建策略
- `20250610161000_fix_org_members_policy.sql`: 修复组织成员策略
- `20250610162000_fix_infinite_recursion_policy.sql`: 修复无限递归策略
- `20250610163000_completely_fix_recursion.sql`: 完全修复递归问题
- `20250610164000_complete_rls_reset.sql`: 完整RLS重置
- `20250610165000_final_cleanup_all_policies.sql`: 最终清理所有策略
- `20250610165100_cleanup_remaining_policy.sql`: 清理剩余策略
- `20250610170000_enable_multi_department_membership.sql`: 启用多部门成员资格
- `20250610180000_fix_organization_select_for_users.sql`: 修复用户组织查询
- `20250611103054_fix_security_definer_view_warning.sql`: 修复安全定义视图警告

## 最新迁移详情

### 2025-06-11 权限系统优化

#### 20250611103054_fix_security_definer_view_warning.sql
**目标**: 修复Supabase安全视图警告，优化权限控制机制

**主要变更**:
1. **视图安全优化**:
   - 重新创建`user_organization_departments`视图，明确指定为`SECURITY INVOKER`
   - 确保视图依赖底层表的RLS策略进行权限控制
   - 管理员可查看所有数据，普通用户只能查看自己相关的组织信息

2. **函数权限说明**:
   - 确认`get_user_departments`函数的`SECURITY DEFINER`是必要的
   - 该函数用于管理员查询任意用户的完整部门信息
   - 包含明确的参数控制和权限检查

#### 20250610180000_fix_organization_select_for_users.sql
**目标**: 修复普通用户无法查看组织信息的问题

**主要变更**:
1. **RLS策略优化**:
   - 删除过于严格的`simple_organizations_select`策略
   - 创建新的`organizations_select_for_members`策略
   - 管理员可以查看所有组织，普通用户可以查看自己所属的组织

#### 20250610133559_simplify_department_permissions.sql
**目标**: 简化部门权限设计，移除混淆的字段

**主要变更**:
1. **表结构简化**:
   - 删除`permission_level`字段（造成混淆的根源）
   - 采用更简洁的二元权限控制（is_enabled字段）
   - 保留配额管理功能（usage_quota, used_count）

2. **函数重构**:
   - 重新创建`get_user_accessible_apps`函数，移除permission_level逻辑
   - 重新创建`check_user_app_permission`函数，简化权限检查
   - 重新创建`increment_app_usage`函数，优化使用量统计

3. **权限逻辑优化**:
   - **公开应用**: 所有人可见，无需权限检查
   - **组织应用**: 需要部门权限且已启用（is_enabled = true）
   - **私有应用**: 只有管理员可见

### 2025-06-10 组织权限管理系统

#### 多部门支持 (20250610170000)
- 用户可以在同一组织的多个部门任职
- 每个用户在同一组织的每个部门只能有一条记录
- 权限检查时取用户的第一个部门记录

#### RLS策略修复系列 (20250610160000-165100)
- 修复了组织创建、成员管理的RLS策略
- 解决了无限递归问题
- 完整重置并重新设计了所有RLS策略
- 确保管理员和普通用户的权限边界清晰

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

### 部门级权限控制

实现了精确的部门级应用权限管理：

- **三元组权限控制**：基于 `(org_id + department + service_instance_id)` 的精确权限控制
- **应用可见性管理**：支持公开、组织内、私有三种可见性级别
- **配额管理**：支持部门级使用配额限制和自动重置
- **权限级别**：支持完全访问、只读、受限三种权限级别
- **智能权限创建**：只为有真实组织和部门数据的情况创建权限记录

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
| avatar_url    |    |  | settings       |       | department    |
| role          |    |  | created_at     |       | job_title     |
| status        |    |  | updated_at     |       | created_at    |
| created_at    |    |  |                |       | updated_at    |
| updated_at    |    |  |                |       +---------------+
| last_login    |    |  |                |       |               |
| auth_source   |    |  |                |       | department_app_permissions |
| sso_provider_id|    |  |                |       +---------------+
+---------------+    |  |                |       | id            |
                     |  |                |<------| org_id        |
                     |  |                |       | department    |
                     |  |                |       | service_instance_id |
                     |  |                |       | is_enabled    |
                     |  |                |       | usage_quota   |
                     |  |                |       | used_count    |
                     |  |                |       | quota_reset_date |
                     |  |                |       | settings      |
                     |  |                |       | created_at    |
                     |  |                |       | updated_at    |
                     |  |                |       +---------------+
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
