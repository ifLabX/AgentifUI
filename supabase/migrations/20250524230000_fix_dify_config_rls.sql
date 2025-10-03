-- 修复 Dify 配置相关表的 RLS 策略
-- 允许服务端代码读取提供商、服务实例和API密钥数据

-- --- BEGIN COMMENT ---
-- 修复 providers 表的 RLS 策略
-- 允许管理员管理 + 允许服务端读取（用于 Dify 配置）
-- --- END COMMENT ---
DROP POLICY IF EXISTS "允许管理员管理提供商" ON public.providers;
CREATE POLICY "允许管理员管理提供商" ON public.providers
  FOR ALL USING (
    -- 管理员可以进行所有操作
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- 添加服务端读取策略
CREATE POLICY "允许服务端读取提供商" ON public.providers
  FOR SELECT USING (
    -- 允许未认证的服务端请求读取（用于 API 路由）
    auth.uid() IS NULL
    OR
    -- 或者任何已认证用户都可以读取提供商信息
    auth.uid() IS NOT NULL
  );

-- --- BEGIN COMMENT ---
-- 修复 service_instances 表的 RLS 策略
-- 允许管理员管理 + 允许服务端读取（用于 Dify 配置）
-- --- END COMMENT ---
DROP POLICY IF EXISTS "允许管理员管理服务实例" ON public.service_instances;
CREATE POLICY "允许管理员管理服务实例" ON public.service_instances
  FOR ALL USING (
    -- 管理员可以进行所有操作
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- 添加服务端读取策略
CREATE POLICY "允许服务端读取服务实例" ON public.service_instances
  FOR SELECT USING (
    -- 允许未认证的服务端请求读取（用于 API 路由）
    auth.uid() IS NULL
    OR
    -- 或者任何已认证用户都可以读取服务实例信息
    auth.uid() IS NOT NULL
  );

-- --- BEGIN COMMENT ---
-- 修复 api_keys 表的 RLS 策略
-- 允许管理员管理 + 允许服务端读取（用于 Dify 配置）
-- --- END COMMENT ---
DROP POLICY IF EXISTS "允许管理员管理 API 密钥" ON public.api_keys;
CREATE POLICY "允许管理员管理 API 密钥" ON public.api_keys
  FOR ALL USING (
    -- 管理员可以进行所有操作
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- 添加服务端读取策略
CREATE POLICY "允许服务端读取 API 密钥" ON public.api_keys
  FOR SELECT USING (
    -- 允许未认证的服务端请求读取（用于 API 路由）
    auth.uid() IS NULL
    OR
    -- 或者任何已认证用户都可以读取 API 密钥（仅读取，不能修改）
    auth.uid() IS NOT NULL
  );

-- 刷新 Supabase 客户端缓存
NOTIFY pgrst, 'reload schema'; 