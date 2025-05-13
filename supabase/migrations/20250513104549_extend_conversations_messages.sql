-- 扩展 conversations 表，添加与 Dify 集成相关的字段
DO $$
BEGIN
    -- 添加 external_id 字段（存储 Dify 中的会话 ID）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'external_id'
    ) THEN
        ALTER TABLE conversations ADD COLUMN external_id VARCHAR(255);
    END IF;

    -- 添加 app_id 字段（关联的 Dify 应用 ID）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'app_id'
    ) THEN
        ALTER TABLE conversations ADD COLUMN app_id VARCHAR(255);
    END IF;

    -- 添加 last_message_preview 字段（最后一条消息的预览）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'last_message_preview'
    ) THEN
        ALTER TABLE conversations ADD COLUMN last_message_preview TEXT;
    END IF;

    -- 扩展 messages 表，添加与 Dify 集成相关的字段
    -- 添加 external_id 字段（存储 Dify 中的消息 ID）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'external_id'
    ) THEN
        ALTER TABLE messages ADD COLUMN external_id VARCHAR(255);
    END IF;

    -- 添加 token_count 字段（消息的 token 数量）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'token_count'
    ) THEN
        ALTER TABLE messages ADD COLUMN token_count INTEGER;
    END IF;

    -- 添加 is_synced 字段（消息是否已同步到 Dify）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'is_synced'
    ) THEN
        ALTER TABLE messages ADD COLUMN is_synced BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 更新 conversations 表的 RLS 策略
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 创建或替换 conversations 表的安全策略
DROP POLICY IF EXISTS "用户可以查看自己的对话" ON conversations;
CREATE POLICY "用户可以查看自己的对话" ON conversations
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以创建自己的对话" ON conversations;
CREATE POLICY "用户可以创建自己的对话" ON conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以更新自己的对话" ON conversations;
CREATE POLICY "用户可以更新自己的对话" ON conversations
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以删除自己的对话" ON conversations;
CREATE POLICY "用户可以删除自己的对话" ON conversations
    FOR DELETE
    USING (auth.uid() = user_id);

-- 更新 messages 表的 RLS 策略
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 创建或替换 messages 表的安全策略
DROP POLICY IF EXISTS "用户可以查看自己对话中的消息" ON messages;
CREATE POLICY "用户可以查看自己对话中的消息" ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "用户可以创建自己对话中的消息" ON messages;
CREATE POLICY "用户可以创建自己对话中的消息" ON messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "用户可以更新自己对话中的消息" ON messages;
CREATE POLICY "用户可以更新自己对话中的消息" ON messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "用户可以删除自己对话中的消息" ON messages;
CREATE POLICY "用户可以删除自己对话中的消息" ON messages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );
