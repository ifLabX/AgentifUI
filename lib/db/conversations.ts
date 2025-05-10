/**
 * 对话相关的数据库查询函数
 * 
 * 本文件包含与对话表(conversations)和消息表(messages)相关的所有数据库操作
 */

import { createClient } from '@supabase/supabase-js';
import { Conversation, Message } from '../types/database';

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * 获取用户的所有对话
 * @param userId 用户ID
 * @returns 对话列表
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('获取用户对话失败:', error);
    return [];
  }

  return data as Conversation[];
}

/**
 * 获取对话详情
 * @param conversationId 对话ID
 * @returns 对话对象，如果未找到则返回null
 */
export async function getConversationById(conversationId: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error || !data) {
    console.error('获取对话详情失败:', error);
    return null;
  }

  return data as Conversation;
}

/**
 * 创建新的对话
 * @param conversation 对话对象
 * @returns 创建的对话对象，如果创建失败则返回null
 */
export async function createConversation(
  conversation: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .insert(conversation)
    .select()
    .single();

  if (error || !data) {
    console.error('创建对话失败:', error);
    return null;
  }

  return data as Conversation;
}

/**
 * 更新对话
 * @param id 对话ID
 * @param updates 需要更新的字段
 * @returns 更新后的对话对象，如果更新失败则返回null
 */
export async function updateConversation(
  id: string,
  updates: Partial<Omit<Conversation, 'id' | 'created_at' | 'updated_at'>>
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('更新对话失败:', error);
    return null;
  }

  return data as Conversation;
}

/**
 * 删除对话（软删除，将状态设置为deleted）
 * @param id 对话ID
 * @returns 是否删除成功
 */
export async function deleteConversation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('conversations')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('删除对话失败:', error);
    return false;
  }

  return true;
}

/**
 * 获取对话的所有消息
 * @param conversationId 对话ID
 * @returns 消息列表
 */
export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at');

  if (error) {
    console.error('获取对话消息失败:', error);
    return [];
  }

  return data as Message[];
}

/**
 * 添加消息到对话
 * @param message 消息对象
 * @returns 创建的消息对象，如果创建失败则返回null
 */
export async function addMessageToConversation(
  message: Omit<Message, 'id' | 'created_at'>
): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert(message)
    .select()
    .single();

  if (error || !data) {
    console.error('添加消息失败:', error);
    return null;
  }

  // 更新对话的最后更新时间
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', message.conversation_id);

  return data as Message;
}

/**
 * 更新消息状态
 * @param id 消息ID
 * @param status 新状态
 * @returns 是否更新成功
 */
export async function updateMessageStatus(id: string, status: Message['status']): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('更新消息状态失败:', error);
    return false;
  }

  return true;
}
