import { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { useChatStore } from '@lib/stores/chat-store';
import { useChatStateSync } from './use-chat-state-sync';
import { useChatTransitionStore } from '@lib/stores/chat-transition-store';
import { useSidebarStore } from '@lib/stores/sidebar-store';

/**
 * 聊天页面状态管理钩子
 * 
 * 集中管理聊天页面的状态，减少页面组件中的状态管理逻辑
 */
export function useChatPageState(conversationIdFromUrl: string | undefined) {
  // 从 useChatStore 中获取必要的状态和方法
  const setCurrentConversationId = useChatStore((state) => state.setCurrentConversationId);
  const clearMessages = useChatStore(state => state.clearMessages);
  
  // 从 useChatStateSync 中获取欢迎屏幕状态和设置方法
  const { isWelcomeScreen, setIsWelcomeScreen } = useChatStateSync();
  
  // 本地状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 从全局状态获取过渡状态
  const { 
    isTransitioningToWelcome, 
    setIsTransitioningToWelcome 
  } = useChatTransitionStore();
  
  // --- BEGIN COMMENT ---
  // 从侧边栏 store 获取选中状态和方法
  // 用于确保路由变化时侧边栏选中状态同步更新
  // --- END COMMENT ---
  const selectItem = useSidebarStore(state => state.selectItem);
  
  // --- BEGIN COMMENT ---
  // 使用 useLayoutEffect 处理 URL 参数变化，减少闪烁
  // 相比 useEffect，useLayoutEffect 会在浏览器绘制前同步执行
  // 这有助于减少欢迎页面的闪烁问题
  // --- END COMMENT ---
  useLayoutEffect(() => {
    // 如果 URL 中的 conversationId 是 'new'，则设置为 null、清除消息历史并显示欢迎页面
    if (conversationIdFromUrl === 'new') {
      console.log('[ChatPageState] 检测到 new 路由，清除消息历史并显示欢迎页面');
      
      // 强制清除所有消息
      useChatStore.getState().clearMessages();
      clearMessages();
      
      // 设置当前对话 ID 为 null
      setCurrentConversationId(null);
      
      // 同步设置侧边栏选中状态为 null
      selectItem('chat', null, true);
      
      // 强制设置欢迎屏幕状态为 true
      setIsWelcomeScreen(true);
      
      // 重置提交状态
      setIsSubmitting(false);
      
      // 设置为从对话界面到欢迎界面的过渡
      setIsTransitioningToWelcome(true);
    } else if (conversationIdFromUrl) {
      // 判断是否为临时ID
      const isTempId = conversationIdFromUrl.startsWith('temp-');
      
      console.log(`[ChatPageState] 设置对话 ID: ${conversationIdFromUrl}${isTempId ? ' (临时ID)' : ''}`);
      
      // 设置当前对话 ID
      setCurrentConversationId(conversationIdFromUrl);
      
      // 同步设置侧边栏选中状态
      selectItem('chat', conversationIdFromUrl, true);
      
      // 关闭欢迎屏幕 - 强制设置为 false，确保刷新页面后不会显示欢迎界面
      setIsWelcomeScreen(false);
      
      // 不是从对话界面到欢迎界面的过渡
      setIsTransitioningToWelcome(false);
      
      // --- BEGIN COMMENT ---
      // 强制刷新消息状态，确保刷新页面后能正确显示对话内容
      // --- END COMMENT ---
      setTimeout(() => {
        // 再次确认欢迎屏幕关闭，避免刷新后显示欢迎界面
        setIsWelcomeScreen(false);
        
        // 确保当前对话 ID 和侧边栏选中状态一致
        if (useChatStore.getState().currentConversationId !== conversationIdFromUrl) {
          setCurrentConversationId(conversationIdFromUrl);
        }
        
        // 确保侧边栏选中状态正确
        const sidebarState = useSidebarStore.getState();
        if (sidebarState.selectedId !== conversationIdFromUrl || sidebarState.selectedType !== 'chat') {
          selectItem('chat', conversationIdFromUrl, true);
        }
      }, 50);
    } else {
      // 如果没有 conversationId，则设置为 null
      setCurrentConversationId(null);
      
      // 同步设置侧边栏选中状态为 null
      selectItem('chat', null, true);
    }
  }, [conversationIdFromUrl, setCurrentConversationId, setIsWelcomeScreen, clearMessages, setIsTransitioningToWelcome, selectItem]);
  
  // --- BEGIN COMMENT ---
  // 包装 handleSubmit 函数
  // 确保在提交消息时正确同步侧边栏选中状态
  // --- END COMMENT ---
  const wrapHandleSubmit = useCallback((originalHandleSubmit: (message: string, files?: any[]) => Promise<any>) => {
    return async (message: string, files?: any[]) => {
      // 立即设置提交状态为 true
      setIsSubmitting(true);
      // 立即关闭欢迎界面
      setIsWelcomeScreen(false);
      // 不是从对话界面到欢迎界面的过渡，使用滑动效果
      setIsTransitioningToWelcome(false);
      
      // --- BEGIN COMMENT ---
      // 判断是否为新对话流程
      // 如果是新对话或临时ID，需要清除消息历史
      // --- END COMMENT ---
      const urlIndicatesNew = window.location.pathname === '/chat/new' || window.location.pathname.includes('/chat/temp-');
      const currentConvId = useChatStore.getState().currentConversationId;
      const isNewConversationFlow = urlIndicatesNew && !currentConvId;
      
      if (isNewConversationFlow) {
        console.log('[ChatPageState] 检测到新对话路由且没有当前对话ID，清除消息历史');
        clearMessages();
      } else if (currentConvId) {
        console.log(`[ChatPageState] 使用现有对话: ${currentConvId}`);
        
        // --- BEGIN COMMENT ---
        // 确保侧边栏选中状态与当前对话ID同步
        // 保持当前展开状态
        // --- END COMMENT ---
        selectItem('chat', currentConvId, true);
      }
      
      // 调用原始的 handleSubmit 函数
      const result = await originalHandleSubmit(message, files);
      
      // --- BEGIN COMMENT ---
      // 如果是新对话，提交后可能会创建临时ID
      // 需要再次确保侧边栏选中状态与当前对话ID同步
      // --- END COMMENT ---
      const newConvId = useChatStore.getState().currentConversationId;
      if (newConvId && newConvId !== currentConvId) {
        console.log(`[ChatPageState] 提交后更新对话ID: ${newConvId}`);
        selectItem('chat', newConvId, true);
      }
      
      return result;
    };
  }, [setIsWelcomeScreen, clearMessages, selectItem]);
  
  return {
    isWelcomeScreen,
    isSubmitting,
    isTransitioningToWelcome,
    wrapHandleSubmit
  };
}
