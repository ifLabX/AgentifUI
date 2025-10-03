-- 修复 profiles 表的外键约束问题
-- 确保与其他表保持一致的 ON DELETE CASCADE 行为

-- 1. 检查当前外键约束
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  -- 检查是否存在正确的外键约束
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc 
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.table_name = 'profiles' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'id'
    AND rc.delete_rule = 'CASCADE'
  ) INTO constraint_exists;
  
  -- 如果不存在正确的约束，则修复
  IF NOT constraint_exists THEN
    RAISE NOTICE '修复 profiles 表的外键约束...';
    
    -- 删除现有的外键约束（如果存在）
    ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    
    -- 重新创建带有 ON DELETE CASCADE 的外键约束
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'profiles 表外键约束修复完成';
  ELSE
    RAISE NOTICE 'profiles 表外键约束已正确设置';
  END IF;
END $$;

-- 2. 验证修复结果
DO $$
DECLARE
  constraint_info RECORD;
BEGIN
  SELECT 
    tc.constraint_name,
    rc.delete_rule,
    kcu.column_name
  INTO constraint_info
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
  WHERE tc.table_name = 'profiles' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'id';
  
  IF FOUND THEN
    RAISE NOTICE '外键约束验证: 约束名=%, 删除规则=%, 列名=%', 
      constraint_info.constraint_name, 
      constraint_info.delete_rule, 
      constraint_info.column_name;
  ELSE
    RAISE WARNING '未找到 profiles 表的外键约束！';
  END IF;
END $$;

-- 刷新 Supabase 客户端缓存
NOTIFY pgrst, 'reload schema'; 