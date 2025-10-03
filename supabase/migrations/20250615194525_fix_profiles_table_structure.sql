-- --- BEGIN COMMENT ---
-- 修复 profiles 表结构问题
-- 确保所有注册和用户管理功能所需的字段都存在
-- 解决 handle_new_user 触发器插入失败的问题
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 1. 添加所有缺失的关键字段
-- --- END COMMENT ---
DO $$
BEGIN
  -- 添加 email 字段（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'email'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
    RAISE NOTICE '添加了 email 字段到 profiles 表';
  END IF;

  -- 添加 username 字段（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'username'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT;
    RAISE NOTICE '添加了 username 字段到 profiles 表';
  END IF;

  -- 添加 phone 字段（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'phone'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    RAISE NOTICE '添加了 phone 字段到 profiles 表';
  END IF;

  -- 添加 role 字段（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    RAISE NOTICE '添加了 role 字段到 profiles 表';
  END IF;

  -- 添加 status 字段（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'status'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active';
    RAISE NOTICE '添加了 status 字段到 profiles 表';
  END IF;

  -- 确保 auth_source 字段存在
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'auth_source'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN auth_source TEXT DEFAULT 'email';
    RAISE NOTICE '添加了 auth_source 字段到 profiles 表';
  END IF;

  -- 确保 sso_provider_id 字段存在
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'sso_provider_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN sso_provider_id TEXT;
    RAISE NOTICE '添加了 sso_provider_id 字段到 profiles 表';
  END IF;

  -- 确保 last_login 字段存在
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'last_login'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '添加了 last_login 字段到 profiles 表';
  END IF;
END $$;

-- --- BEGIN COMMENT ---
-- 2. 添加必要的约束
-- --- END COMMENT ---
DO $$
BEGIN
  -- 添加 username 唯一约束（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_username_key' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
    RAISE NOTICE '添加了 username 唯一约束';
  END IF;
END $$;

-- --- BEGIN COMMENT ---
-- 3. 同步现有用户的数据
-- --- END COMMENT ---
DO $$
DECLARE
  sync_count INTEGER := 0;
BEGIN
  -- 同步 email 数据
  UPDATE public.profiles 
  SET email = (
    SELECT email FROM auth.users WHERE auth.users.id = profiles.id
  )
  WHERE email IS NULL;
  
  GET DIAGNOSTICS sync_count = ROW_COUNT;
  IF sync_count > 0 THEN
    RAISE NOTICE '同步了 % 个用户的 email 数据', sync_count;
  END IF;

  -- 同步 phone 数据
  UPDATE public.profiles 
  SET phone = (
    SELECT phone FROM auth.users WHERE auth.users.id = profiles.id
  )
  WHERE phone IS NULL;
  
  GET DIAGNOSTICS sync_count = ROW_COUNT;
  IF sync_count > 0 THEN
    RAISE NOTICE '同步了 % 个用户的 phone 数据', sync_count;
  END IF;

  -- 确保所有用户都有默认的 role 和 status
  UPDATE public.profiles 
  SET 
    role = COALESCE(role, 'user'),
    status = COALESCE(status, 'active'),
    auth_source = COALESCE(auth_source, 'email')
  WHERE role IS NULL OR status IS NULL OR auth_source IS NULL;
  
  GET DIAGNOSTICS sync_count = ROW_COUNT;
  IF sync_count > 0 THEN
    RAISE NOTICE '更新了 % 个用户的默认 role/status/auth_source', sync_count;
  END IF;

  -- 为没有 username 的用户生成默认 username
  UPDATE public.profiles 
  SET username = CONCAT('user_', SUBSTRING(CAST(id AS TEXT), 1, 8))
  WHERE username IS NULL OR username = '';
  
  GET DIAGNOSTICS sync_count = ROW_COUNT;
  IF sync_count > 0 THEN
    RAISE NOTICE '为 % 个用户生成了默认 username', sync_count;
  END IF;
END $$;

-- --- BEGIN COMMENT ---
-- 4. 验证 handle_new_user 函数是否与表结构匹配
-- --- END COMMENT ---
DO $$
DECLARE
  missing_fields TEXT[] := ARRAY[]::TEXT[];
  field_name TEXT;
BEGIN
  -- 检查 handle_new_user 函数中使用的字段是否都存在
  FOR field_name IN SELECT unnest(ARRAY['id', 'email', 'full_name', 'avatar_url', 'auth_source', 'created_at', 'updated_at']) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name = field_name
      AND table_schema = 'public'
    ) THEN
      missing_fields := array_append(missing_fields, field_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_fields, 1) > 0 THEN
    RAISE WARNING 'handle_new_user 函数使用的以下字段在 profiles 表中不存在: %', array_to_string(missing_fields, ', ');
  ELSE
    RAISE NOTICE '✅ handle_new_user 函数使用的所有字段都存在于 profiles 表中';
  END IF;
END $$;

-- --- BEGIN COMMENT ---
-- 5. 创建索引优化查询性能
-- --- END COMMENT ---
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_source ON public.profiles(auth_source);

-- --- BEGIN COMMENT ---
-- 6. 验证表结构完整性
-- --- END COMMENT ---
DO $$
DECLARE
  table_info RECORD;
  field_count INTEGER;
BEGIN
  -- 获取 profiles 表的字段信息
  SELECT COUNT(*) INTO field_count
  FROM information_schema.columns 
  WHERE table_name = 'profiles' 
  AND table_schema = 'public';
  
  RAISE NOTICE '=== Profiles 表结构验证 ===';
  RAISE NOTICE 'profiles 表共有 % 个字段', field_count;
  
  -- 列出所有字段
  FOR table_info IN 
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND table_schema = 'public'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '字段: % | 类型: % | 可空: % | 默认值: %', 
      table_info.column_name, 
      table_info.data_type, 
      table_info.is_nullable,
      COALESCE(table_info.column_default, 'NULL');
  END LOOP;
  
  RAISE NOTICE '=== 验证完成 ===';
END $$;

-- --- BEGIN COMMENT ---
-- 7. 添加注释说明
-- --- END COMMENT ---
COMMENT ON TABLE public.profiles IS '用户资料表：存储用户的扩展信息，与 auth.users 表关联';
COMMENT ON COLUMN public.profiles.email IS '用户邮箱（从 auth.users 同步）';
COMMENT ON COLUMN public.profiles.username IS '用户名（唯一）';
COMMENT ON COLUMN public.profiles.phone IS '用户手机号（从 auth.users 同步）';
COMMENT ON COLUMN public.profiles.role IS '用户角色：admin, manager, user';
COMMENT ON COLUMN public.profiles.status IS '账户状态：active, suspended, pending';
COMMENT ON COLUMN public.profiles.auth_source IS '认证来源：email, google, github, phone 等';
COMMENT ON COLUMN public.profiles.sso_provider_id IS 'SSO 提供商 ID';
COMMENT ON COLUMN public.profiles.last_login IS '最后登录时间';

-- --- BEGIN COMMENT ---
-- 8. 完成提示
-- --- END COMMENT ---
DO $$
BEGIN
  RAISE NOTICE '🎉 profiles 表结构修复完成！';
  RAISE NOTICE '📝 请运行注册测试以验证功能是否正常';
END $$; 