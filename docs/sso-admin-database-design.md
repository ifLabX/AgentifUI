# SSO后台配置管理系统数据库设计文档 v3.1

## 📋 文档概述

**文档版本**: v3.1 (精益版配套)  
**创建日期**: 2025年7月1日  
**最后更新**: 2025年7月1日
**适用范围**: AgentifUI SSO后台配置管理系统(精益版)  
**配套方案**: SSO后台配置管理系统实现方案 v3.1
**基于原有设计**: 保留现有sso_providers表结构，无需重新迁移

## 🎯 设计理念

### 核心目标

1. **解决核心问题**: 支持正确的`NEXT_PUBLIC_APP_URL`构建service地址，确保认证流程稳定
2. **精益设计**: 基于现有表结构，专注核心功能实现
3. **快速交付**: 支持10-15天内交付可用系统，无需数据库迁移
4. **扩展预留**: 在现有设计基础上预留未来扩展接口
5. **类型安全**: 使用TypeScript配置文件提供协议模板

### 设计原则

- **保持稳定**: 保留现有sso_providers表结构，确保兼容性
- **精益实现**: 专注MVP功能，避免过度设计
- **稳定可靠**: 确保核心认证流程的稳定性
- **扩展友好**: 在现有字段基础上为未来功能预留空间

## 📊 数据库表结构设计

### 1. `sso_providers` 表 - SSO提供商核心表 (现有设计)

#### 表结构定义 (保持不变)

```sql
-- 现有的sso_providers表结构 (来自sso-database-design-refactored.md)
CREATE TABLE sso_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  protocol sso_protocol NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  client_id TEXT,
  client_secret TEXT,
  metadata_url TEXT,
  enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  button_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 现有的协议枚举类型
CREATE TYPE sso_protocol AS ENUM ('CAS', 'OIDC', 'SAML', 'OAuth2');
```

#### 字段详细说明 (基于现有设计)

| 字段名          | 类型         | 描述             | 约束          | 使用说明                                     |
| --------------- | ------------ | ---------------- | ------------- | -------------------------------------------- |
| `id`            | UUID         | 提供商唯一标识符 | 主键          | 用于API路由`/api/sso/{id}/*`和内部引用       |
| `name`          | TEXT         | 提供商显示名称   | NOT NULL      | 管理界面展示和日志记录，如"北京信息科技大学" |
| `protocol`      | sso_protocol | 协议类型         | NOT NULL      | 支持CAS、OIDC、SAML、OAuth2四种协议          |
| `settings`      | JSONB        | 统一配置结构     | NOT NULL      | 🔥核心字段，存储所有协议配置                 |
| `client_id`     | TEXT         | 客户端ID         | 可选          | OAuth2/OIDC协议使用                          |
| `client_secret` | TEXT         | 客户端密钥       | 可选          | OAuth2/OIDC协议使用，建议加密存储            |
| `metadata_url`  | TEXT         | 元数据URL        | 可选          | SAML协议使用，用于自动配置端点信息           |
| `enabled`       | BOOLEAN      | 是否启用         | DEFAULT TRUE  | false时不显示且API拒绝访问                   |
| `display_order` | INTEGER      | 显示顺序         | DEFAULT 0     | 登录页面按钮显示顺序                         |
| `button_text`   | TEXT         | 按钮文本         | 可选          | 自定义登录按钮文本，为空时使用name字段值     |
| `created_at`    | TIMESTAMP    | 创建时间         | DEFAULT NOW() | 记录创建时间                                 |
| `updated_at`    | TIMESTAMP    | 更新时间         | DEFAULT NOW() | 自动更新时间戳                               |

### 2. `settings` 字段结构设计 (核心配置) - 适配精益版

`settings` 字段是整个系统的核心，采用JSONB格式存储复杂配置，支持所有协议的统一配置：

#### 三层架构设计 (与实现方案配套)

```json
{
  "protocol_config": {
    // 协议相关的技术配置 - 对应实现方案中的URL构建和协议服务
  },
  "security": {
    // 安全相关的设置 - 支持NEXT_PUBLIC_APP_URL验证和HTTPS要求
  },
  "ui": {
    // 用户界面相关的设置 - 支持管理界面和登录页面展示
  }
}
```

#### CAS协议配置示例 (北京信息科技大学)

```json
{
  "protocol_config": {
    "base_url": "https://sso.bistu.edu.cn", // SSO服务器基础URL
    "version": "2.0", // 协议版本
    "timeout": 10000, // 请求超时时间
    "endpoints": {
      "login": "/login", // 登录端点
      "logout": "/logout", // 注销端点
      "validate": "/serviceValidate", // 票据验证端点
      "validate_v3": "/p3/serviceValidate" // CAS 3.0验证端点(可选)
    },
    "attributes_mapping": {
      "employee_id": "cas:user", // 工号字段映射
      "username": "cas:username", // 用户名字段映射
      "full_name": "cas:name", // 全名字段映射
      "email": "cas:mail" // 邮箱字段映射(可选)
    }
  },
  "security": {
    "require_https": true, // 支持NEXT_PUBLIC_APP_URL的HTTPS验证
    "validate_certificates": true, // SSL证书验证
    "allowed_redirect_hosts": ["bistu.edu.cn"] // 允许的重定向主机白名单
  },
  "ui": {
    "icon": "🏛️", // 按钮图标
    "theme": "primary", // 按钮主题
    "description": "北京信息科技大学统一认证系统" // 详细描述
  }
}
```

#### OIDC协议配置示例

```json
{
  "protocol_config": {
    "issuer": "https://oidc.example.com", // OIDC Issuer URL
    "scope": "openid profile email", // OIDC scope参数
    "response_type": "code", // 响应类型
    "timeout": 10000, // 请求超时
    "endpoints": {
      "authorization": "/auth", // 授权端点
      "token": "/token", // 令牌端点
      "userinfo": "/userinfo", // 用户信息端点
      "end_session": "/logout" // 会话结束端点
    },
    "attributes_mapping": {
      "employee_id": "sub", // 员工ID映射
      "username": "preferred_username", // 用户名映射
      "full_name": "name", // 全名映射
      "email": "email" // 邮箱映射
    }
  },
  "security": {
    "require_https": true, // HTTPS要求
    "validate_certificates": true, // 证书验证
    "pkce_enabled": true, // PKCE支持
    "state_parameter": true // State参数验证
  },
  "ui": {
    "icon": "🔐", // 按钮图标
    "theme": "secondary", // 按钮主题
    "description": "企业OIDC认证" // 描述文本
  }
}
```

#### 配置结构特点 (与精益版实现方案对应)

1. **协议通用性**: 通过不同字段组合支持CAS、OIDC、SAML、OAuth2四种协议
2. **URL构建支持**: `protocol_config.base_url`配合`NEXT_PUBLIC_APP_URL`解决核心问题
3. **扩展友好**: 支持任意自定义字段，无需修改表结构
4. **类型安全**: 配合TypeScript协议定义文件提供编译时检查

## 🔒 权限和安全设计 (基于现有RLS策略)

### 1. 行级安全策略 (RLS) - 保持现有设计

基于原有的RLS策略设计，确保管理员权限控制和数据安全：

```sql
-- 启用行级安全 (已存在)
ALTER TABLE sso_providers ENABLE ROW LEVEL SECURITY;

-- 管理员完全访问策略 (精益版实现所需)
CREATE POLICY "管理员可以访问所有SSO提供商"
  ON sso_providers FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'isAdmin' = 'true'
    )
  );

-- 普通用户只读访问启用的提供商 (登录页面使用)
CREATE POLICY "普通用户可以查看启用的SSO提供商"
  ON sso_providers FOR SELECT TO authenticated
  USING (enabled = true);

-- 匿名用户查看启用的提供商 (登录页面展示)
CREATE POLICY "匿名用户可以查看启用的SSO提供商"
  ON sso_providers FOR SELECT TO anon
  USING (enabled = true);
```

### 2. 敏感信息保护 (适配精益版需求)

创建公共视图，隐藏敏感信息，支持登录页面和前端安全访问：

```sql
-- 创建公共视图，隐藏敏感信息
CREATE VIEW sso_providers_public AS
SELECT
  id,
  name,
  protocol,
  -- 从settings中移除敏感信息，保留UI和基础配置
  jsonb_set(
    settings,
    '{protocol_config}',
    (settings->'protocol_config') - 'client_secret'
  ) as settings,
  client_id,
  -- client_secret字段被隐藏
  metadata_url,
  enabled,
  display_order,
  button_text,
  created_at,
  updated_at
FROM sso_providers
WHERE enabled = true
ORDER BY display_order, name;

-- 设置视图权限
GRANT SELECT ON sso_providers_public TO anon, authenticated;
```

### 3. 精益版安全特性

针对精益版实现方案的安全考虑：

1. **URL验证**: 支持`NEXT_PUBLIC_APP_URL`的白名单验证
2. **协议安全**: 强制HTTPS连接要求
3. **访问控制**: 基于NextAuth.js的管理员权限验证
4. **数据保护**: 敏感配置信息的安全存储和访问

## 🛠️ 适配精益版的配置示例

### 1. 基础数据插入 (无需新迁移，支持现有结构)

基于现有表结构的示例配置，支持精益版实现方案的核心功能：

```sql
-- 插入CAS协议示例 (北京信息科技大学)
-- 支持NEXT_PUBLIC_APP_URL构建和service参数验证
INSERT INTO sso_providers (
  name,
  protocol,
  settings,
  enabled,
  display_order,
  button_text
) VALUES (
  '北京信息科技大学',
  'CAS',
  '{
    "protocol_config": {
      "base_url": "https://sso.bistu.edu.cn",
      "version": "2.0",
      "timeout": 10000,
      "endpoints": {
        "login": "/login",
        "logout": "/logout",
        "validate": "/serviceValidate"
      },
      "attributes_mapping": {
        "employee_id": "cas:user",
        "username": "cas:username",
        "full_name": "cas:name",
        "email": "cas:mail"
      }
    },
    "security": {
      "require_https": true,
      "validate_certificates": true,
      "allowed_redirect_hosts": ["bistu.edu.cn"]
    },
    "ui": {
      "icon": "🏛️",
      "theme": "primary",
      "description": "使用学校统一认证登录"
    }
  }',
  true,
  1,
  '学校统一认证登录'
);

-- 插入OIDC协议示例 (企业认证)
-- 支持client_id/client_secret字段和OAuth2流程
INSERT INTO sso_providers (
  name,
  protocol,
  settings,
  client_id,
  enabled,
  display_order,
  button_text
) VALUES (
  '企业OIDC认证',
  'OIDC',
  '{
    "protocol_config": {
      "issuer": "https://auth.company.com",
      "scope": "openid profile email",
      "response_type": "code",
      "timeout": 10000,
      "endpoints": {
        "authorization": "/auth",
        "token": "/token",
        "userinfo": "/userinfo"
      },
      "attributes_mapping": {
        "employee_id": "sub",
        "username": "preferred_username",
        "full_name": "name",
        "email": "email"
      }
    },
    "security": {
      "require_https": true,
      "validate_certificates": true,
      "pkce_enabled": true
    },
    "ui": {
      "icon": "🔐",
      "theme": "secondary",
      "description": "企业账号登录"
    }
  }',
  'your-client-id',
  false,
  2,
  '企业账号登录'
);
```

## 🔧 精益版工具函数 (支持完整实现)

### 1. 基础配置验证 (完整版)

用于验证核心配置完整性，支持实现方案中的所有协议：

```sql
-- 验证SSO提供商配置的完整性
CREATE OR REPLACE FUNCTION validate_sso_provider_config(
  protocol_type sso_protocol,
  config_settings JSONB,
  client_id_param TEXT DEFAULT NULL,
  client_secret_param TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- 基础结构验证 (三层架构)
  IF NOT (config_settings ? 'protocol_config' AND
          config_settings ? 'security' AND
          config_settings ? 'ui') THEN
    RETURN FALSE;
  END IF;

  -- 验证protocol_config必需字段
  IF NOT (config_settings->'protocol_config' ? 'base_url' AND
          config_settings->'protocol_config' ? 'endpoints' AND
          config_settings->'protocol_config' ? 'attributes_mapping') THEN
    RETURN FALSE;
  END IF;

  -- 协议特定的验证 (对应实现方案)
  CASE protocol_type
    WHEN 'CAS' THEN
      -- CAS协议验证 (对应CASService)
      RETURN (config_settings->'protocol_config'->'endpoints' ? 'login' AND
              config_settings->'protocol_config'->'endpoints' ? 'validate' AND
              config_settings->'protocol_config'->'endpoints' ? 'logout');
    WHEN 'OIDC' THEN
      -- OIDC协议验证 (对应OIDCService)
      RETURN (config_settings->'protocol_config'->'endpoints' ? 'authorization' AND
              config_settings->'protocol_config'->'endpoints' ? 'token' AND
              config_settings->'protocol_config'->'endpoints' ? 'userinfo' AND
              config_settings->'protocol_config' ? 'scope' AND
              client_id_param IS NOT NULL);
    WHEN 'OAuth2' THEN
      -- OAuth2协议验证 (使用OIDC服务)
      RETURN (config_settings->'protocol_config'->'endpoints' ? 'authorization' AND
              config_settings->'protocol_config'->'endpoints' ? 'token' AND
              client_id_param IS NOT NULL);
    WHEN 'SAML' THEN
      -- SAML协议验证 (预留实现)
      RETURN (config_settings->'protocol_config' ? 'entity_id' OR
              config_settings ? 'metadata_url');
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 验证属性映射配置
CREATE OR REPLACE FUNCTION validate_attributes_mapping(
  protocol_type sso_protocol,
  attributes_mapping JSONB
) RETURNS BOOLEAN AS $$
BEGIN
  -- 验证必需的属性映射字段
  RETURN (attributes_mapping ? 'employee_id' AND
          attributes_mapping ? 'username' AND
          attributes_mapping ? 'full_name');
END;
$$ LANGUAGE plpgsql;
```

### 2. 管理工具函数 (支持完整实现)

支持实现方案中完整管理功能的工具：

```sql
-- 获取启用的提供商列表 (登录页面使用)
CREATE OR REPLACE FUNCTION get_enabled_sso_providers()
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'name', name,
        'protocol', protocol,
        'button_text', COALESCE(button_text, name),
        'display_order', display_order,
        'ui_settings', settings->'ui'
      ) ORDER BY display_order, name
    )
    FROM sso_providers
    WHERE enabled = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 根据协议类型获取配置模板 (对应实现方案中的协议模板)
CREATE OR REPLACE FUNCTION get_protocol_template(protocol_name sso_protocol)
RETURNS JSON AS $$
BEGIN
  CASE protocol_name
    WHEN 'CAS' THEN
      RETURN '{
        "protocol_config": {
          "base_url": "",
          "version": "2.0",
          "timeout": 10000,
          "endpoints": {
            "login": "/login",
            "logout": "/logout",
            "validate": "/serviceValidate"
          },
          "attributes_mapping": {
            "employee_id": "cas:user",
            "username": "cas:username",
            "full_name": "cas:name",
            "email": "cas:mail"
          }
        },
        "security": {
          "require_https": true,
          "validate_certificates": true,
          "allowed_redirect_hosts": []
        },
        "ui": {
          "icon": "🏛️",
          "theme": "primary",
          "description": "CAS统一认证系统"
        }
      }'::json;
    WHEN 'OIDC' THEN
      RETURN '{
        "protocol_config": {
          "base_url": "",
          "scope": "openid profile email",
          "response_type": "code",
          "timeout": 10000,
          "endpoints": {
            "authorization": "/auth",
            "token": "/token",
            "userinfo": "/userinfo",
            "logout": "/logout"
          },
          "attributes_mapping": {
            "employee_id": "sub",
            "username": "preferred_username",
            "full_name": "name",
            "email": "email"
          }
        },
        "security": {
          "require_https": true,
          "validate_certificates": true,
          "pkce_enabled": true,
          "state_parameter": true
        },
        "ui": {
          "icon": "🔐",
          "theme": "secondary",
          "description": "OIDC认证系统"
        }
      }'::json;
    WHEN 'OAuth2' THEN
      RETURN '{
        "protocol_config": {
          "base_url": "",
          "scope": "read:user user:email",
          "response_type": "code",
          "timeout": 10000,
          "endpoints": {
            "authorization": "/oauth/authorize",
            "token": "/oauth/token",
            "userinfo": "/user"
          },
          "attributes_mapping": {
            "employee_id": "id",
            "username": "login",
            "full_name": "name",
            "email": "email"
          }
        },
        "security": {
          "require_https": true,
          "validate_certificates": true,
          "state_parameter": true
        },
        "ui": {
          "icon": "🔑",
          "theme": "accent",
          "description": "OAuth2认证系统"
        }
      }'::json;
    WHEN 'SAML' THEN
      RETURN '{
        "protocol_config": {
          "base_url": "",
          "entity_id": "",
          "timeout": 10000,
          "endpoints": {
            "sso": "/sso",
            "slo": "/slo"
          },
          "attributes_mapping": {
            "employee_id": "urn:oid:0.9.2342.19200300.100.1.1",
            "username": "urn:oid:0.9.2342.19200300.100.1.1",
            "full_name": "urn:oid:2.5.4.3",
            "email": "urn:oid:0.9.2342.19200300.100.1.3"
          }
        },
        "security": {
          "require_https": true,
          "validate_certificates": true,
          "sign_requests": true
        },
        "ui": {
          "icon": "🏢",
          "theme": "tertiary",
          "description": "SAML认证系统"
        }
      }'::json;
    ELSE
      RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 导出SSO提供商配置 (管理员备份使用)
CREATE OR REPLACE FUNCTION export_sso_providers_config()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- 检查管理员权限
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'isAdmin' = 'true'
  ) THEN
    RAISE EXCEPTION '权限不足：需要管理员权限';
  END IF;

  SELECT json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'protocol', protocol,
      'settings', settings,
      'client_id', client_id,
      'metadata_url', metadata_url,
      'enabled', enabled,
      'display_order', display_order,
      'button_text', button_text,
      'created_at', created_at
    )
  ) INTO result
  FROM sso_providers
  ORDER BY display_order, name;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📊 查询优化 (支持完整实现)

### 1. 核心查询模式 (对应实现方案需求)

基于实现方案的数据访问模式优化的查询：

```sql
-- 登录页面查询：获取启用的提供商 (SSOProviderService.getEnabledProviders)
SELECT id, name, protocol,
       COALESCE(button_text, name) as button_text,
       settings->'ui' as ui_settings,
       display_order
FROM sso_providers_public
WHERE enabled = true
ORDER BY display_order, name;

-- 管理界面查询：获取所有提供商 (SSOProviderService.getProviders)
SELECT id, name, protocol, enabled, display_order,
       created_at, updated_at,
       settings->'ui'->>'description' as description
FROM sso_providers
ORDER BY display_order, name;

-- SSO认证API查询：根据ID获取提供商 (SSOProviderService.getProviderById)
SELECT id, name, protocol, settings, client_id, client_secret, metadata_url,
       enabled, button_text
FROM sso_providers
WHERE id = $1 AND enabled = true;

-- 完整提供商信息查询 (含敏感信息，仅管理员)
SELECT id, name, protocol, settings, client_id, client_secret, metadata_url,
       enabled, display_order, button_text, created_at, updated_at
FROM sso_providers
WHERE id = $1;

-- 协议筛选查询：按协议类型获取 (管理界面筛选)
SELECT id, name, enabled, display_order,
       settings->'ui'->>'icon' as icon,
       settings->'ui'->>'description' as description
FROM sso_providers
WHERE protocol = $1
ORDER BY display_order, name;

-- URL构建查询：获取特定提供商配置 (URL构建服务)
SELECT id, name, protocol,
       settings->'protocol_config'->>'base_url' as base_url,
       settings->'protocol_config'->'endpoints' as endpoints,
       settings->'security' as security_config,
       client_id
FROM sso_providers
WHERE id = $1 AND enabled = true;

-- 用户同步查询：检查用户是否存在 (UserSyncService.syncUser)
SELECT id, username, email, name, last_login_at
FROM users
WHERE sso_provider_id = $1 AND sso_user_id = $2;

-- 协议配置验证查询：检查配置完整性
SELECT id, name, protocol,
       validate_sso_provider_config(protocol, settings, client_id, client_secret) as is_valid
FROM sso_providers
WHERE id = $1;
```

### 2. 索引策略 (支持完整实现)

针对实现方案中数据访问模式的性能优化：

```sql
-- 基础索引 (如果尚未存在)
CREATE INDEX IF NOT EXISTS idx_sso_providers_protocol
ON sso_providers(protocol);

CREATE INDEX IF NOT EXISTS idx_sso_providers_enabled
ON sso_providers(enabled);

CREATE INDEX IF NOT EXISTS idx_sso_providers_display_order
ON sso_providers(display_order);

-- 复合索引：启用状态 + 显示顺序 (SSOProviderService.getEnabledProviders)
CREATE INDEX IF NOT EXISTS idx_sso_providers_enabled_display_order
ON sso_providers(enabled, display_order)
WHERE enabled = true;

-- GIN索引：settings字段 JSONB 查询优化 (协议配置查询)
CREATE INDEX IF NOT EXISTS idx_sso_providers_settings_gin
ON sso_providers USING GIN (settings);

-- 部分索引：启用的提供商协议类型 (API性能优化)
CREATE INDEX IF NOT EXISTS idx_sso_providers_protocol_enabled
ON sso_providers(protocol)
WHERE enabled = true;

-- JSONB路径索引：UI配置快速查询
CREATE INDEX IF NOT EXISTS idx_sso_providers_ui_icon
ON sso_providers USING GIN ((settings->'ui'));

-- JSONB路径索引：协议配置base_url快速查询 (URL构建优化)
CREATE INDEX IF NOT EXISTS idx_sso_providers_base_url
ON sso_providers USING GIN ((settings->'protocol_config'));

-- 用户表相关索引 (支持UserSyncService)
CREATE INDEX IF NOT EXISTS idx_users_sso_provider_user
ON users(sso_provider_id, sso_user_id);

CREATE INDEX IF NOT EXISTS idx_users_last_login
ON users(last_login_at);

-- 表达式索引：经常查询的JSON字段
CREATE INDEX IF NOT EXISTS idx_sso_providers_description
ON sso_providers((settings->'ui'->>'description'));

CREATE INDEX IF NOT EXISTS idx_sso_providers_base_url_text
ON sso_providers((settings->'protocol_config'->>'base_url'));
```

## 🚀 部署说明 (完整实现支持)

### 1. 数据库结构验证

验证数据库是否支持完整实现方案：

```sql
-- 验证sso_providers表结构是否完整
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'sso_providers'
ORDER BY ordinal_position;

-- 验证协议枚举类型 (确保包含所有支持的协议)
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'sso_protocol'
)
ORDER BY enumlabel;

-- 验证users表是否支持SSO字段
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('sso_provider_id', 'sso_user_id', 'sso_raw_data', 'last_login_at');

-- 验证RLS策略是否已启用
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'sso_providers';

-- 验证公共视图是否存在
SELECT viewname, definition
FROM pg_views
WHERE viewname = 'sso_providers_public';

-- 检查工具函数是否存在
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'validate_sso_provider_config',
  'get_enabled_sso_providers',
  'get_protocol_template'
);
```

### 2. 环境变量配置 (完整实现)

支持完整实现方案的环境变量配置：

```bash
# .env.local - 完整SSO系统配置

# 核心URL配置 (解决service参数构建问题)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# SSO协议配置
SSO_ENABLED_PROTOCOLS=CAS,OIDC,SAML,OAuth2
SSO_DEFAULT_TIMEOUT=10000

# 数据库配置 (使用现有数据库)
DATABASE_URL=postgresql://username:password@host:port/database

# NextAuth配置 (支持SSO集成)
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret-key

# SSO安全配置
SSO_REQUIRE_HTTPS=true
SSO_VALIDATE_CERTIFICATES=true

# 开发环境配置
NODE_ENV=development

# 可选：Redis缓存配置 (提高性能)
REDIS_URL=redis://localhost:6379

# 可选：日志配置
LOG_LEVEL=info
LOG_SSO_EVENTS=true
```

### 3. 快速部署检查清单

精益版部署前的验证清单：

```sql
-- 1. 检查表是否存在
SELECT COUNT(*) as table_exists
FROM information_schema.tables
WHERE table_name = 'sso_providers';

-- 2. 检查基础索引
SELECT indexname
FROM pg_indexes
WHERE tablename = 'sso_providers';

-- 3. 检查是否有示例数据
SELECT protocol, COUNT(*) as count
FROM sso_providers
GROUP BY protocol;

-- 4. 验证RLS策略
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'sso_providers';
```

## 🔄 精益版扩展性设计

### 1. 基于现有字段的扩展空间

利用现有表结构为未来版本预留扩展能力：

#### metadata_url字段扩展用途

- **当前用途**: SAML协议的元数据URL
- **扩展用途**: 可存储各种协议的元数据端点或配置URL
- **未来可能**: JSON格式的多协议元数据配置

#### settings字段的扩展结构

基于现有JSONB字段的未来扩展规划：

```json
{
  "protocol_config": {
    // 现有协议配置 (精益版已实现)
    "base_url": "https://sso.example.com",
    "endpoints": {},
    "attributes_mapping": {}
  },
  "security": {
    // 现有安全配置 (精益版已实现)
    "require_https": true,
    "validate_certificates": true,
    "allowed_redirect_hosts": []
  },
  "ui": {
    // 现有UI配置 (精益版已实现)
    "icon": "🏛️",
    "theme": "primary",
    "description": "认证系统"
  },
  "advanced": {
    // 第2版扩展: 高级配置
    "auto_provision": true,
    "group_mapping": {},
    "attribute_transformation": {},
    "session_timeout": 3600
  },
  "audit": {
    // 第3版扩展: 审计配置
    "enable_audit": true,
    "audit_events": ["login", "logout", "failed_auth"],
    "retention_days": 90
  },
  "compliance": {
    // 第4版扩展: 合规配置
    "data_classification": "internal",
    "encryption_required": true,
    "privacy_mode": false
  }
}
```

### 2. 未来版本的数据库扩展

为不破坏现有结构的未来扩展预留设计：

```sql
-- 第2版可能的扩展表 (审计日志)
-- CREATE TABLE sso_audit_logs (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   provider_id UUID REFERENCES sso_providers(id) ON DELETE CASCADE,
--   user_id UUID,
--   action TEXT NOT NULL,
--   details JSONB,
--   ip_address INET,
--   user_agent TEXT,
--   success BOOLEAN DEFAULT true,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );

-- 第3版可能的扩展表 (提供商分组)
-- CREATE TABLE sso_provider_groups (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name TEXT NOT NULL,
--   description TEXT,
--   display_order INTEGER DEFAULT 0,
--   enabled BOOLEAN DEFAULT true,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );
--
-- ALTER TABLE sso_providers
-- ADD COLUMN group_id UUID REFERENCES sso_provider_groups(id);

-- 第4版可能的扩展表 (用户-提供商映射)
-- CREATE TABLE sso_user_provider_preferences (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL,
--   provider_id UUID REFERENCES sso_providers(id) ON DELETE CASCADE,
--   is_preferred BOOLEAN DEFAULT false,
--   last_used_at TIMESTAMP WITH TIME ZONE,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );
```

### 3. 扩展策略说明

精益版的扩展设计原则：

1. **向后兼容**: 所有扩展都基于现有表结构，不破坏已有功能
2. **渐进增强**: 新功能通过settings字段的JSON扩展实现
3. **可选特性**: 扩展功能都是可选的，不影响核心认证流程
4. **数据迁移最小化**: 优先使用现有字段，减少数据库结构变更

## 📚 相关文档

- [SSO后台配置管理系统实现方案 v3.1 (精益版)](./sso-admin-system-implementation-plan.md)
- [SSO数据库设计指南（重构版）](./sso-database-design-refactored.md) - 原有设计参考
- [数据库设计文档](./DATABASE-DESIGN.md)
- [部署指南](./DEPLOYMENT-GUIDE.md)

## 📝 精益版维护指南

### 1. 日常维护任务

基于现有表结构的维护操作：

```sql
-- 性能优化：分析表统计信息
ANALYZE sso_providers;

-- 清理禁用的过期提供商 (谨慎操作)
-- DELETE FROM sso_providers
-- WHERE enabled = false
-- AND updated_at < NOW() - INTERVAL '1 year';

-- 重建索引 (如需要)
-- REINDEX TABLE sso_providers;

-- 检查表空间使用情况
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE tablename = 'sso_providers';
```

### 2. 监控和诊断查询

支持精益版运维的监控查询：

```sql
-- 检查各协议的提供商分布
SELECT
  protocol,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE enabled = true) as enabled_count
FROM sso_providers
GROUP BY protocol
ORDER BY protocol;

-- 检查配置完整性
SELECT
  id,
  name,
  protocol,
  CASE
    WHEN settings ? 'protocol_config' AND
         settings ? 'security' AND
         settings ? 'ui'
    THEN '✅ 配置完整'
    ELSE '❌ 配置不完整'
  END as config_status,
  CASE
    WHEN settings->'protocol_config' ? 'base_url'
    THEN '✅ URL配置正常'
    ELSE '❌ 缺少base_url'
  END as url_status
FROM sso_providers
ORDER BY enabled DESC, display_order;

-- 检查最近更新的提供商
SELECT
  name,
  protocol,
  enabled,
  updated_at
FROM sso_providers
WHERE updated_at > NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC;

-- 检查settings字段大小 (JSONB性能监控)
SELECT
  name,
  protocol,
  octet_length(settings::text) as settings_size_bytes
FROM sso_providers
ORDER BY settings_size_bytes DESC;
```

### 3. 故障排除指南

精益版常见问题的数据库层面排查：

```sql
-- 排查认证失败：检查URL配置
SELECT
  id,
  name,
  protocol,
  settings->'protocol_config'->>'base_url' as base_url,
  settings->'security'->>'require_https' as require_https,
  enabled
FROM sso_providers
WHERE enabled = true;

-- 排查权限问题：检查RLS策略
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'sso_providers';

-- 排查性能问题：检查查询计划
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, protocol, settings
FROM sso_providers
WHERE enabled = true
ORDER BY display_order;
```

## ⚡ 性能建议

针对精益版实现的性能优化建议：

1. **JSONB字段优化**: 避免过度复杂的settings结构
2. **索引策略**: 基于实际查询模式调整索引
3. **缓存策略**: 前端缓存启用的提供商列表
4. **监控指标**: 关注settings字段大小和查询性能

---

## 📝 更新说明 (v3.1 → v3.2)

### 主要更新内容

1. **完善工具函数**: 更新验证函数以支持所有协议类型和完整配置验证
2. **协议模板支持**: 在数据库层面提供协议配置模板函数
3. **查询优化**: 针对完整实现方案优化查询模式和索引策略
4. **扩展索引**: 添加支持用户同步和JSONB查询的专用索引
5. **部署验证**: 提供完整的数据库结构验证脚本

### 与实现方案的配套性验证

- ✅ **类型定义**: 数据库字段与TypeScript类型完全匹配
- ✅ **服务支持**: 所有服务层操作都有对应的优化查询
- ✅ **工具函数**: 支持所有协议验证和模板生成需求
- ✅ **性能优化**: 索引策略覆盖所有主要查询场景

**注意**: 本数据库设计文档现在为SSO后台配置管理系统实现方案v3.2(完整版)提供全面配套支持，确保完整实现的性能和功能需求。
