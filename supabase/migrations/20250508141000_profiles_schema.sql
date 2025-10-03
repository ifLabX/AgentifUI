-- 从 profiles 表中删除 website 列

-- 检查 profiles 表结构
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- 检查 website 列是否存在
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'website'
  ) INTO column_exists;

  -- 如果 website 列存在，则删除它
  IF column_exists THEN
    EXECUTE 'ALTER TABLE public.profiles DROP COLUMN website';
  END IF;
END
$$;
