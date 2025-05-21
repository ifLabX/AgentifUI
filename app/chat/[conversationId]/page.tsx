'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChatInput } from '@components/chat-input';
import { 
  ChatLoader, 
  WelcomeScreen, 
  ChatInputBackdrop, 
  PromptContainer, 
  ScrollToBottomButton,
  MessagesLoadingIndicator,
  PageLoadingSpinner
} from '@components/chat';
import { FilePreviewCanvas } from '@components/file-preview/file-preview-canvas';
import { useChatInterface, useChatStateSync } from '@lib/hooks';
import { useConversationMessages } from '@lib/hooks/use-conversation-messages';
import { useChatPageState } from '@lib/hooks/use-chat-page-state';
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { useChatStore } from '@lib/stores/chat-store';
import { useChatLayoutStore } from '@lib/stores/chat-layout-store';
import { useChatScroll } from '@lib/hooks/use-chat-scroll';
import { useFilePreviewStore } from '@lib/stores/ui/file-preview-store';
import { useChatTransitionStore } from '@lib/stores/chat-transition-store';
import { cn } from '@lib/utils';
import { NavBar } from '@components/nav-bar/nav-bar';

export default function ChatPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationIdFromUrl = params.conversationId;
  
  // --- BEGIN COMMENT ---
  // 使用 useChatPageState hook 管理聊天页面状态
  // 这样可以减少页面组件中的状态管理逻辑
  // --- END COMMENT ---
  const {
    isWelcomeScreen,
    isSubmitting,
    isTransitioningToWelcome,
    wrapHandleSubmit
  } = useChatPageState(conversationIdFromUrl);
  
  const { inputHeight } = useChatLayoutStore();
  const isPreviewOpen = useFilePreviewStore((state) => state.isPreviewOpen);
  const { colors, isDark } = useThemeColors();
  
  const { 
    messages, 
    handleSubmit: originalHandleSubmit, 
    isProcessing,        
    handleStopProcessing, 
  } = useChatInterface();
  
  // --- BEGIN COMMENT ---
  // 使用分页加载钩子获取历史消息
  // --- END COMMENT ---
  const {
    loadingState,
    hasMoreMessages,
    isLoadingMore,
    loadMoreMessages,
    setMessagesContainer,
    error,
    isLoadingInitial
  } = useConversationMessages();
  
  // --- BEGIN COMMENT ---
  // 使用 wrapHandleSubmit 包装原始的 handleSubmit 函数
  // --- END COMMENT ---
  const handleSubmit = wrapHandleSubmit(originalHandleSubmit);

  const scrollRef = useChatScroll(messages);

  const isWaitingForResponse = useChatStore((state) => state.isWaitingForResponse);

  const chatInputHeightVar = `${inputHeight || 80}px`;
  
  // --- BEGIN COMMENT ---
  // 合并scrollRef和setMessagesContainer
  // --- END COMMENT ---
  const setScrollRef = (element: HTMLDivElement | null) => {
    if (scrollRef) {
      // @ts-ignore - scrollRef.current在类型上不是一个setter函数，但实际可能是
      typeof scrollRef === 'function' ? scrollRef(element) : (scrollRef.current = element);
    }
    setMessagesContainer(element);
  };

  return (
    <div 
      className={cn(
        "h-full w-full relative flex flex-col",
        colors.mainBackground.tailwind,
        colors.mainText.tailwind
      )}
    >
      {/* 不再需要单独的页面级加载指示器，骨架屏已足够 */}
      {/* <PageLoadingSpinner isLoading={isLoadingInitial} /> */}
      
      <NavBar />

      <div 
        className={cn(
          "relative flex-1 flex flex-col overflow-hidden min-h-0",
          "pt-10",
          "transition-[width] duration-300 ease-in-out",
          isPreviewOpen ? "w-[50%] lg:w-[60%]" : "w-full"
        )}
        style={{ '--chat-input-height': chatInputHeightVar } as React.CSSProperties}
      >
        <div className="flex-1 min-h-0">
          {/* --- BEGIN MODIFIED COMMENT ---
          显示欢迎屏幕的条件：
          1. 当前路径是 /chat/new 且 没有消息
          2. 或者是欢迎状态 且 没有消息 且 不在提交消息中
          
          修改后与提示容器的渲染逻辑完全一致，确保在/chat/new路径下且没有消息时显示欢迎屏幕
          --- END MODIFIED COMMENT --- */}
          {/* 强制判断路径条件，确保在 /chat/new 路径下且没有消息时显示欢迎屏幕 */}
          {(conversationIdFromUrl === 'new' && messages.length === 0) ? (
            <WelcomeScreen />
          ) : (messages.length === 0 && !isSubmitting && isWelcomeScreen) ? (
            <WelcomeScreen />
          ) : (
            <div 
              ref={setScrollRef}
              className="h-full overflow-y-auto scroll-smooth chat-scroll-container"
            >
              {/* --- BEGIN COMMENT ---
              显示“加载更多”按钮或加载指示器的条件：
              1. 非初始加载状态(避免与初始骨架屏重叠)
              2. 非新对话或临时对话路径
              3. 确实有更多消息可加载
              4. 已经有消息显示（非空消息列表）
              5. 不在加载更多的状态中（避免闪烁）
              --- END COMMENT --- */}
              {!isLoadingInitial && 
               hasMoreMessages && 
               messages.length > 0 &&
               !isLoadingMore &&
               conversationIdFromUrl && 
               conversationIdFromUrl !== 'new' && 
               !conversationIdFromUrl.includes('temp-') && (
                <MessagesLoadingIndicator 
                  loadingState={loadingState}
                  isLoadingMore={isLoadingMore}
                  hasMoreMessages={hasMoreMessages}
                  error={error}
                  onRetry={loadMoreMessages}
                />
              )}
              
              <ChatLoader 
                messages={messages} 
                isWaitingForResponse={isWaitingForResponse}
                isLoadingInitial={isLoadingInitial}
              />
            </div>
          )}
        </div>

        <ScrollToBottomButton />

        <ChatInputBackdrop />
        
        <ChatInput
          onSubmit={handleSubmit}
          placeholder="输入消息，按Enter发送..."
          isProcessing={isProcessing}
          isWaiting={isWaitingForResponse}
          onStop={handleStopProcessing}
          isWelcomeScreen={isWelcomeScreen}
          isTransitioningToWelcome={isTransitioningToWelcome}
        />
        
        {/* --- BEGIN MODIFIED COMMENT ---
        显示提示模板容器的条件：
        1. 当前是欢迎屏幕状态 或 当前URL路径是 /chat/new
        2. 且 不在提交消息中
        --- END MODIFIED COMMENT --- */}
        {/* 强制判断路径条件，确保在 /chat/new 路径下且没有消息时显示提示容器 */}
        {(conversationIdFromUrl === 'new' && messages.length === 0) && <PromptContainer />}
        {/* 原有条件作为备用 */}
        {(!isSubmitting && isWelcomeScreen && messages.length === 0 && conversationIdFromUrl !== 'new') && <PromptContainer />}
      </div>
      
      <FilePreviewCanvas /> 
    </div>
  );
} 