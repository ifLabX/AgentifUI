-- 确保 username 列存在
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- 添加唯一约束（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_username_key' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END
$$;

-- 更新触发器函数，确保包含 username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    CONCAT('user_', SUBSTRING(CAST(NEW.id AS TEXT), 1, 8)), -- 生成临时用户名
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.created_at,
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新现有记录，确保所有记录都有 username 值
UPDATE public.profiles
SET username = CONCAT('user_', SUBSTRING(CAST(id AS TEXT), 1, 8))
WHERE username IS NULL OR username = '';

-- 刷新 Supabase 客户端缓存
NOTIFY pgrst, 'reload schema';
