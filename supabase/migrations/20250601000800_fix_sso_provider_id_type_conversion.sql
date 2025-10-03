-- 修复 handle_new_user 函数中 sso_provider_id 的类型转换问题
-- 这是一个 debug 修复，只处理 TEXT 到 UUID 的类型转换，不改变任何表结构

-- 备份当前函数（如果需要回滚）
-- 当前函数存在类型转换问题：new.raw_user_meta_data->>'sso_provider_id' 返回 TEXT，但字段需要 UUID

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  sso_provider_text TEXT;
  sso_provider_uuid UUID;
BEGIN
  -- 获取 SSO 提供商 ID 的文本值
  sso_provider_text := new.raw_user_meta_data->>'sso_provider_id';
  
  -- 安全地将 TEXT 转换为 UUID
  -- 处理以下情况：
  -- 1. NULL -> NULL
  -- 2. 空字符串 '' -> NULL  
  -- 3. 有效 UUID 字符串 -> UUID
  -- 4. 无效 UUID 字符串 -> NULL (记录警告)
  IF sso_provider_text IS NOT NULL AND sso_provider_text != '' THEN
    BEGIN
      -- 尝试转换为 UUID
      sso_provider_uuid := sso_provider_text::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
      -- 转换失败时记录警告并设置为 NULL
      RAISE WARNING 'Invalid UUID format for sso_provider_id: %, setting to NULL', sso_provider_text;
      sso_provider_uuid := NULL;
    END;
  ELSE
    -- NULL 或空字符串都设置为 NULL
    sso_provider_uuid := NULL;
  END IF;

  -- 插入用户资料，使用转换后的 UUID 值
  INSERT INTO public.profiles (
    id, 
    full_name, 
    username, 
    avatar_url,
    auth_source,
    sso_provider_id
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    CONCAT('user_', SUBSTRING(CAST(new.id AS TEXT), 1, 8)),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'auth_source', 'password'),
    sso_provider_uuid  -- 使用安全转换后的 UUID 值
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释说明这个修复的目的
COMMENT ON FUNCTION public.handle_new_user() IS 
'处理新用户注册时的资料创建。修复了 sso_provider_id 从 TEXT 到 UUID 的类型转换问题。'; 