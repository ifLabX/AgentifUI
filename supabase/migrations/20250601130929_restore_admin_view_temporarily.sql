-- 临时恢复管理员用户视图
-- 确保管理界面能正常工作，同时保持安全性

-- 1. 确保管理员检查函数存在（使用public模式避免权限问题）
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

-- 2. 重新创建安全的管理员用户视图
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

-- 3. 设置视图权限
REVOKE ALL ON public.admin_user_management_view FROM anon;
REVOKE ALL ON public.admin_user_management_view FROM authenticated;
GRANT SELECT ON public.admin_user_management_view TO authenticated;

-- 4. 添加注释
COMMENT ON VIEW public.admin_user_management_view IS '临时恢复的管理员用户视图：确保管理界面正常工作，包含权限检查'; 