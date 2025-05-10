'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChatInput } from '@components/chat-input';
import { 
  ChatLoader, 
  WelcomeScreen, 
  ChatInputBackdrop, 
  PromptContainer, 
  ScrollToBottomButton
} from '@components/chat';
import { FilePreviewCanvas } from '@components/file-preview/file-preview-canvas';
import { useChatInterface, useChatStateSync } from '@lib/hooks';
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { useChatStore } from '@lib/stores/chat-store';
import { useChatLayoutStore } from '@lib/stores/chat-layout-store';
import { useChatScroll } from '@lib/hooks/use-chat-scroll';
import { useFilePreviewStore } from '@lib/stores/ui/file-preview-store';
import { cn } from '@lib/utils';
import { NavBar } from '@components/nav-bar/nav-bar';

export default function ChatPage() {
  const params = useParams();
  const conversationIdFromUrl = params.conversationId as string | undefined;
  
  const setCurrentConversationId = useChatStore((state) => state.setCurrentConversationId);
  const { inputHeight } = useChatLayoutStore();
  const isPreviewOpen = useFilePreviewStore((state) => state.isPreviewOpen);

  const { isWelcomeScreen } = useChatStateSync();
  const { colors, isDark } = useThemeColors();
  
  const { 
    messages, 
    handleSubmit, 
    isProcessing,        
    handleStopProcessing, 
  } = useChatInterface();

  const scrollRef = useChatScroll<HTMLDivElement>(messages);

  const isWaitingForResponse = useChatStore((state) => state.isWaitingForResponse);

  useEffect(() => {
    const idToSet = (conversationIdFromUrl && conversationIdFromUrl !== 'new') ? conversationIdFromUrl : null;
    console.log(`[ChatPage Effect] Syncing URL param. conversationIdFromUrl: ${conversationIdFromUrl}, Setting store ID to: ${idToSet}`);
    setCurrentConversationId(idToSet);

    // --- BEGIN COMMENT ---
    // "new" 是一个特殊标识符，用于在 URL 中显式表示用户想要开始一个新对话。
    // 在 handleSubmit 中，当首次从 API 获取到真实的 conversationId 后，
    // URL 会被替换成 /chat/[realId]。
    // 未来如果实现"自动重命名对话"（例如根据第一条消息内容），
    // 可能也需要参考或处理这个初始的 "new" 状态。
    // --- END COMMENT ---
  }, [conversationIdFromUrl, setCurrentConversationId]);

  const chatInputHeightVar = `${inputHeight || 80}px`;

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
        <div className="flex-1 min-h-0">
          {isWelcomeScreen && useChatStore.getState().currentConversationId === null ? (
            <WelcomeScreen />
          ) : (
            <div 
              ref={scrollRef}
              className="h-full overflow-y-auto scroll-smooth"
            >
              <ChatLoader 
                messages={messages} 
                isWaitingForResponse={isWaitingForResponse}
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
        />
        
        {useChatStore.getState().currentConversationId === null && <PromptContainer />}
      </div>
      
      <FilePreviewCanvas /> 
    </div>
  );
} 