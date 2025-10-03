-- 删除 service_instances 表的 name 字段
-- 在删除之前，确保 display_name 字段有值

-- 第一步：将 name 字段的值迁移到 display_name 字段（如果 display_name 为空）
UPDATE service_instances 
SET display_name = name 
WHERE display_name IS NULL OR display_name = '';

-- 第二步：删除 name 字段
ALTER TABLE service_instances DROP COLUMN IF EXISTS name;

-- 第三步：确保 display_name 字段不为空（设置默认值为 instance_id）
UPDATE service_instances 
SET display_name = instance_id 
WHERE display_name IS NULL OR display_name = '';

-- 第四步：添加注释说明变更
COMMENT ON TABLE service_instances IS '服务实例表 - 已移除 name 字段，使用 display_name 作为显示名称';

-- 输出操作结果
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- 统计受影响的记录数
  SELECT COUNT(*) INTO updated_count
  FROM service_instances 
  WHERE display_name IS NOT NULL;
  
  RAISE NOTICE '服务实例表 name 字段已删除，共有 % 条记录的 display_name 字段已确保有值', updated_count;
  
  -- 验证没有空的 display_name
  IF EXISTS (
    SELECT 1 FROM service_instances 
    WHERE display_name IS NULL OR display_name = ''
  ) THEN
    RAISE EXCEPTION '仍存在空的 display_name 字段，迁移失败';
  END IF;
  
  RAISE NOTICE 'name 字段删除迁移完成，所有记录的 display_name 字段都有有效值';
END $$; 