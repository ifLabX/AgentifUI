-- 修复 api_keys 表结构
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS service_instance_id UUID REFERENCES service_instances(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_api_keys_service_instance_id ON api_keys(service_instance_id);

-- 修复 ON CONFLICT 约束
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'providers_name_key'
  ) THEN
    ALTER TABLE providers ADD CONSTRAINT providers_name_key UNIQUE (name);
  END IF;
END $$;

-- 初始化 Dify 配置数据
DO $$
DECLARE
    dify_provider_id UUID;
    dify_instance_id UUID;
    dify_api_key TEXT := 'app-xxxxxxxxxxxxxxxxxxxx'; -- 测试密钥，实际使用时请修改
    dify_api_url TEXT := 'https://api.dify.ai/v1'; -- 默认 URL
BEGIN
    -- 删除现有数据（仅用于测试，实际使用时请将此部分注释）
    DELETE FROM api_keys WHERE provider_id IN (SELECT id FROM providers WHERE name = 'Dify');
    DELETE FROM service_instances WHERE provider_id IN (SELECT id FROM providers WHERE name = 'Dify');
    DELETE FROM providers WHERE name = 'Dify';
    
    -- 插入 Dify 提供商记录
    INSERT INTO providers (name, type, base_url, auth_type)
    VALUES ('Dify', 'llm', dify_api_url, 'api_key')
    RETURNING id INTO dify_provider_id;
    
    -- 插入默认服务实例
    INSERT INTO service_instances (provider_id, name, is_default, instance_id)
    VALUES (dify_provider_id, 'Default Dify Instance', TRUE, 'default')
    RETURNING id INTO dify_instance_id;
    
    -- 插入 API 密钥
    INSERT INTO api_keys (provider_id, service_instance_id, key_value, is_default)
    VALUES (dify_provider_id, dify_instance_id, dify_api_key, TRUE);
    
    -- 输出调试信息
    RAISE NOTICE 'Dify 配置已初始化: 提供商 ID = %, 服务实例 ID = %', dify_provider_id, dify_instance_id;
    
    -- 更新现有的 API 密钥记录，添加 service_instance_id 字段
    UPDATE api_keys
    SET service_instance_id = dify_instance_id
    WHERE provider_id = dify_provider_id AND service_instance_id IS NULL;
    
    -- 检查是否成功创建记录
    IF NOT EXISTS (SELECT 1 FROM providers WHERE name = 'Dify') THEN
        RAISE EXCEPTION 'Failed to create Dify provider record';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM service_instances WHERE provider_id = dify_provider_id) THEN
        RAISE EXCEPTION 'Failed to create Dify service instance record';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM api_keys WHERE provider_id = dify_provider_id) THEN
        RAISE EXCEPTION 'Failed to create Dify API key record';
    END IF;
END $$;
