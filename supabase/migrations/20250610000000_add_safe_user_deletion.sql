-- --- BEGIN COMMENT ---
-- 添加安全的用户删除RPC函数
-- 使用SECURITY DEFINER权限删除auth.users记录，触发级联删除
-- --- END COMMENT ---

-- 创建安全的用户删除函数
CREATE OR REPLACE FUNCTION public.safe_delete_user(target_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_role user_role;
  target_user_role user_role;
BEGIN
  -- 获取当前操作用户的角色
  SELECT role INTO current_user_role 
  FROM profiles 
  WHERE id = auth.uid();
  
  -- 如果无法获取当前用户角色，拒绝操作
  IF current_user_role IS NULL THEN
    RAISE EXCEPTION '无法验证用户权限';
  END IF;
  
  -- 只有管理员可以删除用户
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION '权限不足：只有管理员可以删除用户';
  END IF;
  
  -- 获取被删除用户的角色
  SELECT role INTO target_user_role 
  FROM profiles 
  WHERE id = target_user_id;
  
  -- 如果用户不存在
  IF target_user_role IS NULL THEN
    RAISE EXCEPTION '用户不存在';
  END IF;
  
  -- 防止删除自己
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION '不能删除自己的账号';
  END IF;
  
  -- 防止删除其他管理员
  IF target_user_role = 'admin' THEN
    RAISE EXCEPTION '不能删除其他管理员账号';
  END IF;
  
  -- 删除auth.users记录（会触发级联删除profiles和所有相关数据）
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- 检查是否删除成功
  IF NOT FOUND THEN
    RAISE EXCEPTION '删除用户失败：用户可能不存在于认证系统中';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 添加函数注释
COMMENT ON FUNCTION public.safe_delete_user(UUID) IS '安全删除用户：删除auth.users记录并触发级联删除所有相关数据'; 