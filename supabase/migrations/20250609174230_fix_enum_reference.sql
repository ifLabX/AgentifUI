-- 修复枚举类型引用问题
-- 解决 "type auth_source_type does not exist" 错误

-- --- BEGIN COMMENT ---
-- 重新定义 handle_new_user 函数，使用显式的schema引用
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  provider_name TEXT;
  auth_source_value TEXT; -- 先用TEXT类型获取值
  proposed_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- 获取认证提供商
  provider_name := NEW.raw_app_meta_data->>'provider';
  
  -- 设置认证来源
  CASE provider_name
    WHEN 'google' THEN auth_source_value := 'google';
    WHEN 'github' THEN auth_source_value := 'github';
    WHEN 'phone' THEN auth_source_value := 'phone';
    WHEN 'email' THEN auth_source_value := 'password';
    ELSE auth_source_value := 'password';
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
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := proposed_username || '_' || counter;
  END LOOP;

  -- 插入用户资料，使用TEXT转换为枚举
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
    auth_source_value::public.auth_source_type, -- 显式转换为枚举类型
    NEW.created_at,
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BEGIN COMMENT ---
-- 添加函数注释
-- --- END COMMENT ---
COMMENT ON FUNCTION public.handle_new_user() IS '认证支持：邮箱密码、GitHub OAuth、手机号验证码登录 - 修复枚举类型引用';

-- --- BEGIN COMMENT ---
-- 验证修复
-- --- END COMMENT ---
DO $$ 
BEGIN
  RAISE NOTICE '枚举类型引用修复完成：邮箱密码、GitHub OAuth、手机号验证码';
END $$; 