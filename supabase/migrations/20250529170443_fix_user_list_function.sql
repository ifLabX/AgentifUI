-- 修复用户列表查询函数的GROUP BY问题
-- 重新实现get_user_list函数，避免不必要的聚合

-- 删除原有函数
DROP FUNCTION IF EXISTS public.get_user_list(user_role, account_status, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER);

-- 重新创建修复后的用户列表获取函数
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
  last_login TIMESTAMPTZ,
  total_count BIGINT
) AS $$
DECLARE
  offset_val INTEGER;
  where_clause TEXT;
  order_clause TEXT;
  total BIGINT;
  query_text TEXT;
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
    where_clause := where_clause || ' AND p.role = $1';
  END IF;
  
  IF p_status IS NOT NULL THEN
    where_clause := where_clause || ' AND p.status = $2';
  END IF;
  
  IF p_auth_source IS NOT NULL THEN
    where_clause := where_clause || ' AND p.auth_source = $3';
  END IF;
  
  IF p_search IS NOT NULL AND p_search != '' THEN
    where_clause := where_clause || ' AND (p.full_name ILIKE $4 OR p.username ILIKE $4 OR au.email ILIKE $4)';
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
  query_text := 'SELECT COUNT(*) FROM profiles p LEFT JOIN auth.users au ON p.id = au.id ' || where_clause;
  
  -- 执行计数查询
  IF p_role IS NOT NULL AND p_status IS NOT NULL AND p_auth_source IS NOT NULL AND p_search IS NOT NULL AND p_search != '' THEN
    EXECUTE query_text USING p_role, p_status, p_auth_source, '%' || p_search || '%' INTO total;
  ELSIF p_role IS NOT NULL AND p_status IS NOT NULL AND p_auth_source IS NOT NULL THEN
    EXECUTE query_text USING p_role, p_status, p_auth_source INTO total;
  ELSIF p_role IS NOT NULL AND p_status IS NOT NULL AND p_search IS NOT NULL AND p_search != '' THEN
    EXECUTE query_text USING p_role, p_status, '%' || p_search || '%' INTO total;
  ELSIF p_role IS NOT NULL AND p_auth_source IS NOT NULL AND p_search IS NOT NULL AND p_search != '' THEN
    EXECUTE query_text USING p_role, p_auth_source, '%' || p_search || '%' INTO total;
  ELSIF p_status IS NOT NULL AND p_auth_source IS NOT NULL AND p_search IS NOT NULL AND p_search != '' THEN
    EXECUTE query_text USING p_status, p_auth_source, '%' || p_search || '%' INTO total;
  ELSIF p_role IS NOT NULL AND p_status IS NOT NULL THEN
    EXECUTE query_text USING p_role, p_status INTO total;
  ELSIF p_role IS NOT NULL AND p_auth_source IS NOT NULL THEN
    EXECUTE query_text USING p_role, p_auth_source INTO total;
  ELSIF p_role IS NOT NULL AND p_search IS NOT NULL AND p_search != '' THEN
    EXECUTE query_text USING p_role, '%' || p_search || '%' INTO total;
  ELSIF p_status IS NOT NULL AND p_auth_source IS NOT NULL THEN
    EXECUTE query_text USING p_status, p_auth_source INTO total;
  ELSIF p_status IS NOT NULL AND p_search IS NOT NULL AND p_search != '' THEN
    EXECUTE query_text USING p_status, '%' || p_search || '%' INTO total;
  ELSIF p_auth_source IS NOT NULL AND p_search IS NOT NULL AND p_search != '' THEN
    EXECUTE query_text USING p_auth_source, '%' || p_search || '%' INTO total;
  ELSIF p_role IS NOT NULL THEN
    EXECUTE query_text USING p_role INTO total;
  ELSIF p_status IS NOT NULL THEN
    EXECUTE query_text USING p_status INTO total;
  ELSIF p_auth_source IS NOT NULL THEN
    EXECUTE query_text USING p_auth_source INTO total;
  ELSIF p_search IS NOT NULL AND p_search != '' THEN
    EXECUTE query_text USING '%' || p_search || '%' INTO total;
  ELSE
    EXECUTE query_text INTO total;
  END IF;
  
  -- 返回分页结果
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
    p.last_login,
    total as total_count
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
    CASE WHEN p_sort_by = 'email' AND p_sort_order = 'asc' THEN au.email END ASC,
    CASE WHEN p_sort_by = 'email' AND p_sort_order = 'desc' THEN au.email END DESC,
    CASE WHEN p_sort_by = 'last_sign_in_at' AND p_sort_order = 'asc' THEN au.last_sign_in_at END ASC,
    CASE WHEN p_sort_by = 'last_sign_in_at' AND p_sort_order = 'desc' THEN au.last_sign_in_at END DESC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN p.created_at END ASC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN p.created_at END DESC,
    CASE WHEN p_sort_by = 'full_name' AND p_sort_order = 'asc' THEN p.full_name END ASC,
    CASE WHEN p_sort_by = 'full_name' AND p_sort_order = 'desc' THEN p.full_name END DESC
  LIMIT p_page_size OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 