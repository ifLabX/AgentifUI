/**
 * 对话消息加载钩子
 * 
 * 提供消息的分页加载、历史记录查询和滚动加载功能
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getMessagesByConversationId } from '@lib/db/messages';
import { Message } from '@lib/types/database';
import { useChatStore, ChatMessage } from '@lib/stores/chat-store';
import { useSupabaseAuth } from '@lib/supabase/hooks';
import { getConversationByExternalId } from '@lib/db/conversations';

// 每页加载的消息数量
const MESSAGES_PER_PAGE = 10;

// 定义加载状态类型
export type LoadingState = 'idle' | 'loading' | 'success' | 'error' | 'complete';

/**
 * 将数据库消息转换为前端消息对象
 */
function dbMessageToChatMessage(dbMessage: Message): ChatMessage {
  return {
    id: `db-${dbMessage.id}`, // 添加前缀，保证ID唯一性
    text: dbMessage.content,
    isUser: dbMessage.role === 'user',
    role: dbMessage.role,
    persistenceStatus: 'saved',
    db_id: dbMessage.id,
    dify_message_id: dbMessage.external_id || undefined,
    metadata: dbMessage.metadata || {},
    wasManuallyStopped: dbMessage.metadata?.stopped_manually === true,
    token_count: dbMessage.token_count || undefined
  };
}

/**
 * 对话消息加载钩子
 * 提供分页加载消息的功能
 */
export function useConversationMessages() {
  const pathname = usePathname();
  const { session } = useSupabaseAuth();
  const userId = session?.user?.id;
  
  // 消息加载相关状态
  const [dbConversationId, setDbConversationId] = useState<string | null>(null);
  const [difyConversationId, setDifyConversationId] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const pageRef = useRef<number>(1);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  
  // 从chatStore获取当前消息状态和操作方法
  const { messages, addMessage, clearMessages, updateMessage } = useChatStore();
  
  /**
   * 获取当前路由中的对话ID
   */
  const getConversationIdFromPath = useCallback(() => {
    if (!pathname) return null;
    if (pathname.startsWith('/chat/') && 
        !pathname.includes('/chat/new') && 
        !pathname.includes('/chat/temp-')) {
      return pathname.replace('/chat/', '');
    }
    return null;
  }, [pathname]);
  
  /**
   * 从Dify对话ID获取数据库对话ID
   */
  const fetchDbConversationId = useCallback(async (externalId: string) => {
    try {
      console.log(`[useConversationMessages] 查询外部ID为 ${externalId} 的对话记录`);
      
      const dbConversation = await getConversationByExternalId(externalId);
      
      if (dbConversation) {
        console.log(`[useConversationMessages] 找到对话记录，数据库ID=${dbConversation.id}`);
        setDbConversationId(dbConversation.id);
        return dbConversation.id;
      } else {
        console.log(`[useConversationMessages] 未找到外部ID为 ${externalId} 的对话记录`);
        setDbConversationId(null);
        return null;
      }
    } catch (error) {
      console.error(`[useConversationMessages] 查询对话记录失败:`, error);
      setError(error instanceof Error ? error : new Error(String(error)));
      setDbConversationId(null);
      return null;
    }
  }, []);
  
  /**
   * 加载初始消息（最新的N条）
   */
  const loadInitialMessages = useCallback(async (dbConvId: string) => {
    if (!dbConvId) return;
    
    try {
      setLoadingState('loading');
      pageRef.current = 1;
      
      console.log(`[useConversationMessages] 加载初始消息，对话ID=${dbConvId}`);
      
      // 先清空现有消息
      clearMessages();
      
      // 获取最新的MESSAGES_PER_PAGE条消息
      const dbMessages = await getMessagesByConversationId(dbConvId);
      
      // 如果没有更多消息可加载，设置状态
      if (dbMessages.length < MESSAGES_PER_PAGE) {
        setHasMoreMessages(false);
      } else {
        setHasMoreMessages(true);
      }
      
      if (dbMessages.length === 0) {
        console.log(`[useConversationMessages] 对话无历史消息`);
        setLoadingState('complete');
        return;
      }
      
      // 取最后的MESSAGES_PER_PAGE条消息
      const latestMessages = dbMessages.slice(-MESSAGES_PER_PAGE);
      
      // 将数据库消息转换为前端消息对象并添加到store
      latestMessages.forEach(dbMessage => {
        addMessage(dbMessageToChatMessage(dbMessage));
      });
      
      console.log(`[useConversationMessages] 加载了${latestMessages.length}条最新消息`);
      setLoadingState('success');
      
    } catch (error) {
      console.error(`[useConversationMessages] 加载初始消息失败:`, error);
      setError(error instanceof Error ? error : new Error(String(error)));
      setLoadingState('error');
    }
  }, [addMessage, clearMessages]);
  
  /**
   * 加载更多历史消息（向前翻页）
   */
  const loadMoreMessages = useCallback(async () => {
    if (!dbConversationId || loadingState === 'loading' || loadingState === 'complete' || !hasMoreMessages) {
      return;
    }
    
    try {
      setLoadingState('loading');
      
      // 计算要跳过的消息数
      const currentPage = pageRef.current;
      const skip = currentPage * MESSAGES_PER_PAGE;
      
      console.log(`[useConversationMessages] 加载更多历史消息，页码=${currentPage+1}，跳过=${skip}`);
      
      // 获取所有消息，在前端手动分页（简化实现）
      // 实际项目中应该在服务端实现分页查询以提高性能
      const allMessages = await getMessagesByConversationId(dbConversationId);
      
      // 如果已经加载了所有消息
      if (skip >= allMessages.length) {
        setHasMoreMessages(false);
        setLoadingState('complete');
        console.log(`[useConversationMessages] 没有更多历史消息`);
        return;
      }
      
      // 获取当前页的消息
      const endIndex = Math.max(0, allMessages.length - skip);
      const startIndex = Math.max(0, endIndex - MESSAGES_PER_PAGE);
      const pageMessages = allMessages.slice(startIndex, endIndex);
      
      // 检查是否还有更多消息可加载
      if (startIndex === 0) {
        setHasMoreMessages(false);
      }
      
      // 获取当前第一条消息的引用，用于保持滚动位置
      const firstMessage = document.getElementById(messages[0]?.id);
      const firstMessageTop = firstMessage?.getBoundingClientRect().top;
      
      // 将数据库消息转换为前端消息对象并添加到store（添加到最前面）
      const newChatMessages = pageMessages.map(dbMessageToChatMessage);
      
      // 添加到现有消息的前面
      const updatedMessages = [...newChatMessages, ...messages];
      useChatStore.setState({ messages: updatedMessages });
      
      // 增加页码
      pageRef.current = currentPage + 1;
      
      console.log(`[useConversationMessages] 加载了${pageMessages.length}条历史消息`);
      setLoadingState('success');
      
      // 还原滚动位置，避免加载后视图跳动
      if (firstMessage && firstMessageTop) {
        setTimeout(() => {
          const newFirstMessageTop = firstMessage.getBoundingClientRect().top;
          const scrollDiff = newFirstMessageTop - firstMessageTop;
          window.scrollBy(0, scrollDiff);
        }, 10);
      }
      
    } catch (error) {
      console.error(`[useConversationMessages] 加载更多历史消息失败:`, error);
      setError(error instanceof Error ? error : new Error(String(error)));
      setLoadingState('error');
    }
  }, [dbConversationId, loadingState, hasMoreMessages, messages]);
  
  /**
   * 设置消息容器引用，用于滚动检测
   */
  const setMessagesContainer = useCallback((element: HTMLDivElement | null) => {
    messagesContainerRef.current = element;
  }, []);
  
  /**
   * 检测滚动到顶部，自动加载更多消息
   */
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || !hasMoreMessages || loadingState === 'loading') return;
    
    const { scrollTop } = messagesContainerRef.current;
    const scrollThreshold = 50; // 滚动到距顶部50px内触发加载
    
    if (scrollTop < scrollThreshold) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, loadingState, loadMoreMessages]);
  
  /**
   * 路由更改时加载消息
   */
  useEffect(() => {
    const externalId = getConversationIdFromPath();
    
    if (externalId) {
      setDifyConversationId(externalId);
      
      // 获取数据库对话ID并加载消息
      (async () => {
        const dbConvId = await fetchDbConversationId(externalId);
        if (dbConvId) {
          loadInitialMessages(dbConvId);
        }
      })();
    } else {
      // 清理状态
      setDifyConversationId(null);
      setDbConversationId(null);
      setHasMoreMessages(true);
      pageRef.current = 1;
    }
  }, [pathname, fetchDbConversationId, loadInitialMessages, getConversationIdFromPath]);
  
  /**
   * 添加和移除滚动事件监听器
   */
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (messagesContainer) {
        messagesContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);
  
  return {
    dbConversationId,
    difyConversationId,
    loadingState,
    hasMoreMessages,
    error,
    loadMoreMessages,
    setMessagesContainer,
    // 导出一些有用的状态
    isLoading: loadingState === 'loading',
    isLoadingInitial: loadingState === 'loading' && pageRef.current === 1,
    isLoadingMore: loadingState === 'loading' && pageRef.current > 1
  };
} 