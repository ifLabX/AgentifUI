import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useChatInputStore } from '@lib/stores/chat-input-store';
import { useChatStore, selectIsProcessing, ChatMessage } from '@lib/stores/chat-store';
import { streamDifyChat, stopDifyStreamingTask } from '@lib/services/dify/chat-service';
import type { DifyChatRequestPayload, DifyStopTaskResponse } from '@lib/services/dify/types';

// --- BEGIN COMMENT ---
// TODO: 将 Dify App ID 移到环境变量或配置文件中
// --- END COMMENT ---

// --- BEGIN COMMENT ---
// 定义前端使用的 Dify 应用标识符。
// 这个标识符将传递给后端代理 (/api/dify/[identifier]/...)，
// 后端代理再用这个标识符查找对应的 Dify API Key 和 URL。
// 推荐使用环境变量配置，例如 NEXT_PUBLIC_DIFY_APP_IDENTIFIER=default
// --- END COMMENT ---
// --- BEGIN COMMENT ---
// TODO (数据库/配置集成): 当前实现使用硬编码回退值 'default' 或单个环境变量作为应用标识符。
// 未来版本中，此标识符应根据用户选择或上下文动态确定。
// 例如：
// 1. 用户在 UI (如下拉菜单或侧边栏) 中选择了一个 Dify 应用。
// 2. 该选择更新了一个全局状态 (如 Zustand store)，存储当前激活的应用标识符 (如 '客服机器人')。
// 3. 此 Hook 从全局状态读取该标识符: `const appIdentifier = useAppStore(state => state.currentAppIdentifier);`
// 4. 或者，如果聊天会话已与特定应用关联，则基于 `currentConversationId` 从数据库查询关联的应用标识符。
// 最终，动态获取到的 `appIdentifier` 将传递给 `streamDifyChat` 函数。
// 届时，当前这种基于单一环境变量或硬编码值的逻辑将被移除。
// 后端代理 (`route.ts` 中的 `getDifyAppConfig`) 也将相应修改，根据标识符从数据库查询应用的 API Key 和 URL。
// --- END COMMENT ---
const DIFY_APP_IDENTIFIER = process.env.NEXT_PUBLIC_DIFY_APP_IDENTIFIER || "default";

// --- BEGIN COMMENT ---
// 定义 API 响应流的接口结构 (占位符)
// 真实的实现需要根据后端 API (如 Dify 或其他) 的流格式来解析
// --- END COMMENT ---
// interface ChatApiResponse { ... }

// --- BEGIN COMMENT ---
// 恢复模拟 API 函数，使其返回 ChatApiResponse 结构
// --- END COMMENT ---
// async function simulateStreamApiResponse(...) { ... }

export function useChatInterface() {
  const router = useRouter();
  const currentPathname = usePathname();
  const { isWelcomeScreen, setIsWelcomeScreen } = useChatInputStore();

  // --- 从 Store 获取状态和 Actions ---
  const messages = useChatStore(state => state.messages);
  const addMessage = useChatStore(state => state.addMessage);
  const appendMessageChunk = useChatStore(state => state.appendMessageChunk);
  const finalizeStreamingMessage = useChatStore(state => state.finalizeStreamingMessage);
  const markAsManuallyStopped = useChatStore(state => state.markAsManuallyStopped);
  const setMessageError = useChatStore(state => state.setMessageError);
  const setIsWaitingForResponse = useChatStore(state => state.setIsWaitingForResponse);
  const isWaitingForResponse = useChatStore(state => state.isWaitingForResponse);
  // --- BEGIN COMMENT ---
  // 获取当前对话 ID 和设置函数
  // --- END COMMENT ---
  const currentConversationId = useChatStore(state => state.currentConversationId);
  const setCurrentConversationId = useChatStore(state => state.setCurrentConversationId);
  const isProcessing = useChatStore(selectIsProcessing);
  // --- BEGIN COMMENT --- 获取设置 Task ID 的 action --- END COMMENT ---
  const setCurrentTaskId = useChatStore(state => state.setCurrentTaskId); 

  // --- BEGIN COMMENT ---
  // TODO: 获取真实的用户标识符，这里使用占位符
  // --- END COMMENT ---
  const currentUserIdentifier = "userlyz"; 

  // --- 处理消息提交 ---
  // files 参数改为可选，不再设置默认值 []
  const handleSubmit = useCallback(async (message: string, files?: any[]) => {
    if (isProcessing) {
      console.log("Blocking submission: Already processing a message.");
      return;
    }

    setIsWaitingForResponse(true);
    
    // 将 files 转换为 MessageAttachment 格式
    const messageAttachments = Array.isArray(files) && files.length > 0 
      ? files.map(file => ({
          id: file.upload_file_id,
          name: file.name,
          size: file.size,
          type: file.mime_type,
          upload_file_id: file.upload_file_id
        }))
      : undefined;
      
    // 添加包含附件信息的用户消息
    addMessage({ 
      text: message, 
      isUser: true,
      attachments: messageAttachments 
    });

    if (isWelcomeScreen) {
      setIsWelcomeScreen(false);
    }

    let assistantMessageId: string | null = null;
    setCurrentTaskId(null);

    // --- BEGIN MODIFICATION ---
    // --- BEGIN 用户要求的中文注释 ---
    // 定义一个标志位，用于跟踪路由是否已经通过回调函数成功更新
    // --- END 用户要求的中文注释 ---
    let routeUpdatedViaCallback = false;
    // --- END MODIFICATION ---

    try {
      // --- BEGIN 中文注释 ---
      // 修复 Dify API 400 错误：inputs.file 必须始终为文件对象数组（即使只有一个文件也要用数组），且仅在有文件时设置。
      // file 变量名允许通过参数传递，默认 'file'。
      // --- END 中文注释 ---
      const fileInputVarName = 'file'; // TODO: 可通过 props/context 配置
      let inputs: Record<string, any> = {};
      // 显式检查 files 是否为有效数组
      if (Array.isArray(files) && files.length > 0 && fileInputVarName) {
        // 单文件为对象，多文件为数组
        inputs[fileInputVarName] = files.length === 1 ? files[0] : files;
      }
      const payload: DifyChatRequestPayload = {
        query: message,
        user: currentUserIdentifier,
        response_mode: 'streaming',
        conversation_id: currentConversationId,
        inputs, // inputs 要么是空对象，要么包含 file 变量
        // 显式检查 files 是否为有效数组，决定是否添加 files 字段
        ...(Array.isArray(files) && files.length > 0 && { files }),
      };
      console.log("[handleSubmit] 调用 Dify API，payload:", payload);

      const response = await streamDifyChat(
        payload, 
        DIFY_APP_IDENTIFIER,
        (newlyFetchedConversationId) => { // onConversationIdReceived 回调的实现
          console.log('[ChatInterface] Conversation ID received via callback:', newlyFetchedConversationId);
          // --- BEGIN 用户要求的中文注释 ---
          // 从 store 获取最新的 currentConversationId，因为 page.tsx 中的 useEffect 可能已更新它
          // 或者直接检查当前页面的路径 (例如 window.location.pathname)
          // 此处我们优先信任并更新 store，然后基于 store 的状态决策是否更新路由
          // --- END 用户要求的中文注释 ---
          const currentConvIdInStore = useChatStore.getState().currentConversationId;

          // --- BEGIN 用户要求的中文注释 ---
          // 条件：1. store 中的 ID 为 null (表示新会话) 且获取到了新 ID
          //       2. 或 store 中的 ID 与新获取的 ID 不同 (理论上在新会话场景，回调触发时 store ID 应为 null)
          //       3. 确保 newlyFetchedConversationId 是有效的
          // --- END 用户要求的中文注释 ---
          if ((currentConvIdInStore === null || currentConvIdInStore !== newlyFetchedConversationId) && newlyFetchedConversationId) {
            setCurrentConversationId(newlyFetchedConversationId); // 更新 store 中的 conversationId
            router.replace(`/chat/${newlyFetchedConversationId}`, { scroll: false }); // 更新 URL
            console.log(`[ChatInterface] Router replaced to /chat/${newlyFetchedConversationId} via callback.`);
            routeUpdatedViaCallback = true; // 标记路由已通过回调成功更新
          }
        }
      );

      let finalConversationIdFromStream: string | null = null; 
      let finalTaskId: string | null = null;

      for await (const answerChunk of response.answerStream) {
        if (assistantMessageId === null) {
          const assistantMessage = addMessage({
            text: '',
            isUser: false,
            isStreaming: true,
          });
          assistantMessageId = assistantMessage.id;
          useChatStore.setState({ isWaitingForResponse: false, streamingMessageId: assistantMessageId });
          
          finalConversationIdFromStream = response.getConversationId(); 
          finalTaskId = response.getTaskId();
          if (finalTaskId) setCurrentTaskId(finalTaskId);

          const currentConvIdInStoreAfterChunk = useChatStore.getState().currentConversationId;
          if (!routeUpdatedViaCallback && 
              (currentConvIdInStoreAfterChunk === null || currentConvIdInStoreAfterChunk !== finalConversationIdFromStream) && 
              finalConversationIdFromStream) {
            console.log('[ChatInterface] Updating conversation ID and route from stream (callback might have failed or was late).');
            setCurrentConversationId(finalConversationIdFromStream);
            router.replace(`/chat/${finalConversationIdFromStream}`, { scroll: false });
          } else if (currentConvIdInStoreAfterChunk !== finalConversationIdFromStream && finalConversationIdFromStream) {
            console.warn(`[handleSubmit] Mismatch or unexpected ConvID in stream: Store was ${currentConvIdInStoreAfterChunk}, Dify stream returned ${finalConversationIdFromStream}. Route updated via callback: ${routeUpdatedViaCallback}`);
          }
        }

        if (assistantMessageId) {
          if (useChatStore.getState().streamingMessageId === assistantMessageId) {
            appendMessageChunk(assistantMessageId, answerChunk);
          } else {
            break; 
          }
        }
      }

      finalTaskId = response.getTaskId();
      if (finalTaskId && useChatStore.getState().currentTaskId !== finalTaskId) {
        setCurrentTaskId(finalTaskId);
      }
      
      const finalConvIdFromGetterAfterStream = response.getConversationId();
      const storeConvIdAfterStream = useChatStore.getState().currentConversationId;
      if (storeConvIdAfterStream !== finalConvIdFromGetterAfterStream && finalConvIdFromGetterAfterStream) {
          console.log(`[ChatInterface] Syncing conversation ID in store after stream completion. Store: ${storeConvIdAfterStream}, Getter: ${finalConvIdFromGetterAfterStream}`);
          setCurrentConversationId(finalConvIdFromGetterAfterStream);
          if (currentPathname !== `/chat/${finalConvIdFromGetterAfterStream}`) { 
              console.warn(`[ChatInterface] Router path ${currentPathname} is not synced with final convId ${finalConvIdFromGetterAfterStream} after stream. Forcing replace.`);
              router.replace(`/chat/${finalConvIdFromGetterAfterStream}`, { scroll: false });
          }
      }

      // --- BEGIN MODIFICATION ---
      // --- BEGIN 用户要求的中文注释 ---
      // 在流处理循环结束后，检查 assistantMessageId 是否仍然为 null。
      // 如果为 null，意味着没有收到任何有效的回复数据块来创建助手消息，
      // 因此，此时应将 isWaitingForResponse 设置为 false。
      // 之前的 `!routeUpdatedViaCallback` 条件已移除，因为它导致了 bug。
      // --- END 用户要求的中文注释 ---
      if (assistantMessageId && useChatStore.getState().streamingMessageId === assistantMessageId) {
        finalizeStreamingMessage(assistantMessageId);
      } else if (!assistantMessageId) { 
        // --- BEGIN 用户要求的中文注释 ---
        // 此分支处理流结束但未创建 assistantMessage 的情况 (例如，空回复或在第一个 chunk 前停止)。
        // 无论路由是否通过回调更新，此时都应结束等待状态。
        // --- END 用户要求的中文注释 ---
        console.log("[ChatInterface] No answer chunks received or stream stopped before first chunk. Setting isWaitingForResponse to false.");
        setIsWaitingForResponse(false); 
      }
      // --- END MODIFICATION ---

    } catch (error) {
      console.error("[handleSubmit] Error processing stream:", error);
      // --- BEGIN MODIFICATION ---
      // --- BEGIN 用户要求的中文注释 ---
      // 统一在 catch 块中将 isWaitingForResponse 设置为 false，无论 assistantMessageId 是否已创建。
      // 因为一旦进入 catch，表明正常流程已中断，不应再处于等待响应状态。
      // --- END 用户要求的中文注释 ---
      setIsWaitingForResponse(false); 
      if (assistantMessageId) {
        setMessageError(assistantMessageId, `处理消息时发生错误: ${(error as Error).message}`);
      } else {
        // --- BEGIN 用户要求的中文注释 ---
        // 如果错误发生在 assistantMessageId 创建之前，可以考虑添加一个全局错误提示
        // 例如: useChatStore.getState().setGlobalError(`请求处理失败: ${(error as Error).message}`);
        // --- END 用户要求的中文注释 ---
        console.warn("[ChatInterface] Error occurred before assistant message was created.");
      }
      setCurrentTaskId(null); 
      // throw error; // 考虑是否需要重新抛出错误，当前注释以允许 finally 执行
      // --- END MODIFICATION ---
    } finally {
        // --- BEGIN MODIFICATION ---
        // --- BEGIN 用户要求的中文注释 ---
        // finally 块作为最后一道防线，确保 isWaitingForResponse 状态最终被重置。
        // 之前的 try 和 catch 块应已处理了大多数情况。
        // --- END 用户要求的中文注释 ---
        if(useChatStore.getState().isWaitingForResponse) {
            console.warn("[ChatInterface] isWaitingForResponse was still true in finally block. Forcing to false. This may indicate an unhandled edge case in try/catch.");
            setIsWaitingForResponse(false);
        }
        // --- END MODIFICATION ---
    }
  }, [
    isProcessing,
    currentConversationId,
    currentUserIdentifier,
    addMessage,
    setIsWaitingForResponse,
    isWelcomeScreen,
    setIsWelcomeScreen,
    appendMessageChunk,
    finalizeStreamingMessage,
    setMessageError,
    setCurrentConversationId,
    setCurrentTaskId,
    router,
    currentPathname
  ]);

  // --- 停止处理 --- 
  const handleStopProcessing = useCallback(async () => {
    const state = useChatStore.getState();
    const currentStreamingId = state.streamingMessageId;
    const currentTaskId = state.currentTaskId;
    
    if (currentStreamingId) {
      console.log(`[handleStopProcessing] Stopping stream for message ID: ${currentStreamingId}, Task ID: ${currentTaskId}`);
      
      markAsManuallyStopped(currentStreamingId); 

      if (currentTaskId) {
        try {
          console.log(`[handleStopProcessing] Calling stopDifyStreamingTask for Task ID: ${currentTaskId}`);
          const stopResponse: DifyStopTaskResponse = await stopDifyStreamingTask(
            DIFY_APP_IDENTIFIER,
            currentTaskId,
            currentUserIdentifier
          );
          console.log("[handleStopProcessing] Stop request successful:", stopResponse);
          setCurrentTaskId(null);
        } catch (error) {
          console.error(`[handleStopProcessing] Error calling stopDifyStreamingTask for Task ID ${currentTaskId}:`, error);
        }
      } else {
        console.warn("[handleStopProcessing] Cannot send stop request: Task ID not found in store.");
      }
    } else {
      console.log("[handleStopProcessing] No active stream to stop.");
    }
  }, [markAsManuallyStopped, setCurrentTaskId]);

  // --- 判断 UI 状态 ---
  const shouldShowWelcome = isWelcomeScreen && messages.length === 0;
  const shouldShowLoader = messages.length > 0;

  // --- 返回 Hook 接口 ---
  return {
    messages, 
    handleSubmit,
    handleStopProcessing, 
    shouldShowWelcome,
    shouldShowLoader,
    isWelcomeScreen,
    isProcessing, 
    isWaitingForResponse,
  };
} 