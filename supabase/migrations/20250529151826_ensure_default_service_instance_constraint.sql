-- 确保默认服务实例的唯一性约束
-- 该迁移确保在每个提供商下最多只能有一个默认服务实例

-- 首先，修复可能存在的多个默认应用问题
-- 保留最新创建的默认应用，其他的设置为非默认
WITH default_instances AS (
  SELECT 
    id,
    provider_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY provider_id 
      ORDER BY created_at DESC, id DESC
    ) as rn
  FROM service_instances 
  WHERE is_default = TRUE
)
UPDATE service_instances 
SET is_default = FALSE 
WHERE id IN (
  SELECT id 
  FROM default_instances 
  WHERE rn > 1
);

-- 添加部分唯一约束：在同一提供商下，最多只能有一个默认应用
-- 使用部分唯一索引，只对 is_default = TRUE 的记录生效
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_instances_unique_default_per_provider
ON service_instances (provider_id)
WHERE is_default = TRUE;

-- 添加注释说明约束的作用
COMMENT ON INDEX idx_service_instances_unique_default_per_provider 
IS '确保在同一提供商下最多只能有一个默认服务实例';

-- 输出操作结果
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  -- 统计修复的记录数
  SELECT COUNT(*) INTO fixed_count
  FROM service_instances 
  WHERE is_default = TRUE;
  
  RAISE NOTICE '默认应用唯一性约束已添加，当前默认应用数量: %', fixed_count;
  
  -- 检查是否有重复的默认应用
  IF EXISTS (
    SELECT provider_id 
    FROM service_instances 
    WHERE is_default = TRUE 
    GROUP BY provider_id 
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION '仍存在重复的默认应用，约束添加失败';
  END IF;
  
  RAISE NOTICE '默认应用唯一性约束验证通过';
END $$; 