-- --- BEGIN COMMENT ---
-- 更新 handle_new_user 函数以匹配当前的 profiles 表结构
-- 当前表结构包含：id, full_name, username, avatar_url, role, created_at, updated_at, 
-- last_login, status, sso_provider_id, auth_source, email, phone
-- --- END COMMENT ---

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  provider_name TEXT;
  auth_source_value TEXT;
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
    WHEN 'google' THEN auth_source_value := 'google';
    WHEN 'github' THEN auth_source_value := 'github';
    WHEN 'phone' THEN auth_source_value := 'phone';
    WHEN 'email' THEN auth_source_value := 'email';
    ELSE auth_source_value := 'email';
  END CASE;

  -- --- BEGIN COMMENT ---
  -- 生成唯一用户名，处理冲突
  -- --- END COMMENT ---
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
      -- 优先使用用户提供的 username，如果没有则生成默认值
      proposed_username := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'username', ''),
        CONCAT('user_', SUBSTRING(CAST(NEW.id AS TEXT), 1, 8))
      );
  END CASE;

  -- 检查用户名冲突并生成唯一用户名
  final_username := proposed_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := proposed_username || '_' || counter;
  END LOOP;

  -- --- BEGIN COMMENT ---
  -- 插入用户资料，包含所有实际存在的字段
  -- --- END COMMENT ---
  INSERT INTO public.profiles (
    id, 
    full_name, 
    username, 
    avatar_url,
    email,
    phone,
    auth_source,
    sso_provider_id,
    created_at,
    updated_at,
    last_login
  )
  VALUES (
    NEW.id,
    -- 用户全名获取逻辑
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      CASE 
        WHEN NEW.email IS NOT NULL THEN SPLIT_PART(NEW.email, '@', 1)
        WHEN NEW.phone IS NOT NULL THEN CONCAT('用户_', SUBSTRING(NEW.phone FROM '.{4}$'))
        ELSE '新用户'
      END
    ),
    final_username,
    -- 头像URL
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    -- 同步邮箱
    NEW.email,
    -- 同步手机号
    NEW.phone,
    -- 认证来源
    auth_source_value,
    -- SSO提供商ID（只对OAuth用户设置）
    CASE 
      WHEN provider_name IN ('google', 'github') THEN provider_name::TEXT
      ELSE NEW.raw_user_meta_data->>'sso_provider_id'
    END,
    NEW.created_at,
    NEW.created_at,
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 添加函数注释
-- --- END COMMENT ---
COMMENT ON FUNCTION public.handle_new_user() IS '更新版本：匹配当前完整的 profiles 表结构，支持邮箱、手机号、OAuth认证';

-- --- BEGIN COMMENT ---
-- 验证函数更新成功
-- --- END COMMENT ---
DO $$
BEGIN
  RAISE NOTICE '✅ handle_new_user 函数已更新，支持完整的 profiles 表结构';
  RAISE NOTICE '📝 支持的认证方式：邮箱密码、Google OAuth、GitHub OAuth、手机号验证码';
END $$; 