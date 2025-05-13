import { useChatInputStore } from '@lib/stores/chat-input-store';
import { useChatInterface } from './use-chat-interface';
import { useCallback } from 'react';

/**
 * 统一判断当前是否为欢迎界面的Hook
 * 
 * 欢迎界面的条件：isWelcomeScreen状态为true，且messages数组为空
 */
export function useWelcomeScreen() {
  const { isWelcomeScreen, setIsWelcomeScreen: setStoreWelcomeScreen } = useChatInputStore();
  const { messages } = useChatInterface();
  
  // 只有当isWelcomeScreen为true且没有消息时才认为是欢迎界面
  const isWelcome = isWelcomeScreen && messages.length === 0;
  
  // 包装设置欢迎屏幕状态的方法，确保它能够立即响应
  const setIsWelcomeScreen = useCallback((value: boolean) => {
    setStoreWelcomeScreen(value);
  }, [setStoreWelcomeScreen]);
  
  return {
    isWelcomeScreen: isWelcome,
    setIsWelcomeScreen
  };
} 