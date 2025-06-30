-- --- BEGIN COMMENT ---
-- 极简群组系统的初始数据
-- 不再需要默认组织，用户可以自己创建群组
-- --- END COMMENT ---

-- 插入示例SSO提供商配置
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
    '{"authorization_endpoint": "https://accounts.google.com/o/oauth2/v2.auth"}',
    'google-client-id-example',
    'google-client-secret-example',
    'https://accounts.google.com/.well-known/openid-configuration',
    true
  );

-- 插入示例域名映射
INSERT INTO domain_sso_mappings (domain, sso_provider_id, enabled)
VALUES
  ('example.com', '00000000-0000-0000-0000-000000000002', true),
  ('google.com', '00000000-0000-0000-0000-000000000003', true); 

-- --- BEGIN COMMENT ---
-- 示例群组数据（可选，实际部署时可以删除）
-- --- END COMMENT ---

-- 注意：以下是示例数据，实际部署时应该删除
-- 创建示例群组需要真实的用户ID，所以这里先注释掉
-- 用户注册后可以自己创建群组

/*
-- 示例：创建一个演示群组（需要真实的用户ID）
INSERT INTO groups (id, name, description, created_by)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '演示群组', '这是一个演示群组，展示群组功能', NULL);

-- 示例：为群组分配应用权限（需要真实的service_instance_id）
INSERT INTO group_app_permissions (group_id, service_instance_id, is_enabled, usage_quota)
VALUES 
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM service_instances LIMIT 1), true, 100);
*/ 