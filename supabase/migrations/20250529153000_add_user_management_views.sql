-- 用户管理相关的视图和权限
-- 为管理员提供用户管理功能

-- 1. 创建管理员权限检查函数
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

-- 2. 创建用户列表视图（包含auth.users的部分信息）
CREATE OR REPLACE VIEW public.user_management_view AS
SELECT 
  p.id,
  p.full_name,
  p.username,
  p.avatar_url,
  p.role,
  p.status,
  p.created_at as profile_created_at,
  p.updated_at as profile_updated_at,
  p.last_login,
  p.auth_source,
  p.sso_provider_id,
  au.email,
  au.phone,
  au.email_confirmed_at,
  au.phone_confirmed_at,
  au.created_at,
  au.updated_at,
  au.last_sign_in_at
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id;

-- 3. 为管理员创建查看用户列表的策略
CREATE POLICY "管理员可以查看所有用户" ON profiles
  FOR SELECT USING (auth.is_admin());

-- 4. 为管理员创建更新用户的策略  
CREATE POLICY "管理员可以更新用户" ON profiles
  FOR UPDATE USING (auth.is_admin());

-- 5. 为管理员创建删除用户的策略
CREATE POLICY "管理员可以删除用户" ON profiles
  FOR DELETE USING (auth.is_admin());

-- 6. 创建用户统计函数
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- 检查是否为管理员
  IF NOT auth.is_admin() THEN
    RAISE EXCEPTION '权限不足：需要管理员权限';
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 创建用户详情获取函数
CREATE OR REPLACE FUNCTION public.get_user_detail(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  phone TEXT,
  email_confirmed_at TIMESTAMPTZ,
  phone_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  role user_role,
  status account_status,
  auth_source TEXT,
  sso_provider_id TEXT,
  profile_created_at TIMESTAMPTZ,
  profile_updated_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ
) AS $$
BEGIN
  -- 检查是否为管理员
  IF NOT auth.is_admin() THEN
    RAISE EXCEPTION '权限不足：需要管理员权限';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    au.email,
    au.phone,
    au.email_confirmed_at,
    au.phone_confirmed_at,
    au.created_at,
    au.updated_at,
    au.last_sign_in_at,
    p.full_name,
    p.username,
    p.avatar_url,
    p.role,
    p.status,
    p.auth_source,
    p.sso_provider_id,
    p.created_at as profile_created_at,
    p.updated_at as profile_updated_at,
    p.last_login
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE p.id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 创建用户列表获取函数（支持筛选和分页）
CREATE OR REPLACE FUNCTION public.get_user_list(
  p_role user_role DEFAULT NULL,
  p_status account_status DEFAULT NULL,
  p_auth_source TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc',
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  users JSON,
  total_count BIGINT,
  page INTEGER,
  page_size INTEGER,
  total_pages INTEGER
) AS $$
DECLARE
  offset_val INTEGER;
  where_clause TEXT;
  order_clause TEXT;
  total BIGINT;
  pages INTEGER;
BEGIN
  -- 检查是否为管理员
  IF NOT auth.is_admin() THEN
    RAISE EXCEPTION '权限不足：需要管理员权限';
  END IF;

  -- 计算偏移量
  offset_val := (p_page - 1) * p_page_size;
  
  -- 构建WHERE子句
  where_clause := 'WHERE 1=1';
  
  IF p_role IS NOT NULL THEN
    where_clause := where_clause || ' AND p.role = ''' || p_role || '''';
  END IF;
  
  IF p_status IS NOT NULL THEN
    where_clause := where_clause || ' AND p.status = ''' || p_status || '''';
  END IF;
  
  IF p_auth_source IS NOT NULL THEN
    where_clause := where_clause || ' AND p.auth_source = ''' || p_auth_source || '''';
  END IF;
  
  IF p_search IS NOT NULL AND p_search != '' THEN
    where_clause := where_clause || ' AND (p.full_name ILIKE ''%' || p_search || '%'' OR p.username ILIKE ''%' || p_search || '%'' OR au.email ILIKE ''%' || p_search || '%'')';
  END IF;
  
  -- 构建ORDER BY子句
  IF p_sort_by = 'email' THEN
    order_clause := 'ORDER BY au.email ' || p_sort_order;
  ELSIF p_sort_by = 'last_sign_in_at' THEN
    order_clause := 'ORDER BY au.last_sign_in_at ' || p_sort_order;
  ELSE
    order_clause := 'ORDER BY p.' || p_sort_by || ' ' || p_sort_order;
  END IF;
  
  -- 获取总数
  EXECUTE 'SELECT COUNT(*) FROM profiles p LEFT JOIN auth.users au ON p.id = au.id ' || where_clause
  INTO total;
  
  pages := CEIL(total::FLOAT / p_page_size);
  
  -- 返回结果
  RETURN QUERY
  EXECUTE '
    SELECT 
      json_agg(
        json_build_object(
          ''id'', p.id,
          ''email'', au.email,
          ''phone'', au.phone,
          ''email_confirmed_at'', au.email_confirmed_at,
          ''phone_confirmed_at'', au.phone_confirmed_at,
          ''created_at'', au.created_at,
          ''updated_at'', au.updated_at,
          ''last_sign_in_at'', au.last_sign_in_at,
          ''full_name'', p.full_name,
          ''username'', p.username,
          ''avatar_url'', p.avatar_url,
          ''role'', p.role,
          ''status'', p.status,
          ''auth_source'', p.auth_source,
          ''sso_provider_id'', p.sso_provider_id,
          ''profile_created_at'', p.created_at,
          ''profile_updated_at'', p.updated_at,
          ''last_login'', p.last_login
        )
      ) as users,
      ' || total || '::BIGINT as total_count,
      ' || p_page || '::INTEGER as page,
      ' || p_page_size || '::INTEGER as page_size,
      ' || pages || '::INTEGER as total_pages
    FROM profiles p
    LEFT JOIN auth.users au ON p.id = au.id ' ||
    where_clause || ' ' ||
    order_clause || ' 
    LIMIT ' || p_page_size || ' OFFSET ' || offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 