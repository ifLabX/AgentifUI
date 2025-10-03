-- 重新创建安全的管理员用户视图
-- 解决Supabase警告的同时保留完整功能

-- 1. 创建管理员专用的用户管理视图
CREATE OR REPLACE VIEW public.admin_user_management_view 
WITH (security_invoker=true) AS
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
  au.email,
  au.phone,
  au.email_confirmed_at,
  au.phone_confirmed_at,
  au.last_sign_in_at
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
-- 在视图级别限制只有管理员能看到数据
WHERE EXISTS (
  SELECT 1 FROM profiles admin_check 
  WHERE admin_check.id = auth.uid() 
  AND admin_check.role = 'admin'
);

-- 2. 撤销所有默认权限
REVOKE ALL ON public.admin_user_management_view FROM anon;
REVOKE ALL ON public.admin_user_management_view FROM authenticated;

-- 3. 只给认证用户基础权限
GRANT SELECT ON public.admin_user_management_view TO authenticated;

-- 4. 添加注释说明
COMMENT ON VIEW public.admin_user_management_view IS '管理员专用用户管理视图：包含完整用户信息，仅限管理员访问';

-- 5. 确保public.is_admin函数存在且正确（避免auth模式权限问题）
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 