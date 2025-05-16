import { useState, useCallback, useEffect } from 'react';
import { useChatStore } from '@lib/stores/chat-store';
import { useChatStateSync } from './use-chat-state-sync';
import { useChatTransitionStore } from '@lib/stores/chat-transition-store';
import { useSidebarStore } from '@lib/stores/sidebar-store'; // Import SidebarStore

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

  // 从 SidebarStore 获取方法和状态
  const selectSidebarItem = useSidebarStore((state) => state.selectItem);
  const currentSidebarSelectedId = useSidebarStore((state) => state.selectedId);
  
  // 处理 URL 参数变化
  useEffect(() => {
    // 如果 URL 中的 conversationId 是 'new'，则设置为 null、清除消息历史并显示欢迎页面
    if (conversationIdFromUrl === 'new') {
      console.log('[ChatPageState] 检测到 new 路由，清除消息历史并显示欢迎页面');
      
      // 强制清除所有消息
      useChatStore.getState().clearMessages();
      clearMessages();
      
      // 设置当前对话 ID 为 null
      setCurrentConversationId(null);
      
      // 强制设置欢迎屏幕状态为 true
      setIsWelcomeScreen(true);
      
      // 重置提交状态
      setIsSubmitting(false);
      
      // 设置为从对话界面到欢迎界面的过渡
      setIsTransitioningToWelcome(true);

      // 清除侧边栏选中
      if (currentSidebarSelectedId !== null) {
        selectSidebarItem(null, null);
      }
      
      // 确保消息数组完全清除
      setTimeout(() => {
        console.log('[ChatPageState] 再次确认消息数组清除状态');
        useChatStore.getState().clearMessages();
        clearMessages();
        setIsWelcomeScreen(true);
      }, 100);
    } else if (conversationIdFromUrl) {
      // 否则，如果有 conversationId，则设置它并关闭欢迎页面
      console.log(`[ChatPageState] 设置对话 ID: ${conversationIdFromUrl}`);
      setCurrentConversationId(conversationIdFromUrl);
      setIsWelcomeScreen(false);
      // 不是从对话界面到欢迎界面的过渡
      setIsTransitioningToWelcome(false);

      // --- BEGIN ADDED LOGIC TO RESTORE SIDEBAR SELECTION ---
      if (currentSidebarSelectedId !== conversationIdFromUrl) { 
        console.log(`[ChatPageState] Restoring sidebar selection to: ${conversationIdFromUrl}`);
        selectSidebarItem('chat', conversationIdFromUrl); 
      }
      // --- END ADDED LOGIC TO RESTORE SIDEBAR SELECTION ---

    } else {
      // 如果没有 conversationId，则设置为 null
      setCurrentConversationId(null);
      // 清除侧边栏选中
      if (currentSidebarSelectedId !== null) {
        selectSidebarItem(null, null);
      }
    }
  }, [conversationIdFromUrl, setCurrentConversationId, setIsWelcomeScreen, clearMessages, setIsTransitioningToWelcome, selectSidebarItem, currentSidebarSelectedId]);
  
  // 包装 handleSubmit 函数
  const wrapHandleSubmit = useCallback((originalHandleSubmit: (message: string, files?: any[]) => Promise<any>) => {
    return async (message: string, files?: any[]) => {
      // 立即设置提交状态为 true
      setIsSubmitting(true);
      // 立即关闭欢迎界面
      setIsWelcomeScreen(false);
      // 不是从对话界面到欢迎界面的过渡，使用滑动效果
      setIsTransitioningToWelcome(false);
      
      const urlIndicatesNew = window.location.pathname === '/chat/new' || window.location.pathname.includes('/chat/temp-');
      const currentConvId = useChatStore.getState().currentConversationId;
      const isNewConversationFlow = urlIndicatesNew && !currentConvId;
      
      if (isNewConversationFlow) {
        console.log('[ChatPageState] 检测到新对话路由且没有当前对话ID，清除消息历史');
        clearMessages();
      } else if (currentConvId) {
        console.log(`[ChatPageState] 使用现有对话: ${currentConvId}`);
      }
      
      // 调用原始的 handleSubmit 函数
      return originalHandleSubmit(message, files);
    };
  }, [setIsWelcomeScreen, clearMessages, setIsTransitioningToWelcome]); // Added setIsTransitioningToWelcome
  
  return {
    isWelcomeScreen,
    isSubmitting,
    isTransitioningToWelcome,
    wrapHandleSubmit
  };
}
