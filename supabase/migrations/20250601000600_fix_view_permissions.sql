-- 修复管理员用户视图权限问题
-- 改回SECURITY DEFINER模式以访问auth.users表

-- 1. 重新创建视图，使用SECURITY DEFINER模式
CREATE OR REPLACE VIEW public.admin_user_management_view AS
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

-- 2. 设置视图权限
REVOKE ALL ON public.admin_user_management_view FROM anon;
REVOKE ALL ON public.admin_user_management_view FROM authenticated;
GRANT SELECT ON public.admin_user_management_view TO authenticated;

-- 3. 添加注释
COMMENT ON VIEW public.admin_user_management_view IS '管理员专用用户管理视图：包含完整用户信息，仅限管理员访问（使用SECURITY DEFINER）'; 