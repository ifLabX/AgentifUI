import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useChatInputStore } from '@lib/stores/chat-input-store';
import { useChatStore, selectIsProcessing, ChatMessage } from '@lib/stores/chat-store';
import { streamDifyChat, stopDifyStreamingTask } from '@lib/services/dify/chat-service'; // streamDifyChat 用于现有对话
import type { DifyChatRequestPayload, DifyStopTaskResponse, DifyStreamResponse } from '@lib/services/dify/types';
import { useCreateConversation } from './use-create-conversation';
// usePendingConversationStore 可能在这里不需要直接使用，因为状态更新由 useCreateConversation 内部处理
// import { usePendingConversationStore } from '@lib/stores/pending-conversation-store'; 

const DIFY_APP_IDENTIFIER = process.env.NEXT_PUBLIC_DIFY_APP_IDENTIFIER || "default";
const currentUserIdentifier = "userlyz";
// --- BEGIN COMMENT ---
// 毫秒，批量处理数据块的持续时间
// --- END COMMENT ---
const CHUNK_APPEND_INTERVAL = 100; 

export function useChatInterface() {
  const router = useRouter();
  const currentPathname = usePathname();
  const { isWelcomeScreen, setIsWelcomeScreen } = useChatInputStore();

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
  // updatePendingStatus 仅用于流结束后更新 pending store，如果需要的话
  // const updatePendingStatus = usePendingConversationStore((state) => state.updateStatus);


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
    const isNewConversationFlow = window.location.pathname === '/chat/new' || window.location.pathname.includes('/chat/temp-');

    if (isNewConversationFlow) {
      console.log('[handleSubmit] New conversation flow detected.');
      currentConvId = null; 
      setCurrentConversationId(null); // Ensure global state is also null for new conv
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
        user: currentUserIdentifier, // 添加 user 字段
        inputs: {}, // 假设当前没有额外的 prompt inputs，或者从其他地方获取
        ...(difyFiles && { files: difyFiles }),
      };
      
      // 对于现有对话，payload 构造方式不同，需要包含 conversation_id
      // 并且 auto_generate_name 应为 false

      if (isNewConversationFlow) {
        // --- 新对话逻辑 ---
        // basePayloadForNewConversation 已经包含了 user
        const creationResult = await initiateNewConversation(
          basePayloadForNewConversation, // 使用正确的变量名
          DIFY_APP_IDENTIFIER
          // currentUserIdentifier // userIdentifier 已包含在 basePayloadForNewConversation.user 中
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
          user: currentUserIdentifier,
          response_mode: 'streaming',
          conversation_id: currentConvId, // Should be a valid ID
          auto_generate_name: false, // Not a new conversation
        };
        const streamServiceResponse = await streamDifyChat(
          difyPayload,
          DIFY_APP_IDENTIFIER,
          (newlyFetchedConvId) => { // This callback might be redundant for existing chats
            if (newlyFetchedConvId && useChatStore.getState().currentConversationId !== newlyFetchedConvId) {
               // This case should ideally not happen for existing conversations if currentConvId is correct
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
          // 流结束的通知给 pending store 的逻辑由 useCreateConversation 内部或其回调处理
        }
      }
      setIsWaitingForResponse(false);
      isSubmittingRef.current = false;
    }
  }, [
    currentUserIdentifier, 
    addMessage, setIsWaitingForResponse, isWelcomeScreen, setIsWelcomeScreen,
    appendMessageChunk, finalizeStreamingMessage, markAsManuallyStopped, setMessageError,
    setCurrentConversationId, setCurrentTaskId, router, currentPathname, flushChunkBuffer,
    initiateNewConversation // 添加新的依赖
  ]);

  const handleStopProcessing = useCallback(async () => {
    const state = useChatStore.getState();
    const currentStreamingId = state.streamingMessageId;
    const currentTaskId = state.currentTaskId;
    
    if (currentStreamingId) {
      // --- BEGIN COMMENT ---
      // 正确访问 appendTimerRef 和 flushChunkBuffer，因为它们现在是顶级作用域的
      // --- END COMMENT ---
      if (appendTimerRef.current) { 
        clearTimeout(appendTimerRef.current);
        appendTimerRef.current = null;
      }
      flushChunkBuffer(currentStreamingId); 
      markAsManuallyStopped(currentStreamingId); 

      if (currentTaskId) {
        try {
          await stopDifyStreamingTask(DIFY_APP_IDENTIFIER, currentTaskId, currentUserIdentifier);
          // --- BEGIN MODIFIED COMMENT ---
          // 成功停止后清除任务 ID
          // --- END MODIFIED COMMENT ---
          setCurrentTaskId(null); 
        } catch (error) {
          console.error(`[handleStopProcessing] Error calling stopDifyStreamingTask:`, error);
        }
      }
    }
    // --- BEGIN COMMENT ---
    // 如果我们因为此流而等待，请确保 isWaitingForResponse 为 false
    // --- END COMMENT ---
    if (state.isWaitingForResponse && state.streamingMessageId === currentStreamingId) {
        setIsWaitingForResponse(false);
    }
  }, [markAsManuallyStopped, setCurrentTaskId, appendMessageChunk, setIsWaitingForResponse]); // --- BEGIN MODIFIED COMMENT ---
  // 添加了 appendMessageChunk 和 setIsWaitingForResponse
  // --- END MODIFIED COMMENT ---

  return {
    messages, handleSubmit, handleStopProcessing, 
    // --- BEGIN MODIFIED COMMENT ---
    // 获取最新的 isProcessing 状态
    // --- END MODIFIED COMMENT ---
    isProcessing: useChatStore(selectIsProcessing), 
    // --- BEGIN MODIFIED COMMENT ---
    // 获取最新的 waiting 状态
    // --- END MODIFIED COMMENT ---
    isWaitingForResponse: useChatStore(state => state.isWaitingForResponse), 
  };
}
