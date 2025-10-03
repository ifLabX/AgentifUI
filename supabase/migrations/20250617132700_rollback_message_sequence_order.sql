-- 回滚消息序列排序优化
-- 完全撤销20250617114003_optimize_message_sequence_order.sql的所有修改
-- 
-- 回滚内容：
-- 1. 删除sequence_order字段
-- 2. 删除相关索引
-- 3. 删除相关约束
-- 4. 恢复到优化前的状态

-- 第一步：删除数据约束
DO $$
BEGIN
    -- 删除sequence_order字段的检查约束
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_messages_sequence_order' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE messages DROP CONSTRAINT chk_messages_sequence_order;
        RAISE NOTICE '已删除 sequence_order 字段约束';
    ELSE
        RAISE NOTICE 'sequence_order 字段约束不存在，跳过删除';
    END IF;
END $$;

-- 第二步：删除相关索引
DO $$
BEGIN
    -- 删除conversation_time_sequence索引
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_messages_conversation_time_sequence'
    ) THEN
        DROP INDEX idx_messages_conversation_time_sequence;
        RAISE NOTICE '已删除 idx_messages_conversation_time_sequence 索引';
    ELSE
        RAISE NOTICE 'idx_messages_conversation_time_sequence 索引不存在，跳过删除';
    END IF;
    
    -- 删除stable_sort索引
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_messages_conversation_stable_sort'
    ) THEN
        DROP INDEX idx_messages_conversation_stable_sort;
        RAISE NOTICE '已删除 idx_messages_conversation_stable_sort 索引';
    ELSE
        RAISE NOTICE 'idx_messages_conversation_stable_sort 索引不存在，跳过删除';
    END IF;
END $$;

-- 第三步：删除sequence_order字段
DO $$
BEGIN
    -- 检查字段是否存在
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'sequence_order'
    ) THEN
        -- 删除字段
        ALTER TABLE messages DROP COLUMN sequence_order;
        RAISE NOTICE '已删除 sequence_order 字段';
    ELSE
        RAISE NOTICE 'sequence_order 字段不存在，跳过删除';
    END IF;
END $$;

-- 第四步：验证回滚结果
DO $$
DECLARE
    total_count INTEGER;
    field_exists BOOLEAN;
    index_count INTEGER;
    constraint_count INTEGER;
BEGIN
    -- 检查字段是否已删除
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'sequence_order'
    ) INTO field_exists;
    
    -- 检查索引是否已删除
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE indexname IN ('idx_messages_conversation_time_sequence', 'idx_messages_conversation_stable_sort');
    
    -- 检查约束是否已删除
    SELECT COUNT(*) INTO constraint_count 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'chk_messages_sequence_order' AND table_name = 'messages';
    
    -- 统计消息总数
    SELECT COUNT(*) INTO total_count FROM messages;
    
    -- 输出回滚结果报告
    RAISE NOTICE '=== 序列字段回滚结果报告 ===';
    RAISE NOTICE '消息总数: %', total_count;
    RAISE NOTICE 'sequence_order字段存在: %', CASE WHEN field_exists THEN '是' ELSE '否' END;
    RAISE NOTICE '相关索引数量: %', index_count;
    RAISE NOTICE '相关约束数量: %', constraint_count;
    
    -- 检查回滚是否成功
    IF NOT field_exists AND index_count = 0 AND constraint_count = 0 THEN
        RAISE NOTICE '✅ 回滚完成，sequence_order 相关修改已完全撤销';
    ELSE
        RAISE WARNING '⚠️  回滚可能未完全成功，请检查:';
        IF field_exists THEN
            RAISE WARNING '- sequence_order 字段仍然存在';
        END IF;
        IF index_count > 0 THEN
            RAISE WARNING '- 仍有 % 个相关索引未删除', index_count;
        END IF;
        IF constraint_count > 0 THEN
            RAISE WARNING '- 仍有 % 个相关约束未删除', constraint_count;
        END IF;
    END IF;
END $$;

-- 第五步：恢复提示
DO $$
BEGIN
    RAISE NOTICE '=== 回滚完成提示 ===';
    RAISE NOTICE '1. sequence_order 字段及相关索引已删除';
    RAISE NOTICE '2. 应用层应恢复使用 metadata.sequence_index 进行排序';
    RAISE NOTICE '3. 查询应恢复为客户端排序方式';
    RAISE NOTICE '4. 数据库结构已恢复到优化前状态';
END $$;

-- 回滚完成确认
SELECT 
    '消息序列字段回滚完成' as status,
    COUNT(*) as total_messages,
    'sequence_order字段已删除' as field_status
FROM messages; 