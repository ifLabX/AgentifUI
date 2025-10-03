-- 简化用户列表查询函数
-- 删除复杂的动态查询，使用更简单的方法

-- 删除原有函数
DROP FUNCTION IF EXISTS public.get_user_list(user_role, account_status, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER);

-- 创建简化的用户统计函数
CREATE OR REPLACE FUNCTION public.get_user_count(
  p_role user_role DEFAULT NULL,
  p_status account_status DEFAULT NULL,
  p_auth_source TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
BEGIN
  -- 检查是否为管理员
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION '权限不足：需要管理员权限';
  END IF;

  RETURN (
    SELECT COUNT(*)
    FROM profiles p
    LEFT JOIN auth.users au ON p.id = au.id
    WHERE 
      (p_role IS NULL OR p.role = p_role) AND
      (p_status IS NULL OR p.status = p_status) AND
      (p_auth_source IS NULL OR p.auth_source = p_auth_source) AND
      (p_search IS NULL OR p_search = '' OR 
       p.full_name ILIKE '%' || p_search || '%' OR 
       p.username ILIKE '%' || p_search || '%' OR 
       au.email ILIKE '%' || p_search || '%')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建简化的用户列表函数
CREATE OR REPLACE FUNCTION public.get_user_list_simple(
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
DECLARE
  offset_val INTEGER;
BEGIN
  -- 检查是否为管理员
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION '权限不足：需要管理员权限';
  END IF;

  -- 计算偏移量
  offset_val := (p_page - 1) * p_page_size;
  
  -- 返回结果（使用CASE语句进行排序）
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
  WHERE 
    (p_role IS NULL OR p.role = p_role) AND
    (p_status IS NULL OR p.status = p_status) AND
    (p_auth_source IS NULL OR p.auth_source = p_auth_source) AND
    (p_search IS NULL OR p_search = '' OR 
     p.full_name ILIKE '%' || p_search || '%' OR 
     p.username ILIKE '%' || p_search || '%' OR 
     au.email ILIKE '%' || p_search || '%')
  ORDER BY 
    CASE 
      WHEN p_sort_by = 'email' AND p_sort_order = 'asc' THEN au.email 
      WHEN p_sort_by = 'email' AND p_sort_order = 'desc' THEN au.email 
    END ASC,
    CASE 
      WHEN p_sort_by = 'email' AND p_sort_order = 'desc' THEN au.email 
    END DESC,
    CASE 
      WHEN p_sort_by = 'last_sign_in_at' AND p_sort_order = 'asc' THEN au.last_sign_in_at 
      WHEN p_sort_by = 'last_sign_in_at' AND p_sort_order = 'desc' THEN au.last_sign_in_at 
    END ASC,
    CASE 
      WHEN p_sort_by = 'last_sign_in_at' AND p_sort_order = 'desc' THEN au.last_sign_in_at 
    END DESC,
    CASE 
      WHEN p_sort_by = 'full_name' AND p_sort_order = 'asc' THEN p.full_name 
      WHEN p_sort_by = 'full_name' AND p_sort_order = 'desc' THEN p.full_name 
    END ASC,
    CASE 
      WHEN p_sort_by = 'full_name' AND p_sort_order = 'desc' THEN p.full_name 
    END DESC,
    CASE 
      WHEN (p_sort_by = 'created_at' OR p_sort_by IS NULL OR p_sort_by = '') AND (p_sort_order = 'asc') THEN p.created_at 
      WHEN (p_sort_by = 'created_at' OR p_sort_by IS NULL OR p_sort_by = '') AND (p_sort_order = 'desc' OR p_sort_order IS NULL) THEN p.created_at 
    END ASC,
    CASE 
      WHEN (p_sort_by = 'created_at' OR p_sort_by IS NULL OR p_sort_by = '') AND (p_sort_order = 'desc' OR p_sort_order IS NULL) THEN p.created_at 
    END DESC
  LIMIT p_page_size OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 