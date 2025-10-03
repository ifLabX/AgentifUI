-- OAuth 支持增强迁移
-- 优化 OAuth 登录流程和用户资料处理

-- --- BEGIN COMMENT ---
-- 1. 更新 handle_new_user 函数以更好地处理 OAuth 用户
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  provider_name TEXT;
  auth_source TEXT;
  proposed_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- --- BEGIN COMMENT ---
  -- 从用户元数据中确定认证来源
  -- --- END COMMENT ---
  provider_name := NEW.raw_app_meta_data->>'provider';
  
  -- 根据提供商设置认证来源
  CASE provider_name
    WHEN 'google' THEN auth_source := 'google';
    WHEN 'github' THEN auth_source := 'github';
    WHEN 'email' THEN auth_source := 'password';
    ELSE auth_source := COALESCE(NEW.raw_user_meta_data->>'auth_source', 'password');
  END CASE;

  -- --- BEGIN COMMENT ---
  -- 生成唯一用户名，处理冲突
  -- --- END COMMENT ---
  CASE 
    WHEN provider_name = 'github' THEN 
      proposed_username := COALESCE(
        NEW.raw_user_meta_data->>'user_name',  -- GitHub提供的用户名
        CONCAT('github_', SUBSTRING(CAST(NEW.id AS TEXT), 1, 8))
      );
    WHEN provider_name = 'google' THEN 
      proposed_username := CONCAT('google_', SUBSTRING(CAST(NEW.id AS TEXT), 1, 8));
    ELSE 
      proposed_username := CONCAT('user_', SUBSTRING(CAST(NEW.id AS TEXT), 1, 8));
  END CASE;

  -- 检查用户名冲突并生成唯一用户名
  final_username := proposed_username;
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := proposed_username || '_' || counter;
  END LOOP;

  INSERT INTO public.profiles (
    id, 
    full_name, 
    username, 
    avatar_url,
    auth_source,
    sso_provider_id,
    created_at,
    updated_at,
    last_login
  )
  VALUES (
    NEW.id,
    -- --- BEGIN COMMENT --- 
    -- OAuth用户的全名获取逻辑：优先使用full_name，然后是name，最后是email的用户名部分
    -- --- END COMMENT ---
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    final_username,
    -- --- BEGIN COMMENT ---
    -- OAuth用户的头像URL
    -- --- END COMMENT ---
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture' -- Google OAuth用picture字段
    ),
    auth_source,
    CASE 
      WHEN provider_name IN ('google', 'github') THEN provider_name
      ELSE NEW.raw_user_meta_data->>'sso_provider_id'
    END,
    NEW.created_at,
    NEW.created_at,
    NEW.created_at -- 首次登录时间
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 2. 创建函数用于更新OAuth用户的最后登录时间
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION public.update_user_last_login()
RETURNS TRIGGER AS $$
BEGIN
  -- 当用户登录时更新最后登录时间
  IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at AND NEW.last_sign_in_at IS NOT NULL THEN
    UPDATE public.profiles 
    SET last_login = NEW.last_sign_in_at,
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 3. 创建触发器监听用户登录
-- --- END COMMENT ---
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.update_user_last_login();

-- --- BEGIN COMMENT ---
-- 4. 添加auth_source枚举类型以规范认证来源
-- --- END COMMENT ---
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_source_type') THEN
    CREATE TYPE auth_source_type AS ENUM ('password', 'google', 'github', 'oauth', 'sso');
  END IF;
END $$;

-- --- BEGIN COMMENT ---
-- 5. 更新profiles表的auth_source字段使用枚举类型（如果还是TEXT类型的话）
-- --- END COMMENT ---
DO $$ 
DECLARE
  view_name TEXT;
BEGIN
  -- 检查当前字段类型
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'auth_source' 
    AND data_type = 'text'
  ) THEN
    -- 先更新现有数据以符合枚举值
    UPDATE profiles SET auth_source = 'password' WHERE auth_source IS NULL OR auth_source = '';
    UPDATE profiles SET auth_source = 'oauth' WHERE auth_source NOT IN ('password', 'google', 'github', 'sso');
    
    -- 临时删除依赖视图
    DROP VIEW IF EXISTS admin_user_management_view CASCADE;
    
    -- 先删除默认值约束
    ALTER TABLE profiles ALTER COLUMN auth_source DROP DEFAULT;
    
    -- 转换字段类型
    ALTER TABLE profiles 
    ALTER COLUMN auth_source TYPE auth_source_type 
    USING auth_source::auth_source_type;
    
    -- 重新设置默认值
    ALTER TABLE profiles ALTER COLUMN auth_source SET DEFAULT 'password'::auth_source_type;
    
    -- 重新创建admin_user_management_view视图
    CREATE VIEW admin_user_management_view AS
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
    WHERE EXISTS (
      SELECT 1 FROM profiles admin_check 
      WHERE admin_check.id = auth.uid() 
      AND admin_check.role = 'admin'
    );
  END IF;
END $$;

-- --- BEGIN COMMENT ---
-- 6. 创建索引优化OAuth用户查询
-- --- END COMMENT ---
CREATE INDEX IF NOT EXISTS idx_profiles_auth_source ON profiles(auth_source);
CREATE INDEX IF NOT EXISTS idx_profiles_sso_provider ON profiles(sso_provider_id) WHERE sso_provider_id IS NOT NULL;

-- --- BEGIN COMMENT ---
-- 7. 更新现有OAuth用户的认证来源（如果有的话）
-- --- END COMMENT ---
UPDATE profiles 
SET auth_source = 'oauth'::auth_source_type,
    updated_at = NOW()
WHERE auth_source = 'password'::auth_source_type 
  AND id IN (
    SELECT au.id FROM auth.users au 
    WHERE au.raw_app_meta_data->>'provider' IS NOT NULL 
    AND au.raw_app_meta_data->>'provider' != 'email'
  );

-- --- BEGIN COMMENT ---
-- 8. 创建函数获取用户的OAuth提供商信息
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION public.get_user_oauth_provider(user_id UUID)
RETURNS TABLE(provider TEXT, provider_id TEXT, email TEXT, name TEXT, avatar_url TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.raw_app_meta_data->>'provider' as provider,
    au.raw_user_meta_data->>'sub' as provider_id,
    au.email,
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'name'
    ) as name,
    COALESCE(
      au.raw_user_meta_data->>'avatar_url',
      au.raw_user_meta_data->>'picture'
    ) as avatar_url
  FROM auth.users au
  WHERE au.id = user_id;
END;
$$;

-- --- BEGIN COMMENT ---
-- 9. 添加注释说明OAuth集成
-- --- END COMMENT ---
COMMENT ON FUNCTION public.handle_new_user() IS 'OAuth增强：处理新用户注册，支持Google、GitHub等OAuth提供商';
COMMENT ON FUNCTION public.update_user_last_login() IS 'OAuth支持：更新用户最后登录时间';
COMMENT ON FUNCTION public.get_user_oauth_provider(UUID) IS 'OAuth工具：获取用户的OAuth提供商信息';
COMMENT ON TYPE auth_source_type IS 'OAuth支持：用户认证来源枚举类型'; 