/**
 * 消息相关的数据库操作函数
 * 
 * 本文件包含与消息表(messages)相关的所有数据库操作
 * 更新为使用新的messageService和统一数据服务，同时保留兼容版本
 */

import { messageService } from '@lib/services/message-service';
import { dataService } from '@lib/services/data-service';
import { Result, success, failure } from '@lib/types/result';
import { createClient } from '@lib/supabase/client';
import { Message, MessageStatus } from '@lib/types/database';
import { ChatMessage } from '@lib/stores/chat-store';

// 保持与现有代码的兼容性
const supabase = createClient();

/**
 * 保存消息到数据库（优化版本）
 * @param message 消息对象 
 * @returns 保存后的消息对象Result，如果保存失败则返回错误
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
}): Promise<Result<Message>> {
  console.log(`[saveMessage] 开始保存消息，对话ID=${message.conversation_id}，角色=${message.role}`);
  
  const result = await messageService.saveMessage(message);
  
  if (result.success) {
    console.log(`[saveMessage] 保存消息成功，消息ID=${result.data.id}`);
  } else {
    console.error(`[saveMessage] 保存消息失败:`, result.error);
  }
  
  return result;
}

/**
 * 批量保存多条消息（优化版本）
 * @param messages 消息对象数组
 * @returns 保存成功的消息ID数组Result
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
}[]): Promise<Result<string[]>> {
  if (!messages.length) {
    return success([]);
  }
  
  console.log(`[saveMessages] 开始批量保存${messages.length}条消息`);
  
  const result = await messageService.saveMessages(messages);
  
  if (result.success) {
    console.log(`[saveMessages] 批量保存消息成功，保存了${result.data.length}条消息`);
  } else {
    console.error(`[saveMessages] 批量保存消息失败:`, result.error);
  }
  
  return result;
}

/**
 * 更新消息状态（优化版本）
 * @param messageId 消息ID
 * @param status 新状态
 * @returns 是否更新成功的Result
 */
export async function updateMessageStatus(messageId: string, status: MessageStatus): Promise<Result<boolean>> {
  console.log(`[updateMessageStatus] 更新消息状态，消息ID=${messageId}，新状态=${status}`);
  
  const result = await messageService.updateMessageStatus(messageId, status);
  
  if (result.success) {
    console.log(`[updateMessageStatus] 更新消息状态成功`);
    return success(true);
  } else {
    console.error(`[updateMessageStatus] 更新消息状态失败:`, result.error);
    return success(false);
  }
}

/**
 * 根据对话ID获取所有消息（优化版本）
 * @param conversationId 对话ID
 * @returns 消息数组Result
 */
export async function getMessagesByConversationId(conversationId: string): Promise<Result<Message[]>> {
  console.log(`[getMessagesByConversationId] 获取对话消息，对话ID=${conversationId}`);
  
  const result = await messageService.getLatestMessages(conversationId, 1000, { cache: true }); // 获取大量消息
  
  if (result.success) {
    console.log(`[getMessagesByConversationId] 获取消息成功，共${result.data.length}条消息`);
  } else {
    console.error(`[getMessagesByConversationId] 获取消息失败:`, result.error);
  }
  
  return result;
}

/**
 * 将前端ChatMessage对象转换为数据库Message对象（使用messageService）
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
  // 使用messageService中的转换函数，确保一致性
  // --- END COMMENT ---
  
  return messageService.chatMessageToDbMessage(chatMessage, conversationId, userId);
}

/**
 * 创建错误占位助手消息（优化版本）
 * @param conversationId 对话ID
 * @param status 消息状态
 * @param errorMessage 错误信息
 * @returns 保存后的消息对象Result
 */
export async function createPlaceholderAssistantMessage(
  conversationId: string,
  status: MessageStatus = 'error',
  errorMessage: string | null = null
): Promise<Result<Message>> {
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
 * 根据内容和角色查询消息，用于检查重复（优化版本）
 */
export async function getMessageByContentAndRole(
  content: string, 
  role: 'user' | 'assistant' | 'system',
  conversationId: string
): Promise<Result<Message | null>> {
  try {
    // --- BEGIN COMMENT ---
    // 使用messageService中的查找重复消息功能
    // --- END COMMENT ---
    const result = await messageService.findDuplicateMessage(content, role, conversationId);
    
    if (result.success) {
      return result;
    } else {
      console.error('[getMessageByContentAndRole] 查询消息失败:', result.error);
      return result;
    }
  } catch (e) {
    console.error('[getMessageByContentAndRole] 查询消息异常:', e);
    return failure(e instanceof Error ? e : new Error(String(e)));
  }
}

// --- BEGIN COMMENT ---
// 兼容性函数，保持与现有代码的兼容性
// 这些函数将逐步迁移到使用Result类型
// --- END COMMENT ---

/**
 * 保存消息到数据库（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function saveMessageLegacy(message: {
  conversation_id: string;
  user_id?: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  status?: MessageStatus;
  external_id?: string | null;
  token_count?: number | null;
}): Promise<Message | null> {
  const result = await saveMessage(message);
  return result.success ? result.data : null;
}

/**
 * 批量保存多条消息（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function saveMessagesLegacy(messages: {
  conversation_id: string;
  user_id?: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  status?: MessageStatus;
  external_id?: string | null;
  token_count?: number | null;
}[]): Promise<string[]> {
  const result = await saveMessages(messages);
  return result.success ? result.data : [];
}

/**
 * 更新消息状态（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function updateMessageStatusLegacy(messageId: string, status: MessageStatus): Promise<boolean> {
  const result = await updateMessageStatus(messageId, status);
  return result.success ? result.data : false;
}

/**
 * 根据对话ID获取所有消息（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function getMessagesByConversationIdLegacy(conversationId: string): Promise<Message[]> {
  const result = await getMessagesByConversationId(conversationId);
  return result.success ? result.data : [];
}

/**
 * 创建错误占位助手消息（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function createPlaceholderAssistantMessageLegacy(
  conversationId: string,
  status: MessageStatus = 'error',
  errorMessage: string | null = null
): Promise<Message | null> {
  const result = await createPlaceholderAssistantMessage(conversationId, status, errorMessage);
  return result.success ? result.data : null;
}

/**
 * 根据内容和角色查询消息，用于检查重复（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function getMessageByContentAndRoleLegacy(
  content: string, 
  role: 'user' | 'assistant' | 'system',
  conversationId: string
): Promise<Message | null> {
  const result = await getMessageByContentAndRole(content, role, conversationId);
  return result.success ? result.data : null;
}
