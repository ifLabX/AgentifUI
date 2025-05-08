-- 添加角色字段到 profiles 表
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 创建管理员角色检查约束
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_role_check'
  ) THEN
    EXECUTE 'ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN (''user'', ''admin''))';
  END IF;
END
$$;

-- 创建 RLS 策略，只允许管理员访问 API 密钥表
-- 首先尝试删除现有策略（如果存在）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = '允许管理员管理 API 密钥'
  ) THEN
    DROP POLICY "允许管理员管理 API 密钥" ON public.api_keys;
  END IF;
END
$$;

-- 然后创建策略
CREATE POLICY "允许管理员管理 API 密钥" ON public.api_keys
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- 创建 RLS 策略，只允许管理员管理提供商表
-- 首先尝试删除现有策略（如果存在）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'providers' AND policyname = '允许管理员管理提供商'
  ) THEN
    DROP POLICY "允许管理员管理提供商" ON public.providers;
  END IF;
END
$$;

-- 然后创建策略
CREATE POLICY "允许管理员管理提供商" ON public.providers
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- 创建 RLS 策略，只允许管理员管理服务实例表
-- 首先尝试删除现有策略（如果存在）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'service_instances' AND policyname = '允许管理员管理服务实例'
  ) THEN
    DROP POLICY "允许管理员管理服务实例" ON public.service_instances;
  END IF;
END
$$;

-- 然后创建策略
CREATE POLICY "允许管理员管理服务实例" ON public.service_instances
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- 创建管理员初始化函数
CREATE OR REPLACE FUNCTION public.initialize_admin(admin_email TEXT)
RETURNS VOID AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- 查找用户 ID
  SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
  
  IF admin_id IS NULL THEN
    RAISE EXCEPTION '用户 % 不存在', admin_email;
  END IF;
  
  -- 设置为管理员
  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = admin_id;
  
  RAISE NOTICE '用户 % 已设置为管理员', admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
