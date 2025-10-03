-- 修复用户管理视图的安全问题
-- 1. 移除暴露auth.users数据的视图
-- 2. 创建安全的用户管理函数替代视图

-- 1. 删除不安全的用户管理视图
DROP VIEW IF EXISTS public.user_management_view;

-- 2. 创建安全的用户管理函数，只返回profiles数据
CREATE OR REPLACE FUNCTION public.get_users_for_admin(
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
  id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  role user_role,
  status account_status,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  auth_source TEXT,
  sso_provider_id TEXT,
  -- 只返回有限的auth数据，不暴露敏感信息
  has_email BOOLEAN,
  email_confirmed BOOLEAN,
  last_sign_in_at TIMESTAMPTZ
) AS $$
DECLARE
  offset_val INTEGER;
  where_conditions TEXT[];
  where_clause TEXT;
  order_clause TEXT;
  query_text TEXT;
BEGIN
  -- 检查是否为管理员
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION '权限不足：需要管理员权限';
  END IF;

  -- 计算偏移量
  offset_val := (p_page - 1) * p_page_size;
  
  -- 构建WHERE条件数组
  where_conditions := ARRAY['1=1'];
  
  IF p_role IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 'p.role = $1');
  END IF;
  
  IF p_status IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 'p.status = $2');
  END IF;
  
  IF p_auth_source IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 'p.auth_source = $3');
  END IF;
  
  IF p_search IS NOT NULL AND p_search != '' THEN
    where_conditions := array_append(where_conditions, 
      '(p.full_name ILIKE $4 OR p.username ILIKE $4)');
  END IF;
  
  -- 组合WHERE子句
  where_clause := array_to_string(where_conditions, ' AND ');
  
  -- 构建ORDER BY子句
  IF p_sort_by = 'full_name' THEN
    order_clause := 'ORDER BY p.full_name ' || p_sort_order;
  ELSIF p_sort_by = 'username' THEN
    order_clause := 'ORDER BY p.username ' || p_sort_order;
  ELSIF p_sort_by = 'role' THEN
    order_clause := 'ORDER BY p.role ' || p_sort_order;
  ELSIF p_sort_by = 'status' THEN
    order_clause := 'ORDER BY p.status ' || p_sort_order;
  ELSIF p_sort_by = 'last_sign_in_at' THEN
    order_clause := 'ORDER BY au.last_sign_in_at ' || p_sort_order;
  ELSE
    order_clause := 'ORDER BY p.created_at ' || p_sort_order;
  END IF;

  -- 返回用户数据，包含有限的auth信息
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.username,
    p.avatar_url,
    p.role,
    p.status,
    p.created_at,
    p.updated_at,
    p.last_login,
    p.auth_source,
    p.sso_provider_id,
    -- 只返回是否有邮箱，不返回具体邮箱地址
    (au.email IS NOT NULL) as has_email,
    (au.email_confirmed_at IS NOT NULL) as email_confirmed,
    au.last_sign_in_at
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE 
    CASE 
      WHEN p_role IS NOT NULL AND p_status IS NOT NULL AND p_auth_source IS NOT NULL AND p_search IS NOT NULL 
        THEN p.role = p_role AND p.status = p_status AND p.auth_source = p_auth_source 
             AND (p.full_name ILIKE '%' || p_search || '%' OR p.username ILIKE '%' || p_search || '%')
      WHEN p_role IS NOT NULL AND p_status IS NOT NULL AND p_auth_source IS NOT NULL 
        THEN p.role = p_role AND p.status = p_status AND p.auth_source = p_auth_source
      WHEN p_role IS NOT NULL AND p_status IS NOT NULL AND p_search IS NOT NULL 
        THEN p.role = p_role AND p.status = p_status 
             AND (p.full_name ILIKE '%' || p_search || '%' OR p.username ILIKE '%' || p_search || '%')
      WHEN p_role IS NOT NULL AND p_auth_source IS NOT NULL AND p_search IS NOT NULL 
        THEN p.role = p_role AND p.auth_source = p_auth_source 
             AND (p.full_name ILIKE '%' || p_search || '%' OR p.username ILIKE '%' || p_search || '%')
      WHEN p_status IS NOT NULL AND p_auth_source IS NOT NULL AND p_search IS NOT NULL 
        THEN p.status = p_status AND p.auth_source = p_auth_source 
             AND (p.full_name ILIKE '%' || p_search || '%' OR p.username ILIKE '%' || p_search || '%')
      WHEN p_role IS NOT NULL AND p_status IS NOT NULL 
        THEN p.role = p_role AND p.status = p_status
      WHEN p_role IS NOT NULL AND p_auth_source IS NOT NULL 
        THEN p.role = p_role AND p.auth_source = p_auth_source
      WHEN p_role IS NOT NULL AND p_search IS NOT NULL 
        THEN p.role = p_role AND (p.full_name ILIKE '%' || p_search || '%' OR p.username ILIKE '%' || p_search || '%')
      WHEN p_status IS NOT NULL AND p_auth_source IS NOT NULL 
        THEN p.status = p_status AND p.auth_source = p_auth_source
      WHEN p_status IS NOT NULL AND p_search IS NOT NULL 
        THEN p.status = p_status AND (p.full_name ILIKE '%' || p_search || '%' OR p.username ILIKE '%' || p_search || '%')
      WHEN p_auth_source IS NOT NULL AND p_search IS NOT NULL 
        THEN p.auth_source = p_auth_source AND (p.full_name ILIKE '%' || p_search || '%' OR p.username ILIKE '%' || p_search || '%')
      WHEN p_role IS NOT NULL 
        THEN p.role = p_role
      WHEN p_status IS NOT NULL 
        THEN p.status = p_status
      WHEN p_auth_source IS NOT NULL 
        THEN p.auth_source = p_auth_source
      WHEN p_search IS NOT NULL 
        THEN (p.full_name ILIKE '%' || p_search || '%' OR p.username ILIKE '%' || p_search || '%')
      ELSE TRUE
    END
  ORDER BY 
    CASE 
      WHEN p_sort_by = 'full_name' AND p_sort_order = 'asc' THEN p.full_name
    END ASC,
    CASE 
      WHEN p_sort_by = 'full_name' AND p_sort_order = 'desc' THEN p.full_name
    END DESC,
    CASE 
      WHEN p_sort_by = 'username' AND p_sort_order = 'asc' THEN p.username
    END ASC,
    CASE 
      WHEN p_sort_by = 'username' AND p_sort_order = 'desc' THEN p.username
    END DESC,
    CASE 
      WHEN p_sort_by = 'last_sign_in_at' AND p_sort_order = 'asc' THEN au.last_sign_in_at
    END ASC,
    CASE 
      WHEN p_sort_by = 'last_sign_in_at' AND p_sort_order = 'desc' THEN au.last_sign_in_at
    END DESC,
    CASE 
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN p.created_at
    END ASC,
    CASE 
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN p.created_at
    END DESC
  LIMIT p_page_size
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 创建获取用户总数的安全函数
CREATE OR REPLACE FUNCTION public.get_users_count_for_admin(
  p_role user_role DEFAULT NULL,
  p_status account_status DEFAULT NULL,
  p_auth_source TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  total_count BIGINT;
BEGIN
  -- 检查是否为管理员
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION '权限不足：需要管理员权限';
  END IF;

  SELECT COUNT(*)
  INTO total_count
  FROM profiles p
  WHERE 
    CASE 
      WHEN p_role IS NOT NULL AND p_status IS NOT NULL AND p_auth_source IS NOT NULL AND p_search IS NOT NULL 
        THEN p.role = p_role AND p.status = p_status AND p.auth_source = p_auth_source 
             AND (p.full_name ILIKE '%' || p_search || '%' OR p.username ILIKE '%' || p_search || '%')
      WHEN p_role IS NOT NULL AND p_status IS NOT NULL AND p_auth_source IS NOT NULL 
        THEN p.role = p_role AND p.status = p_status AND p.auth_source = p_auth_source
      WHEN p_role IS NOT NULL AND p_status IS NOT NULL AND p_search IS NOT NULL 
        THEN p.role = p_role AND p.status = p_status 
             AND (p.full_name ILIKE '%' || p_search || '%' OR p.username ILIKE '%' || p_search || '%')
      WHEN p_role IS NOT NULL AND p_auth_source IS NOT NULL AND p_search IS NOT NULL 
        THEN p.role = p_role AND p.auth_source = p_auth_source 
             AND (p.full_name ILIKE '%' || p_search || '%' OR p.username ILIKE '%' || p_search || '%')
      WHEN p_status IS NOT NULL AND p_auth_source IS NOT NULL AND p_search IS NOT NULL 
        THEN p.status = p_status AND p.auth_source = p_auth_source 
             AND (p.full_name ILIKE '%' || p_search || '%' OR p.username ILIKE '%' || p_search || '%')
      WHEN p_role IS NOT NULL AND p_status IS NOT NULL 
        THEN p.role = p_role AND p.status = p_status
      WHEN p_role IS NOT NULL AND p_auth_source IS NOT NULL 
        THEN p.role = p_role AND p.auth_source = p_auth_source
      WHEN p_role IS NOT NULL AND p_search IS NOT NULL 
        THEN p.role = p_role AND (p.full_name ILIKE '%' || p_search || '%' OR p.username ILIKE '%' || p_search || '%')
      WHEN p_status IS NOT NULL AND p_auth_source IS NOT NULL 
        THEN p.status = p_status AND p.auth_source = p_auth_source
      WHEN p_status IS NOT NULL AND p_search IS NOT NULL 
        THEN p.status = p_status AND (p.full_name ILIKE '%' || p_search || '%' OR p.username ILIKE '%' || p_search || '%')
      WHEN p_auth_source IS NOT NULL AND p_search IS NOT NULL 
        THEN p.auth_source = p_auth_source AND (p.full_name ILIKE '%' || p_search || '%' OR p.username ILIKE '%' || p_search || '%')
      WHEN p_role IS NOT NULL 
        THEN p.role = p_role
      WHEN p_status IS NOT NULL 
        THEN p.status = p_status
      WHEN p_auth_source IS NOT NULL 
        THEN p.auth_source = p_auth_source
      WHEN p_search IS NOT NULL 
        THEN (p.full_name ILIKE '%' || p_search || '%' OR p.username ILIKE '%' || p_search || '%')
      ELSE TRUE
    END;

  RETURN total_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建获取特定用户详情的安全函数（只返回必要信息）
CREATE OR REPLACE FUNCTION public.get_user_detail_for_admin(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  role user_role,
  status account_status,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  auth_source TEXT,
  sso_provider_id TEXT,
  has_email BOOLEAN,
  email_confirmed BOOLEAN,
  has_phone BOOLEAN,
  phone_confirmed BOOLEAN,
  last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
  -- 检查是否为管理员
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION '权限不足：需要管理员权限';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.username,
    p.avatar_url,
    p.role,
    p.status,
    p.created_at,
    p.updated_at,
    p.last_login,
    p.auth_source,
    p.sso_provider_id,
    (au.email IS NOT NULL) as has_email,
    (au.email_confirmed_at IS NOT NULL) as email_confirmed,
    (au.phone IS NOT NULL) as has_phone,
    (au.phone_confirmed_at IS NOT NULL) as phone_confirmed,
    au.last_sign_in_at
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE p.id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 撤销匿名用户对这些函数的访问权限
REVOKE ALL ON FUNCTION public.get_users_for_admin FROM anon;
REVOKE ALL ON FUNCTION public.get_users_count_for_admin FROM anon;
REVOKE ALL ON FUNCTION public.get_user_detail_for_admin FROM anon;

-- 6. 只允许认证用户访问这些函数（函数内部会检查管理员权限）
GRANT EXECUTE ON FUNCTION public.get_users_for_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_count_for_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_detail_for_admin TO authenticated;

-- 7. 添加注释说明
COMMENT ON FUNCTION public.get_users_for_admin IS '管理员专用：获取用户列表（不暴露敏感的auth.users数据）';
COMMENT ON FUNCTION public.get_users_count_for_admin IS '管理员专用：获取用户总数';
COMMENT ON FUNCTION public.get_user_detail_for_admin IS '管理员专用：获取用户详情（不暴露敏感的auth.users数据）'; 