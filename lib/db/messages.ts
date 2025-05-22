/**
 * 消息相关的数据库操作函数
 * 
 * 本文件包含与消息表(messages)相关的所有数据库操作
 */

import { createClient } from '@lib/supabase/client';
import { Message, MessageStatus } from '@lib/types/database';
import { ChatMessage } from '@lib/stores/chat-store';

/**
 * 保存消息到数据库
 * @param message 消息对象 
 * @returns 保存后的消息对象，如果保存失败则返回null
 */
export async function saveMessage(message: {
  conversation_id: string;
  user_id?: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  status?: MessageStatus;
  external_id?: string | null;
  token_count?: number | null;
}): Promise<Message | null> {
  const supabase = createClient();
  // --- BEGIN COMMENT ---
  // 保存消息到数据库
  // 注意：
  // 1. 消息状态默认为 'sent'
  // 2. is_synced 默认为 true (因为我们只存储已经发送给 Dify 或从 Dify 收到的消息)
  // 3. metadata 如果为空，使用空对象 {}
  // --- END COMMENT ---
  
  console.log(`[saveMessage] 开始保存消息，对话ID=${message.conversation_id}，角色=${message.role}`);
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: message.conversation_id,
      user_id: message.user_id,
      role: message.role,
      content: message.content,
      metadata: message.metadata || {},
      status: message.status || 'sent',
      external_id: message.external_id,
      token_count: message.token_count,
      is_synced: true
    })
    .select()
    .single();

  if (error) {
    console.error(`[saveMessage] 保存消息失败:`, error);
    return null;
  }

  console.log(`[saveMessage] 保存消息成功，消息ID=${data.id}`);
  return data as Message;
}

/**
 * 批量保存多条消息
 * @param messages 消息对象数组
 * @returns 保存成功的消息ID数组
 */
export async function saveMessages(messages: {
  conversation_id: string;
  user_id?: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  status?: MessageStatus;
  external_id?: string | null;
  token_count?: number | null;
}[]): Promise<string[]> {
  const supabase = createClient();
  // --- BEGIN COMMENT ---
  // 批量保存多条消息，便于一次性保存用户-助手消息对
  // --- END COMMENT ---
  
  if (!messages.length) {
    return [];
  }
  
  console.log(`[saveMessages] 开始批量保存${messages.length}条消息`);
  
  const { data, error } = await supabase
    .from('messages')
    .insert(messages.map(msg => ({
      conversation_id: msg.conversation_id,
      user_id: msg.user_id,
      role: msg.role,
      content: msg.content,
      metadata: msg.metadata || {},
      status: msg.status || 'sent',
      external_id: msg.external_id,
      token_count: msg.token_count,
      is_synced: true
    })))
    .select('id');

  if (error) {
    console.error(`[saveMessages] 批量保存消息失败:`, error);
    return [];
  }

  const savedIds = data.map((item: { id: string }) => item.id);
  console.log(`[saveMessages] 批量保存消息成功，保存了${savedIds.length}条消息`);
  return savedIds;
}

/**
 * 更新消息状态
 * @param messageId 消息ID
 * @param status 新状态
 * @returns 是否更新成功
 */
export async function updateMessageStatus(messageId: string, status: MessageStatus): Promise<boolean> {
  const supabase = createClient();
  // --- BEGIN COMMENT ---
  // 更新消息状态，用于处理消息发送后的状态变化
  // --- END COMMENT ---
  
  console.log(`[updateMessageStatus] 更新消息状态，消息ID=${messageId}，新状态=${status}`);
  
  const { error } = await supabase
    .from('messages')
    .update({ status })
    .eq('id', messageId);

  if (error) {
    console.error(`[updateMessageStatus] 更新消息状态失败:`, error);
    return false;
  }

  console.log(`[updateMessageStatus] 更新消息状态成功`);
  return true;
}

/**
 * 根据对话ID获取所有消息
 * @param conversationId 对话ID
 * @returns 消息数组
 */
export async function getMessagesByConversationId(conversationId: string): Promise<Message[]> {
  const supabase = createClient();
  // --- BEGIN COMMENT ---
  // 获取对话的所有消息，按创建时间排序
  // --- END COMMENT ---
  
  console.log(`[getMessagesByConversationId] 获取对话消息，对话ID=${conversationId}`);
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`[getMessagesByConversationId] 获取消息失败:`, error);
    return [];
  }

  console.log(`[getMessagesByConversationId] 获取消息成功，共${data.length}条消息`);
  return data as Message[];
}

/**
 * 将前端ChatMessage对象转换为数据库Message对象
 * @param chatMessage 前端消息对象
 * @param conversationId 对话ID
 * @param userId 用户ID (可选，用户消息需要)
 * @returns 数据库消息对象
 */
export function chatMessageToDbMessage(
  chatMessage: ChatMessage, 
  conversationId: string,
  userId?: string | null
): Omit<Message, 'id' | 'created_at' | 'is_synced'> {
  // --- BEGIN COMMENT ---
  // 将前端消息对象转换为数据库消息对象，用于保存
  // 注意：
  // 1. 用户消息需要传入userId，确保用户消息有正确的用户ID关联
  // 2. 助手消息的userId必须为null，符合数据库设计
  // 3. 如果没有指定role，根据isUser推断
  // 4. 消息状态默认为'sent'，除非有错误
  // 5. 如果消息被手动中断，添加相应的元数据标记
  // 6. 添加sequence_index确保用户-助手消息对的顺序正确
  // --- END COMMENT ---
  
  // 构建基础元数据
  const baseMetadata = chatMessage.metadata || {};
  
  // 如果消息被手动中断，确保元数据中包含中断标记
  if (chatMessage.wasManuallyStopped && !baseMetadata.stopped_manually) {
    baseMetadata.stopped_manually = true;
    baseMetadata.stopped_at = baseMetadata.stopped_at || new Date().toISOString();
  }
  
  // 如果有附件，确保添加到元数据中
  if (chatMessage.attachments && chatMessage.attachments.length > 0) {
    baseMetadata.attachments = chatMessage.attachments;
  }
  
  // 添加序列索引标记，确保用户消息总是排在对应的助手消息前面
  baseMetadata.sequence_index = chatMessage.isUser ? 0 : 1;
  
  return {
    conversation_id: conversationId,
    user_id: chatMessage.isUser ? (userId || null) : null, // 用户消息使用传入的userId，助手消息一定为null
    role: chatMessage.role || (chatMessage.isUser ? 'user' : 'assistant'),
    content: chatMessage.text,
    metadata: baseMetadata,
    status: chatMessage.error ? 'error' : 'sent',
    external_id: chatMessage.dify_message_id || null, // 使用消息中的dify_message_id作为external_id
    token_count: chatMessage.token_count || null
  };
}

/**
 * 创建错误占位助手消息
 * @param conversationId 对话ID
 * @param status 消息状态
 * @param errorMessage 错误信息
 * @returns 保存后的消息对象
 */
export async function createPlaceholderAssistantMessage(
  conversationId: string,
  status: MessageStatus = 'error',
  errorMessage: string | null = null
): Promise<Message | null> {
  // --- BEGIN COMMENT ---
  // 创建一个错误占位的助手消息
  // 用于确保即使助手回复出错，也能在数据库中保存一条记录
  // 确保用户消息和助手消息成对出现
  // --- END COMMENT ---
  
  console.log(`[createPlaceholderAssistantMessage] 创建占位助手消息，对话ID=${conversationId}`);
  
  return saveMessage({
    conversation_id: conversationId,
    user_id: null,
    role: 'assistant',
    content: errorMessage || '助手消息生成失败',
    metadata: { error: true, errorMessage, sequence_index: 1 },
    status
  });
}

/**
 * 根据内容和角色查询消息，用于检查重复
 */
export async function getMessageByContentAndRole(
  content: string, 
  role: 'user' | 'assistant' | 'system',
  conversationId: string
): Promise<Message | null> {
  const supabase = createClient();
  
  try {
    // --- BEGIN COMMENT ---
    // 使用完整内容进行精确匹配，而不是前缀匹配
    // 这样可以避免长消息被截断的问题
    // 尤其是对于助手消息，确保完整的回复内容能够被保存
    // --- END COMMENT ---
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('role', role)
      .eq('content', content) // 使用完整内容精确匹配，而不是前缀匹配
      .maybeSingle();
    
    if (error) {
      console.error('[getMessageByContentAndRole] 查询消息失败:', error);
      return null;
    }
    
    return data as Message;
  } catch (e) {
    console.error('[getMessageByContentAndRole] 查询消息异常:', e);
    return null;
  }
}
