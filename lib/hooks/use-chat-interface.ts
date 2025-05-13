import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useChatInputStore } from '@lib/stores/chat-input-store';
import { useChatStore, selectIsProcessing, ChatMessage } from '@lib/stores/chat-store';
import { streamDifyChat, stopDifyStreamingTask } from '@lib/services/dify/chat-service';
import type { DifyChatRequestPayload, DifyStopTaskResponse } from '@lib/services/dify/types';

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
    // Use selector for isProcessing check
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
    }

    let assistantMessageId: string | null = null;
    let streamError: Error | null = null;
    setCurrentTaskId(null); 
    let routeUpdatedViaCallback = false;
    const initialConversationIdForThisSubmit = useChatStore.getState().currentConversationId;
    
    // --- BEGIN COMMENT ---
    // 为新的提交重置 chunkBuffer
    // --- END COMMENT ---
    chunkBufferRef.current = ""; 
    // --- BEGIN COMMENT ---
    // 这个可以保留在 handleSubmit 的局部作用域
    // --- END COMMENT ---
    let lastAppendTime = Date.now(); 

    try {
      const fileInputVarName = 'file';
      let inputs: Record<string, any> = {};
      if (Array.isArray(files) && files.length > 0 && fileInputVarName) {
        inputs[fileInputVarName] = files.length === 1 ? files[0] : files;
      }
      const payload: DifyChatRequestPayload = {
        query: message, user: currentUserIdentifier, response_mode: 'streaming',
        conversation_id: initialConversationIdForThisSubmit,
        inputs,
        ...(Array.isArray(files) && files.length > 0 && { files }),
      };

      const response = await streamDifyChat(
        payload, 
        DIFY_APP_IDENTIFIER,
        (newlyFetchedConversationId) => {
          const currentConvIdInStore = useChatStore.getState().currentConversationId;
          if ((currentConvIdInStore === null || currentConvIdInStore !== newlyFetchedConversationId) && newlyFetchedConversationId) {
            setCurrentConversationId(newlyFetchedConversationId);
            router.replace(`/chat/${newlyFetchedConversationId}`, { scroll: false });
            routeUpdatedViaCallback = true;
          }
        }
      );

      let finalConversationIdFromStream: string | null = null; 
      let finalTaskId: string | null = null;

      for await (const answerChunk of response.answerStream) {
        if (useChatStore.getState().streamingMessageId === null && assistantMessageId === null) {
          const assistantMessage = addMessage({ text: '', isUser: false, isStreaming: true });
          assistantMessageId = assistantMessage.id;
          // --- BEGIN COMMENT ---
          // 设置 streamingMessageId 并将 isWaitingForResponse 设置为 false，因为流已开始
          // --- END COMMENT ---
          useChatStore.setState({ streamingMessageId: assistantMessageId });
          setIsWaitingForResponse(false); 
          
          finalConversationIdFromStream = response.getConversationId(); 
          finalTaskId = response.getTaskId();
          if (finalTaskId) setCurrentTaskId(finalTaskId);

          const currentConvIdInStoreAfterChunk = useChatStore.getState().currentConversationId;
          if (!routeUpdatedViaCallback && 
              (currentConvIdInStoreAfterChunk === null || currentConvIdInStoreAfterChunk !== finalConversationIdFromStream) && 
              finalConversationIdFromStream) {
            setCurrentConversationId(finalConversationIdFromStream);
            router.replace(`/chat/${finalConversationIdFromStream}`, { scroll: false });
          }
        }

        if (assistantMessageId) {
          if (useChatStore.getState().streamingMessageId === assistantMessageId) {
            // --- BEGIN MODIFIED COMMENT ---
            // 使用 ref
            // --- END MODIFIED COMMENT ---
            chunkBufferRef.current += answerChunk; 
            if (Date.now() - lastAppendTime >= CHUNK_APPEND_INTERVAL || chunkBufferRef.current.includes('\n\n') || chunkBufferRef.current.length > 500) {
              flushChunkBuffer(assistantMessageId);
              // --- BEGIN MODIFIED COMMENT ---
              // 刷新后重置 lastAppendTime
              // --- END MODIFIED COMMENT ---
              lastAppendTime = Date.now(); 
            } else if (!appendTimerRef.current) {
              appendTimerRef.current = setTimeout(() => {
                flushChunkBuffer(assistantMessageId);
                // --- BEGIN MODIFIED COMMENT ---
                // 刷新后重置 lastAppendTime
                // --- END MODIFIED COMMENT ---
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
      } // --- BEGIN MODIFIED COMMENT ---
      // for-await 循环结束
      // --- END MODIFIED COMMENT ---
      
      // --- BEGIN COMMENT ---
      // 追加此提交的任何剩余缓冲区
      // --- END COMMENT ---
      flushChunkBuffer(assistantMessageId); 

      if (!finalTaskId) finalTaskId = response.getTaskId();
      if (finalTaskId && useChatStore.getState().currentTaskId !== finalTaskId) setCurrentTaskId(finalTaskId);
      
      if (!finalConversationIdFromStream) finalConversationIdFromStream = response.getConversationId();
      const storeConvIdAfterStream = useChatStore.getState().currentConversationId;
      if (storeConvIdAfterStream !== finalConversationIdFromStream && finalConversationIdFromStream) {
          setCurrentConversationId(finalConversationIdFromStream);
          if (currentPathname !== `/chat/${finalConversationIdFromStream}`) { 
              router.replace(`/chat/${finalConversationIdFromStream}`, { scroll: false });
          }
      }

    } catch (error) {
      console.error("[handleSubmit] Error processing stream:", error);
      streamError = error as Error;
      if (assistantMessageId) {
        setMessageError(assistantMessageId, streamError.message);
      } else {
        addMessage({ text: `抱歉，处理您的请求时发生错误: ${streamError.message}`, isUser: false, error: streamError.message });
      }
    } finally {
      if (appendTimerRef.current) clearTimeout(appendTimerRef.current);
      
      if (assistantMessageId) {
        const finalMessageState = useChatStore.getState().messages.find(m=>m.id===assistantMessageId);
        if (finalMessageState && finalMessageState.isStreaming && !finalMessageState.wasManuallyStopped) {
          finalizeStreamingMessage(assistantMessageId);
        }
      }
      setIsWaitingForResponse(false);
      isSubmittingRef.current = false;
    }
  }, [
    currentUserIdentifier, 
    addMessage, setIsWaitingForResponse, isWelcomeScreen, setIsWelcomeScreen,
    // --- BEGIN COMMENT ---
    // appendMessageChunk 稳定, finalizeStreamingMessage, markAsManuallyStopped, setMessageError,
    // setCurrentConversationId, setCurrentTaskId 稳定。router, currentPathname 来自 Next.js。
    // flushChunkBuffer 现在是 useCallback 的依赖项。
    // --- END COMMENT ---
    appendMessageChunk, finalizeStreamingMessage, markAsManuallyStopped, setMessageError,
    setCurrentConversationId, setCurrentTaskId, router, currentPathname, flushChunkBuffer 
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
