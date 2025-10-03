-- --- BEGIN COMMENT ---
-- 重新设计auth_source字段的实时同步机制
-- 改为TEXT类型，直接存储auth.users.raw_app_meta_data->>'provider'的值
-- 支持Supabase的所有认证方式，不受枚举限制
-- --- END COMMENT ---

-- --- BEGIN COMMENT ---
-- 1. 将auth_source字段从枚举类型改为TEXT类型
-- --- END COMMENT ---
DO $$
BEGIN
  -- 检查当前字段类型是否为枚举类型
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'auth_source'
    AND udt_name = 'auth_source_type'
  ) THEN
    -- 步骤1：先删除默认值约束
    ALTER TABLE public.profiles
    ALTER COLUMN auth_source DROP DEFAULT;
    
    -- 步骤2：添加临时TEXT列
    ALTER TABLE public.profiles
    ADD COLUMN auth_source_temp TEXT;
    
    -- 步骤3：将枚举值转换为文本并复制到临时列
    UPDATE public.profiles
    SET auth_source_temp = auth_source::TEXT;
    
    -- 步骤4：删除原枚举列
    ALTER TABLE public.profiles
    DROP COLUMN auth_source;
    
    -- 步骤5：将临时列重命名为原列名
    ALTER TABLE public.profiles
    RENAME COLUMN auth_source_temp TO auth_source;
    
    -- 步骤6：设置NOT NULL约束（如果原来有的话）
    ALTER TABLE public.profiles
    ALTER COLUMN auth_source SET NOT NULL;

    RAISE NOTICE 'auth_source字段已从枚举类型改为TEXT类型';
  END IF;
END $$;

-- --- BEGIN COMMENT ---
-- 2. 创建实时同步触发器函数
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION sync_auth_source()
RETURNS TRIGGER AS $$
BEGIN
  -- 从auth.users的raw_app_meta_data中获取provider信息
  UPDATE public.profiles
  SET auth_source = COALESCE(
    NEW.raw_app_meta_data->>'provider',
    'email'  -- 默认值
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 3. 创建触发器监听auth.users表的变化
-- --- END COMMENT ---
DROP TRIGGER IF EXISTS trigger_sync_auth_source ON auth.users;
CREATE TRIGGER trigger_sync_auth_source
  AFTER UPDATE OF raw_app_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_source();

-- --- BEGIN COMMENT ---
-- 4. 修复handle_new_user函数，使用正确的provider值
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    auth_source,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 5. 一次性同步现有用户的auth_source
-- --- END COMMENT ---
UPDATE public.profiles
SET auth_source = COALESCE(
  (SELECT raw_app_meta_data->>'provider' FROM auth.users WHERE auth.users.id = profiles.id),
  'email'
)
WHERE auth_source IS NOT NULL;

-- --- BEGIN COMMENT ---
-- 6. 添加索引优化查询性能
-- --- END COMMENT ---
CREATE INDEX IF NOT EXISTS idx_profiles_auth_source ON public.profiles(auth_source);

-- --- BEGIN COMMENT ---
-- 7. 删除旧的枚举类型（如果没有其他表使用）
-- --- END COMMENT ---
DO $$
BEGIN
  -- 检查是否还有其他表使用这个枚举类型
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE udt_name = 'auth_source_type'
    AND table_name != 'profiles'
  ) THEN
    DROP TYPE IF EXISTS auth_source_type;
    RAISE NOTICE '已删除未使用的枚举类型 auth_source_type';
  END IF;
END $$;

-- --- BEGIN COMMENT ---
-- 8. 添加辅助函数：获取用户所有认证方式
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION get_user_auth_providers(user_id UUID)
RETURNS TEXT[] AS $$
BEGIN
  RETURN COALESCE(
    (SELECT 
      CASE 
        WHEN jsonb_typeof(raw_app_meta_data->'providers') = 'array' 
        THEN ARRAY(SELECT jsonb_array_elements_text(raw_app_meta_data->'providers'))
        ELSE ARRAY[COALESCE(raw_app_meta_data->>'provider', 'email')]
      END
    FROM auth.users WHERE id = user_id),
    ARRAY['email']
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 9. 添加验证函数：检查auth_source同步状态
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION validate_auth_source_sync()
RETURNS TABLE(
  user_id UUID,
  profile_auth_source TEXT,
  actual_provider TEXT,
  is_synced BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.auth_source,
    COALESCE(u.raw_app_meta_data->>'provider', 'email') as actual_provider,
    p.auth_source = COALESCE(u.raw_app_meta_data->>'provider', 'email') as is_synced
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 10. 添加函数注释
-- --- END COMMENT ---
COMMENT ON FUNCTION sync_auth_source() IS '实时同步auth_source字段，直接存储auth.users.raw_app_meta_data中的provider值';
COMMENT ON FUNCTION get_user_auth_providers(UUID) IS '获取用户的所有认证方式信息';
COMMENT ON FUNCTION validate_auth_source_sync() IS '验证auth_source同步状态，检查数据一致性';

-- --- BEGIN COMMENT ---
-- 11. 验证配置是否正确
-- --- END COMMENT ---
DO $$ 
BEGIN
  -- 验证字段类型
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'auth_source' 
    AND data_type = 'text'
  ) THEN
    RAISE EXCEPTION 'auth_source字段类型转换失败';
  END IF;
  
  -- 验证触发器函数
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_auth_source') THEN
    RAISE EXCEPTION 'sync_auth_source 函数创建失败';
  END IF;
  
  -- 验证触发器
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_sync_auth_source' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    RAISE EXCEPTION 'trigger_sync_auth_source 触发器创建失败';
  END IF;
  
  RAISE NOTICE 'auth_source实时同步机制配置完成（TEXT类型）！';
  RAISE NOTICE '- 字段类型：TEXT，直接存储provider值（如email、github、google等）';
  RAISE NOTICE '- 新用户注册时：handle_new_user函数设置初始auth_source';
  RAISE NOTICE '- 用户绑定新认证方式时：sync_auth_source触发器自动更新';
  RAISE NOTICE '- 现有用户数据：已通过一次性同步函数同步';
  RAISE NOTICE '- 多认证方式：可通过get_user_auth_providers函数获取完整信息';
END $$; 