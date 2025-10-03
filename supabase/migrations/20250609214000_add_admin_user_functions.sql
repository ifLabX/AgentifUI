-- --- BEGIN COMMENT ---
-- 添加管理员用户查询函数，用于在管理后台显示用户的完整信息
-- 包括邮箱、手机号等敏感信息（仅限管理员访问）
-- --- END COMMENT ---

-- 创建管理员专用的用户查询函数
CREATE OR REPLACE FUNCTION get_admin_users(user_ids UUID[] DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  email TEXT,
  phone TEXT,
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

-- 创建获取用户统计信息的函数
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- 检查调用者是否为管理员
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION '权限不足：只有管理员可以访问用户统计信息';
  END IF;

  SELECT json_build_object(
    'totalUsers', (SELECT COUNT(*) FROM profiles),
    'activeUsers', (SELECT COUNT(*) FROM profiles WHERE status = 'active'),
    'suspendedUsers', (SELECT COUNT(*) FROM profiles WHERE status = 'suspended'),
    'pendingUsers', (SELECT COUNT(*) FROM profiles WHERE status = 'pending'),
    'adminUsers', (SELECT COUNT(*) FROM profiles WHERE role = 'admin'),
    'managerUsers', (SELECT COUNT(*) FROM profiles WHERE role = 'manager'),
    'regularUsers', (SELECT COUNT(*) FROM profiles WHERE role = 'user'),
    'newUsersToday', (
      SELECT COUNT(*) FROM profiles 
      WHERE created_at >= CURRENT_DATE
    ),
    'newUsersThisWeek', (
      SELECT COUNT(*) FROM profiles 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    ),
    'newUsersThisMonth', (
      SELECT COUNT(*) FROM profiles 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 添加函数注释
COMMENT ON FUNCTION get_admin_users(UUID[]) IS '
管理员专用函数：获取用户的完整信息，包括邮箱和手机号等敏感数据。
只有系统管理员可以调用此函数。
参数：
- user_ids: 可选的用户ID数组，如果提供则只返回指定用户的信息
';

COMMENT ON FUNCTION get_user_stats() IS '
管理员专用函数：获取用户统计信息，包括总数、状态分布、角色分布等。
只有系统管理员可以调用此函数。
'; 