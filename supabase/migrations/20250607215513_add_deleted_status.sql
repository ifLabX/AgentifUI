-- 添加 'deleted' 状态到 execution_status 枚举
-- 用于支持软删除功能

-- 添加新的枚举值
ALTER TYPE execution_status ADD VALUE 'deleted';

-- 添加注释说明
COMMENT ON TYPE execution_status IS '执行状态枚举：pending(等待中), running(运行中), completed(已完成), failed(失败), stopped(已停止), deleted(已删除)';

-- 输出更新结果
DO $$
BEGIN
  RAISE NOTICE 'execution_status 枚举已更新，新增 deleted 状态';
  RAISE NOTICE '现在支持软删除功能';
END $$; 