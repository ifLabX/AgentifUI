-- 添加角色更新保护机制
-- 确保管理员不能降级其他管理员或自己

-- 创建角色更新保护函数
CREATE OR REPLACE FUNCTION public.validate_role_update()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role user_role;
  old_role user_role;
  new_role user_role;
BEGIN
  -- 获取当前操作用户的角色
  SELECT role INTO current_user_role 
  FROM profiles 
  WHERE id = auth.uid();
  
  -- 如果无法获取当前用户角色，拒绝操作
  IF current_user_role IS NULL THEN
    RAISE EXCEPTION '无法验证用户权限';
  END IF;
  
  -- 只有管理员可以修改角色
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION '权限不足：只有管理员可以修改用户角色';
  END IF;
  
  -- 获取角色变更信息
  old_role := OLD.role;
  new_role := NEW.role;
  
  -- 如果角色没有变化，允许更新
  IF old_role = new_role THEN
    RETURN NEW;
  END IF;
  
  -- 防止管理员修改自己的角色
  IF NEW.id = auth.uid() THEN
    RAISE EXCEPTION '不能修改自己的角色';
  END IF;
  
  -- 防止降级其他管理员
  IF old_role = 'admin' AND new_role != 'admin' THEN
    RAISE EXCEPTION '不能降级其他管理员的权限';
  END IF;
  
  -- 允许管理员提拔其他用户
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器，在角色更新前检查权限
DROP TRIGGER IF EXISTS validate_role_update_trigger ON profiles;
CREATE TRIGGER validate_role_update_trigger
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_update();

-- 创建用户删除保护函数
CREATE OR REPLACE FUNCTION public.validate_user_deletion()
RETURNS TRIGGER AS $$
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
  target_user_role := OLD.role;
  
  -- 防止删除自己
  IF OLD.id = auth.uid() THEN
    RAISE EXCEPTION '不能删除自己的账号';
  END IF;
  
  -- 防止删除其他管理员
  IF target_user_role = 'admin' THEN
    RAISE EXCEPTION '不能删除其他管理员账号';
  END IF;
  
  -- 允许删除非管理员用户
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器，在用户删除前检查权限
DROP TRIGGER IF EXISTS validate_user_deletion_trigger ON profiles;
CREATE TRIGGER validate_user_deletion_trigger
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_deletion();

-- 创建批量操作保护函数
CREATE OR REPLACE FUNCTION public.safe_batch_update_role(
  target_user_ids UUID[],
  target_role user_role
)
RETURNS INTEGER AS $$
DECLARE
  current_user_role user_role;
  current_user_id UUID;
  target_user_id UUID;
  target_user_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- 获取当前用户信息
  current_user_id := auth.uid();
  
  SELECT role INTO current_user_role 
  FROM profiles 
  WHERE id = current_user_id;
  
  -- 检查权限
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION '权限不足：只有管理员可以批量修改用户角色';
  END IF;
  
  -- 遍历每个目标用户
  FOREACH target_user_id IN ARRAY target_user_ids
  LOOP
    -- 获取目标用户信息
    SELECT * INTO target_user_record 
    FROM profiles 
    WHERE id = target_user_id;
    
    -- 跳过不存在的用户
    IF target_user_record IS NULL THEN
      CONTINUE;
    END IF;
    
    -- 防止修改自己
    IF target_user_id = current_user_id THEN
      RAISE EXCEPTION '不能在批量操作中包含自己';
    END IF;
    
    -- 防止降级其他管理员
    IF target_user_record.role = 'admin' AND target_role != 'admin' THEN
      RAISE EXCEPTION '不能在批量操作中降级其他管理员';
    END IF;
    
    -- 执行更新
    UPDATE profiles 
    SET role = target_role, updated_at = NOW()
    WHERE id = target_user_id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释说明
COMMENT ON FUNCTION public.validate_role_update() IS '角色更新保护：防止管理员自我降级和降级其他管理员';
COMMENT ON FUNCTION public.validate_user_deletion() IS '用户删除保护：防止删除管理员账号';
COMMENT ON FUNCTION public.safe_batch_update_role(UUID[], user_role) IS '安全的批量角色更新：包含完整的权限检查'; 