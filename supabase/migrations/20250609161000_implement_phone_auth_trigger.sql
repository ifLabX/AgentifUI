-- 第二步：实现手机号认证触发器修复
-- 现在可以安全使用phone枚举值

-- --- BEGIN COMMENT ---
-- 修复 handle_new_user 函数，兼容手机号认证
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
  -- 插入用户资料，只使用确定存在的字段
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
        ELSE NULL
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
-- 添加注释说明修复内容
-- --- END COMMENT ---
COMMENT ON FUNCTION public.handle_new_user() IS '修复版本：支持手机号认证，简化字段插入逻辑，避免不存在字段错误';

-- --- BEGIN COMMENT ---
-- 创建索引优化手机号认证查询
-- --- END COMMENT ---
CREATE INDEX IF NOT EXISTS idx_profiles_phone_auth ON profiles(auth_source) WHERE auth_source = 'phone';

-- --- BEGIN COMMENT ---
-- 刷新客户端缓存
-- --- END COMMENT ---
NOTIFY pgrst, 'reload schema'; 