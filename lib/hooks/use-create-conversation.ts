import { useCallback, useState } from 'react';
import { usePendingConversationStore } from '@lib/stores/pending-conversation-store';
import { streamDifyChat } from '@lib/services/dify/chat-service';
import { DifyStreamResponse } from '@lib/services/dify/types';
import { renameConversation } from '@lib/services/dify/conversation-service';
import type { DifyChatRequestPayload } from '@lib/services/dify/types';

// --- BEGIN COMMENT ---
// 定义 Hook 返回值的接口
// --- END COMMENT ---
interface UseCreateConversationReturn {
  initiateNewConversation: (
    payload: Omit<DifyChatRequestPayload, 'response_mode' | 'conversation_id' | 'auto_generate_name'>,
    appId: string,
    userIdentifier: string
  ) => Promise<{
    tempConvId: string;
    realConvId?: string; // 初始可能未定义，在流中获取
    taskId?: string;     // 初始可能未定义
    answerStream?: AsyncGenerator<string, void, undefined>;
    error?: any;
  }>;
  isLoading: boolean;
  error: any;
}

// --- BEGIN COMMENT ---
// Hook 用于封装新对话的创建流程，包括：
// 1. 在 pending store 中注册一个临时对话
// 2. 调用 Dify chat-messages API (auto_generate_name: false) 创建对话并获取流
// 3. 在获取到 realConvId 后，立即异步调用 Dify renameConversation API (auto_generate: true) 获取标题
// --- END COMMENT ---
export function useCreateConversation(): UseCreateConversationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const addPending = usePendingConversationStore((state) => state.addPending);
  const setRealId = usePendingConversationStore((state) => state.setRealId);
  const updateTitleAndStatus = usePendingConversationStore((state) => state.updateTitleAndStatus);
  const updateStatus = usePendingConversationStore((state) => state.updateStatus);

  const initiateNewConversation = useCallback(
    async (
      payloadData: Omit<DifyChatRequestPayload, 'response_mode' | 'conversation_id' | 'auto_generate_name'>,
      appId: string,
      userIdentifier: string
    ): Promise<{
      tempConvId: string;
      realConvId?: string;
      taskId?: string;
      answerStream?: AsyncGenerator<string, void, undefined>;
      error?: any;
    }> => {
      setIsLoading(true);
      setError(null);

      const tempConvId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      addPending(tempConvId, "创建中..."); // 初始占位标题

      let streamResponse: DifyStreamResponse | null = null;
      let realConvIdFromStream: string | null = null;
      let taskIdFromStream: string | null = null;

      try {
        // Step 1: 创建对话并开始流式消息 (auto_generate_name: false)
        const chatPayload: DifyChatRequestPayload = {
          ...payloadData,
          user: userIdentifier,
          response_mode: 'streaming',
          conversation_id: null, // 强制创建新对话
          auto_generate_name: false, // 重要：不让 chat-messages API 生成标题
        };

        streamResponse = await streamDifyChat(
          chatPayload,
          appId,
          (id) => { // onConversationIdReceived callback
            if (id && !realConvIdFromStream) {
              realConvIdFromStream = id;
              console.log(`[useCreateConversation] Real conversation ID received from stream: ${id}`);
              setRealId(tempConvId, id); // 更新 pending store
              updateStatus(id, 'untitled'); // 状态仍是 untitled，等待标题

              // Step 2: 异步获取/生成标题 (一旦有了 realConvId)
              renameConversation(appId, id, { user: userIdentifier, auto_generate: true })
                .then(renameResponse => {
                  if (renameResponse && renameResponse.name) {
                    console.log(`[useCreateConversation] Title fetched for ${id}: ${renameResponse.name}`);
                    updateTitleAndStatus(id, renameResponse.name, 'resolved');
                  } else {
                    console.warn(`[useCreateConversation] Title fetch for ${id} returned no name. Setting to 'Untitled'.`);
                    updateTitleAndStatus(id, "Untitled", 'untitled'); // 标题获取失败或为空，但对话本身可能没问题
                  }
                })
                .catch(renameError => {
                  console.error(`[useCreateConversation] Error fetching title for ${id}:`, renameError);
                  // 即使标题获取失败，对话流可能仍然成功，所以只更新标题为 "Untitled"
                  // 除非 renameError 表示一个严重到需要将整个 pending conversation 标记为 failed 的问题
                  updateTitleAndStatus(id, "Untitled (获取标题失败)", 'untitled'); 
                });
            }
          }
        );
        
        // 注意：streamDifyChat 的 onConversationIdReceived 是在流内部被调用的。
        // 我们需要确保在 streamDifyChat Promise resolve 后，realConvIdFromStream 已经被设置（如果流中有的话）
        // 或者从 streamResponse.getConversationId() 获取。
        // streamDifyChat 的实现是，getConversationId() 会在流处理过程中被填充。

        // 尝试在流开始前或刚开始时获取 realConvId 和 taskId
        // 这是为了尽早触发标题获取。
        // 如果 onConversationIdReceived 已经执行，这里的 getConversationId() 应该能拿到值。
        if (!realConvIdFromStream) realConvIdFromStream = streamResponse.getConversationId();
        if (!taskIdFromStream) taskIdFromStream = streamResponse.getTaskId();

        if (realConvIdFromStream && !usePendingConversationStore.getState().getPendingByRealId(realConvIdFromStream)?.realId) {
            // 如果回调由于某种原因没有及时设置 realId (例如流非常快，回调前的检查通过了)
            // 在这里再次确保设置
            setRealId(tempConvId, realConvIdFromStream);
            updateStatus(realConvIdFromStream, 'untitled');

            // 再次尝试触发标题获取，以防回调中的逻辑未执行或执行太晚
            renameConversation(appId, realConvIdFromStream, { user: userIdentifier, auto_generate: true })
            .then(renameResponse => {
              if (renameResponse && renameResponse.name) {
                updateTitleAndStatus(realConvIdFromStream!, renameResponse.name, 'resolved');
              } else {
                updateTitleAndStatus(realConvIdFromStream!, "Untitled", 'untitled');
              }
            })
            .catch(renameError => {
              console.error(`[useCreateConversation] Error fetching title (fallback) for ${realConvIdFromStream}:`, renameError);
              updateTitleAndStatus(realConvIdFromStream!, "Untitled (获取标题失败)", 'untitled');
            });
        }


        setIsLoading(false);
        return {
          tempConvId,
          realConvId: realConvIdFromStream || undefined,
          taskId: taskIdFromStream || undefined,
          answerStream: streamResponse.answerStream,
        };

      } catch (e) {
        console.error('[useCreateConversation] Error initiating new conversation:', e);
        setError(e);
        setIsLoading(false);
        updateStatus(tempConvId, 'failed'); // 标记这个临时对话创建失败
        // 可以在这里设置一个更具体的错误标题
        updateTitleAndStatus(tempConvId, "创建对话失败", 'failed');
        return { tempConvId, error: e };
      }
    },
    [addPending, setRealId, updateTitleAndStatus, updateStatus]
  );

  return {
    initiateNewConversation,
    isLoading,
    error,
  };
}
