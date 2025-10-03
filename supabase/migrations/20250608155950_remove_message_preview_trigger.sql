-- 删除消息预览触发器，改为在应用层统一处理
-- 这样可以更好地处理带推理文本的助手消息

-- 删除触发器
DROP TRIGGER IF EXISTS trigger_update_conversation_preview ON messages;

-- 删除触发器函数
DROP FUNCTION IF EXISTS update_conversation_last_message_preview();

-- 添加注释说明变更原因
COMMENT ON TABLE conversations IS '对话表 - last_message_preview字段现在由应用层在保存消息时统一更新，支持智能提取主要内容'; 