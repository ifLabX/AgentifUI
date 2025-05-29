-- 更新profiles表，添加auth_source和sso_provider_id字段

-- 添加auth_source字段（认证来源）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'auth_source') THEN
    ALTER TABLE profiles ADD COLUMN auth_source TEXT DEFAULT 'password';
  END IF;
END $$;

-- 添加sso_provider_id字段（SSO提供商ID）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'sso_provider_id') THEN
    ALTER TABLE profiles ADD COLUMN sso_provider_id TEXT;
  END IF;
END $$;

-- 更新handle_new_user函数，处理新增字段
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    new.raw_user_meta_data->>'sso_provider_id'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 