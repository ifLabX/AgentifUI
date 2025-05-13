/**
 * 对话相关的数据库查询函数
 * 
 * 本文件包含与对话表(conversations)和消息表(messages)相关的所有数据库操作
 */

import { createClient } from '../supabase/client';
import { Conversation, Message } from '../types/database';

// 使用单例模式的Supabase客户端
const supabase = createClient();

/**
 * 获取用户的所有对话，支持分页和按应用筛选
 * @param userId 用户ID
 * @param limit 每页数量，默认20
 * @param offset 偏移量，默认0
 * @param appId 可选的应用ID筛选
 * @returns 对话列表和总数
 */
export async function getUserConversations(
  userId: string, 
  limit: number = 20, 
  offset: number = 0,
  appId?: string
): Promise<{ conversations: Conversation[], total: number }> {
  // --- BEGIN COMMENT ---
  // 构建基础查询，添加了count选项以获取总记录数
  // --- END COMMENT ---
  let query = supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  // 如果指定了appId，添加筛选条件
  if (appId) {
    query = query.eq('app_id', appId);
  }
  
  const { data, error, count } = await query;

  if (error) {
    console.error('获取用户对话失败:', error);
    return { conversations: [], total: 0 };
  }

  return { 
    conversations: data as Conversation[], 
    total: count || 0 
  };
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
  // --- BEGIN COMMENT ---
  // 添加默认值，确保新增字段有合适的初始值
  // --- END COMMENT ---
  const conversationWithDefaults = {
    ...conversation,
    external_id: conversation.external_id || null,
    app_id: conversation.app_id || null,
    last_message_preview: conversation.last_message_preview || null
  };

  const { data, error } = await supabase
    .from('conversations')
    .insert(conversationWithDefaults)
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
  // --- BEGIN COMMENT ---
  // 添加默认值，确保新增字段有合适的初始值
  // --- END COMMENT ---
  const messageWithDefaults = {
    ...message,
    external_id: message.external_id || null,
    token_count: message.token_count || null,
    is_synced: message.is_synced !== undefined ? message.is_synced : true
  };

  const { data, error } = await supabase
    .from('messages')
    .insert(messageWithDefaults)
    .select()
    .single();

  if (error || !data) {
    console.error('添加消息失败:', error);
    return null;
  }

  // --- BEGIN COMMENT ---
  // 更新对话的最后更新时间和最后消息预览
  // 取消息内容的前100个字符作为预览
  // --- END COMMENT ---
  await supabase
    .from('conversations')
    .update({ 
      updated_at: new Date().toISOString(),
      last_message_preview: message.content.substring(0, 100) // 取前100个字符作为预览
    })
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

/**
 * 创建新的空对话
 * @param userId 用户ID
 * @param appId 应用ID
 * @param initialTitle 初始标题（可选）
 * @returns 创建的对话对象
 */
export async function createEmptyConversation(
  userId: string,
  appId: string,
  initialTitle?: string
): Promise<Conversation | null> {
  // --- BEGIN COMMENT ---
  // 创建一个新的空对话，设置初始值
  // --- END COMMENT ---
  return await createConversation({
    user_id: userId,
    title: initialTitle || '新对话',
    summary: null,
    ai_config_id: null,
    app_id: appId,
    external_id: null,
    org_id: null,
    settings: {},
    status: 'active',
    last_message_preview: null
  });
}
