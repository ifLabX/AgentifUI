'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChatInput } from '@components/chat-input';
import { 
  ChatLoader, 
  WelcomeScreen, 
  ChatInputBackdrop, 
  ScrollToBottomButton,
  MessagesLoadingIndicator,
  PageLoadingSpinner
} from '@components/chat';
import { DynamicSuggestedQuestions } from '@components/chat/dynamic-suggested-questions';
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
import { useSidebarStore } from '@lib/stores/sidebar-store';
import { useMobile } from '@lib/hooks';
import { cn } from '@lib/utils';
import { NavBar } from '@components/nav-bar/nav-bar';
import { useProfile } from '@lib/hooks/use-profile';

export default function ChatPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationIdFromUrl = params.conversationId;
  
  // --- BEGIN COMMENT ---
  // 获取sidebar状态和mobile状态，用于计算backdrop边距
  // --- END COMMENT ---
  const { isExpanded, isLocked } = useSidebarStore();
  const isMobile = useMobile();
  
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
    sendDirectMessage,
  } = useChatInterface();
  
  // --- BEGIN COMMENT ---
  // 使用分页加载钩子获取历史消息
  // --- END COMMENT ---
  const {
    loading,
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

  // --- BEGIN COMMENT ---
  // 只在 /chat/new 路由下调用 useProfile，其他路由不需要
  // 使用缓存机制，避免loading状态和闪烁
  // --- END COMMENT ---
  const isNewChat = conversationIdFromUrl === 'new';
  const { profile, isLoading: isProfileLoading } = isNewChat ? useProfile() : { profile: null, isLoading: false };

  return (
    <div 
      className={cn(
        "h-full w-full relative flex flex-col",
        colors.mainBackground.tailwind,
        colors.mainText.tailwind
      )}
    >
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
        {/* --- BEGIN COMMENT ---
        页面级 loading，使用 PageLoadingSpinner 组件确保全屏覆盖
        只在 /chat/new 路由下显示 loading 状态
        只有在profile还在初始加载时才显示页面级loading
        --- END COMMENT --- */}
        <PageLoadingSpinner isLoading={isNewChat && isProfileLoading} />

        {/* 主要内容 */}
        <div className="flex-1 min-h-0">
          {/* --- BEGIN COMMENT ---
          显示欢迎屏幕的条件：
          1. 新聊天页面且没有消息
          2. 或者欢迎状态且没有消息且不在提交中
          --- END COMMENT --- */}
          {isNewChat && messages.length === 0 ? (
            <WelcomeScreen username={profile?.username} />
          ) : messages.length === 0 && !isSubmitting && isWelcomeScreen ? (
            <WelcomeScreen username={profile?.username} />
          ) : (
            <div 
              ref={setScrollRef}
              className="h-full overflow-y-auto scroll-smooth chat-scroll-container"
            >
              {/* --- BEGIN COMMENT ---
              显示"加载更多"按钮或加载指示器的条件：
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
                  loadingState={loading.state}
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
          showModelSelector={isNewChat}
        />
        
        {/* --- BEGIN COMMENT ---
        显示动态推荐问题的条件：
        1. 新聊天页面且没有消息
        2. 或者欢迎状态且没有消息且不在提交中
        --- END COMMENT --- */}
        {(isNewChat && messages.length === 0) && <DynamicSuggestedQuestions onQuestionClick={sendDirectMessage} />}
        {(!isSubmitting && isWelcomeScreen && messages.length === 0 && conversationIdFromUrl !== 'new') && <DynamicSuggestedQuestions onQuestionClick={sendDirectMessage} />}
      </div>
      
      <FilePreviewCanvas /> 
    </div>
  );
} 