-- supabase/migrations/20250515132500_add_metadata_to_conversations.sql
DO $$
BEGIN
    -- 向 conversations 表添加 metadata 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' -- 确保是 public schema
        AND table_name = 'conversations' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.conversations -- 明确指定 schema
        ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb; 
        -- 使用 JSONB 类型，并设置一个空对象的默认值
    END IF;
END $$;

-- 为新列添加注释
COMMENT ON COLUMN public.conversations.metadata IS '用于存储对话的额外元数据，例如是否置顶、标签等。';
