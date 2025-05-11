import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useChatInputStore } from '@lib/stores/chat-input-store';
import { useChatStore, selectIsProcessing, ChatMessage } from '@lib/stores/chat-store';
import { streamDifyChat, stopDifyStreamingTask } from '@lib/services/dify/chat-service';
import type { DifyChatRequestPayload, DifyStopTaskResponse } from '@lib/services/dify/types';

const DIFY_APP_IDENTIFIER = process.env.NEXT_PUBLIC_DIFY_APP_IDENTIFIER || "default";
const currentUserIdentifier = "userlyz";
const CHUNK_APPEND_INTERVAL = 100; // ms, batch chunks for this duration

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
  const chunkBufferRef = useRef(""); // For accumulating chunks
  const appendTimerRef = useRef<NodeJS.Timeout | null>(null); // Timer for flushing buffer

  const flushChunkBuffer = useCallback((id: string | null) => {
    if (id && chunkBufferRef.current) {
      appendMessageChunk(id, chunkBufferRef.current);
      chunkBufferRef.current = "";
      // lastAppendTime can be a ref if needed for more precise timing, or simply reset here
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
    
    // Reset chunkBuffer for new submission
    chunkBufferRef.current = ""; 
    let lastAppendTime = Date.now(); // This can remain local to handleSubmit

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
          // Set streamingMessageId AND set isWaitingForResponse to false as stream has started
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
            chunkBufferRef.current += answerChunk; // Use ref
            if (Date.now() - lastAppendTime >= CHUNK_APPEND_INTERVAL || chunkBufferRef.current.includes('\n\n') || chunkBufferRef.current.length > 500) {
              flushChunkBuffer(assistantMessageId);
              lastAppendTime = Date.now(); // Reset lastAppendTime after flushing
            } else if (!appendTimerRef.current) {
              appendTimerRef.current = setTimeout(() => {
                flushChunkBuffer(assistantMessageId);
                lastAppendTime = Date.now(); // Reset lastAppendTime after flushing
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
      } // End of for-await loop
      
      flushChunkBuffer(assistantMessageId); // Append any remaining buffer for this submission

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
      console.log("[handleSubmit] finally executed. isSubmittingRef, isWaitingForResponse set to false.");
    }
  }, [
    currentUserIdentifier, 
    addMessage, setIsWaitingForResponse, isWelcomeScreen, setIsWelcomeScreen,
    // appendMessageChunk is stable, finalizeStreamingMessage, markAsManuallyStopped, setMessageError,
    // setCurrentConversationId, setCurrentTaskId are stable. router, currentPathname are from Next.js.
    // flushChunkBuffer is now a useCallback dep.
    appendMessageChunk, finalizeStreamingMessage, markAsManuallyStopped, setMessageError,
    setCurrentConversationId, setCurrentTaskId, router, currentPathname, flushChunkBuffer 
  ]);

  const handleStopProcessing = useCallback(async () => {
    const state = useChatStore.getState();
    const currentStreamingId = state.streamingMessageId;
    const currentTaskId = state.currentTaskId;
    
    if (currentStreamingId) {
      // Access appendTimerRef and flushChunkBuffer correctly as they are now top-level
      if (appendTimerRef.current) { 
        clearTimeout(appendTimerRef.current);
        appendTimerRef.current = null;
      }
      flushChunkBuffer(currentStreamingId); 
      markAsManuallyStopped(currentStreamingId); 

      if (currentTaskId) {
        try {
          await stopDifyStreamingTask(DIFY_APP_IDENTIFIER, currentTaskId, currentUserIdentifier);
          setCurrentTaskId(null); // Clear task ID after successful stop
        } catch (error) {
          console.error(`[handleStopProcessing] Error calling stopDifyStreamingTask:`, error);
        }
      }
    }
    // Ensure isWaitingForResponse is false if we were waiting due to this stream
    if (state.isWaitingForResponse && state.streamingMessageId === currentStreamingId) {
        setIsWaitingForResponse(false);
    }
  }, [markAsManuallyStopped, setCurrentTaskId, appendMessageChunk, setIsWaitingForResponse]); // Added appendMessageChunk and setIsWaitingForResponse

  return {
    messages, handleSubmit, handleStopProcessing, 
    isProcessing: useChatStore(selectIsProcessing), // Get fresh isProcessing state
    isWaitingForResponse: useChatStore(state => state.isWaitingForResponse), // Get fresh waiting state
  };
}
