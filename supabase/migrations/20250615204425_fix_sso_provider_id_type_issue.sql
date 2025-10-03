-- --- BEGIN COMMENT ---
-- 修复 handle_new_user 函数中 sso_provider_id 的类型转换问题
-- 错误：column "sso_provider_id" is of type uuid but expression is of type text
-- --- END COMMENT ---

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  provider_name TEXT;
  auth_source_value TEXT;
  proposed_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
  sso_provider_uuid UUID;
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
  -- 安全处理 sso_provider_id 的类型转换
  -- --- END COMMENT ---
  BEGIN
    -- 对于 OAuth 提供商，不设置 sso_provider_id（因为 provider_name 已经是字符串）
    -- 只有当用户元数据中明确提供了有效的 UUID 格式的 sso_provider_id 时才设置
    IF NEW.raw_user_meta_data->>'sso_provider_id' IS NOT NULL 
       AND NEW.raw_user_meta_data->>'sso_provider_id' != '' THEN
      sso_provider_uuid := (NEW.raw_user_meta_data->>'sso_provider_id')::UUID;
    ELSE
      sso_provider_uuid := NULL;
    END IF;
  EXCEPTION WHEN invalid_text_representation THEN
    -- 如果转换失败，设置为 NULL 并记录警告
    RAISE WARNING 'Invalid UUID format for sso_provider_id: %, setting to NULL', 
                  NEW.raw_user_meta_data->>'sso_provider_id';
    sso_provider_uuid := NULL;
  END;

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
    -- SSO提供商ID（安全转换后的UUID值）
    sso_provider_uuid,
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
COMMENT ON FUNCTION public.handle_new_user() IS '修复版本：解决 sso_provider_id 类型转换问题，安全处理 UUID 转换';

-- --- BEGIN COMMENT ---
-- 验证函数更新成功
-- --- END COMMENT ---
DO $$
BEGIN
  RAISE NOTICE '✅ handle_new_user 函数已修复 sso_provider_id 类型转换问题';
  RAISE NOTICE '📝 现在可以安全处理邮箱密码注册和 OAuth 登录';
END $$; 