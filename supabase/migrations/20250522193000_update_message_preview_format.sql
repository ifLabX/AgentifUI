-- 更新消息预览格式，在截断的消息末尾添加省略号
CREATE OR REPLACE FUNCTION update_conversation_last_message_preview()
RETURNS TRIGGER AS $$
BEGIN
  -- 只处理助手(assistant)角色的消息，通常这些是我们想在预览中显示的
  IF NEW.role = 'assistant' THEN
    -- 提取消息内容的前100个字符作为预览，并在末尾添加省略号
    -- 如果消息长度超过100个字符，则添加省略号，否则保持原样
    UPDATE conversations
    SET 
      last_message_preview = CASE 
        WHEN length(NEW.content) > 100 THEN substring(NEW.content, 1, 100) || '...'
        ELSE NEW.content
      END,
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 触发器无需重新创建，因为我们只是更新了函数实现

-- 添加注释说明更新的用途
COMMENT ON FUNCTION update_conversation_last_message_preview() IS '当新消息插入时，自动更新对应对话的最后消息预览，并在截断的消息末尾添加省略号';
