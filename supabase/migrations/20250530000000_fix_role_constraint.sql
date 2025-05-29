-- 修复角色约束，允许manager角色
-- 删除现有的约束
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END
$$;

-- 重新创建约束，包含manager角色
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin', 'manager'));

-- 确保role字段与user_role ENUM保持一致
-- 如果存在TEXT类型的role字段，将其转换为user_role类型
DO $$
BEGIN
  -- 检查role字段的类型
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role' 
    AND data_type = 'text'
  ) THEN
    -- 如果是TEXT类型，先删除约束，然后转换为ENUM类型
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    
    -- 转换为ENUM类型
    ALTER TABLE public.profiles 
    ALTER COLUMN role TYPE user_role 
    USING role::user_role;
    
    -- 设置默认值
    ALTER TABLE public.profiles 
    ALTER COLUMN role SET DEFAULT 'user'::user_role;
  END IF;
END
$$;

-- 如果role字段已经是user_role类型，只需要确保没有冲突的约束
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role' 
    AND udt_name = 'user_role'
  ) THEN
    -- 删除可能存在的TEXT类型约束
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  END IF;
END
$$; 