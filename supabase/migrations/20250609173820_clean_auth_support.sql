-- 清理并重新定义认证支持
-- 支持：邮箱密码、GitHub OAuth、手机号验证码登录

-- --- BEGIN COMMENT ---
-- 1. 确保 auth_source_type 枚举包含所有需要的认证类型
-- --- END COMMENT ---
DO $$ 
BEGIN
  -- 如果枚举类型不存在，创建它
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_source_type') THEN
    CREATE TYPE auth_source_type AS ENUM ('password', 'google', 'github', 'oauth', 'sso', 'phone');
  ELSE
    -- 确保包含phone类型
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'phone' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'auth_source_type')
    ) THEN
      ALTER TYPE auth_source_type ADD VALUE 'phone';
    END IF;
  END IF;
END $$;

-- --- BEGIN COMMENT ---
-- 2. 确保 profiles 表的 auth_source 字段使用枚举类型
-- --- END COMMENT ---
DO $$ 
BEGIN
  -- 检查字段类型
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'auth_source' 
    AND data_type = 'text'
  ) THEN
    -- 如果是TEXT类型，转换为枚举
    -- 先清理数据
    UPDATE profiles SET auth_source = 'password' WHERE auth_source IS NULL OR auth_source = '';
    UPDATE profiles SET auth_source = 'oauth' WHERE auth_source NOT IN ('password', 'google', 'github', 'sso', 'phone');
    
    -- 转换类型
    ALTER TABLE profiles 
    ALTER COLUMN auth_source TYPE auth_source_type 
    USING auth_source::auth_source_type;
    
    -- 设置默认值
    ALTER TABLE profiles ALTER COLUMN auth_source SET DEFAULT 'password'::auth_source_type;
  END IF;
END $$;

-- --- BEGIN COMMENT ---
-- 3. 重新定义 handle_new_user 函数 - 支持邮箱、GitHub、手机号认证
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  provider_name TEXT;
  auth_source_value auth_source_type;
  proposed_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- 获取认证提供商
  provider_name := NEW.raw_app_meta_data->>'provider';
  
  -- 设置认证来源
  CASE provider_name
    WHEN 'google' THEN auth_source_value := 'google'::auth_source_type;
    WHEN 'github' THEN auth_source_value := 'github'::auth_source_type;
    WHEN 'phone' THEN auth_source_value := 'phone'::auth_source_type;
    WHEN 'email' THEN auth_source_value := 'password'::auth_source_type;
    ELSE auth_source_value := 'password'::auth_source_type;
  END CASE;

  -- 生成用户名
  CASE 
    WHEN provider_name = 'github' THEN 
      proposed_username := COALESCE(
        NEW.raw_user_meta_data->>'user_name',
        CONCAT('github_', SUBSTRING(CAST(NEW.id AS TEXT), 1, 8))
      );
    WHEN provider_name = 'google' THEN 
      proposed_username := CONCAT('google_', SUBSTRING(CAST(NEW.id AS TEXT), 1, 8));
    WHEN provider_name = 'phone' THEN 
      proposed_username := CONCAT('phone_', SUBSTRING(CAST(NEW.id AS TEXT), 1, 8));
    ELSE 
      proposed_username := CONCAT('user_', SUBSTRING(CAST(NEW.id AS TEXT), 1, 8));
  END CASE;

  -- 确保用户名唯一
  final_username := proposed_username;
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := proposed_username || '_' || counter;
  END LOOP;

  -- 插入用户资料（只包含实际存在的核心字段）
  INSERT INTO public.profiles (
    id, 
    full_name, 
    username, 
    avatar_url,
    auth_source,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    -- 全名处理
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      CASE 
        WHEN NEW.email IS NOT NULL THEN SPLIT_PART(NEW.email, '@', 1)
        WHEN NEW.phone IS NOT NULL THEN CONCAT('用户_', RIGHT(NEW.phone, 4))
        ELSE 'New User'
      END
    ),
    final_username,
    -- 头像URL
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    auth_source_value,
    NEW.created_at,
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 4. 确保有登录时间更新函数（如果不存在）
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
-- 5. 确保触发器存在
-- --- END COMMENT ---
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.update_user_last_login();

-- --- BEGIN COMMENT ---
-- 6. 创建有用的索引
-- --- END COMMENT ---
CREATE INDEX IF NOT EXISTS idx_profiles_auth_source ON profiles(auth_source);

-- --- BEGIN COMMENT ---
-- 7. 添加函数注释
-- --- END COMMENT ---
COMMENT ON FUNCTION public.handle_new_user() IS '认证支持：邮箱密码、GitHub OAuth、手机号验证码登录';
COMMENT ON FUNCTION public.update_user_last_login() IS '更新用户最后登录时间';

-- --- BEGIN COMMENT ---
-- 8. 验证配置正确
-- --- END COMMENT ---
DO $$ 
BEGIN
  -- 验证枚举类型
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_source_type') THEN
    RAISE EXCEPTION '枚举类型创建失败';
  END IF;
  
  -- 验证函数
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    RAISE EXCEPTION 'handle_new_user 函数创建失败';
  END IF;
  
  RAISE NOTICE '认证支持配置完成：邮箱密码、GitHub OAuth、手机号验证码';
END $$; 