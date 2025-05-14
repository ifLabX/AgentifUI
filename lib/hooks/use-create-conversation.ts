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
// 1. 在 pending store 中注册一个临时对话，状态为 'creating'
// 2. 开始流式消息前，更新状态为 'streaming_message'
// 3. 获取到 realConvId 后，更新状态为 'stream_completed_title_pending'
// 4. 开始获取标题时，更新状态为 'title_fetching'
// 5. 标题获取成功后，更新状态为 'title_resolved'
// 6. 如果任何步骤失败，更新状态为 'failed'
// --- END COMMENT ---
export function useCreateConversation(): UseCreateConversationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const addPending = usePendingConversationStore((state) => state.addPending);
  const setRealIdAndStatus = usePendingConversationStore((state) => state.setRealIdAndStatus);
  const updateTitle = usePendingConversationStore((state) => state.updateTitle);
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
      updateStatus(tempConvId, 'creating');

      let streamResponse: DifyStreamResponse | null = null;
      let realConvIdFromStream: string | null = null;
      let taskIdFromStream: string | null = null;

      try {
        // Step 1: 创建对话并开始流式消息 (auto_generate_name: false)
        updateStatus(tempConvId, 'streaming_message');
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
              
              // --- BEGIN MODIFIED COMMENT ---
              // 重要：立即更新当前路径，确保从临时对话路径切换到真实对话路径
              // 这里使用 window.history.replaceState 而不是 router.replace
              // 因为这是在回调中执行，可能会比 router.replace 更可靠
              // --- END MODIFIED COMMENT ---
              const currentPath = window.location.pathname;
              if (currentPath.includes('/chat/temp-') || currentPath === '/chat/new') {
                console.log(`[useCreateConversation] Updating URL from ${currentPath} to /chat/${id}`);
                window.history.replaceState({}, '', `/chat/${id}`);
              }
              
              // 更新状态为 stream_completed_title_pending，表示流已经开始但标题尚未获取
              setRealIdAndStatus(tempConvId, id, 'stream_completed_title_pending');
              // 更新状态为标题获取中
              updateStatus(id, 'title_fetching');

              // Step 2: 异步获取/生成标题 (一旦有了 realConvId)
              renameConversation(appId, id, { user: userIdentifier, auto_generate: true })
                .then(renameResponse => {
                  if (renameResponse && renameResponse.name) {
                    console.log(`[useCreateConversation] Title fetched for ${id}: ${renameResponse.name}`);
                    updateTitle(id, renameResponse.name, true); // 更新为最终标题
                  } else {
                    console.warn(`[useCreateConversation] Title fetch for ${id} returned no name. Setting to 'Untitled'.`);
                    updateTitle(id, "Untitled", true); // 标题获取失败或为空，但对话本身可能没问题
                  }
                })
                .catch(renameError => {
                  console.error(`[useCreateConversation] Error fetching title for ${id}:`, renameError);
                  // 即使标题获取失败，对话流可能仍然成功，所以只更新标题为 "Untitled"
                  // 除非 renameError 表示一个严重到需要将整个 pending conversation 标记为 failed 的问题
                  updateTitle(id, "Untitled (获取标题失败)", true); 
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
            // --- BEGIN MODIFIED COMMENT ---
            // 如果回调由于某种原因没有及时设置 realId (例如流非常快，回调前的检查通过了)
            // 在这里再次确保设置
            // --- END MODIFIED COMMENT ---
            setRealIdAndStatus(tempConvId, realConvIdFromStream, 'stream_completed_title_pending');
            updateStatus(realConvIdFromStream, 'title_fetching');
            
            // --- BEGIN MODIFIED COMMENT ---
            // 再次检查并更新URL路径，确保从临时对话路径切换到真实对话路径
            // --- END MODIFIED COMMENT ---
            const currentPath = window.location.pathname;
            if (currentPath.includes('/chat/temp-') || currentPath === '/chat/new') {
                console.log(`[useCreateConversation] Updating URL (fallback) from ${currentPath} to /chat/${realConvIdFromStream}`);
                window.history.replaceState({}, '', `/chat/${realConvIdFromStream}`);
            }

            // --- BEGIN MODIFIED COMMENT ---
            // 再次尝试触发标题获取，以防回调中的逻辑未执行或执行太晚
            // --- END MODIFIED COMMENT ---
            renameConversation(appId, realConvIdFromStream, { user: userIdentifier, auto_generate: true })
            .then(renameResponse => {
              if (renameResponse && renameResponse.name) {
                updateTitle(realConvIdFromStream!, renameResponse.name, true);
              } else {
                updateTitle(realConvIdFromStream!, "Untitled", true);
              }
            })
            .catch(renameError => {
              console.error(`[useCreateConversation] Error fetching title (fallback) for ${realConvIdFromStream}:`, renameError);
              updateTitle(realConvIdFromStream!, "Untitled (获取标题失败)", true);
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
        updateTitle(tempConvId, "创建对话失败", true);
        return { tempConvId, error: e };
      }
    },
    [addPending, setRealIdAndStatus, updateTitle, updateStatus]
  );

  return {
    initiateNewConversation,
    isLoading,
    error,
  };
}
