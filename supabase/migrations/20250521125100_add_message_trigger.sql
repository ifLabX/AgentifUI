-- 创建更新对话最后消息预览的触发器函数
CREATE OR REPLACE FUNCTION update_conversation_last_message_preview()
RETURNS TRIGGER AS $$
BEGIN
  -- 只处理助手(assistant)角色的消息，通常这些是我们想在预览中显示的
  IF NEW.role = 'assistant' THEN
    -- 提取消息内容的前100个字符作为预览
    UPDATE conversations
    SET 
      last_message_preview = substring(NEW.content, 1, 100),
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器，在消息表插入新记录后执行
DROP TRIGGER IF EXISTS trigger_update_conversation_preview ON messages;
CREATE TRIGGER trigger_update_conversation_preview
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message_preview();

-- 添加注释说明触发器用途
COMMENT ON FUNCTION update_conversation_last_message_preview() IS '当新消息插入时，自动更新对应对话的最后消息预览';
COMMENT ON TRIGGER trigger_update_conversation_preview ON messages IS '在插入新消息后自动更新对话的最后消息预览'; 