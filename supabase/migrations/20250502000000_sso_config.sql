-- 创建 SSO 提供商类型枚举
CREATE TYPE sso_protocol AS ENUM ('SAML', 'OAuth2', 'OIDC');

-- 创建 SSO 提供商表
CREATE TABLE IF NOT EXISTS sso_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  protocol sso_protocol NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_id TEXT,
  client_secret TEXT,
  metadata_url TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建域名到SSO提供商的映射表
CREATE TABLE IF NOT EXISTS domain_sso_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  sso_provider_id UUID REFERENCES sso_providers(id) ON DELETE CASCADE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建全局认证设置表
CREATE TABLE IF NOT EXISTS auth_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allow_email_registration BOOLEAN DEFAULT false,
  allow_phone_registration BOOLEAN DEFAULT false,
  allow_password_login BOOLEAN DEFAULT true,
  require_email_verification BOOLEAN DEFAULT true,
  password_policy JSONB DEFAULT '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_number": true, "require_special": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 添加用户来源字段到profiles表
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_source TEXT DEFAULT 'password';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sso_provider_id UUID REFERENCES sso_providers(id) ON DELETE SET NULL;

-- 设置行级安全性
ALTER TABLE sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_sso_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_settings ENABLE ROW LEVEL SECURITY;

-- 为SSO表创建策略
CREATE POLICY "管理员可以访问SSO提供商配置" ON sso_providers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::user_role
    )
  );

CREATE POLICY "管理员可以访问域名映射" ON domain_sso_mappings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::user_role
    )
  );

CREATE POLICY "管理员可以访问认证设置" ON auth_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::user_role
    )
  );

-- 创建自动更新updated_at的触发器
CREATE TRIGGER update_sso_providers_modtime
  BEFORE UPDATE ON sso_providers
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_domain_sso_mappings_modtime
  BEFORE UPDATE ON domain_sso_mappings
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_auth_settings_modtime
  BEFORE UPDATE ON auth_settings
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 插入默认认证设置
INSERT INTO auth_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001'); 