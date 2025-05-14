import { useChatInputStore } from '@lib/stores/chat-input-store';
import { useChatInterface } from './use-chat-interface';
import { useCallback } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 统一判断当前是否为欢迎界面的Hook
 * 
 * 欢迎界面的条件：
 * 1. 当前路径为/chat/new，或
 * 2. isWelcomeScreen状态为true且messages数组为空
 */
export function useWelcomeScreen() {
  const { isWelcomeScreen, setIsWelcomeScreen: setStoreWelcomeScreen } = useChatInputStore();
  const { messages } = useChatInterface();
  const pathname = usePathname();
  
  // --- BEGIN MODIFIED COMMENT ---
  // 修改判断逻辑：当路径为/chat/new时，总是显示欢迎界面
  // 否则，保持原有逻辑
  // --- END MODIFIED COMMENT ---
  // 强制路径判断，确保在 /chat/new 路径下总是返回 true
  let isWelcome = false;
  
  if (pathname === '/chat/new') {
    isWelcome = true;
  } else {
    isWelcome = isWelcomeScreen && messages.length === 0;
  }
  
  // 添加调试日志
  // console.log(`[useWelcomeScreen] isWelcome: ${isWelcome}`);
  
  // 包装设置欢迎屏幕状态的方法，确保它能够立即响应
  const setIsWelcomeScreen = useCallback((value: boolean) => {
    setStoreWelcomeScreen(value);
  }, [setStoreWelcomeScreen]);
  
  return {
    isWelcomeScreen: isWelcome,
    setIsWelcomeScreen
  };
} 