-- 最终修复 handle_new_user 函数
-- 确保函数与实际表结构完全匹配

-- --- BEGIN COMMENT ---
-- 重新创建 handle_new_user 函数，匹配实际的profiles表结构
-- 表结构包含：id, full_name, username, avatar_url, role, created_at, updated_at, last_login, status, auth_source, sso_provider_id
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  provider_name TEXT;
  auth_source_value TEXT; -- 使用TEXT类型，避免枚举类型问题
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
    WHEN 'google' THEN auth_source_value := 'google';
    WHEN 'github' THEN auth_source_value := 'github';
    WHEN 'phone' THEN auth_source_value := 'phone';
    WHEN 'email' THEN auth_source_value := 'password';
    ELSE auth_source_value := 'password';
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
  -- 插入用户资料，包含所有实际存在的字段
  -- --- END COMMENT ---
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
    -- --- BEGIN COMMENT ---
    -- SSO提供商ID：只对OAuth和SSO用户设置
    -- --- END COMMENT ---
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
-- 添加函数注释
-- --- END COMMENT ---
COMMENT ON FUNCTION public.handle_new_user() IS '最终修复版本：支持手机号认证，使用TEXT类型避免枚举类型问题，匹配实际表结构'; 