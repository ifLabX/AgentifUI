/**
 * 对话消息加载钩子
 * 
 * --- BEGIN COMMENT ---
 * 🎯 适用范围：仅用于对话类 Dify 应用（chatbot、agent、chatflow）
 * 这些应用的历史消息存储在 conversations + messages 表中
 * 
 * 任务类应用（workflow、text-generation）的执行记录存储在 app_executions 表中，
 * 不使用此 hook 进行历史记录加载
 * --- END COMMENT ---
 * 
 * 提供消息的分页加载、历史记录查询和滚动加载功能
 * 更新为使用新的统一数据服务和messageService
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { messageService } from '@lib/services/db/message-service';
import { getConversationByExternalId } from '@lib/db/conversations';
import { Message } from '@lib/types/database';
import { useChatStore, ChatMessage } from '@lib/stores/chat-store';
import { useSupabaseAuth } from '@lib/supabase/hooks';
import { useChatScrollStore } from '@lib/stores/chat-scroll-store';

// 每页加载的消息数量
const MESSAGES_PER_PAGE = 20;

// --- BEGIN COMMENT ---
// 定义统一的加载状态类型
// 包含状态、类型和锁定标志
// --- END COMMENT ---
export type LoadingState = 'idle' | 'loading' | 'success' | 'error' | 'complete';

// 加载状态对象类型
type LoadingStatus = {
  state: LoadingState;
  type: 'initial' | 'more' | 'none';
  isLocked: boolean;
};

/**
 * 将数据库消息转换为前端消息对象
 */
function dbMessageToChatMessage(dbMessage: Message): ChatMessage {
  // --- BEGIN COMMENT ---
  // 从metadata中提取附件信息
  // --- END COMMENT ---
  const attachments = dbMessage.metadata?.attachments || [];
  
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
    token_count: dbMessage.token_count || undefined,
    attachments: attachments.length > 0 ? attachments : undefined
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
  
  // --- BEGIN COMMENT ---
  // 简化状态管理，使用统一的加载状态对象
  // 将多个状态变量合并为一个结构化的状态对象
  // --- END COMMENT ---
  const [dbConversationId, setDbConversationId] = useState<string | null>(null);
  const [difyConversationId, setDifyConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingStatus>({
    state: 'idle',
    type: 'none',
    isLocked: false
  });
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  
  // --- BEGIN COMMENT ---
  // 合并多个ref到单一对象，提高可维护性
  // --- END COMMENT ---
  const loaderState = useRef<{
    page: number;
    currentId: string | null;
    totalMessages: number;
    loadedConversations: Set<string>;
    abortController: AbortController | null;
    previousPath: string | null;
  }>({
    page: 1,
    currentId: null,
    totalMessages: 0,
    loadedConversations: new Set(),
    abortController: null,
    previousPath: null
  });
  
  // 从chatStore获取当前消息状态和操作方法
  const { messages, addMessage, clearMessages, updateMessage } = useChatStore();
  
  // --- BEGIN COMMENT ---
  // 添加辅助函数，简化状态管理
  // --- END COMMENT ---
  
  // 开始加载
  const startLoading = useCallback((type: 'initial' | 'more') => {
    setLoading(prev => ({ ...prev, state: 'loading', type, isLocked: true }));
  }, []);

  // 完成加载
  const finishLoading = useCallback((state: 'success' | 'error' | 'complete' | 'idle') => {
    setLoading(prev => ({ ...prev, state, type: 'none', isLocked: false }));
  }, []);

  // 取消当前请求
  const cancelCurrentRequest = useCallback(() => {
    if (loaderState.current.abortController) {
      loaderState.current.abortController.abort();
      loaderState.current.abortController = null;
    }
  }, []);

  // 重置加载状态
  const resetLoader = useCallback(() => {
    cancelCurrentRequest();
    loaderState.current.page = 1;
    loaderState.current.totalMessages = 0;
    loaderState.current.currentId = null;
    setLoading({ state: 'idle', type: 'none', isLocked: false });
    setError(null);
  }, [cancelCurrentRequest]);
  
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
  
    // --- BEGIN COMMENT ---
  // 🎯 优化：简化排序逻辑，数据库已提供正确排序
  // 移除复杂的客户端排序，依赖数据库层的高性能排序
  // --- END COMMENT ---
  
  /**
   * 组织消息顺序（已优化）
   * 🎯 由于数据库查询已经按照created_at、sequence_order、id进行了正确排序，
   * 客户端不再需要复杂的排序逻辑，直接返回即可
   */
  const organizeMessages = useCallback((messages: Message[]): Message[] => {
    // --- BEGIN COMMENT ---
    // 🎯 性能优化：数据库已经提供了正确的排序
    // 按照 created_at ASC, sequence_order ASC, id DESC 的顺序
    // 这里直接返回，避免额外的客户端排序开销
    // --- END COMMENT ---
    console.log(`[useConversationMessages] 消息已在数据库层排序，跳过客户端排序，消息数量: ${messages.length}`);
    return messages;
  }, []);
  
  /**
   * 从Dify对话ID获取数据库对话ID（使用新的优化接口）
   */
  const fetchDbConversationId = useCallback(async (externalId: string) => {
    try {
      console.log(`[useConversationMessages] 查询外部ID为 ${externalId} 的对话记录`);
      
      const result = await getConversationByExternalId(externalId);
      
      if (result.success && result.data) {
        console.log(`[useConversationMessages] 找到对话记录，数据库ID=${result.data.id}`);
        setDbConversationId(result.data.id);
        return result.data.id;
      } else if (result.success && !result.data) {
        console.log(`[useConversationMessages] 未找到外部ID为 ${externalId} 的对话记录`);
        setDbConversationId(null);
        return null;
      } else {
        console.error(`[useConversationMessages] 查询对话记录失败:`, result.error);
        setError(result.error || new Error('查询对话记录失败'));
        setDbConversationId(null);
        return null;
      }
    } catch (error) {
      console.error(`[useConversationMessages] 查询对话记录异常:`, error);
      setError(error instanceof Error ? error : new Error(String(error)));
      setDbConversationId(null);
      return null;
    }
  }, []);
  
  /**
   * 加载初始消息（使用新的messageService）
   */
  const loadInitialMessages = useCallback(async (dbConvId: string) => {
    // --- BEGIN COMMENT ---
    // 防止重复加载或者加载已经变更的对话
    // 使用统一的加载状态对象检查是否正在加载
    // --- END COMMENT ---
    if (!dbConvId || loading.isLocked) {
      return;
    }
    
    // 获取滚动控制函数
    const resetScrollState = useChatScrollStore.getState().resetScrollState;
    
    // 取消任何进行中的请求
    cancelCurrentRequest();
    
    // 创建新的AbortController
    const controller = new AbortController();
    loaderState.current.abortController = controller;
    const signal = controller.signal;
    
    try {
      // --- BEGIN COMMENT ---
      // 使用统一的状态管理方式设置加载状态
      // --- END COMMENT ---
      startLoading('initial');
      loaderState.current.page = 1;
      loaderState.current.currentId = dbConvId;
      
      console.log(`[useConversationMessages] 开始加载初始消息，数据库对话ID=${dbConvId}`);
      
      // --- BEGIN COMMENT ---
      // 在获取消息前先清空当前消息，避免旧消息闪烁
      // 保持骨架屏状态直到新消息完全加载完成
      // --- END COMMENT ---
      clearMessages();
      
      // 设置当前数据库对话ID
      setDbConversationId(dbConvId);
      
      // --- BEGIN COMMENT ---
      // 使用新的messageService获取最新消息
      // --- END COMMENT ---
      const result = await messageService.getLatestMessages(dbConvId, MESSAGES_PER_PAGE, { cache: true });
      
      // 如果请求已被取消或对话ID已改变，则放弃处理结果
      if (signal.aborted || loaderState.current.currentId !== dbConvId) {
        console.log(`[useConversationMessages] 请求已取消或对话ID已变更，放弃加载结果`);
        finishLoading('idle'); // 重置加载状态
        return;
      }
      
      if (!result.success) {
        console.error(`[useConversationMessages] 加载初始消息失败:`, result.error);
        setError(result.error);
        finishLoading('error');
        return;
      }
      
      const dbMessages = result.data;
      
      // 记录总消息数
      loaderState.current.totalMessages = dbMessages.length;
      
      // 如果消息总数不足一页，就不需要显示"加载更多"按钮
      if (dbMessages.length <= MESSAGES_PER_PAGE) {
        setHasMoreMessages(false);
      } else {
        setHasMoreMessages(true);
      }
      
      if (dbMessages.length === 0) {
        console.log(`[useConversationMessages] 对话无历史消息`);
        finishLoading('complete');
        return;
      }
      
      // 按时间排序并组织消息顺序
      const organizedMessages = organizeMessages(dbMessages);
      
      // 取最后的MESSAGES_PER_PAGE条消息
      const latestMessages = organizedMessages.slice(-MESSAGES_PER_PAGE);
      
      // 将数据库消息转换为前端消息对象
      const chatMessages = latestMessages.map(dbMessageToChatMessage);
      
      console.log(`[useConversationMessages] 加载了${latestMessages.length}条最新消息`);
      
      // --- BEGIN COMMENT ---
      // 优化状态更新逻辑，确保骨架屏消失后直接显示新消息，避免闪烁问题
      // 1. 先批量添加消息到store
      // 2. 使用requestAnimationFrame确保DOM已更新
      // 3. 然后再设置加载状态为成功，关闭骨架屏
      // --- END COMMENT ---
      
      // 批量添加消息，减少渲染次数
      useChatStore.setState({ messages: chatMessages });
      
      // 使用requestAnimationFrame确保DOM已更新后再关闭骨架屏
      requestAnimationFrame(() => {
        // 确保滚动到底部，使用可靠的方法
        resetScrollState();
        
        // 再次使用requestAnimationFrame确保上面的操作已完成
        requestAnimationFrame(() => {
          // 设置加载成功状态
          finishLoading('success');
          
          // 记录该对话已经加载成功，避免重复加载
          if (dbConvId) {
            loaderState.current.loadedConversations.add(dbConvId);
            
            // 获取当前路径中的对话ID
            const pathConversationId = getConversationIdFromPath();
            if (pathConversationId && pathConversationId !== 'new' && !pathConversationId.includes('temp-')) {
              loaderState.current.loadedConversations.add(pathConversationId);
            }
          }
        });
      });
      
    } catch (error) {
      // 如果是取消请求导致的错误，则不处理
      if (signal.aborted) return;
      
      console.error(`[useConversationMessages] 加载初始消息失败:`, error);
      setError(error instanceof Error ? error : new Error(String(error)));
      finishLoading('error');
    }
  }, [clearMessages, organizeMessages]);
  
  /**
   * 加载更多历史消息（使用新的messageService）
   */
  const loadMoreMessages = useCallback(async () => {
    // --- BEGIN COMMENT ---
    // 使用统一的状态对象检查是否可以加载更多消息
    // 避免在初始加载过程中触发加载更多，防止骨架屏闪烁
    // --- END COMMENT ---
    if (!dbConversationId || 
        loading.isLocked || 
        loading.state === 'loading' || 
        loading.state === 'complete' || 
        !hasMoreMessages || 
        loading.type === 'initial') {
      return;
    }
    
    // 记录当前滚动位置，防止加载完成后滚动位置丢失
    let scrollPosition = 0;
    const scrollContainer = document.querySelector('.chat-scroll-container');
    if (scrollContainer) {
      scrollPosition = scrollContainer.scrollTop;
    }
    
    // 获取滚动控制函数
    const scrollToBottom = useChatScrollStore.getState().scrollToBottom;
    
    // 取消任何进行中的请求
    cancelCurrentRequest();
    
    // 创建新的AbortController
    const controller = new AbortController();
    loaderState.current.abortController = controller;
    const signal = controller.signal;
    
    try {
      // --- BEGIN COMMENT ---
      // 使用统一的状态管理方式设置加载状态
      // 仅在加载更多消息时将状态类型设置为'more'
      // --- END COMMENT ---
      startLoading('more');
      
      // 计算要跳过的消息数
      const currentPage = loaderState.current.page;
      const skip = currentPage * MESSAGES_PER_PAGE;
      
      console.log(`[useConversationMessages] 加载更多历史消息，页码=${currentPage+1}，跳过=${skip}`);
      
      // --- BEGIN COMMENT ---
      // 使用新的messageService获取所有消息，然后手动分页
      // 这是临时方案，后续可以优化为真正的游标分页
      // --- END COMMENT ---
      const result = await messageService.getLatestMessages(dbConversationId, 1000, { cache: true }); // 获取大量消息用于分页
      
      // 如果请求已被取消或对话ID已改变，则放弃处理结果
      if (signal.aborted || loaderState.current.currentId !== dbConversationId) {
        console.log(`[useConversationMessages] 请求已取消或对话ID已变更，放弃加载更多结果`);
        return;
      }
      
      if (!result.success) {
        console.error(`[useConversationMessages] 加载更多消息失败:`, result.error);
        setError(result.error);
        finishLoading('error');
        return;
      }
      
      const allMessages = result.data;
      
      // 更新总消息数
      loaderState.current.totalMessages = allMessages.length;
      
      // 如果已经加载了所有消息
      if (skip >= allMessages.length) {
        setHasMoreMessages(false);
        finishLoading('complete');
        console.log(`[useConversationMessages] 没有更多历史消息`);
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
        // 如果没有更多消息，设置加载状态为完成
        finishLoading('complete');
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
      loaderState.current.page = currentPage + 1;
      
      console.log(`[useConversationMessages] 加载了${pageMessages.length}条历史消息`);
      
      // --- BEGIN COMMENT ---
      // 加载完成后重置加载状态
      // --- END COMMENT ---
      finishLoading('success');
      
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
      if (signal.aborted) {
        return;
      }
      
      console.error(`[useConversationMessages] 加载更多历史消息失败:`, error);
      setError(error instanceof Error ? error : new Error(String(error)));
      finishLoading('error');
    } finally {
      // 解锁加载状态
      finishLoading('idle');
    }
  }, [dbConversationId, loading, hasMoreMessages, organizeMessages]);
  
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
    // --- BEGIN COMMENT ---
    // 使用统一的状态对象检查是否可以加载更多消息
    // --- END COMMENT ---
    if (!messagesContainerRef.current || 
        !hasMoreMessages || 
        loading.state === 'loading' || 
        loading.isLocked) {
      return;
    }
    
    const { scrollTop } = messagesContainerRef.current;
    const scrollThreshold = 50; // 滚动到距顶部50px内触发加载
    
    if (scrollTop < scrollThreshold) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, loading, loadMoreMessages]);
  
  // --- BEGIN COMMENT ---
  // 重置加载状态的功能已由resetLoader函数提供
  // 不再需要单独的resetLoadingState函数
  // --- END COMMENT ---
  
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
    const isFromNewChat = loaderState.current.previousPath === '/chat/new' || 
                        (loaderState.current.previousPath?.includes('/chat/temp-') ?? false);
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
    loaderState.current.previousPath = pathname;
    
    console.log(`[useConversationMessages] 路由变化检测: 是否首次发送=${isFirstMessageTransition}, 从=${isFromNewChat}, 到=${isToExistingChat}, 消息数=${hasExistingMessages}`);
    
    // 获取滚动控制函数
    const resetScrollState = useChatScrollStore.getState().resetScrollState;
    
    // 取消任何进行中的请求
    cancelCurrentRequest();
    
    // 如果是首次发送消息导致的路由变化，跳过清空和加载消息的步骤
    if (isFirstMessageTransition) {
      console.log(`[useConversationMessages] 首次发送消息导致的路由变化，保留现有消息`)
      // 跳过重置状态和清空消息的步骤，直接设置加载完成
      finishLoading('success');
      
      // 记录已经加载过
      if (externalId) {
        loaderState.current.loadedConversations.add(externalId);
      }
      
      // 确保滚动到底部
      resetScrollState();
      return;
    }
    
    // 检查是否已经加载过该对话
    if (externalId && loaderState.current.loadedConversations.has(externalId)) {
      console.log(`[useConversationMessages] 已经加载过对话 ${externalId}，跳过重复加载`);
      return;
    }
    
    // --- BEGIN COMMENT ---
    // 对于非首次发送消息的路由变化，执行正常的加载逻辑
    // 优化状态更新顺序，避免旧消息闪烁
    // 1. 先重置状态和清空消息
    // 2. 然后设置加载状态和初始加载状态
    // 3. 确保骨架屏显示直到新消息加载完成
    // --- END COMMENT ---
    
    // --- BEGIN COMMENT ---
    // 使用统一的状态管理方式重置加载状态
    // 并清空消息，避免显示旧消息
    // --- END COMMENT ---
    resetLoader();
    clearMessages();
    
    // 立即设置加载状态，确保UI显示骨架屏
    startLoading('initial');
    
    // 确保滚动回顶部，避免在新对话加载时显示滚动按钮
    resetScrollState();
    
    if (externalId) {
      setDifyConversationId(externalId);
      
      // --- BEGIN COMMENT ---
      // 使用统一的状态对象设置当前加载的对话ID
      // --- END COMMENT ---
      loaderState.current.currentId = externalId;
      
      // 获取数据库对话ID并加载消息
      (async () => {
        // 尝试查询数据库对话ID
        const dbConvId = await fetchDbConversationId(externalId);
        
        // 确保当前路径仍然是请求的对话
        if (loaderState.current.currentId === externalId && dbConvId) {
          // 设置为当前数据库对话ID
          loaderState.current.currentId = dbConvId;
          // 加载初始消息
          loadInitialMessages(dbConvId);
        } else if (loaderState.current.currentId === externalId) {
          // 没有找到对应的数据库对话ID，设置完成状态
          finishLoading('complete');
        }
      })();
    } else {
      // --- BEGIN COMMENT ---
      // 使用统一的状态管理方式清理状态
      // --- END COMMENT ---
      setDifyConversationId(null);
      setDbConversationId(null);
      setHasMoreMessages(true);
      // 如果不是对话页面，重置为idle状态
      resetLoader();
    }
    
    // 清理函数
    return () => {
      // --- BEGIN COMMENT ---
      // 使用统一的状态管理方式清理加载状态
      // 如果组件卸载或路由改变，标记当前加载ID为null
      // 这样可以在异步操作完成后知道上下文已经改变
      // --- END COMMENT ---
      if (loaderState.current.currentId === externalId) {
        loaderState.current.currentId = null;
      }
      
      // 取消任何进行中的请求
      cancelCurrentRequest();
    };
  }, [pathname, fetchDbConversationId, loadInitialMessages, getConversationIdFromPath, resetLoader, clearMessages]);
  
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
    loading,
    hasMoreMessages,
    error,
    loadMoreMessages,
    setMessagesContainer,
    // 导出一些有用的状态
    isLoading: loading.state === 'loading',
    // --- BEGIN COMMENT ---
    // 使用统一的加载状态对象推断初始加载和加载更多状态
    // 这样可以更精确地控制骨架屏的显示时机，避免闪烁问题
    // --- END COMMENT ---
    isLoadingInitial: loading.state === 'loading' && loading.type === 'initial',
    isLoadingMore: loading.state === 'loading' && loading.type === 'more'
  };
} 