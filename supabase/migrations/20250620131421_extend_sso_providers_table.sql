-- 扩展sso_providers表以支持动态SSO配置管理
-- 创建日期: 2025-01-08 
-- 描述: 为SSO配置管理系统添加必要的字段和表结构
-- 设计原则: 避免字段冗余，统一UI配置在settings.ui中管理

-- --- BEGIN COMMENT ---
-- 1. 为sso_providers表添加UI配置字段，确保不破坏现有数据
-- 只保留最常用的字段，避免冗余设计
-- --- END COMMENT ---
ALTER TABLE sso_providers 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,  -- 登录页面按钮显示顺序（数字越小越靠前）
ADD COLUMN IF NOT EXISTS button_text TEXT;                 -- 登录按钮显示文本（如：Example University SSO）

-- --- BEGIN COMMENT ---
-- 2. 为现有字段和新增字段添加详细注释，便于开发者理解
-- --- END COMMENT ---
COMMENT ON COLUMN sso_providers.id IS 'SSO提供商唯一标识符，用于API路由(/api/sso/{id}/*)和服务实例缓存';
COMMENT ON COLUMN sso_providers.name IS '提供商显示名称，用于管理界面展示和日志记录，如：Example University';
COMMENT ON COLUMN sso_providers.protocol IS 'SSO协议类型，支持CAS、OIDC、SAML等，决定使用哪个服务实现类';
COMMENT ON COLUMN sso_providers.enabled IS '是否启用该提供商，false时不会在登录页面显示且API拒绝访问';
COMMENT ON COLUMN sso_providers.display_order IS '登录页面按钮显示顺序，数字越小越靠前，相同值按name字母序排序';
COMMENT ON COLUMN sso_providers.button_text IS '登录按钮显示文本，为空时使用name字段值，支持多语言';
COMMENT ON COLUMN sso_providers.client_id IS 'OAuth2/OIDC协议的客户端ID，CAS协议不使用此字段';
COMMENT ON COLUMN sso_providers.client_secret IS 'OAuth2/OIDC协议的客户端密钥，建议使用加密存储';
COMMENT ON COLUMN sso_providers.metadata_url IS 'SAML协议的元数据URL，用于自动配置端点信息';

-- --- BEGIN COMMENT ---
-- 3. 为settings字段添加详细的结构说明注释
-- --- END COMMENT ---
COMMENT ON COLUMN sso_providers.settings IS '
SSO提供商完整配置，JSONB格式，避免字段冗余的统一配置结构：
{
  "protocol_config": {
    "base_url": "string",               // SSO服务器基础URL，如：https://sso.example.com
    "endpoints": {
      "login": "string",                // 登录端点路径，如：/login
      "logout": "string",               // 注销端点路径，如：/logout
      "validate": "string",             // 票据验证端点，如：/serviceValidate
      "metadata": "string"              // 元数据端点路径（SAML协议使用）
    },
    "version": "string",                // 协议版本，如：CAS 2.0/3.0
    "timeout": number,                  // 请求超时时间（毫秒），默认10000
    "attributes_mapping": {
      "employee_id": "string",          // 工号字段映射，如：cas:user
      "username": "string",             // 用户名字段映射，如：cas:username
      "full_name": "string",            // 全名字段映射，如：cas:name
      "email": "string"                 // 邮箱字段映射，如：cas:mail
    }
  },
  "security": {
    "require_https": boolean,           // 是否要求HTTPS连接，生产环境建议true
    "validate_certificates": boolean,   // 是否验证SSL证书，生产环境建议true
    "allowed_redirect_hosts": ["string"] // 允许的重定向主机白名单
  },
  "ui": {
    "icon": "string",                   // 按钮图标（emoji或图片URL），如：🏛️
    "logo_url": "string",               // 机构logo图片URL，用于管理界面展示
    "description": "string",            // 详细描述文本，如：Example University SSO System
    "theme": "string"                   // 按钮主题标识：primary/secondary/default/outline
  }
}';

-- --- BEGIN COMMENT ---
-- 4. 创建SSO协议模板表，为不同协议提供标准配置模板
-- --- END COMMENT ---
CREATE TABLE IF NOT EXISTS sso_protocol_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- 模板唯一标识符
  protocol sso_protocol NOT NULL,                 -- 对应的SSO协议类型，必须与sso_providers.protocol一致
  name TEXT NOT NULL,                             -- 模板显示名称，如：CAS 2.0/3.0 协议
  description TEXT,                               -- 协议详细描述，说明适用场景和特性
  config_schema JSONB NOT NULL,                   -- JSON Schema格式的配置验证规则
  default_settings JSONB NOT NULL,                -- 该协议的默认配置模板，创建新提供商时使用
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --- BEGIN COMMENT ---
-- 5. 为协议模板表添加详细的字段注释
-- --- END COMMENT ---
COMMENT ON TABLE sso_protocol_templates IS 'SSO协议配置模板表，为不同协议提供标准配置模板和验证规则，简化新提供商的创建过程';
COMMENT ON COLUMN sso_protocol_templates.id IS '模板唯一标识符，用于管理API的模板操作';
COMMENT ON COLUMN sso_protocol_templates.protocol IS 'SSO协议类型，必须与sso_providers.protocol枚举值一致，如：CAS、OIDC、SAML';
COMMENT ON COLUMN sso_protocol_templates.name IS '模板显示名称，用于管理界面选择协议时展示，如：CAS 2.0/3.0 协议';
COMMENT ON COLUMN sso_protocol_templates.description IS '协议详细描述，说明协议特性、适用场景和配置要点';
COMMENT ON COLUMN sso_protocol_templates.config_schema IS 'JSON Schema格式的配置验证规则，用于验证sso_providers.settings字段的合法性';
COMMENT ON COLUMN sso_protocol_templates.default_settings IS '该协议的默认配置模板，创建新提供商时作为初始配置使用';

-- --- BEGIN COMMENT ---
-- 6. 设置RLS策略，确保只有管理员可以访问协议模板
-- --- END COMMENT ---
ALTER TABLE sso_protocol_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以访问SSO协议模板" ON sso_protocol_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::user_role
    )
  );

-- --- BEGIN COMMENT ---
-- 7. 插入CAS协议模板，提供标准的CAS配置模板
-- --- END COMMENT ---
INSERT INTO sso_protocol_templates (protocol, name, description, config_schema, default_settings)
VALUES (
  'CAS',
  'CAS 2.0/3.0 协议',
  '中央认证服务协议，广泛用于高校统一认证系统，支持单点登录和注销功能',
  '{
    "type": "object",
    "properties": {
      "protocol_config": {
        "type": "object",
        "properties": {
          "base_url": {"type": "string", "format": "uri"},
          "version": {"type": "string", "enum": ["2.0", "3.0"]},
          "timeout": {"type": "number", "minimum": 1000},
          "endpoints": {
            "type": "object",
            "properties": {
              "login": {"type": "string"},
              "logout": {"type": "string"},
              "validate": {"type": "string"},
              "validate_v3": {"type": "string"}
            }
          }
        },
        "required": ["base_url"]
      }
    }
  }',
  '{
    "protocol_config": {
      "version": "2.0",
      "timeout": 10000,
      "endpoints": {
        "login": "/login",
        "logout": "/logout",
        "validate": "/serviceValidate",
        "validate_v3": "/p3/serviceValidate"
      },
      "attributes_mapping": {
        "employee_id": "cas:user",
        "username": "cas:username",
        "full_name": "cas:name"
      }
    },
    "security": {
      "require_https": true,
      "validate_certificates": true
    }
  }'
) ON CONFLICT DO NOTHING;

-- --- BEGIN COMMENT ---
-- 8. 插入其他协议模板（为将来扩展准备），提供OIDC和SAML的标准配置
-- --- END COMMENT ---
INSERT INTO sso_protocol_templates (protocol, name, description, config_schema, default_settings)
VALUES 
(
  'OIDC',
  'OpenID Connect',
  '基于OAuth 2.0的身份认证协议，支持现代Web应用和移动应用的SSO',
  '{
    "type": "object",
    "properties": {
      "protocol_config": {
        "type": "object",
        "properties": {
          "issuer": {"type": "string", "format": "uri"},
          "client_id": {"type": "string"},
          "client_secret": {"type": "string"},
          "scope": {"type": "string", "default": "openid profile email"}
        },
        "required": ["issuer", "client_id", "client_secret"]
      }
    }
  }',
  '{
    "protocol_config": {
      "scope": "openid profile email",
      "response_type": "code",
      "attributes_mapping": {
        "employee_id": "sub",
        "username": "preferred_username",
        "full_name": "name",
        "email": "email"
      }
    }
  }'
),
(
  'SAML',
  'SAML 2.0',
  '安全断言标记语言，企业级SSO标准，支持复杂的身份联邦场景',
  '{
    "type": "object",
    "properties": {
      "protocol_config": {
        "type": "object",
        "properties": {
          "metadata_url": {"type": "string", "format": "uri"},
          "entity_id": {"type": "string"},
          "sso_url": {"type": "string", "format": "uri"}
        },
        "required": ["metadata_url"]
      }
    }
  }',
  '{
    "protocol_config": {
      "attributes_mapping": {
        "employee_id": "urn:oid:0.9.2342.19200300.100.1.1",
        "username": "urn:oid:0.9.2342.19200300.100.1.1",
        "full_name": "urn:oid:2.5.4.3",
        "email": "urn:oid:1.2.840.113549.1.9.1"
      }
    }
  }'
)
ON CONFLICT DO NOTHING;

-- --- BEGIN COMMENT ---
-- 9. 创建更新时间触发器，自动维护updated_at字段
-- --- END COMMENT ---
CREATE TRIGGER update_sso_protocol_templates_modtime
  BEFORE UPDATE ON sso_protocol_templates
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column(); 