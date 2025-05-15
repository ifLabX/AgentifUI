import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useChatInputStore } from '@lib/stores/chat-input-store';
import { useChatStore, selectIsProcessing, ChatMessage } from '@lib/stores/chat-store';
import { streamDifyChat, stopDifyStreamingTask } from '@lib/services/dify/chat-service';
import { useSupabaseAuth } from '@lib/supabase/hooks'; // 假设 Supabase Auth Hook
import { useCurrentAppStore } from '@lib/stores/current-app-store'; // 引入新的 App Store
import type { DifyChatRequestPayload, DifyStopTaskResponse, DifyStreamResponse } from '@lib/services/dify/types';
import { useCreateConversation } from './use-create-conversation';
import { usePendingConversationStore } from '@lib/stores/pending-conversation-store';

// --- BEGIN COMMENT ---
// 移除硬编码的 DIFY_APP_IDENTIFIER 和 currentUserIdentifier
// 这些将从 store 和 auth hook 中获取
// --- END COMMENT ---

// --- BEGIN COMMENT ---
// 毫秒，批量处理数据块的持续时间
// --- END COMMENT ---
const CHUNK_APPEND_INTERVAL = 100; 

export function useChatInterface() {
  const router = useRouter();
  const currentPathname = usePathname();
  const { isWelcomeScreen, setIsWelcomeScreen } = useChatInputStore();

  // --- BEGIN COMMENT ---
  // 获取认证状态和当前应用ID
  // --- END COMMENT ---
  const { session } = useSupabaseAuth();
  const currentUserId = session?.user?.id;
  const { currentAppId, isLoadingAppId, errorLoadingAppId, currentAppInstance } = useCurrentAppStore();
  // --- END COMMENT ---

  const messages = useChatStore(state => state.messages);
  const addMessage = useChatStore(state => state.addMessage);
  const appendMessageChunk = useChatStore(state => state.appendMessageChunk);
  const finalizeStreamingMessage = useChatStore(state => state.finalizeStreamingMessage);
  const markAsManuallyStopped = useChatStore(state => state.markAsManuallyStopped);
  const setMessageError = useChatStore(state => state.setMessageError);
  const setIsWaitingForResponse = useChatStore(state => state.setIsWaitingForResponse);
  const currentConversationId = useChatStore(state => state.currentConversationId);
  const setCurrentConversationId = useChatStore(state => state.setCurrentConversationId);
  const setCurrentTaskId = useChatStore(state => state.setCurrentTaskId);

  const { initiateNewConversation } = useCreateConversation();
  const updatePendingStatus = usePendingConversationStore((state) => state.updateStatus);


  const isSubmittingRef = useRef(false);
  // --- BEGIN COMMENT ---
  // 用于累积数据块
  // --- END COMMENT ---
  const chunkBufferRef = useRef(""); 
  // --- BEGIN COMMENT ---
  // 用于刷新缓冲区的计时器
  // --- END COMMENT ---
  const appendTimerRef = useRef<NodeJS.Timeout | null>(null); 

  const flushChunkBuffer = useCallback((id: string | null) => {
    if (id && chunkBufferRef.current) {
      appendMessageChunk(id, chunkBufferRef.current);
      chunkBufferRef.current = "";
      // --- BEGIN COMMENT ---
      // 如果需要更精确的计时，lastAppendTime 可以是一个 ref，或者在这里简单重置
      // --- END COMMENT ---
    }
    if (appendTimerRef.current) {
      clearTimeout(appendTimerRef.current);
      appendTimerRef.current = null;
    }
  }, [appendMessageChunk]);

  const handleSubmit = useCallback(async (message: string, files?: any[]) => {
    if (isSubmittingRef.current) {
      console.warn("[handleSubmit] Submission blocked: already submitting.");
      return;
    }
    if (selectIsProcessing(useChatStore.getState())) {
      console.warn("[handleSubmit] Submission blocked: chat store isProcessing.");
      return;
    }

    // --- BEGIN COMMENT ---
    // 在提交前检查用户是否登录，AppId 是否有效
    // --- END COMMENT ---
    if (!currentUserId) {
      console.error("useChatInterface.handleSubmit: User not authenticated.");
      // TODO: 可以通过 useNotificationStore 显示提示
      return;
    }
    if (!currentAppId || isLoadingAppId) {
      console.error(`useChatInterface.handleSubmit: App ID not ready (current: ${currentAppId}, loading: ${isLoadingAppId}).`);
      // TODO: 可以通过 useNotificationStore 显示提示
      return;
    }
    // --- END COMMENT ---

    isSubmittingRef.current = true;
    setIsWaitingForResponse(true);
    
    const messageAttachments = Array.isArray(files) && files.length > 0 
      ? files.map(file => ({
          id: file.upload_file_id, name: file.name, size: file.size,
          type: file.mime_type, upload_file_id: file.upload_file_id
        }))
      : undefined;
      
    addMessage({ 
      text: message, isUser: true, attachments: messageAttachments 
    });

    if (isWelcomeScreen) {
      setIsWelcomeScreen(false);
      if (window.location.pathname === '/chat/new') {
        window.history.replaceState({}, '', `/chat/temp-${Date.now()}`);
      }
    }

    let assistantMessageId: string | null = null;
    let streamError: Error | null = null;
    setCurrentTaskId(null); 
    
    let currentConvId = useChatStore.getState().currentConversationId;
    
    // --- BEGIN MODIFIED COMMENT ---
    // 修改判断新对话的逻辑，增加对 currentConversationId 的检查
    // 1. 如果 URL 是 /chat/new 或者包含 temp-，且 currentConvId 为 null，则是新对话
    // 2. 如果已经有对话ID，即使 URL 路径是 /chat/new 或者包含 temp-，也不应该创建新对话
    // --- END MODIFIED COMMENT ---
    const urlIndicatesNew = window.location.pathname === '/chat/new' || window.location.pathname.includes('/chat/temp-');
    const isNewConversationFlow = urlIndicatesNew && !currentConvId;

    if (isNewConversationFlow) {
      console.log('[handleSubmit] New conversation flow detected.');
      currentConvId = null; 
      setCurrentConversationId(null); // Ensure global state is also null for new conv
    } else if (currentConvId) {
      console.log(`[handleSubmit] Using existing conversation: ${currentConvId}`);
    }
    
    chunkBufferRef.current = ""; 
    let lastAppendTime = Date.now(); 

    let answerStream: AsyncGenerator<string, void, undefined> | undefined;
    let finalRealConvId: string | undefined;
    let finalTaskId: string | undefined;

    try {
      // 将 messageAttachments (any[]) 转换为 DifyFile[]
      // 假设 DifyFile 需要 type 和 upload_file_id
      // 注意：这里的 type 需要根据 mime_type 推断，或者让 Dify 自行处理。
      // DifyFile 的 type 是 'image' | 'document' 等，而不是 mime_type。
      // 这是一个简化处理，实际项目中可能需要更复杂的 mime_type 到 DifyFile.type 的映射。
      // 暂时假设所有文件都是 'document' 类型，并且使用 upload_file_id。
      const difyFiles: { type: 'document'; transfer_method: 'local_file'; upload_file_id: any; }[] | undefined = 
        Array.isArray(files) && files.length > 0
          ? files.map(file => ({
              type: 'document' as const, // 使用 as const 确保字面量类型
              transfer_method: 'local_file' as const, // 使用 as const
              upload_file_id: file.upload_file_id 
            }))
          : undefined;

      const basePayloadForNewConversation = {
        query: message,
        user: currentUserId, // 使用动态获取的 currentUserId
        inputs: {}, 
        ...(difyFiles && { files: difyFiles }),
      };
      
      if (isNewConversationFlow) {
        // --- 新对话逻辑 ---
        const creationResult = await initiateNewConversation(
          basePayloadForNewConversation,
          currentAppId, // 使用动态获取的 currentAppId
          currentUserId // 显式传递 userIdentifier
        );

        if (creationResult.error) {
          throw creationResult.error;
        }
        
        answerStream = creationResult.answerStream;
        finalRealConvId = creationResult.realConvId;
        finalTaskId = creationResult.taskId;

        if (finalRealConvId) {
          if (useChatStore.getState().currentConversationId !== finalRealConvId) {
            setCurrentConversationId(finalRealConvId);
          }
          if (currentPathname !== `/chat/${finalRealConvId}`) {
            router.replace(`/chat/${finalRealConvId}`, { scroll: false });
          }
        }
        if (finalTaskId) {
          setCurrentTaskId(finalTaskId);
        }

      } else {
        // --- 现有对话逻辑 ---
        // 为现有对话构造一个不包含 user 的基础 payload，因为 DifyChatRequestPayload 会单独添加
        const payloadForExistingStream = {
            query: message,
            inputs: {}, // 与 basePayloadForNewConversation 的 inputs 保持一致
            ...(difyFiles && { files: difyFiles }),
        };
        const difyPayload: DifyChatRequestPayload = {
          ...payloadForExistingStream,
          user: currentUserId, // 使用动态获取的 currentUserId
          response_mode: 'streaming',
          conversation_id: currentConvId, 
          auto_generate_name: false, 
        };
        const streamServiceResponse = await streamDifyChat(
          difyPayload,
          currentAppId, // 使用动态获取的 currentAppId
          (newlyFetchedConvId) => { 
            if (newlyFetchedConvId && useChatStore.getState().currentConversationId !== newlyFetchedConvId) {
              console.warn(`[handleSubmit] Conversation ID changed mid-stream for existing chat: ${currentConvId} -> ${newlyFetchedConvId}`);
              setCurrentConversationId(newlyFetchedConvId);
              if (currentPathname !== `/chat/${newlyFetchedConvId}`) {
                router.replace(`/chat/${newlyFetchedConvId}`, { scroll: false });
              }
            }
          }
        );
        answerStream = streamServiceResponse.answerStream;
        finalRealConvId = streamServiceResponse.getConversationId() || currentConvId || undefined; // Fallback to currentConvId
        finalTaskId = streamServiceResponse.getTaskId() || undefined;
        
        if (finalTaskId && useChatStore.getState().currentTaskId !== finalTaskId) {
          setCurrentTaskId(finalTaskId);
        }
      }

      if (!answerStream) {
        throw new Error("Answer stream is undefined after API call.");
      }

      for await (const answerChunk of answerStream) {
        if (useChatStore.getState().streamingMessageId === null && assistantMessageId === null) {
          const assistantMessage = addMessage({ text: '', isUser: false, isStreaming: true });
          assistantMessageId = assistantMessage.id;
          useChatStore.setState({ streamingMessageId: assistantMessageId });
          setIsWaitingForResponse(false); 
          
          // 对于新对话，realConvId 和 taskId 应该已经从 initiateNewConversation 获取
          // 对于现有对话，它们从 streamDifyChat 获取
          // 此处不再需要从 response.getConversationId() 等获取

          // 如果是新对话，更新 pending 状态为 streaming_message
          if (isNewConversationFlow && finalRealConvId) {
            updatePendingStatus(finalRealConvId, 'streaming_message');
          }
        }

        if (assistantMessageId) {
          if (useChatStore.getState().streamingMessageId === assistantMessageId) {
            chunkBufferRef.current += answerChunk; 
            if (Date.now() - lastAppendTime >= CHUNK_APPEND_INTERVAL || chunkBufferRef.current.includes('\n\n') || chunkBufferRef.current.length > 500) {
              flushChunkBuffer(assistantMessageId);
              lastAppendTime = Date.now(); 
            } else if (!appendTimerRef.current) {
              appendTimerRef.current = setTimeout(() => {
                flushChunkBuffer(assistantMessageId);
                lastAppendTime = Date.now(); 
              }, CHUNK_APPEND_INTERVAL);
            }
          } else {
            console.log("[handleSubmit] Stream was stopped externally, breaking chunk processing.");
            if (assistantMessageId && !useChatStore.getState().messages.find(m=>m.id===assistantMessageId)?.wasManuallyStopped) {
                 markAsManuallyStopped(assistantMessageId);
            }
            break; 
          }
        }
      } 
      
      flushChunkBuffer(assistantMessageId); 

      // 确保 chat-store 中的 conversationId 是最新的 (主要针对新对话)
      if (finalRealConvId && useChatStore.getState().currentConversationId !== finalRealConvId) {
          setCurrentConversationId(finalRealConvId);
          if (currentPathname !== `/chat/${finalRealConvId}`) { 
              router.replace(`/chat/${finalRealConvId}`, { scroll: false });
          }
      }
      // Task ID 应该在流开始时就设置了
      if (finalTaskId && useChatStore.getState().currentTaskId !== finalTaskId) {
        setCurrentTaskId(finalTaskId);
      }
      
      // 如果是新对话，流结束后更新 pending 状态
      if (isNewConversationFlow && finalRealConvId) {
        updatePendingStatus(finalRealConvId, 'stream_completed_title_pending');
      }


    } catch (error) {
      console.error("[handleSubmit] Error processing stream:", error);
      streamError = error as Error;
      if (assistantMessageId) {
        setMessageError(assistantMessageId, streamError.message);
      } else {
        // 如果是新对话创建失败，useCreateConversation 内部会更新 pending store
        // 这里只添加一个错误消息到聊天界面
        addMessage({ text: `抱歉，处理您的请求时发生错误: ${streamError.message}`, isUser: false, error: streamError.message });
      }
    } finally {
      if (appendTimerRef.current) clearTimeout(appendTimerRef.current);
      
      if (assistantMessageId) {
        const finalMessageState = useChatStore.getState().messages.find(m=>m.id===assistantMessageId);
        if (finalMessageState && finalMessageState.isStreaming && !finalMessageState.wasManuallyStopped) {
          finalizeStreamingMessage(assistantMessageId);
          
          // --- BEGIN MODIFIED COMMENT ---
          // 流式响应结束时（骨架屏消失时），确保在侧边栏中高亮当前对话项
          // --- END MODIFIED COMMENT ---
          const currentConvId = useChatStore.getState().currentConversationId;
          if (currentConvId) {
            try {
              // 使用侧边栏存储的 selectItem 方法选中当前对话
              const { selectItem } = require('@lib/stores/sidebar-store').useSidebarStore.getState();
              console.log(`[流式响应结束] 骨架屏消失，高亮对话: ${currentConvId}`);
              selectItem('chat', currentConvId);
            } catch (error) {
              console.error('[流式响应结束] 高亮对话失败:', error);
            }
          }
          
          // 如果是新对话且流正常结束，更新 pending 状态
          if (isNewConversationFlow && finalRealConvId) {
            // 注意：这里不设置为 title_resolved，因为标题获取是异步的
            // 标题获取完成由 useCreateConversation 内部处理
            updatePendingStatus(finalRealConvId, 'stream_completed_title_pending');
          }
        }
      }
      setIsWaitingForResponse(false);
      isSubmittingRef.current = false;
    }
  }, [
    currentUserId, // 替换 currentUserIdentifier
    currentAppId,  // 添加 currentAppId
    addMessage, setIsWaitingForResponse, isWelcomeScreen, setIsWelcomeScreen,
    appendMessageChunk, finalizeStreamingMessage, markAsManuallyStopped, setMessageError,
    setCurrentConversationId, setCurrentTaskId, router, currentPathname, flushChunkBuffer,
    initiateNewConversation, updatePendingStatus
  ]);

  const handleStopProcessing = useCallback(async () => {
    const state = useChatStore.getState();
    const currentStreamingId = state.streamingMessageId;
    const currentTaskId = state.currentTaskId;
    
    // --- BEGIN COMMENT ---
    // 检查用户是否登录，AppId 是否有效
    // --- END COMMENT ---
    if (!currentUserId) {
      console.error("useChatInterface.handleStopProcessing: User not authenticated.");
      return;
    }
    if (!currentAppId) { // isLoadingAppId 检查可能也需要，但停止操作通常是紧急的
      console.error(`useChatInterface.handleStopProcessing: App ID not available (current: ${currentAppId}).`);
      return;
    }
    // --- END COMMENT ---

    if (currentStreamingId) {
      if (appendTimerRef.current) { 
        clearTimeout(appendTimerRef.current);
        appendTimerRef.current = null;
      }
      flushChunkBuffer(currentStreamingId); 
      markAsManuallyStopped(currentStreamingId); 

      const currentConvId = useChatStore.getState().currentConversationId;
      const urlIndicatesNew = window.location.pathname === '/chat/new' || window.location.pathname.includes('/chat/temp-');
      const isNewConversationFlow = urlIndicatesNew && !currentConvId; // Re-evaluate based on current state
      if (isNewConversationFlow && currentConvId) {
        updatePendingStatus(currentConvId, 'stream_completed_title_pending');
      }

      if (currentTaskId) {
        try {
          await stopDifyStreamingTask(currentAppId, currentTaskId, currentUserId); // 使用动态 appId 和 userId
          setCurrentTaskId(null); 
        } catch (error) {
          console.error(`[handleStopProcessing] Error calling stopDifyStreamingTask:`, error);
        }
      }
    }
    if (state.isWaitingForResponse && state.streamingMessageId === currentStreamingId) {
        setIsWaitingForResponse(false);
    }
  }, [
    currentUserId, // 添加依赖
    currentAppId,  // 添加依赖
    markAsManuallyStopped, setCurrentTaskId, 
    appendMessageChunk, setIsWaitingForResponse, updatePendingStatus, flushChunkBuffer
  ]);

  return {
    messages, handleSubmit, handleStopProcessing, 
    isProcessing: useChatStore(selectIsProcessing), 
    isWaitingForResponse: useChatStore(state => state.isWaitingForResponse),
    // --- BEGIN COMMENT ---
    // 暴露 AppId 加载状态和错误状态，以便 UI 层可以响应
    // --- END COMMENT ---
    isAppConfigLoading: isLoadingAppId,
    appConfigError: errorLoadingAppId,
    isUserLoggedIn: !!currentUserId, // 方便 UI 判断用户是否登录
  };
}
