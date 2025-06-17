# Supabase 数据库文档

本文档记录了AgentifUI项目中的数据库结构、功能和使用方法。本文档与当前数据库状态完全同步。

**文档更新日期**: 2025-06-17  
**数据库版本**: 包含至 20250617140818_drop_sso_views.sql 的所有迁移

## 当前系统状态

- ✅ **组织权限管理**: 完整的部门级应用权限控制系统，简化权限设计
- ✅ **多部门支持**: 用户可在同组织多个部门任职
- ✅ **RLS安全策略**: 修复了所有权限问题，普通用户可正常查看组织信息
- ✅ **安全视图优化**: 修复security_definer视图警告，明确权限控制
- ✅ **用户管理**: 使用函数方式替代了过时的管理员视图
- ✅ **中间件权限**: 前端路由级别的管理员权限验证
- ✅ **应用访问控制**: 基于权限的应用可见性管理，二元权限控制
- ✅ **北信SSO集成**: 完整的CAS 2.0单点登录系统，支持统一认证
- ✅ **学工号管理**: 支持北信学工号字段和身份验证
- ✅ **SSO用户管理**: 自动创建SSO用户账户，安全的身份映射

## 数据库概述

本系统使用 Supabase 作为后端数据库服务，包含用户管理、对话管理、API 密钥管理等多个功能模块。数据库设计遵循关系型数据库的最佳实践，并使用行级安全策略 (RLS) 确保数据安全。

## 核心数据表结构

### 用户和身份管理

1. `profiles` 表：
   - 主要字段：`id`, `full_name`, `username`, `avatar_url`, `email`, `phone`, `role`, `status`, `created_at`, `updated_at`, `last_login`, `auth_source`, `sso_provider_id`, `employee_number`
   - `email` 和 `phone` 字段从 `auth.users` 表同步，确保数据一致性
   - `role` 字段类型为 `user_role` 枚举，可能的值为 `'admin'`, `'manager'`, `'user'`，默认值为 `'user'`
   - `status` 字段类型为 `account_status` 枚举，可能的值为 `'active'`, `'suspended'`, `'pending'`，默认值为 `'active'`
   - `auth_source` 字段支持多种认证方式：`email`, `google`, `github`, `phone`, `bistu_sso` 等，默认值为 `'email'`
   - `employee_number` 字段：北京信息科技大学学工号，唯一约束，用于SSO身份识别

2. `user_preferences` 表：
   - 主要字段：`id`, `user_id`, `theme`, `language`, `notification_settings`, `ai_preferences`, `updated_at`
   - 存储用户的个性化设置和偏好

### 用户管理系统

#### 管理员用户管理

**用户数据访问机制** - 管理员通过函数安全访问用户数据：

- **数据访问**: 管理员通过 `lib/db/users.ts` 中的 `getUserList` 函数获取用户数据
- **权限控制**: 使用 RLS 策略控制数据访问，管理员可以访问敏感信息
- **安全保障**: 所有操作都需要管理员权限验证

**支持的管理功能：**
- 查看所有用户的基本信息（姓名、用户名、头像等）
- 查看用户的邮箱地址和手机号码
- 查看用户的登录状态和最后登录时间
- 管理用户角色和账号状态

#### 权限保护机制

1. **角色更新保护** (`validate_role_update` 触发器)：
   - 防止管理员修改自己的角色
   - 防止降级其他管理员的权限
   - 只有管理员可以修改用户角色

2. **用户删除保护** (`validate_user_deletion` 触发器)：
   - 防止管理员删除自己的账号
   - 防止删除其他管理员账号
   - 只有管理员可以删除用户

3. **批量操作保护** (`safe_batch_update_role` 函数)：
   - 安全的批量角色更新
   - 包含完整的权限检查和自我保护
   - 原子性操作确保数据一致性

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

### 应用执行记录管理

**`app_executions` 表** - 用于存储工作流和文本生成应用的执行记录：

#### 表结构设计

1. **基础字段**：
   - `id`: 主键，UUID 类型
   - `user_id`: 用户ID，关联 auth.users 表
   - `service_instance_id`: 服务实例ID，关联 service_instances 表
   - `execution_type`: 执行类型枚举，支持 'workflow' 和 'text-generation'

2. **Dify 集成字段**：
   - `external_execution_id`: Dify API 返回的执行ID（workflow_run_id 或 message_id）
   - `task_id`: Dify 返回的任务ID（主要用于 workflow 类型）

3. **执行内容字段**：
   - `title`: 执行标题，用户自定义或自动生成
   - `inputs`: 输入参数，JSONB 格式存储
   - `outputs`: 输出结果，JSONB 格式存储
   - `status`: 执行状态枚举（pending, running, completed, failed, stopped）
   - `error_message`: 错误信息

4. **统计字段**：
   - `total_steps`: 总步骤数（workflow 使用，text-generation 为 0）
   - `total_tokens`: 总 token 数量
   - `elapsed_time`: 执行耗时（秒）

5. **元数据和时间戳**：
   - `metadata`: 扩展元数据，JSONB 格式
   - `created_at`, `updated_at`, `completed_at`: 时间戳字段

#### 设计特点

1. **应用类型区分**：
   - **对话类应用**（chatbot, agent, chatflow）：使用 `conversations` + `messages` 表
   - **任务类应用**（workflow, text-generation）：使用 `app_executions` 表

2. **数据隔离**：
   - 每次执行都是独立的任务记录
   - 不同于对话类应用的连续性对话
   - 避免概念混淆和数据污染

3. **灵活扩展**：
   - 支持未来新增的任务类应用类型
   - JSONB 字段支持复杂的输入输出结构
   - 元数据字段支持自定义扩展

#### 索引优化

```sql
-- 用户执行记录查询优化
CREATE INDEX idx_app_executions_user_created ON app_executions(user_id, created_at DESC);

-- 服务实例关联查询优化
CREATE INDEX idx_app_executions_service_instance ON app_executions(service_instance_id);

-- 类型和状态筛选优化
CREATE INDEX idx_app_executions_type_status ON app_executions(execution_type, status);

-- 外部ID查询优化（用于与Dify同步）
CREATE INDEX idx_app_executions_external_id ON app_executions(external_execution_id) WHERE external_execution_id IS NOT NULL;
```

#### 行级安全策略

```sql
-- 用户只能访问自己的执行记录
CREATE POLICY "用户可以查看自己的执行记录" ON app_executions
  FOR SELECT USING (auth.uid() = user_id);

-- 管理员可以查看所有执行记录（用于系统管理）
CREATE POLICY "管理员可以查看所有执行记录" ON app_executions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

#### 使用场景

1. **工作流执行**：
   - 存储工作流的输入参数和输出结果
   - 记录执行状态和步骤进度
   - 支持执行历史查询和重新执行

2. **文本生成**：
   - 存储生成请求的输入提示
   - 记录生成的文本内容
   - 支持生成历史管理

3. **执行监控**：
   - 实时跟踪执行状态
   - 统计 token 使用量
   - 性能分析和优化

### API 密钥管理

1. `providers` 表：
   - 主要字段：`id`, `name`, `type`, `base_url`, `auth_type`, `is_active`, `is_default`, `created_at`, `updated_at`
   - 存储 API 服务提供商信息，如 Dify
   - **默认提供商管理**：通过 `is_default` 字段和唯一约束确保系统中只有一个默认提供商
   - **自动管理机制**：触发器自动维护默认提供商的唯一性和删除保护

2. `service_instances` 表：
   - 主要字段：`id`, `provider_id`, `name`, `display_name`, `description`, `instance_id`, `api_path`, `is_default`, `visibility`, `config`, `created_at`, `updated_at`
   - 存储特定服务提供商的实例配置
   - `provider_id` 和 `instance_id` 组合具有唯一性约束
   - **默认应用唯一性约束**：通过部分唯一索引确保每个提供商最多只能有一个默认应用（`is_default = TRUE`）
   - `visibility` 字段：应用可见性控制（'public', 'org_only', 'private'），默认为 'public'

3. `api_keys` 表：
   - 主要字段：`id`, `provider_id`, `service_instance_id`, `user_id`, `key_value`, `is_default`, `usage_count`, `last_used_at`, `created_at`, `updated_at`
   - 存储用于访问外部 API 的密钥

### 组织和成员管理

1. `organizations` 表：
   - 主要字段：`id`, `name`, `logo_url`, `settings`, `created_at`, `updated_at`

2. `org_members` 表：
   - 主要字段：`id`, `org_id`, `user_id`, `role`, `department`, `job_title`, `created_at`, `updated_at`
   - `role` 字段可能的值为 `'owner'`, `'admin'` 或 `'member'`
   - `department` 字段：部门名称，用于部门级权限控制
   - `job_title` 字段：职位名称

### 部门应用权限管理

**`department_app_permissions` 表** - 实现部门级应用访问权限控制：

**⚠️ 重要说明：此表不包含任何自动生成的虚拟数据，所有权限记录都必须通过管理界面手动配置。**

#### 表结构设计

1. **权限控制字段**：
   - `id`: 主键，UUID 类型
   - `org_id`: 组织ID，关联 organizations 表
   - `department`: 部门名称，与 org_members.department 对应
   - `service_instance_id`: 服务实例ID，关联 service_instances 表
   - `is_enabled`: 是否启用权限，布尔类型

2. **权限级别和配额**：
   - `permission_level`: 权限级别枚举（'full', 'read_only', 'restricted'）
   - `usage_quota`: 月度使用配额，NULL 表示无限制
   - `used_count`: 当月已使用次数
   - `quota_reset_date`: 配额重置日期

3. **扩展和时间戳**：
   - `settings`: 扩展配置，JSONB 格式
   - `created_at`, `updated_at`: 时间戳字段

#### 权限配置原则

1. **手动配置原则**：
   - 所有权限记录必须通过管理界面手动创建
   - 系统不会自动为组织×部门×应用的组合创建权限记录
   - 确保权限控制的精确性和安全性

2. **默认拒绝策略**：
   - 如果部门没有权限记录，则无法访问 `org_only` 类型的应用
   - 只有 `public` 应用对所有用户可见
   - 管理员需要明确授权部门访问特定应用

3. **数据清理保证**：
   - 迁移文件 `20250610140000_clean_virtual_department_permissions.sql` 已清空所有虚拟数据
   - 修改了同步函数，移除自动创建权限的逻辑
   - 确保数据库中只包含真实的权限配置

#### 权限控制机制

1. **三元组权限控制**：
   - 基于 `(org_id + department + service_instance_id)` 的精确权限控制
   - 唯一约束确保一个部门对一个应用只有一条权限记录

2. **应用可见性管理**：
   - `public`: 公开应用，所有用户可见
   - `org_only`: 组织应用，只有被授权的部门成员可见
   - `private`: 私有应用，预留给未来扩展

3. **权限级别说明**：
   - `full`: 完全访问权限
   - `read_only`: 只读权限
   - `restricted`: 受限权限

#### 核心数据库函数

1. **`get_user_accessible_apps(user_id UUID)`**：
   - 获取用户可访问的应用列表
   - 基于用户所属部门的权限配置
   - 支持应用可见性过滤

2. **`check_user_app_permission(user_id UUID, app_instance_id TEXT)`**：
   - 检查用户对特定应用的访问权限
   - 返回权限状态、级别和剩余配额
   - 支持配额限制检查

3. **`increment_app_usage(user_id UUID, app_instance_id TEXT)`**：
   - 增加应用使用计数
   - 支持配额管理和限制检查
   - 自动更新部门使用统计

4. **`reset_monthly_quotas()`**：
   - 重置所有部门的月度使用配额
   - 支持定期配额重置

#### 索引优化

```sql
-- 部门查询优化
CREATE INDEX idx_dept_app_permissions_org_dept ON department_app_permissions(org_id, department);

-- 应用查询优化
CREATE INDEX idx_dept_app_permissions_service_instance_id ON department_app_permissions(service_instance_id);

-- 权限过滤优化
CREATE INDEX idx_dept_app_permissions_enabled ON department_app_permissions(org_id, department, is_enabled);
```

#### 行级安全策略

```sql
-- 用户可以查看自己部门的应用权限
CREATE POLICY "用户可以查看自己部门的应用权限" ON department_app_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = department_app_permissions.org_id
      AND org_members.department = department_app_permissions.department
      AND org_members.user_id = auth.uid()
    )
  );

-- 组织管理员可以管理所有部门的应用权限
CREATE POLICY "组织管理员可以管理部门应用权限" ON department_app_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = department_app_permissions.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );
```

### SSO 认证

1. `sso_providers` 表：
   - 主要字段：`id`, `name`, `protocol`, `settings`, `client_id`, `client_secret`, `metadata_url`, `enabled`, `created_at`, `updated_at`
   - `protocol` 字段可能的值为 `'SAML'`, `'OAuth2'`, `'OIDC'`, `'CAS'`
   - 支持多种单点登录协议，包括北信的CAS 2.0认证系统
   - `settings` 字段存储协议特定配置，如CAS服务器地址、回调URL等

2. `domain_sso_mappings` 表：
   - 主要字段：`id`, `domain`, `sso_provider_id`, `enabled`, `created_at`, `updated_at`

#### SSO用户管理函数

**`find_user_by_employee_number(emp_num TEXT)`**
- 根据学工号查找用户信息，专用于北信SSO登录
- 返回用户的完整profile信息
- 使用SECURITY DEFINER模式确保权限安全

**`create_sso_user(emp_number TEXT, user_name TEXT, sso_provider_uuid UUID)`**
- 为首次SSO登录用户创建账户
- 自动设置认证来源为bistu_sso
- 生成唯一用户名和完整用户信息

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

管理员角色具有特殊权限，可以管理 API 密钥、服务提供商和服务实例等敏感资源。系统通过多层安全机制保护管理员功能。

### 安全函数

#### 管理员权限检查

```sql
-- 检查当前用户是否为管理员
auth.is_admin() RETURNS BOOLEAN
```

该函数用于所有需要管理员权限的操作中，确保只有管理员可以执行敏感操作。

#### 用户统计

```sql
-- 获取用户统计信息（仅管理员可访问）
public.get_user_stats() RETURNS JSON
```

返回包含以下信息的 JSON 对象：
- `totalUsers`: 总用户数
- `activeUsers`: 活跃用户数
- `suspendedUsers`: 被暂停用户数
- `pendingUsers`: 待审核用户数
- `adminUsers`: 管理员用户数
- `managerUsers`: 管理者用户数
- `regularUsers`: 普通用户数
- `newUsersToday`: 今日新用户数
- `newUsersThisWeek`: 本周新用户数
- `newUsersThisMonth`: 本月新用户数

#### 批量用户管理

```sql
-- 安全的批量角色更新
public.safe_batch_update_role(target_user_ids UUID[], target_role user_role) RETURNS INTEGER
```

**安全特性：**
- 权限验证：只有管理员可以执行
- 自我保护：不能在批量操作中包含自己
- 管理员保护：不能降级其他管理员
- 原子性：所有更新在单个事务中完成
- 返回成功更新的用户数量

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

### 数据库安全机制

#### 触发器保护

1. **角色更新保护触发器**：
   ```sql
   CREATE TRIGGER validate_role_update_trigger
     BEFORE UPDATE OF role ON profiles
     FOR EACH ROW
     EXECUTE FUNCTION public.validate_role_update();
   ```

2. **用户删除保护触发器**：
   ```sql
   CREATE TRIGGER validate_user_deletion_trigger
     BEFORE DELETE ON profiles
     FOR EACH ROW
     EXECUTE FUNCTION public.validate_user_deletion();
   ```

#### 视图级安全

用户管理系统通过以下机制确保安全：

1. **权限检查**：所有管理函数都内置管理员权限验证
2. **数据隔离**：通过RLS策略实现行级数据隔离
3. **敏感数据访问**：使用专用函数安全访问 auth.users 表
4. **前端验证**：通过中间件验证管理员身份

#### 最佳实践

1. **最小权限原则**：每个用户只能访问其权限范围内的数据
2. **防御性编程**：所有管理函数都包含权限验证
3. **审计追踪**：重要操作都有相应的日志和通知
4. **数据完整性**：使用触发器防止危险操作

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

4. **department_app_permissions 表**：
   - 用户只能查看自己部门的应用权限
   - 组织管理员可以管理所有部门的应用权限
   - 权限检查基于用户所属组织和部门

这些策略确保了 API 路由可以正常访问 Dify 配置，同时保持了适当的安全控制。

## 相关迁移文件

数据库结构和函数在以下迁移文件中定义：

### 基础结构
- `/supabase/migrations/20250501000000_init.sql`: 初始化基础表结构和枚举类型
- `/supabase/migrations/20250502000000_sso_config.sql`: SSO 认证配置

### 用户和权限管理
- `/supabase/migrations/20250508134000_create_profile_trigger.sql`: 创建用户资料触发器
- `/supabase/migrations/20250508140000_fix_profiles_schema.sql`: 修复用户资料表结构
- `/supabase/migrations/20250508141000_profiles_schema.sql`: 用户资料表结构调整
- `/supabase/migrations/20250508174000_add_admin_role.sql`: 添加管理员角色和相关函数
- `/supabase/migrations/20250524193208_fix_username_sync.sql`: 修复用户名同步逻辑
- `/supabase/migrations/20250524195000_fix_profiles_foreign_key.sql`: 修复 profiles 表外键约束
- `/supabase/migrations/20250524200000_fix_user_deletion_trigger.sql`: 修复用户删除触发器
- `/supabase/migrations/20250527180000_fix_org_members_rls_recursion.sql`: 修复组织成员 RLS 递归问题
- `/supabase/migrations/20250529153000_add_user_management_views.sql`: 添加用户管理视图和相关函数
- `/supabase/migrations/20250529154000_update_profiles_table.sql`: 更新 profiles 表，添加 auth_source 和 sso_provider_id 字段
- `/supabase/migrations/20250529170443_fix_user_list_function.sql`: 修复用户列表函数
- `/supabase/migrations/20250529170559_simplify_user_list_function.sql`: 简化用户列表查询函数
- `/supabase/migrations/20250529171148_cleanup_unused_functions.sql`: 清理未使用的函数
- `/supabase/migrations/20250530000000_fix_role_constraint.sql`: 修复角色约束，支持 manager 角色，转换为枚举类型
- `/supabase/migrations/20250530010000_add_role_update_protection.sql`: 添加角色更新保护机制和用户删除保护

### 最新组织权限管理系统 (2025-06-10)
- `/supabase/migrations/20250610120000_add_org_app_permissions.sql`: 初始组织级权限系统
- `/supabase/migrations/20250610120001_redesign_department_permissions.sql`: 重新设计的部门级权限系统
- `/supabase/migrations/20250610130000_add_department_permission_management.sql`: 添加部门权限管理函数
- `/supabase/migrations/20250610133559_simplify_department_permissions.sql`: 简化部门权限表结构
- `/supabase/migrations/20250610140000_clean_virtual_department_permissions.sql`: 清理虚拟权限数据
- `/supabase/migrations/20250610160000_fix_organization_creation_policy.sql`: 修复组织创建RLS策略
- `/supabase/migrations/20250610161000_fix_org_members_policy.sql`: 修复成员表RLS策略
- `/supabase/migrations/20250610162000_fix_infinite_recursion_policy.sql`: 修复策略递归问题
- `/supabase/migrations/20250610163000_completely_fix_recursion.sql`: 完全修复递归问题
- `/supabase/migrations/20250610164000_complete_rls_reset.sql`: 完整RLS策略重置
- `/supabase/migrations/20250610165000_final_cleanup_all_policies.sql`: 最终策略清理
- `/supabase/migrations/20250610165100_cleanup_remaining_policy.sql`: 清理剩余策略
- `/supabase/migrations/20250610170000_enable_multi_department_membership.sql`: 启用多部门成员支持
- `/supabase/migrations/20250610180000_fix_organization_select_for_users.sql`: 修复普通用户组织查看权限

### 用户管理安全机制 (2025-06-01)
- `/supabase/migrations/20250601000100_fix_user_view_security.sql`: 修复用户管理视图安全问题，删除不安全的视图，创建安全的管理函数
- `/supabase/migrations/20250601000200_fix_user_functions_quick.sql`: 快速修复用户管理函数结构问题
- `/supabase/migrations/20250601000500_restore_admin_user_view.sql`: 重新创建安全的管理员用户视图（使用 security_invoker）
- `/supabase/migrations/20250601000600_fix_view_permissions.sql`: 修复视图权限问题，改回 SECURITY DEFINER 模式
- `/supabase/migrations/20250609214200_remove_deprecated_admin_views.sql`: 最终移除过时的管理员视图

### API 密钥管理
- `/supabase/migrations/20250508165500_api_key_management.sql`: API 密钥管理
- `/supabase/migrations/20250508181700_fix_api_keys_schema.sql`: 修复 API 密钥表结构
- `/supabase/migrations/20250508182400_fix_api_key_encryption.sql`: 修复 API 密钥加密
- `/supabase/migrations/20250508183400_extend_service_instances.sql`: 扩展服务实例表
- `/supabase/migrations/20250524230000_fix_dify_config_rls.sql`: 修复 Dify 配置相关表的 RLS 策略
- `/supabase/migrations/20250529151826_ensure_default_service_instance_constraint.sql`: 确保默认服务实例的唯一性约束
- `/supabase/migrations/20250529151827_add_set_default_service_instance_function.sql`: 添加设置默认服务实例的存储过程

### 对话和消息管理
- `/supabase/migrations/20250513104549_extend_conversations_messages.sql`: 扩展对话和消息表
- `/supabase/migrations/20250515132500_add_metadata_to_conversations.sql`: 添加元数据字段到对话表
- `/supabase/migrations/20250521125100_add_message_trigger.sql`: 增加 messages 表触发器，自动维护同步状态和 last_message_preview
- `/supabase/migrations/20250522193000_update_message_preview_format.sql`: 调整 conversations.last_message_preview 字段为 JSONB 格式

### 数据完整性和清理
- `/supabase/migrations/20250524194000_improve_cascade_deletion.sql`: 改进级联删除逻辑，处理孤儿组织和 AI 配置问题

### 应用执行记录管理
- `/supabase/migrations/20250601124105_add_app_executions_table.sql`: 添加应用执行记录表，支持工作流和文本生成应用的执行历史管理

### 部门应用权限管理
- `/supabase/migrations/20250610120000_add_org_app_permissions.sql`: 初始组织级权限系统（已被替代）
- `/supabase/migrations/20250610120001_redesign_department_permissions.sql`: 重新设计的部门级权限系统，实现精确的部门级应用权限控制
- `/supabase/migrations/20250610130000_add_department_permission_management.sql`: 添加部门权限管理函数和同步工具
- `/supabase/migrations/20250610140000_clean_virtual_department_permissions.sql`: **清空虚拟权限数据，确保只有手动配置的权限记录**

### 北信SSO集成 (2025-06-17)
- `/supabase/migrations/20250617185201_fix_enum_transaction_issue.sql`: 修复PostgreSQL枚举类型事务问题，添加CAS协议支持到sso_protocol枚举
- `/supabase/migrations/20250617185202_add_bistu_sso_data.sql`: 北信SSO完整集成，包括：
  - 在profiles表添加employee_number字段（学工号）
  - 创建find_user_by_employee_number函数用于SSO用户查找
  - 创建create_sso_user函数用于自动创建SSO用户
  - 插入北京信息科技大学CAS提供商配置数据
- `/supabase/migrations/20250617140818_drop_sso_views.sql`: 清理SSO统计视图，简化数据库对象

## 迁移文件说明

### 用户管理系统演进

用户管理系统经历了多次安全性改进：

1. **初始实现** (20250529153000): 创建了基础的用户管理视图和函数
2. **安全问题发现** (20250601000100): Supabase 发出安全警告，原视图暴露 auth.users 数据
3. **函数方案尝试** (20250601000200): 尝试用安全函数替代视图，但遇到结构匹配问题
4. **视图重建** (20250601000500): 重新创建安全视图，使用 security_invoker 模式
5. **权限修复** (20250601000600): 发现权限问题，改回 SECURITY DEFINER 模式

### 最终安全方案

用户管理系统采用以下安全机制：

- **函数级权限验证**：所有管理函数都包含权限检查
- **RLS策略保护**：数据库级别的行级安全控制
- **中间件验证**：前端路由级别的管理员身份验证
- **完整功能保留**：管理员可以安全访问用户数据和敏感信息

### 权限保护机制

系统通过多层保护确保安全：

1. **触发器保护**：防止危险的角色操作和用户删除
2. **函数级验证**：所有管理函数都包含权限检查
3. **视图级隔离**：非管理员查询返回空结果
4. **批量操作安全**：包含自我保护和管理员保护机制
