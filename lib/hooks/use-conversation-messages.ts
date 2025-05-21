/**
 * 对话消息加载钩子
 * 
 * 提供消息的分页加载、历史记录查询和滚动加载功能
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getMessagesByConversationId } from '@lib/db/messages';
import { Message } from '@lib/types/database';
import { useChatStore, ChatMessage } from '@lib/stores/chat-store';
import { useSupabaseAuth } from '@lib/supabase/hooks';
import { getConversationByExternalId } from '@lib/db/conversations';
import { useChatScrollStore } from '@lib/stores/chat-scroll-store';

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
  
  // 加载锁，防止并发加载
  const loadingLockRef = useRef<boolean>(false);
  // 保存当前加载的对话ID，用于检测是否加载了新对话
  const currentLoadingIdRef = useRef<string | null>(null);
  // 记录历史消息的总数，用于判断是否还有更多消息
  const totalMessagesRef = useRef<number>(0);
  // 请求取消控制器，用于取消进行中的请求
  const abortControllerRef = useRef<AbortController | null>(null);
  // 记录上一个路径，用于检测路由变化
  const previousPathRef = useRef<string | null>(null);
  // 记录是否已经加载过的标志，防止重复加载
  const hasLoadedRef = useRef<{[key: string]: boolean}>({});
  
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
   * 按创建时间对消息进行排序，确保消息顺序正确
   */
  const sortMessagesByTime = useCallback((messages: Message[]): Message[] => {
    // 首先按创建时间排序
    // 如果创建时间相同，按sequence_index排序作为第二顺序
    // 如果上述均相同，按ID排序确保稳定性
    return [...messages].sort((a, b) => {
      // 获取聊天窗口的创建时间
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      
      // 计算时间差的绝对值
      const timeDiff = Math.abs(timeA - timeB);
      
      // 如果时间相差在一秒内，认为可能是同一轮对话的消息
      // 此时优先使用sequence_index排序
      if (timeDiff < 1000) {
        // 获取序列索引
        const seqA = a.metadata?.sequence_index ?? (a.role === 'user' ? 0 : 1);
        const seqB = b.metadata?.sequence_index ?? (b.role === 'user' ? 0 : 1);
        
        if (seqA !== seqB) {
          return seqA - seqB; // 用户消息(0)在前，助手消息(1)在后
        }
      }
      
      // 时间差超过阈值或sequence_index相同，按时间排序
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      
      // 最后按ID排序确保稳定性
      return a.id.localeCompare(b.id);
    });
  }, []);
  
  /**
   * 确保消息以正确的顺序组织，并且用户-助手消息对保持合理的顺序
   */
  const organizeMessages = useCallback((messages: Message[]): Message[] => {
    // 先按创建时间排序
    const sortedMessages = sortMessagesByTime(messages);
    
    // stableMessages中已经考虑了sequence_index对于时间接近的消息
    // 所以这里可以直接返回排序后的结果
    return sortedMessages;
  }, [sortMessagesByTime]);
  
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
    // 防止重复加载或者加载已经变更的对话
    if (!dbConvId || loadingLockRef.current) {
      return;
    }
    
    // 获取滚动控制函数
    const resetScrollState = useChatScrollStore.getState().resetScrollState;
    
    // 取消任何进行中的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 创建新的AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      // 加锁，防止并发加载
      loadingLockRef.current = true;
      setLoadingState('loading');
      pageRef.current = 1;
      
      console.log(`[useConversationMessages] 加载初始消息，对话ID=${dbConvId}`);
      
      // 获取所有消息
      const dbMessages = await getMessagesByConversationId(dbConvId);
      
      // 如果请求已被取消或对话ID已改变，则放弃处理结果
      if (signal.aborted || currentLoadingIdRef.current !== dbConvId) {
        console.log(`[useConversationMessages] 请求已取消或对话ID已变更，放弃加载结果`);
        return;
      }
      
      // 记录总消息数
      totalMessagesRef.current = dbMessages.length;
      
      // 如果消息总数不足一页，就不需要显示"加载更多"按钮
      if (dbMessages.length <= MESSAGES_PER_PAGE) {
        setHasMoreMessages(false);
      } else {
        setHasMoreMessages(true);
      }
      
      if (dbMessages.length === 0) {
        console.log(`[useConversationMessages] 对话无历史消息`);
        setLoadingState('complete');
        loadingLockRef.current = false;
        return;
      }
      
      // 按时间排序并组织消息顺序
      const organizedMessages = organizeMessages(dbMessages);
      
      // 取最后的MESSAGES_PER_PAGE条消息
      const latestMessages = organizedMessages.slice(-MESSAGES_PER_PAGE);
      
      // 将数据库消息转换为前端消息对象
      const chatMessages = latestMessages.map(dbMessageToChatMessage);
      
      // 批量添加消息，减少渲染次数
      useChatStore.setState({ messages: chatMessages });
      
      console.log(`[useConversationMessages] 加载了${latestMessages.length}条最新消息`);
      
      // 延迟一点设置状态，确保UI有时间渲染
      setTimeout(() => {
        setLoadingState('success');
        
        // 记录该对话已经加载成功，避免重复加载
        if (dbConvId) {
          hasLoadedRef.current[dbConvId] = true;
          
          // 获取当前路径中的对话ID
          const pathConversationId = getConversationIdFromPath();
          if (pathConversationId && pathConversationId !== 'new' && !pathConversationId.includes('temp-')) {
            hasLoadedRef.current[pathConversationId] = true;
          }
        }
        
        // 确保滚动到底部，使用可靠的方法
        resetScrollState();
      }, 50);
      
    } catch (error) {
      // 如果是取消请求导致的错误，则不处理
      if (signal.aborted) return;
      
      console.error(`[useConversationMessages] 加载初始消息失败:`, error);
      setError(error instanceof Error ? error : new Error(String(error)));
      setLoadingState('error');
    } finally {
      // 解锁
      loadingLockRef.current = false;
    }
  }, [clearMessages, organizeMessages]);
  
  /**
   * 加载更多历史消息（向前翻页）
   */
  const loadMoreMessages = useCallback(async () => {
    if (!dbConversationId || loadingLockRef.current || loadingState === 'loading' || loadingState === 'complete' || !hasMoreMessages) {
      return;
    }
    
    // 获取滚动控制函数
    const scrollToBottom = useChatScrollStore.getState().scrollToBottom;
    
    // 取消任何进行中的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 创建新的AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      // 加锁，防止并发加载
      loadingLockRef.current = true;
      setLoadingState('loading');
      
      // 计算要跳过的消息数
      const currentPage = pageRef.current;
      const skip = currentPage * MESSAGES_PER_PAGE;
      
      console.log(`[useConversationMessages] 加载更多历史消息，页码=${currentPage+1}，跳过=${skip}`);
      
      // 获取所有消息
      const allMessages = await getMessagesByConversationId(dbConversationId);
      
      // 如果请求已被取消或对话ID已改变，则放弃处理结果
      if (signal.aborted || currentLoadingIdRef.current !== dbConversationId) {
        console.log(`[useConversationMessages] 请求已取消或对话ID已变更，放弃加载更多结果`);
        return;
      }
      
      // 更新总消息数
      totalMessagesRef.current = allMessages.length;
      
      // 如果已经加载了所有消息
      if (skip >= allMessages.length) {
        setHasMoreMessages(false);
        setLoadingState('complete');
        console.log(`[useConversationMessages] 没有更多历史消息`);
        loadingLockRef.current = false;
        return;
      }
      
      // 按时间排序并组织消息顺序
      const organizedMessages = organizeMessages(allMessages);
      
      // 获取当前页的消息
      const endIndex = Math.max(0, organizedMessages.length - skip);
      const startIndex = Math.max(0, endIndex - MESSAGES_PER_PAGE);
      const pageMessages = organizedMessages.slice(startIndex, endIndex);
      
      // 检查是否还有更多消息可加载
      if (startIndex === 0) {
        setHasMoreMessages(false);
      }
      
      // 记录当前滚动位置
      const scrollContainer = messagesContainerRef.current;
      const oldScrollHeight = scrollContainer?.scrollHeight || 0;
      const oldScrollTop = scrollContainer?.scrollTop || 0;
      
      // 将数据库消息转换为前端消息对象
      const newChatMessages = pageMessages.map(dbMessageToChatMessage);
      
      // 当前消息
      const currentMessages = useChatStore.getState().messages;
      
      // 批量添加到现有消息的前面
      const updatedMessages = [...newChatMessages, ...currentMessages];
      useChatStore.setState({ messages: updatedMessages });
      
      // 增加页码
      pageRef.current = currentPage + 1;
      
      console.log(`[useConversationMessages] 加载了${pageMessages.length}条历史消息`);
      setLoadingState('success');
      
      // 保持滚动位置，使用更可靠的方式
      if (scrollContainer) {
        // 使用requestAnimationFrame确保DOM已更新
        requestAnimationFrame(() => {
          if (scrollContainer) {
            // 计算新旧高度差
            const newScrollHeight = scrollContainer.scrollHeight;
            const heightDiff = newScrollHeight - oldScrollHeight;
            
            // 调整滚动位置
            if (heightDiff > 0) {
              scrollContainer.scrollTop = oldScrollTop + heightDiff;
              console.log(`[useConversationMessages] 调整滚动位置: ${oldScrollTop} -> ${oldScrollTop + heightDiff}`);
            }
          }
        });
      }
      
    } catch (error) {
      // 如果是取消请求导致的错误，则不处理
      if (signal.aborted) return;
      
      console.error(`[useConversationMessages] 加载更多历史消息失败:`, error);
      setError(error instanceof Error ? error : new Error(String(error)));
      setLoadingState('error');
    } finally {
      // 解锁
      loadingLockRef.current = false;
    }
  }, [dbConversationId, loadingState, hasMoreMessages, organizeMessages]);
  
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
    if (!messagesContainerRef.current || !hasMoreMessages || loadingState === 'loading' || loadingLockRef.current) {
      return;
    }
    
    const { scrollTop } = messagesContainerRef.current;
    const scrollThreshold = 50; // 滚动到距顶部50px内触发加载
    
    if (scrollTop < scrollThreshold) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, loadingState, loadMoreMessages]);
  
  /**
   * 重置加载状态，用于对话切换
   */
  const resetLoadingState = useCallback(() => {
    loadingLockRef.current = false;
    pageRef.current = 1;
    totalMessagesRef.current = 0;
    setLoadingState('idle');
    setError(null);
  }, []);
  
  /**
   * 路由更改时加载消息
   */
  useEffect(() => {
    const externalId = getConversationIdFromPath();
    const currentMessages = useChatStore.getState().messages;
    
    // --- BEGIN COMMENT ---
    // 检测是否是首次发送消息导致的路由变化
    // 1. 从 /chat/new 路径或 /chat/temp- 开头的路径切换到正常对话路径
    // 2. 在这种情况下，不应该清空消息或显示加载状态
    // 3. 增强检测：如果当前有未保存的用户消息和助手正在流式响应的消息，也应该视为首次消息场景
    // --- END COMMENT ---
    const isFromNewChat = previousPathRef.current === '/chat/new' || 
                        (previousPathRef.current?.includes('/chat/temp-') ?? false);
    const isToExistingChat = externalId && externalId !== 'new' && !externalId.includes('temp-');
    const hasExistingMessages = currentMessages.length > 0;
    
    // 检查是否有正在流式响应的助手消息
    const hasStreamingMessage = currentMessages.some(msg => msg.isStreaming === true);
    
    // 检查是否有未保存的用户消息（处于发送状态）
    const hasPendingUserMessage = currentMessages.some(msg => 
      msg.isUser === true && 
      (msg.persistenceStatus === 'pending' || msg.persistenceStatus === 'saving')
    );
    
    // 首次发送消息的条件：
    // 1. 传统条件：从新对话路径切换到存在的对话路径，且已有消息
    // 2. 增强条件：当前有流式响应或未保存的用户消息，表明这是首次发送
    const isFirstMessageTransition = (isFromNewChat && isToExistingChat && hasExistingMessages) || 
                                    (hasExistingMessages && (hasStreamingMessage || hasPendingUserMessage));
    
    // 记录当前路径用于下次判断
    previousPathRef.current = pathname;
    
    console.log(`[useConversationMessages] 路由变化检测: 是否首次发送=${isFirstMessageTransition}, 从=${isFromNewChat}, 到=${isToExistingChat}, 消息数=${hasExistingMessages}`);
    
    // 获取滚动控制函数
    const resetScrollState = useChatScrollStore.getState().resetScrollState;
    
    // 取消任何进行中的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // 如果是首次发送消息导致的路由变化，跳过清空和加载消息的步骤
    if (isFirstMessageTransition) {
      console.log(`[useConversationMessages] 首次发送消息导致的路由变化，保留现有消息`)
      // 跳过重置状态和清空消息的步骤，直接设置加载完成
      setLoadingState('success');
      
      // 记录已经加载过
      if (externalId) {
        hasLoadedRef.current[externalId] = true;
      }
      
      // 确保滚动到底部
      resetScrollState();
      return;
    }
    
    // 检查是否已经加载过该对话
    if (externalId && hasLoadedRef.current[externalId]) {
      console.log(`[useConversationMessages] 已经加载过对话 ${externalId}，跳过重复加载`);
      return;
    }
    
    // 对于非首次发送消息的路由变化，执行正常的加载逻辑
    // 重置状态以防止状态遗留
    resetLoadingState();
    
    // 立即清空消息，避免显示旧消息
    clearMessages();
    
    // 立即设置加载状态，确保UI显示骨架屏
    setLoadingState('loading');
    
    // 确保滚动回顶部，避免在新对话加载时显示滚动按钮
    resetScrollState();
    
    if (externalId) {
      setDifyConversationId(externalId);
      
      // 设置当前加载的对话ID
      currentLoadingIdRef.current = externalId;
      
      // 获取数据库对话ID并加载消息
      (async () => {
        // 尝试查询数据库对话ID
        const dbConvId = await fetchDbConversationId(externalId);
        
        // 确保当前路径仍然是请求的对话
        if (currentLoadingIdRef.current === externalId && dbConvId) {
          // 设置为当前数据库对话ID
          currentLoadingIdRef.current = dbConvId;
          // 加载初始消息
          loadInitialMessages(dbConvId);
        } else if (currentLoadingIdRef.current === externalId) {
          // 没有找到对应的数据库对话ID，设置完成状态
          setLoadingState('complete');
        }
      })();
    } else {
      // 清理状态
      setDifyConversationId(null);
      setDbConversationId(null);
      setHasMoreMessages(true);
      currentLoadingIdRef.current = null;
      setLoadingState('idle'); // 如果不是对话页面，重置为idle状态
    }
    
    // 清理函数
    return () => {
      // 如果组件卸载或路由改变，标记当前加载ID为null
      // 这样可以在异步操作完成后知道上下文已经改变
      if (currentLoadingIdRef.current === externalId) {
        currentLoadingIdRef.current = null;
      }
      
      // 取消任何进行中的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [pathname, fetchDbConversationId, loadInitialMessages, getConversationIdFromPath, resetLoadingState, clearMessages]);
  
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
  
  /**
   * 调试日志，跟踪加载状态变化
   */
  useEffect(() => {
    console.log(`[useConversationMessages] 加载状态变化: ${loadingState}`);
  }, [loadingState]);
  
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