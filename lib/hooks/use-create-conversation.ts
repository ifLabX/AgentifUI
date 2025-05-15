import { useCallback, useState } from 'react';
import { usePendingConversationStore, PendingConversation } from '@lib/stores/pending-conversation-store';
import { streamDifyChat } from '@lib/services/dify/chat-service';
import { DifyStreamResponse } from '@lib/services/dify/types';
import { renameConversation } from '@lib/services/dify/conversation-service';
import type { DifyChatRequestPayload } from '@lib/services/dify/types';
import { useSupabaseAuth } from '@lib/supabase/hooks'; // For userId
import { useCurrentAppStore } from '@lib/stores/current-app-store'; // For appId
import { createConversation as dbCreateConversation } from '@lib/db'; // DB function
import { useChatStore } from '@lib/stores/chat-store'; // To set local conversation ID

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
  const updateTitleInPendingStore = usePendingConversationStore((state) => state.updateTitle); // Renamed for clarity
  const updateStatusInPendingStore = usePendingConversationStore((state) => state.updateStatus); // Renamed for clarity
  const removePending = usePendingConversationStore((state) => state.removePending);

  // --- BEGIN COMMENT ---
  // Get current user and app context
  // --- END COMMENT ---
  const { session } = useSupabaseAuth();
  const currentUserId = session?.user?.id;
  const { currentAppId } = useCurrentAppStore();
  const setCurrentChatConversationId = useChatStore((state) => state.setCurrentConversationId);


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
      updateStatusInPendingStore(tempConvId, 'creating');

      let streamResponse: DifyStreamResponse | null = null;
      let realConvIdFromStream: string | null = null;
      let taskIdFromStream: string | null = null;

      try {
        // Step 1: 创建对话并开始流式消息 (auto_generate_name: false)
        updateStatusInPendingStore(tempConvId, 'streaming_message');
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
              
              const currentPath = window.location.pathname;
              if (currentPath.includes('/chat/temp-') || currentPath === '/chat/new') {
                console.log(`[useCreateConversation] Updating URL from ${currentPath} to /chat/${id}`);
                window.history.replaceState({}, '', `/chat/${id}`);
              }
              
              try {
                const { selectItem } = require('@lib/stores/sidebar-store').useSidebarStore.getState();
                console.log(`[useCreateConversation] 选中新对话并激活悬停效果: ${id}`);
                selectItem('chat', id, true); 
                
                const { setCurrentConversationId } = require('@lib/stores/chat-store').useChatStore.getState();
                setCurrentConversationId(id);
              } catch (error) {
                console.error('[useCreateConversation] 选中对话失败:', error);
              }
              
              setRealIdAndStatus(tempConvId, id, 'stream_completed_title_pending');
              updateStatusInPendingStore(tempConvId, 'title_fetching');

              const saveConversationToDb = async (difyConvId: string, convTitle: string, currentTempConvId: string) => {
                if (!currentUserId || !appId) {
                  console.error("[useCreateConversation] Cannot save to DB: userId or appId is missing.", { currentUserId, appId });
                  updateStatusInPendingStore(currentTempConvId, 'failed'); 
                  updateTitleInPendingStore(currentTempConvId, "保存对话失败", true);
                  return;
                }
                try {
                  console.log(`[useCreateConversation] Saving to DB: difyId=${difyConvId}, title=${convTitle}, userId=${currentUserId}, appId=${appId}, tempId=${currentTempConvId}`);
                  const localConversation = await dbCreateConversation({
                    user_id: currentUserId,
                    app_id: appId, 
                    external_id: difyConvId,
                    title: convTitle,
                    org_id: null, 
                    ai_config_id: null,
                    summary: null,
                    settings: {},
                    status: 'active', 
                    last_message_preview: payloadData.query.substring(0, 100), 
                    metadata: {},
                  });

                  if (localConversation && localConversation.id) {
                    console.log(`[useCreateConversation] Saved to DB successfully. Local ID: ${localConversation.id}`);
                    setCurrentChatConversationId(localConversation.id); 
                    updateStatusInPendingStore(currentTempConvId, 'title_resolved'); 
                    removePending(currentTempConvId); 
                    
                    console.log("[useCreateConversation] TODO: Implement sidebar refresh trigger.");

                  } else {
                    throw new Error("Failed to save conversation to local DB or local ID not returned.");
                  }
                } catch (dbError) {
                  console.error(`[useCreateConversation] Error saving conversation (difyId: ${difyConvId}) to DB:`, dbError);
                  updateStatusInPendingStore(currentTempConvId, 'failed');
                  updateTitleInPendingStore(currentTempConvId, "保存对话失败", true);
                }
              };

              renameConversation(appId, id, { user: userIdentifier, auto_generate: true })
                .then(async renameResponse => { 
                  const finalTitle = (renameResponse && renameResponse.name) ? renameResponse.name : "新对话";
                  console.log(`[useCreateConversation] Title resolved for ${id}: ${finalTitle}`);
                  updateTitleInPendingStore(tempConvId, finalTitle, true); 
                  await saveConversationToDb(id, finalTitle, tempConvId); 

                  try {
                    const { selectItem } = require('@lib/stores/sidebar-store').useSidebarStore.getState();
                    selectItem('chat', id, true); 
                  } catch (error) {
                    console.error('[useCreateConversation] Error selecting item in sidebar:', error);
                  }
                })
                .catch(async renameError => { 
                  console.error(`[useCreateConversation] Error fetching title for ${id}:`, renameError);
                  const fallbackTitle = "获取标题失败";
                  updateTitleInPendingStore(tempConvId, fallbackTitle, true); 
                  await saveConversationToDb(id, fallbackTitle, tempConvId); 

                  try {
                    const { selectItem } = require('@lib/stores/sidebar-store').useSidebarStore.getState();
                    selectItem('chat', id, true);
                  } catch (error) {
                    console.error('[useCreateConversation] Error selecting item in sidebar (title fetch failed):', error);
                  }
                });
            }
          }
        );
        
        if (!realConvIdFromStream) realConvIdFromStream = streamResponse.getConversationId();
        if (!taskIdFromStream) taskIdFromStream = streamResponse.getTaskId();

        if (realConvIdFromStream && !usePendingConversationStore.getState().getPendingByRealId(realConvIdFromStream)?.realId) {
            setRealIdAndStatus(tempConvId, realConvIdFromStream, 'stream_completed_title_pending');
            // Corrected line: use tempConvId for store operations
            updateStatusInPendingStore(tempConvId, 'title_fetching'); 
            
            const currentPath = window.location.pathname;
            if (currentPath.includes('/chat/temp-') || currentPath === '/chat/new') {
                console.log(`[useCreateConversation] Updating URL (fallback) from ${currentPath} to /chat/${realConvIdFromStream}`);
                window.history.replaceState({}, '', `/chat/${realConvIdFromStream}`);
            }
            /*
            // Commenting out duplicate/fallback title fetching logic as discussed,
            // to rely on the primary flow within onConversationIdReceived.
            renameConversation(appId, realConvIdFromStream, { user: userIdentifier, auto_generate: true })
              // ...
            */
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
        updateStatusInPendingStore(tempConvId, 'failed'); 
        updateTitleInPendingStore(tempConvId, "创建对话失败", true);
        return { tempConvId, error: e };
      }
    },
    [
      addPending, 
      setRealIdAndStatus, 
      updateTitleInPendingStore, 
      updateStatusInPendingStore, 
      removePending,
      currentUserId, 
      currentAppId, // Added currentAppId from useCurrentAppStore to dependencies
      setCurrentChatConversationId,
    ]
  );

  return {
    initiateNewConversation,
    isLoading,
    error,
  };
}
