-- 修复用户注册时username字段的自动同步
-- 更新触发器函数，优先使用用户提供的username，如果没有则生成默认值

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    -- 优先使用用户提供的username，如果为空则生成默认值
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'username', ''),
      CONCAT('user_', SUBSTRING(CAST(NEW.id AS TEXT), 1, 8))
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.created_at,
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 刷新 Supabase 客户端缓存
NOTIFY pgrst, 'reload schema'; 