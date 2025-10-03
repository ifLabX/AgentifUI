-- 扩展服务实例表，添加描述字段
ALTER TABLE service_instances 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- 添加显示名称字段
ALTER TABLE service_instances 
ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT '';

-- 确保 instance_id 不为空且唯一
ALTER TABLE service_instances 
ALTER COLUMN instance_id SET NOT NULL;

-- 添加唯一约束
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_instances_provider_id_instance_id_key'
  ) THEN
    ALTER TABLE service_instances 
    ADD CONSTRAINT service_instances_provider_id_instance_id_key 
    UNIQUE (provider_id, instance_id);
  END IF;
END $$;
