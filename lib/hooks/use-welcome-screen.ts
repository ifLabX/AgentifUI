import { useChatInputStore } from '@lib/stores/chat-input-store';
import { useChatInterface } from './use-chat-interface';
import { useCallback } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 统一判断当前是否为欢迎界面的Hook
 * 
 * 欢迎界面的条件：
 * 1. 当前路径为/chat/new，或
 * 2. 当前路径为/apps/{type}/[instanceId]（应用详情页面），或
 * 3. isWelcomeScreen状态为true且messages数组为空
 * 4. 且当前没有指定对话ID
 */
export function useWelcomeScreen() {
  const { isWelcomeScreen, setIsWelcomeScreen: setStoreWelcomeScreen } = useChatInputStore();
  const { messages } = useChatInterface();
  const pathname = usePathname();
  
  // --- BEGIN COMMENT ---
  // 修改判断逻辑，支持应用详情页面作为欢迎界面
  // 1. 当路径为/chat/new时，总是显示欢迎界面
  // 2. 当路径为/apps/{type}/[instanceId]时，总是显示欢迎界面
  // 3. 当路径包含对话ID时，总是不显示欢迎界面
  // 4. 其他情况下，根据 isWelcomeScreen 状态和 messages 数组判断
  // --- END COMMENT ---
  let isWelcome = false;
  
  // 判断当前路径是否包含对话ID
  const hasConversationId = pathname && 
    pathname.startsWith('/chat/') && 
    pathname !== '/chat/new' && 
    !pathname.includes('/chat/temp-'); // 临时ID也算有效对话ID
  
  // 判断当前路径是否为应用详情页面 /apps/{type}/[instanceId]
  const isAppDetailPage = pathname && 
    pathname.startsWith('/apps/') && 
    pathname.split('/').length === 4; // /apps/{type}/[instanceId] 格式
  
  if (pathname === '/chat/new') {
    // 如果路径是 /chat/new，总是显示欢迎界面
    isWelcome = true;
  } else if (isAppDetailPage) {
    // 如果路径是应用详情页面，总是显示欢迎界面（当没有消息时）
    isWelcome = messages.length === 0;
  } else if (hasConversationId) {
    // 如果路径包含对话ID，总是不显示欢迎界面
    isWelcome = false;
  } else {
    // 其他情况，根据状态和消息数组判断
    isWelcome = isWelcomeScreen && messages.length === 0;
  }
  
  // 添加调试日志
  console.log(`[useWelcomeScreen] pathname: ${pathname}, isWelcome: ${isWelcome}, messages: ${messages.length}, isAppDetailPage: ${isAppDetailPage}`);
  
  // 包装设置欢迎屏幕状态的方法，确保它能够立即响应
  const setIsWelcomeScreen = useCallback((value: boolean) => {
    setStoreWelcomeScreen(value);
  }, [setStoreWelcomeScreen]);
  
  return {
    isWelcomeScreen: isWelcome,
    setIsWelcomeScreen
  };
} 