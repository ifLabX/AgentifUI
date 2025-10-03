-- 快速修复用户管理函数
-- 解决函数结构不匹配和权限问题

-- 1. 删除有问题的函数
DROP FUNCTION IF EXISTS public.get_users_for_admin(user_role, account_status, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER);

-- 2. 创建简化的用户列表函数，返回结构与前端期望一致
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
  has_email BOOLEAN,
  email_confirmed BOOLEAN,
  last_sign_in_at TIMESTAMPTZ
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

  -- 返回用户数据
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
    au.last_sign_in_at
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE 
    (p_role IS NULL OR p.role = p_role) AND
    (p_status IS NULL OR p.status = p_status) AND
    (p_auth_source IS NULL OR p.auth_source = p_auth_source) AND
    (p_search IS NULL OR p_search = '' OR 
     p.full_name ILIKE '%' || p_search || '%' OR 
     p.username ILIKE '%' || p_search || '%')
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
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN p.created_at
    END DESC,
    CASE 
      WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN p.created_at
    END ASC,
    p.created_at DESC -- 默认排序
  LIMIT p_page_size
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 重新创建用户总数函数
DROP FUNCTION IF EXISTS public.get_users_count_for_admin(user_role, account_status, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_users_count_for_admin(
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
    WHERE 
      (p_role IS NULL OR p.role = p_role) AND
      (p_status IS NULL OR p.status = p_status) AND
      (p_auth_source IS NULL OR p.auth_source = p_auth_source) AND
      (p_search IS NULL OR p_search = '' OR 
       p.full_name ILIKE '%' || p_search || '%' OR 
       p.username ILIKE '%' || p_search || '%')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 重新创建用户详情函数
DROP FUNCTION IF EXISTS public.get_user_detail_for_admin(UUID);

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

-- 5. 确保权限设置正确
REVOKE ALL ON FUNCTION public.get_users_for_admin FROM anon;
REVOKE ALL ON FUNCTION public.get_users_count_for_admin FROM anon;
REVOKE ALL ON FUNCTION public.get_user_detail_for_admin FROM anon;

GRANT EXECUTE ON FUNCTION public.get_users_for_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_count_for_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_detail_for_admin TO authenticated; 