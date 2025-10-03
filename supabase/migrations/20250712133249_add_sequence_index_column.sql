-- Migration: 20250712133249_add_sequence_index_column.sql
-- Description: Add sequence_index column to messages table, add indexes for efficient sorting
-- Impact: Add new column and indexes, no existing data impact
-- Risk: Low

-- 1. 新增字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
        AND column_name = 'sequence_index'
    ) THEN
        ALTER TABLE messages ADD COLUMN sequence_index INT DEFAULT 0;
    END IF;
END $$;

-- 2. 创建高性能复合索引（用于分页和排序）
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time_sequence
ON messages(conversation_id, created_at ASC, sequence_index ASC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_stable_sort
ON messages(conversation_id, created_at ASC, sequence_index ASC, id ASC);

-- 3. 数据库排序要求
-- 查询消息时，务必使用如下排序：
-- ORDER BY created_at ASC, sequence_index ASC, id ASC 