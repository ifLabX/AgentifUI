-- 迁移文件: 20250622032438_fix_initialize_admin_trigger_issue.sql
-- 描述: 修复 initialize_admin 函数无法使用的问题，允许在系统中没有管理员时创建第一个管理员
-- 影响范围: 修改 validate_role_update 触发器函数，不影响现有数据和函数接口
-- 风险级别: 低风险 - 只修改触发器逻辑，保持现有安全机制

-- --- BEGIN COMMENT ---
-- 问题背景：
-- initialize_admin 函数被 validate_role_update 触发器阻止，导致系统初始化时无法创建第一个管理员
-- 
-- 解决方案：
-- 修改 validate_role_update 触发器函数，允许在系统中没有管理员时创建第一个管理员
-- 保持所有现有的安全机制，只在系统初始化阶段放宽限制
-- --- END COMMENT ---

CREATE OR REPLACE FUNCTION public.validate_role_update()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role user_role;
  old_role user_role;
  new_role user_role;
  admin_count INTEGER;
BEGIN
  -- --- BEGIN COMMENT ---
  -- 新增：检查系统中是否已有管理员
  -- 如果没有管理员，允许创建第一个管理员（用于系统初始化）
  -- --- END COMMENT ---
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin';
  
  -- 如果系统中没有管理员，允许创建第一个管理员
  IF admin_count = 0 THEN
    RETURN NEW;
  END IF;
  
  -- --- BEGIN COMMENT ---
  -- 以下为原有的安全检查逻辑，保持不变
  -- --- END COMMENT ---
  
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

-- --- BEGIN COMMENT ---
-- 更新函数注释，说明修复内容
-- --- END COMMENT ---
COMMENT ON FUNCTION public.validate_role_update() IS '角色更新保护：防止管理员自我降级和降级其他管理员。修复版本：允许在系统中没有管理员时创建第一个管理员，解决 initialize_admin 函数无法使用的问题。';

-- --- BEGIN COMMENT ---
-- 输出修复结果
-- --- END COMMENT ---
DO $$
BEGIN
  RAISE NOTICE '✅ validate_role_update 触发器函数已修复';
  RAISE NOTICE '✅ 现在支持在系统中没有管理员时创建第一个管理员';
  RAISE NOTICE '✅ initialize_admin 函数现在可以正常使用';
  RAISE NOTICE '✅ 所有现有安全机制保持不变';
END $$; 