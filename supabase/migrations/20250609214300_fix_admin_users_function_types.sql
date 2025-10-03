-- --- BEGIN COMMENT ---
-- 修复get_admin_users函数的返回类型，匹配auth.users表的实际列类型
-- auth.users表的字段类型为character varying(255)，而不是text
-- --- END COMMENT ---

-- 删除现有函数
DROP FUNCTION IF EXISTS get_admin_users(UUID[]);

-- 重新创建函数，使用正确的返回类型
CREATE OR REPLACE FUNCTION get_admin_users(user_ids UUID[] DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  email character varying(255),
  phone character varying(255),
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  phone_confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_sign_in_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- 检查调用者是否为管理员
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION '权限不足：只有管理员可以访问用户敏感信息';
  END IF;

  -- 如果指定了用户ID列表，则只返回这些用户
  IF user_ids IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      u.id,
      u.email,
      u.phone,
      u.email_confirmed_at,
      u.phone_confirmed_at,
      u.created_at,
      u.updated_at,
      u.last_sign_in_at
    FROM auth.users u
    WHERE u.id = ANY(user_ids);
  ELSE
    -- 否则返回所有用户
    RETURN QUERY
    SELECT 
      u.id,
      u.email,
      u.phone,
      u.email_confirmed_at,
      u.phone_confirmed_at,
      u.created_at,
      u.updated_at,
      u.last_sign_in_at
    FROM auth.users u;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 添加函数注释
COMMENT ON FUNCTION get_admin_users(UUID[]) IS '
修复版本：管理员专用函数，获取用户的完整信息，包括邮箱和手机号等敏感数据。
修复了返回类型与auth.users表列类型的不匹配问题。
只有系统管理员可以调用此函数。
参数：
- user_ids: 可选的用户ID数组，如果提供则只返回指定用户的信息
'; 