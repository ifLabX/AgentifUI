/**
 * 消息持久化相关的钩子函数
 * 
 * 本文件实现消息的保存、更新和重试逻辑，
 * 以及消息持久化状态的管理
 */

import { useCallback, useState } from 'react';
import { saveMessage as dbSaveMessage, createPlaceholderAssistantMessage, chatMessageToDbMessage } from '@lib/db/messages';
import { ChatMessage, useChatStore } from '@lib/stores/chat-store';

// --- BEGIN COMMENT ---
// 定义消息保存状态类型
// pending: 等待保存
// saving: 保存中
// saved: 保存成功
// error: 保存失败
// --- END COMMENT ---
export type MessagePersistenceStatus = 'pending' | 'saving' | 'saved' | 'error';

// --- BEGIN COMMENT ---
// 定义重试配置
// maxRetries: 最大重试次数
// baseDelayMs: 基础延迟时间（毫秒）
// --- END COMMENT ---
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000, // 1秒，用于指数退避计算
};

/**
 * 消息持久化钩子函数
 * 提供消息保存、状态更新和错误处理能力
 * 
 * @param userId 当前用户ID，用于保存用户消息
 * @returns 消息保存相关的函数和状态
 */
export function useChatMessages(userId?: string) {
  // --- BEGIN COMMENT ---
  // 使用状态跟踪当前正在保存的消息，便于并发控制和状态管理
  // --- END COMMENT ---
  const [savingMessages, setSavingMessages] = useState<Set<string>>(new Set());
  const { updateMessage } = useChatStore();
  
  // --- BEGIN COMMENT ---
  // 添加消息到正在保存集合
  // --- END COMMENT ---
  const addSavingMessage = useCallback((messageId: string) => {
    setSavingMessages(prev => {
      const newSet = new Set(prev);
      newSet.add(messageId);
      return newSet;
    });
  }, []);
  
  // --- BEGIN COMMENT ---
  // 从正在保存集合中移除消息
  // --- END COMMENT ---
  const removeSavingMessage = useCallback((messageId: string) => {
    setSavingMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });
  }, []);
  
  // --- BEGIN COMMENT ---
  // 检查消息是否正在保存中
  // --- END COMMENT ---
  const isMessageSaving = useCallback((messageId: string): boolean => {
    return savingMessages.has(messageId);
  }, [savingMessages]);
  
  /**
   * 保存消息到数据库
   * @param message 前端消息对象
   * @param conversationId 数据库对话ID
   * @param retryCount 重试次数（当前尝试为第几次，从0开始）
   * @returns 保存是否成功
   */
  const saveMessage = useCallback(async (
    message: ChatMessage, 
    conversationId: string, 
    retryCount: number = 0
  ): Promise<boolean> => {
    // --- BEGIN COMMENT ---
    // 保存消息的核心逻辑：
    // 1. 参数校验，确保必要参数存在
    // 2. 检查消息是否已在保存中，避免重复保存
    // 3. 更新UI状态为保存中
    // 4. 将前端消息对象转换为数据库格式
    // 5. 调用数据库API保存
    // 6. 根据结果更新UI状态
    // 7. 如果失败，进行重试（指数退避）
    // --- END COMMENT ---
    
    // 参数校验
    if (!message || !message.id || !conversationId) {
      console.error(`[saveMessage] 参数无效: message=${!!message}, messageId=${message?.id}, conversationId=${conversationId}`);
      return false;
    }
    
    // 检查消息是否已在保存中，避免重复保存
    if (isMessageSaving(message.id)) {
      console.log(`[saveMessage] 消息 ${message.id} 已在保存中，跳过重复请求`);
      return false;
    }
    
    // 检查消息是否已经保存成功
    if (message.persistenceStatus === 'saved' && message.db_id) {
      console.log(`[saveMessage] 消息 ${message.id} 已保存成功，数据库ID: ${message.db_id}`);
      return true;
    }
    
    try {
      // 检查数据库中是否已存在相同消息，避免重复保存
      const { getMessageByContentAndRole } = require('@lib/db/messages');
      if (typeof getMessageByContentAndRole === 'function') {
        const existingMessage = await getMessageByContentAndRole(
          message.text, 
          message.isUser ? 'user' : 'assistant',
          conversationId
        );
        
        if (existingMessage) {
          console.log(`[saveMessage] 消息内容已存在于数据库中，更新UI状态避免重复保存`);
          updateMessage(message.id, { 
            persistenceStatus: 'saved',
            db_id: existingMessage.id,
            dify_message_id: existingMessage.external_id || undefined
          });
          return true;
        }
      }
      
      // 标记消息正在保存中
      addSavingMessage(message.id);
      
      // 更新UI状态为保存中
      updateMessage(message.id, { persistenceStatus: 'saving' });
      
      console.log(`[saveMessage] 开始保存消息，对话ID=${conversationId}, 消息ID=${message.id}, 重试次数=${retryCount}`);
      
      // 转换为数据库格式并保存
      const dbMessageData = chatMessageToDbMessage(message, conversationId, userId);
      const savedMessage = await dbSaveMessage(dbMessageData);
      
      if (!savedMessage) {
        throw new Error(`保存消息失败，对话ID=${conversationId}`);
      }
      
      // 保存成功，更新UI状态
      updateMessage(message.id, { 
        persistenceStatus: 'saved',
        db_id: savedMessage.id,
        dify_message_id: savedMessage.external_id || undefined
      });
      
      console.log(`[saveMessage] 消息保存成功，数据库消息ID=${savedMessage.id}`);
      
      // 从正在保存集合中移除
      removeSavingMessage(message.id);
      return true;
      
    } catch (error) {
      console.error(`[saveMessage] 保存消息出错:`, error);
      
      // 如果还有重试次数，进行指数退避重试
      if (retryCount < RETRY_CONFIG.maxRetries) {
        const delayMs = Math.pow(2, retryCount) * RETRY_CONFIG.baseDelayMs; // 指数退避: 1s, 2s, 4s...
        console.log(`[saveMessage] ${delayMs}毫秒后进行第${retryCount + 1}次重试`);
        
        // 延迟后重试
        setTimeout(() => {
          saveMessage(message, conversationId, retryCount + 1).catch(err => {
            console.error(`[saveMessage] 第${retryCount + 1}次重试失败:`, err);
          });
        }, delayMs);
        
        // 不立即将状态改为错误，等待重试结果
        return false;
      }
      
      // 已达最大重试次数，更新UI状态为错误
      updateMessage(message.id, { persistenceStatus: 'error' });
      console.error(`[saveMessage] 已达最大重试次数(${RETRY_CONFIG.maxRetries})，消息保存失败`);
      
      // 从正在保存集合中移除
      removeSavingMessage(message.id);
      return false;
    }
  }, [userId, updateMessage, isMessageSaving, addSavingMessage, removeSavingMessage]);
  
  /**
   * 保存错误占位助手消息
   * 用于确保即使助手回复出错，也能在数据库中保存一条记录
   * @param conversationId 数据库对话ID
   * @param status 消息状态
   * @param errorMessage 错误信息
   * @returns 是否保存成功
   */
  const saveErrorPlaceholder = useCallback(async (
    conversationId: string,
    status: 'sent' | 'delivered' | 'error' = 'error',
    errorMessage: string = ''
  ): Promise<boolean> => {
    // --- BEGIN COMMENT ---
    // 创建并保存一条错误占位的助手消息
    // 确保即使助手回复失败，消息也是成对的
    // --- END COMMENT ---
    
    // 参数校验
    if (!conversationId) {
      console.error('[saveErrorPlaceholder] 对话ID不能为空');
      return false;
    }
    
    // 生成占位消息的唯一ID，用于跟踪和日志
    const placeholderId = `error-placeholder-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      console.log(`[saveErrorPlaceholder] 创建错误占位助手消息，对话ID=${conversationId}, 占位ID=${placeholderId}`);
      
      // 尝试创建占位消息，最多重试两次
      let placeholderMessage = null;
      let retryCount = 0;
      
      while (!placeholderMessage && retryCount < 2) {
        try {
          placeholderMessage = await createPlaceholderAssistantMessage(
            conversationId,
            status,
            errorMessage || `助手回复失败 (占位ID: ${placeholderId})`
          );
          
          if (placeholderMessage) {
            break;
          }
        } catch (retryError) {
          console.error(`[saveErrorPlaceholder] 第${retryCount + 1}次尝试创建占位消息失败:`, retryError);
        }
        
        retryCount++;
        if (retryCount < 2) {
          // 等待短暂停后重试
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (!placeholderMessage) {
        throw new Error(`创建占位助手消息失败，对话ID=${conversationId}`);
      }
      
      console.log(`[saveErrorPlaceholder] 创建占位助手消息成功，ID=${placeholderMessage.id}, 占位ID=${placeholderId}`);
      return true;
      
    } catch (error) {
      console.error(`[saveErrorPlaceholder] 创建占位助手消息失败 (占位ID=${placeholderId}):`, error);
      return false;
    }
  }, []);
  
  /**
   * 批量保存多条消息
   * 用于一次性保存用户消息和助手回复对
   * @param messages 要保存的消息数组
   * @param conversationId 数据库对话ID
   * @returns 成功保存的消息数量
   */
  const saveMessages = useCallback(async (
    messages: ChatMessage[], 
    conversationId: string
  ): Promise<number> => {
    // --- BEGIN COMMENT ---
    // 批量保存多条消息的逻辑：
    // 1. 参数校验
    // 2. 对每条消息调用saveMessage
    // 3. 返回成功保存的数量
    // --- END COMMENT ---
    
    // 参数校验
    if (!messages || !messages.length || !conversationId) {
      console.error(`[saveMessages] 参数无效: messages=${!!messages}, messagesLength=${messages?.length}, conversationId=${conversationId}`);
      return 0;
    }
    
    console.log(`[saveMessages] 开始批量保存${messages.length}条消息，对话ID=${conversationId}`);
    
    let successCount = 0;
    
    // 依次保存每条消息
    for (const message of messages) {
      const success = await saveMessage(message, conversationId);
      if (success) {
        successCount++;
      }
    }
    
    console.log(`[saveMessages] 批量保存完成，成功保存${successCount}/${messages.length}条消息`);
    return successCount;
  }, [saveMessage]);
  
  /**
   * 检查是否有消息需要保存
   * @param messages 消息数组
   * @returns 是否有需要保存的消息
   */
  const hasMessagesToPersist = useCallback((messages: ChatMessage[]): boolean => {
    return messages.some(msg => 
      msg.persistenceStatus === 'pending' || 
      (msg.persistenceStatus === 'error' && !msg.db_id)
    );
  }, []);
  
  return {
    saveMessage,
    saveMessages,
    saveErrorPlaceholder,
    hasMessagesToPersist,
    isMessageSaving,
    savingMessagesCount: savingMessages.size
  };
}
