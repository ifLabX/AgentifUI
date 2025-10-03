-- 验证和修复 auth_source_type 枚举类型问题
-- 解决 "type auth_source_type does not exist" 错误

-- --- BEGIN COMMENT ---
-- 1. 首先检查并重新创建 auth_source_type 枚举（如果不存在）
-- --- END COMMENT ---
DO $$ 
BEGIN
  -- 如果枚举类型不存在，创建它
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_source_type') THEN
    CREATE TYPE auth_source_type AS ENUM ('password', 'google', 'github', 'oauth', 'sso', 'phone');
  ELSE
    -- 如果存在但没有phone值，添加它
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
-- 2. 确保 profiles 表的 auth_source 字段使用正确的枚举类型
-- --- END COMMENT ---
DO $$ 
BEGIN
  -- 检查字段类型是否为枚举
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'auth_source' 
    AND data_type = 'text'
  ) THEN
    -- 如果还是TEXT类型，转换为枚举
    -- 先更新数据确保符合枚举值
    UPDATE profiles SET auth_source = 'password' WHERE auth_source IS NULL OR auth_source = '';
    UPDATE profiles SET auth_source = 'oauth' WHERE auth_source NOT IN ('password', 'google', 'github', 'sso', 'phone');
    
    -- 转换字段类型
    ALTER TABLE profiles 
    ALTER COLUMN auth_source TYPE auth_source_type 
    USING auth_source::auth_source_type;
    
    -- 设置默认值
    ALTER TABLE profiles ALTER COLUMN auth_source SET DEFAULT 'password'::auth_source_type;
  END IF;
END $$;

-- --- BEGIN COMMENT ---
-- 3. 重新创建 handle_new_user 函数，确保使用正确的类型
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
  -- --- BEGIN COMMENT ---
  -- 从用户元数据中确定认证来源
  -- --- END COMMENT ---
  provider_name := NEW.raw_app_meta_data->>'provider';
  
  -- 根据提供商设置认证来源，支持手机号认证
  CASE provider_name
    WHEN 'google' THEN auth_source_value := 'google'::auth_source_type;
    WHEN 'github' THEN auth_source_value := 'github'::auth_source_type;
    WHEN 'phone' THEN auth_source_value := 'phone'::auth_source_type;
    WHEN 'email' THEN auth_source_value := 'password'::auth_source_type;
    ELSE auth_source_value := 'password'::auth_source_type;
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
    WHEN provider_name = 'phone' THEN 
      -- 手机号认证用户名：使用手机号后4位 + 随机字符
      proposed_username := CONCAT('phone_', SUBSTRING(CAST(NEW.id AS TEXT), 1, 8));
    ELSE 
      proposed_username := CONCAT('user_', SUBSTRING(CAST(NEW.id AS TEXT), 1, 8));
  END CASE;

  -- 检查用户名冲突并生成唯一用户名
  final_username := proposed_username;
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := proposed_username || '_' || counter;
  END LOOP;

  -- --- BEGIN COMMENT ---
  -- 插入用户资料，只包含确定存在的字段
  -- --- END COMMENT ---
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
    -- --- BEGIN COMMENT --- 
    -- 用户全名获取逻辑：优先使用full_name，然后是name，最后是email的用户名部分
    -- --- END COMMENT ---
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      CASE 
        WHEN NEW.email IS NOT NULL THEN SPLIT_PART(NEW.email, '@', 1)
        WHEN NEW.phone IS NOT NULL THEN CONCAT('用户_', SUBSTRING(NEW.phone FROM '.{4}$'))
        ELSE 'new_user'
      END
    ),
    final_username,
    -- --- BEGIN COMMENT ---
    -- 头像URL（手机号认证通常没有头像）
    -- --- END COMMENT ---
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture' -- Google OAuth用picture字段
    ),
    auth_source_value,
    NEW.created_at,
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 4. 添加函数注释
-- --- END COMMENT ---
COMMENT ON FUNCTION public.handle_new_user() IS '修复版本：支持手机号认证，确保枚举类型正确使用';

-- --- BEGIN COMMENT ---
-- 5. 验证枚举类型和函数创建成功
-- --- END COMMENT ---
DO $$ 
BEGIN
  -- 验证枚举类型存在
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_source_type') THEN
    RAISE EXCEPTION 'auth_source_type 枚举类型创建失败';
  END IF;
  
  -- 验证函数存在
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    RAISE EXCEPTION 'handle_new_user 函数创建失败';
  END IF;
  
  RAISE NOTICE '枚举类型和函数验证成功';
END $$; 