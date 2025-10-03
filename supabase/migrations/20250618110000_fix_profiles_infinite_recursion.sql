-- 修复 profiles 表的 RLS 策略无限递归问题
-- 时间: 20250617200000
-- 问题: profiles 表的 RLS 策略在查询时可能引用自己，导致无限递归

-- =====================================================
-- 第一步：禁用 RLS 并清理所有现有策略
-- =====================================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 删除所有现有的 profiles 表策略
DROP POLICY IF EXISTS "允许所有用户查看所有资料" ON profiles;
DROP POLICY IF EXISTS "允许用户更新自己的资料" ON profiles;
DROP POLICY IF EXISTS "允许用户插入自己的资料" ON profiles;
DROP POLICY IF EXISTS "用户可以查看自己的资料" ON profiles;
DROP POLICY IF EXISTS "用户可以更新自己的资料" ON profiles;
DROP POLICY IF EXISTS "sso_users_can_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- =====================================================
-- 第二步：重新启用 RLS 并创建超级简单的策略
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 创建最简单的策略，避免任何可能的递归
-- =====================================================

-- 查看策略：所有认证用户都可以查看所有资料
-- 这样避免了在策略中查询 profiles 表本身
CREATE POLICY "simple_profiles_select" ON profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- 插入策略：只允许用户插入自己的资料
CREATE POLICY "simple_profiles_insert" ON profiles
FOR INSERT WITH CHECK (
  auth.uid() = id
);

-- 更新策略：只允许用户更新自己的资料
CREATE POLICY "simple_profiles_update" ON profiles
FOR UPDATE USING (
  auth.uid() = id
);

-- 删除策略：不允许删除（profiles 由 auth.users 的删除触发器处理）
-- 这里不创建删除策略，让级联删除处理

-- =====================================================
-- 添加策略注释
-- =====================================================

COMMENT ON POLICY "simple_profiles_select" ON profiles IS 
'超简策略：所有认证用户可查看所有资料，避免递归查询';

COMMENT ON POLICY "simple_profiles_insert" ON profiles IS 
'超简策略：用户只能插入自己的资料';

COMMENT ON POLICY "simple_profiles_update" ON profiles IS 
'超简策略：用户只能更新自己的资料';

-- =====================================================
-- 验证策略是否正确创建
-- =====================================================

DO $$
DECLARE
  policy_count INTEGER;
  rec RECORD;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'profiles';
  
  RAISE NOTICE '✅ profiles 表现在有 % 个 RLS 策略', policy_count;
  
  -- 列出所有策略
  FOR rec IN 
    SELECT policyname, cmd, permissive 
    FROM pg_policies 
    WHERE tablename = 'profiles'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  - 策略: % | 操作: % | 类型: %', 
      rec.policyname, rec.cmd, 
      CASE WHEN rec.permissive = 'PERMISSIVE' THEN '允许' ELSE '限制' END;
  END LOOP;
END $$;

-- =====================================================
-- 完成提示
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 profiles 表 RLS 策略修复完成！';
  RAISE NOTICE '📝 已移除所有可能导致递归的策略';
  RAISE NOTICE '✨ 现在使用最简单的策略，避免表间依赖';
END $$; 