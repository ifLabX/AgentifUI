/**
 * 消息持久化相关的钩子函数
 * 
 * 本文件实现消息的保存、更新和重试逻辑，
 * 以及消息持久化状态的管理
 */

import { useCallback } from 'react';
import { saveMessage as dbSaveMessage, createPlaceholderAssistantMessage, chatMessageToDbMessage } from '@lib/db/messages';
import { ChatMessage, useChatStore } from '@lib/stores/chat-store';

/**
 * 消息持久化钩子函数
 * 提供消息保存、状态更新和错误处理能力
 */
// --- BEGIN COMMENT ---
// 定义消息持久化钩子函数参数
// userId: 可选的用户ID，如果不提供，则只能保存助手消息
// --- END COMMENT ---
export function useChatMessages(userId?: string) {
  const { updateMessage } = useChatStore();
  
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
    // 1. 更新UI状态为保存中
    // 2. 将前端消息对象转换为数据库格式
    // 3. 调用数据库API保存
    // 4. 根据结果更新UI状态
    // 5. 如果失败，进行重试（最多3次）
    // --- END COMMENT ---
    
    const maxRetries = 3;
    // 使用传入的userId或者null
    
    try {
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
      return true;
      
    } catch (error) {
      console.error(`[saveMessage] 保存消息出错:`, error);
      
      // 如果还有重试次数，进行指数退避重试
      if (retryCount < maxRetries) {
        const delayMs = Math.pow(2, retryCount) * 1000; // 指数退避: 1s, 2s, 4s...
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
      console.error(`[saveMessage] 已达最大重试次数(${maxRetries})，消息保存失败`);
      return false;
    }
  }, [userId, updateMessage]);
  
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
    
    try {
      console.log(`[saveErrorPlaceholder] 创建错误占位助手消息，对话ID=${conversationId}`);
      
      const placeholderMessage = await createPlaceholderAssistantMessage(
        conversationId,
        status,
        errorMessage
      );
      
      if (!placeholderMessage) {
        throw new Error('创建占位助手消息失败');
      }
      
      console.log(`[saveErrorPlaceholder] 创建占位助手消息成功，ID=${placeholderMessage.id}`);
      return true;
      
    } catch (error) {
      console.error(`[saveErrorPlaceholder] 创建占位助手消息失败:`, error);
      return false;
    }
  }, []);
  
  return {
    saveMessage,
    saveErrorPlaceholder
  };
}
