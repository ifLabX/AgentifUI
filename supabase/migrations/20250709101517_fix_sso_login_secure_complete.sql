-- Migration: 20250709101517_fix_sso_login_secure_complete.sql
-- Description: 修复SSO登录页面访问问题，提供完整settings但过滤敏感信息
-- 使用SECURITY DEFINER确保权限安全，支持按display_order排序

-- 创建安全过滤敏感信息的函数
CREATE OR REPLACE FUNCTION filter_sensitive_sso_settings(settings_input JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  filtered_settings JSONB;
BEGIN
  -- 从settings中移除敏感信息
  filtered_settings := settings_input;
  
  -- 移除OAuth2/OIDC相关的敏感密钥
  filtered_settings := filtered_settings #- '{protocol_config,client_secret}';
  filtered_settings := filtered_settings #- '{protocol_config,client_id}';
  filtered_settings := filtered_settings #- '{security,allowed_redirect_hosts}';
  
  RETURN COALESCE(filtered_settings, '{}'::jsonb);
END;
$$;

-- 创建安全的公开SSO提供商函数
CREATE OR REPLACE FUNCTION get_public_sso_providers()
RETURNS TABLE(
  id UUID,
  name TEXT,
  protocol TEXT,
  enabled BOOLEAN,
  display_order INTEGER,
  button_text TEXT,
  settings JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.name,
    sp.protocol::TEXT,
    sp.enabled,
    sp.display_order,
    sp.button_text,
    filter_sensitive_sso_settings(sp.settings) as settings,
    sp.created_at
  FROM sso_providers sp
  WHERE sp.enabled = true
  ORDER BY sp.display_order ASC NULLS LAST, sp.name ASC;
END;
$$;

-- 创建兼容视图（明确设置SECURITY INVOKER以使用调用者权限）
CREATE VIEW public_sso_providers 
WITH (security_invoker=true)
AS
SELECT * FROM get_public_sso_providers();

-- 创建SSO配置获取函数，供服务端API使用
CREATE OR REPLACE FUNCTION get_sso_provider_config(provider_id_param UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  protocol TEXT,
  settings JSONB,
  enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF provider_id_param IS NULL THEN
    RAISE EXCEPTION 'Provider ID cannot be null';
  END IF;

  RETURN QUERY
  SELECT 
    sp.id,
    sp.name,
    sp.protocol::TEXT,
    sp.settings,  -- 服务端获取完整settings
    sp.enabled
  FROM sso_providers sp
  WHERE sp.id = provider_id_param 
    AND sp.enabled = true;
    
  IF NOT FOUND THEN
    RAISE NOTICE 'SSO provider not found or disabled: %', provider_id_param;
  END IF;
END;
$$;

-- 创建SSO提供商列表获取函数，支持协议过滤
CREATE OR REPLACE FUNCTION get_enabled_sso_providers(protocol_filter TEXT DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  name TEXT,
  protocol TEXT,
  button_text TEXT,
  display_order INTEGER,
  settings JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.name,
    sp.protocol::TEXT,
    sp.button_text,
    sp.display_order,
    filter_sensitive_sso_settings(sp.settings) as settings
  FROM sso_providers sp
  WHERE sp.enabled = true
    AND (protocol_filter IS NULL OR sp.protocol::TEXT = protocol_filter)
  ORDER BY sp.display_order ASC NULLS LAST, sp.name ASC;
END;
$$;

-- 设置权限
GRANT SELECT ON public_sso_providers TO anon;
GRANT SELECT ON public_sso_providers TO authenticated;

GRANT EXECUTE ON FUNCTION get_public_sso_providers() TO anon;
GRANT EXECUTE ON FUNCTION get_public_sso_providers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_sso_providers() TO service_role;

GRANT EXECUTE ON FUNCTION filter_sensitive_sso_settings(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION filter_sensitive_sso_settings(JSONB) TO service_role;

GRANT EXECUTE ON FUNCTION get_sso_provider_config(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sso_provider_config(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION get_enabled_sso_providers(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_enabled_sso_providers(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_enabled_sso_providers(TEXT) TO service_role; 