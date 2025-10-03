-- 确保API相关表启用行级安全策略(RLS)
-- 检查api_keys, service_instances, providers三个表的RLS状态
-- 如果未启用则自动启用，已启用则跳过

-- 1. 检查并启用api_keys表的RLS
DO $$
BEGIN
  -- 检查api_keys表是否已启用RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'api_keys' 
    AND rowsecurity = true
  ) THEN
    -- 如果未启用，则启用RLS
    ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS已启用：api_keys表';
  ELSE
    RAISE NOTICE 'RLS已存在：api_keys表，跳过启用';
  END IF;
END $$;

-- 2. 检查并启用service_instances表的RLS
DO $$
BEGIN
  -- 检查service_instances表是否已启用RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'service_instances' 
    AND rowsecurity = true
  ) THEN
    -- 如果未启用，则启用RLS
    ALTER TABLE public.service_instances ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS已启用：service_instances表';
  ELSE
    RAISE NOTICE 'RLS已存在：service_instances表，跳过启用';
  END IF;
END $$;

-- 3. 检查并启用providers表的RLS
DO $$
BEGIN
  -- 检查providers表是否已启用RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'providers' 
    AND rowsecurity = true
  ) THEN
    -- 如果未启用，则启用RLS
    ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS已启用：providers表';
  ELSE
    RAISE NOTICE 'RLS已存在：providers表，跳过启用';
  END IF;
END $$;

-- 4. 验证所有表的RLS状态
DO $$
DECLARE
  api_keys_rls BOOLEAN;
  service_instances_rls BOOLEAN;
  providers_rls BOOLEAN;
BEGIN
  -- 查询所有表的RLS状态
  SELECT rowsecurity INTO api_keys_rls 
  FROM pg_tables 
  WHERE schemaname = 'public' AND tablename = 'api_keys';
  
  SELECT rowsecurity INTO service_instances_rls 
  FROM pg_tables 
  WHERE schemaname = 'public' AND tablename = 'service_instances';
  
  SELECT rowsecurity INTO providers_rls 
  FROM pg_tables 
  WHERE schemaname = 'public' AND tablename = 'providers';
  
  -- 输出验证结果
  RAISE NOTICE '=== RLS状态验证结果 ===';
  RAISE NOTICE 'api_keys表RLS状态: %', COALESCE(api_keys_rls::TEXT, 'NULL');
  RAISE NOTICE 'service_instances表RLS状态: %', COALESCE(service_instances_rls::TEXT, 'NULL');
  RAISE NOTICE 'providers表RLS状态: %', COALESCE(providers_rls::TEXT, 'NULL');
  
  -- 确保所有表都启用了RLS
  IF COALESCE(api_keys_rls, false) AND 
     COALESCE(service_instances_rls, false) AND 
     COALESCE(providers_rls, false) THEN
    RAISE NOTICE '✅ 所有API相关表的RLS都已正确启用';
  ELSE
    RAISE WARNING '⚠️ 某些表的RLS状态异常，请检查';
  END IF;
END $$;

-- 5. 添加注释说明
COMMENT ON TABLE public.api_keys IS 'API密钥表 - RLS已启用，确保数据安全';
COMMENT ON TABLE public.service_instances IS '服务实例表 - RLS已启用，确保数据安全';
COMMENT ON TABLE public.providers IS '服务提供商表 - RLS已启用，确保数据安全'; 