/**
 * 对话相关的数据库查询函数
 * 
 * 本文件包含与对话表(conversations)和消息表(messages)相关的所有数据库操作
 * 更新为使用统一的数据服务和Result类型
 */

import { dataService } from '@lib/services/data-service';
import { cacheService, CacheKeys } from '@lib/services/cache-service';
import { realtimeService, SubscriptionKeys, SubscriptionConfigs } from '@lib/services/realtime-service';
import { Result, success, failure } from '@lib/types/result';
import { Conversation, Message } from '../types/database';
import { createClient } from '../supabase/client';

// 保持与现有代码的兼容性，同时使用新的数据服务
const supabase = createClient();

/**
 * 获取用户的所有对话，支持分页和按应用筛选（优化版本）
 * @param userId 用户ID
 * @param limit 每页数量，默认20
 * @param offset 偏移量，默认0
 * @param appId 可选的应用ID筛选
 * @returns 对话列表和总数的Result
 */
export async function getUserConversations(
  userId: string, 
  limit: number = 20, 
  offset: number = 0,
  appId?: string
): Promise<Result<{ conversations: Conversation[], total: number }>> {
  const filters = { 
    user_id: userId, 
    status: 'active',
    ...(appId && { app_id: appId })
  };

  try {
    // 获取对话列表
    const conversationsResult = await dataService.findMany<Conversation>(
      'conversations',
      filters,
      { column: 'updated_at', ascending: false },
      { offset, limit },
      {
        cache: true,
        cacheTTL: 2 * 60 * 1000, // 2分钟缓存
      }
    );

    if (!conversationsResult.success) {
      return failure(conversationsResult.error);
    }

    // 获取总数
    const countResult = await dataService.count('conversations', filters);
    
    if (!countResult.success) {
      return failure(countResult.error);
    }

    return success({
      conversations: conversationsResult.data,
      total: countResult.data
    });
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * 获取对话详情（优化版本）
 * @param conversationId 对话ID
 * @returns 对话对象的Result，如果未找到则返回null
 */
export async function getConversationById(conversationId: string): Promise<Result<Conversation | null>> {
  return dataService.findOne<Conversation>(
    'conversations',
    { id: conversationId },
    {
      cache: true,
      cacheTTL: 5 * 60 * 1000, // 5分钟缓存
    }
  );
}

/**
 * 创建新的对话（优化版本）
 * @param conversation 对话对象
 * @returns 创建的对话对象Result，如果创建失败则返回错误
 */
export async function createConversation(
  conversation: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>
): Promise<Result<Conversation>> {
  const conversationWithDefaults = {
    ...conversation,
    external_id: conversation.external_id || null,
    app_id: conversation.app_id || null,
    last_message_preview: conversation.last_message_preview || null
  };

  return dataService.create<Conversation>('conversations', conversationWithDefaults);
}

/**
 * 更新对话（优化版本）
 * @param id 对话ID
 * @param updates 需要更新的字段
 * @returns 更新后的对话对象Result，如果更新失败则返回错误
 */
export async function updateConversation(
  id: string,
  updates: Partial<Omit<Conversation, 'id' | 'created_at' | 'updated_at'>>
): Promise<Result<Conversation>> {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  return dataService.update<Conversation>('conversations', id, updateData);
}

/**
 * 删除对话（软删除，将状态设置为deleted）（优化版本）
 * @param id 对话ID
 * @returns 是否删除成功的Result
 */
export async function deleteConversation(id: string): Promise<Result<boolean>> {
  console.log(`[删除对话] 开始删除对话，ID: ${id}`);
  
  const result = await dataService.softDelete<Conversation>('conversations', id);
  
  if (result.success) {
    console.log(`[删除对话] 删除操作完成，ID: ${id}`);
    return success(true);
  } else {
    console.error(`[删除对话] 删除对话失败:`, result.error);
    return success(false);
  }
}

/**
 * 获取对话的所有消息（优化版本）
 * @param conversationId 对话ID
 * @returns 消息列表的Result
 */
export async function getConversationMessages(conversationId: string): Promise<Result<Message[]>> {
  return dataService.findMany<Message>(
    'messages',
    { conversation_id: conversationId },
    { column: 'created_at', ascending: true },
    undefined,
    {
      cache: true,
      cacheTTL: 1 * 60 * 1000, // 1分钟缓存
    }
  );
}

/**
 * 添加消息到对话（优化版本）
 * @param message 消息对象
 * @returns 创建的消息对象Result，如果创建失败则返回错误
 */
export async function addMessageToConversation(
  message: Omit<Message, 'id' | 'created_at'>
): Promise<Result<Message>> {
  const messageWithDefaults = {
    ...message,
    external_id: message.external_id || null,
    token_count: message.token_count || null,
    is_synced: message.is_synced !== undefined ? message.is_synced : true
  };

  const result = await dataService.create<Message>('messages', messageWithDefaults);

  if (result.success) {
    // 更新对话的最后更新时间和最后消息预览
    const previewText = message.content.substring(0, 100);
    await dataService.update<Conversation>(
      'conversations',
      message.conversation_id,
      { 
        updated_at: new Date().toISOString(),
        last_message_preview: previewText
      }
    );
  }

  return result;
}

/**
 * 更新消息状态（优化版本）
 * @param id 消息ID
 * @param status 新状态
 * @returns 是否更新成功的Result
 */
export async function updateMessageStatus(id: string, status: Message['status']): Promise<Result<boolean>> {
  const result = await dataService.update<Message>('messages', id, { status });
  return success(result.success);
}

/**
 * 根据外部ID（Dify对话ID）查询对话（优化版本）
 * @param externalId 外部ID（Dify对话ID）
 * @returns 对话对象的Result，如果未找到则返回null
 */
export async function getConversationByExternalId(externalId: string): Promise<Result<Conversation | null>> {
  if (!externalId || typeof externalId !== 'string' || externalId.trim() === '') {
    console.log('[getConversationByExternalId] 外部ID无效，跳过查询');
    return success(null);
  }
  
  console.log(`[getConversationByExternalId] 开始查询外部ID为 ${externalId} 的对话`);

  const result = await dataService.findOne<Conversation>(
    'conversations',
    { external_id: externalId },
    {
      cache: true,
      cacheTTL: 30 * 1000, // 30秒缓存
    }
  );

  if (result.success && result.data) {
    console.log(`[getConversationByExternalId] 找到对话，ID=${result.data.id}，外部ID=${externalId}`);
  } else if (result.success && !result.data) {
    console.log(`[getConversationByExternalId] 未找到外部ID为 ${externalId} 的对话`);
  } else {
    console.error(`[getConversationByExternalId] 查询对话失败:`, result.error);
  }

  return result;
}

/**
 * 重命名会话（优化版本）
 * @param conversationId 会话ID
 * @param newTitle 新标题
 * @returns 是否更新成功的Result
 */
export async function renameConversation(
  conversationId: string,
  newTitle: string
): Promise<Result<boolean>> {
  const result = await dataService.update<Conversation>('conversations', conversationId, { title: newTitle });
  return success(result.success);
}

/**
 * 物理删除会话及其消息（优化版本）
 * @param conversationId 会话ID
 * @returns 是否删除成功的Result
 */
export async function permanentlyDeleteConversation(
  conversationId: string
): Promise<Result<boolean>> {
  try {
    // 先删除所有相关消息
    const messagesResult = await dataService.query(async () => {
      const { error } = await dataService['supabase']
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);
      
      if (error) throw error;
      return true;
    });

    if (!messagesResult.success) {
      return failure(messagesResult.error);
    }

    // 删除会话
    const conversationResult = await dataService.delete('conversations', conversationId);
    
    return success(conversationResult.success);
  } catch (error) {
    console.error('物理删除会话失败:', error);
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * 创建新的空对话（优化版本）
 * @param userId 用户ID
 * @param appId 应用ID
 * @param initialTitle 初始标题（可选）
 * @returns 创建的对话对象Result
 */
export async function createEmptyConversation(
  userId: string,
  appId: string,
  initialTitle?: string
): Promise<Result<Conversation>> {
  return createConversation({
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

/**
 * 更新会话元数据（优化版本）
 * @param conversationId 会话ID
 * @param metadata 元数据对象
 * @returns 是否更新成功的Result
 */
export async function updateConversationMetadata(
  conversationId: string,
  metadata: Record<string, any>
): Promise<Result<boolean>> {
  const result = await dataService.update<Conversation>('conversations', conversationId, { metadata });
  return success(result.success);
}

// --- BEGIN COMMENT ---
// 兼容性函数，保持与现有代码的兼容性
// 这些函数将逐步迁移到使用Result类型
// --- END COMMENT ---

/**
 * 获取用户的所有对话（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function getUserConversationsLegacy(
  userId: string, 
  limit: number = 20, 
  offset: number = 0,
  appId?: string
): Promise<{ conversations: Conversation[], total: number }> {
  const result = await getUserConversations(userId, limit, offset, appId);
  return result.success ? result.data : { conversations: [], total: 0 };
}

/**
 * 获取对话详情（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function getConversationByIdLegacy(conversationId: string): Promise<Conversation | null> {
  const result = await getConversationById(conversationId);
  return result.success ? result.data : null;
}
