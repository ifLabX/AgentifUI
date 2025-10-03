-- 添加默认提供商支持
-- 创建时间: 2025-06-15 18:39:42
-- 目的: 支持多提供商环境下的默认提供商管理

-- 1. 添加 is_default 字段到 providers 表
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- 2. 创建唯一约束，确保只有一个默认提供商
-- 使用部分唯一索引，只对 is_default = true 的记录创建唯一约束
CREATE UNIQUE INDEX IF NOT EXISTS providers_unique_default 
ON providers (is_default) 
WHERE is_default = true;

-- 3. 为现有提供商设置默认值
-- 如果当前没有任何默认提供商，将第一个活跃提供商设为默认
DO $$
DECLARE
    default_count INTEGER;
    first_provider_id UUID;
BEGIN
    -- 检查是否已有默认提供商
    SELECT COUNT(*) INTO default_count 
    FROM providers 
    WHERE is_default = true AND is_active = true;
    
    -- 如果没有默认提供商，设置第一个活跃提供商为默认
    IF default_count = 0 THEN
        -- 获取第一个活跃提供商的ID（按创建时间排序）
        SELECT id INTO first_provider_id 
        FROM providers 
        WHERE is_active = true 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        -- 如果找到了活跃提供商，设为默认
        IF first_provider_id IS NOT NULL THEN
            UPDATE providers 
            SET is_default = true 
            WHERE id = first_provider_id;
            
            RAISE NOTICE '已将提供商 % 设为默认提供商', first_provider_id;
        ELSE
            RAISE NOTICE '未找到活跃的提供商，无法设置默认提供商';
        END IF;
    ELSE
        RAISE NOTICE '已存在 % 个默认提供商，无需设置', default_count;
    END IF;
END $$;

-- 4. 创建触发器函数，确保默认提供商的唯一性
CREATE OR REPLACE FUNCTION ensure_single_default_provider()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果新记录或更新后的记录被设为默认
    IF NEW.is_default = true THEN
        -- 将其他所有提供商的 is_default 设为 false
        UPDATE providers 
        SET is_default = false 
        WHERE id != NEW.id AND is_default = true;
        
        RAISE NOTICE '已将提供商 % 设为唯一的默认提供商', NEW.name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 创建触发器
DROP TRIGGER IF EXISTS trigger_ensure_single_default_provider ON providers;
CREATE TRIGGER trigger_ensure_single_default_provider
    AFTER INSERT OR UPDATE ON providers
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION ensure_single_default_provider();

-- 6. 创建触发器函数，防止删除最后一个默认提供商
CREATE OR REPLACE FUNCTION prevent_delete_last_default_provider()
RETURNS TRIGGER AS $$
DECLARE
    remaining_active_count INTEGER;
    remaining_default_count INTEGER;
BEGIN
    -- 如果删除的是默认提供商
    IF OLD.is_default = true AND OLD.is_active = true THEN
        -- 检查删除后还有多少个活跃的提供商
        SELECT COUNT(*) INTO remaining_active_count 
        FROM providers 
        WHERE is_active = true AND id != OLD.id;
        
        -- 检查删除后还有多少个默认提供商
        SELECT COUNT(*) INTO remaining_default_count 
        FROM providers 
        WHERE is_default = true AND is_active = true AND id != OLD.id;
        
        -- 如果删除后没有默认提供商，但还有其他活跃提供商
        IF remaining_default_count = 0 AND remaining_active_count > 0 THEN
            -- 自动将第一个活跃提供商设为默认
            UPDATE providers 
            SET is_default = true 
            WHERE is_active = true 
              AND id != OLD.id 
              AND id = (
                  SELECT id 
                  FROM providers 
                  WHERE is_active = true AND id != OLD.id 
                  ORDER BY created_at ASC 
                  LIMIT 1
              );
              
            RAISE NOTICE '删除默认提供商后，已自动设置新的默认提供商';
        END IF;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 7. 创建删除触发器
DROP TRIGGER IF EXISTS trigger_prevent_delete_last_default_provider ON providers;
CREATE TRIGGER trigger_prevent_delete_last_default_provider
    BEFORE DELETE ON providers
    FOR EACH ROW
    EXECUTE FUNCTION prevent_delete_last_default_provider();

-- 8. 添加注释
COMMENT ON COLUMN providers.is_default IS '标记是否为默认提供商，系统中只能有一个默认提供商';
COMMENT ON INDEX providers_unique_default IS '确保只有一个提供商被标记为默认';
COMMENT ON FUNCTION ensure_single_default_provider() IS '确保系统中只有一个默认提供商的触发器函数';
COMMENT ON FUNCTION prevent_delete_last_default_provider() IS '防止删除最后一个默认提供商，自动设置新的默认提供商';

-- 9. 验证迁移结果
DO $$
DECLARE
    total_providers INTEGER;
    default_providers INTEGER;
    active_providers INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_providers FROM providers;
    SELECT COUNT(*) INTO default_providers FROM providers WHERE is_default = true;
    SELECT COUNT(*) INTO active_providers FROM providers WHERE is_active = true;
    
    RAISE NOTICE '迁移完成统计:';
    RAISE NOTICE '- 总提供商数量: %', total_providers;
    RAISE NOTICE '- 活跃提供商数量: %', active_providers;
    RAISE NOTICE '- 默认提供商数量: %', default_providers;
    
    -- 验证约束
    IF default_providers > 1 THEN
        RAISE EXCEPTION '错误: 发现多个默认提供商，违反唯一性约束';
    END IF;
    
    IF active_providers > 0 AND default_providers = 0 THEN
        RAISE WARNING '警告: 存在活跃提供商但没有默认提供商';
    END IF;
    
    RAISE NOTICE '✅ 默认提供商迁移验证通过';
END $$; 