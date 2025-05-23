import { useCallback, useState } from 'react';
import { usePendingConversationStore, PendingConversation } from '@lib/stores/pending-conversation-store';
import { streamDifyChat } from '@lib/services/dify/chat-service';
import { DifyStreamResponse } from '@lib/services/dify/types';
import { renameConversation } from '@lib/services/dify/conversation-service';
import type { DifyChatRequestPayload } from '@lib/services/dify/types';
import { useSupabaseAuth } from '@lib/supabase/hooks'; // For userId
// import { useCurrentAppStore } from '@lib/stores/current-app-store'; // appId is passed as param
import { createConversation } from '@lib/db'; // 使用新的优化版本
import { useChatStore } from '@lib/stores/chat-store'; // To set local conversation ID

interface UseCreateConversationReturn {
  initiateNewConversation: (
    payload: Omit<DifyChatRequestPayload, 'response_mode' | 'conversation_id' | 'auto_generate_name'>,
    appId: string,
    userIdentifier: string,
    onDbIdCreated?: (difyId: string, dbId: string) => void
  ) => Promise<{
    tempConvId: string;
    realConvId?: string; 
    taskId?: string;     
    answerStream?: AsyncGenerator<string, void, undefined>;
    error?: any;
  }>;
  isLoading: boolean;
  error: any;
}

export function useCreateConversation(): UseCreateConversationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const addPending = usePendingConversationStore((state) => state.addPending);
  const setRealIdAndStatus = usePendingConversationStore((state) => state.setRealIdAndStatus);
  const updateTitleInPendingStore = usePendingConversationStore((state) => state.updateTitle);
  const updateStatusInPendingStore = usePendingConversationStore((state) => state.updateStatus);
  const markAsOptimistic = usePendingConversationStore((state) => state.markAsOptimistic);
  const setSupabasePKInPendingStore = usePendingConversationStore((state) => state.setSupabasePK);

  const { session } = useSupabaseAuth();
  const currentUserId = session?.user?.id;
  const setCurrentChatConversationId = useChatStore((state) => state.setCurrentConversationId);


  const initiateNewConversation = useCallback(
    async (
      payloadData: Omit<DifyChatRequestPayload, 'response_mode' | 'conversation_id' | 'auto_generate_name'>,
      appId: string,
      userIdentifier: string,
      onDbIdCreated?: (difyId: string, dbId: string) => void
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
      addPending(tempConvId, "创建中..."); 
      updateStatusInPendingStore(tempConvId, 'creating');

      // --- BEGIN EARLY HIGHLIGHT ---
      try {
        const currentPath = window.location.pathname;
        if (currentPath === '/chat/new' || !currentPath.startsWith('/chat/temp-')) {
          console.log(`[useCreateConversation] Early highlight: Updating URL to /chat/${tempConvId}`);
          window.history.replaceState({}, '', `/chat/${tempConvId}`);
        }
        
        console.log(`[useCreateConversation] Early highlight: Setting ChatStore currentConversationId to ${tempConvId}`);
        setCurrentChatConversationId(tempConvId); 

        const { selectItem } = require('@lib/stores/sidebar-store').useSidebarStore.getState();
        console.log(`[useCreateConversation] Early highlight: Selecting item in SidebarStore: ${tempConvId}`);
        selectItem('chat', tempConvId, true); // 保持当前展开状态
      } catch (highlightError) {
        console.error('[useCreateConversation] Error during early highlight:', highlightError);
      }
      // --- END EARLY HIGHLIGHT ---

      let streamResponse: DifyStreamResponse | null = null;
      let realConvIdFromStream: string | null = null;
      let taskIdFromStream: string | null = null;

      try {
        updateStatusInPendingStore(tempConvId, 'streaming_message');
        const chatPayload: DifyChatRequestPayload = {
          ...payloadData,
          user: userIdentifier,
          response_mode: 'streaming',
          conversation_id: null, 
          auto_generate_name: false, 
        };

        streamResponse = await streamDifyChat(
          chatPayload,
          appId,
          (id) => { // onConversationIdReceived callback
            if (id && !realConvIdFromStream) {
              realConvIdFromStream = id;
              console.log(`[useCreateConversation] Real conversation ID received from stream: ${id}`);
              
              const currentPath = window.location.pathname;
              if (currentPath === `/chat/${tempConvId}`) {
                console.log(`[useCreateConversation] Updating URL from ${currentPath} to /chat/${id}`);
                window.history.replaceState({}, '', `/chat/${id}`);
              } else if (currentPath.includes('/chat/temp-') || currentPath === '/chat/new') {
                 console.log(`[useCreateConversation] Updating URL (from new/other temp) to /chat/${id}`);
                window.history.replaceState({}, '', `/chat/${id}`);
              }
              
              try {
                const chatStoreState = require('@lib/stores/chat-store').useChatStore.getState();
                if (chatStoreState.currentConversationId === tempConvId || chatStoreState.currentConversationId === null) {
                    chatStoreState.setCurrentConversationId(id);
                }

                const sidebarStoreState = require('@lib/stores/sidebar-store').useSidebarStore.getState();
                if (sidebarStoreState.selectedId === tempConvId || sidebarStoreState.selectedId === null) {
                    sidebarStoreState.selectItem('chat', id, true); // 保持当前展开状态
                }
              } catch (error) {
                console.error('[useCreateConversation] Error updating stores to realId:', error);
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
                  // console.log(`[useCreateConversation] Saving to DB: difyId=${difyConvId}, title=${convTitle}, userId=${currentUserId}, appId=${appId}, tempId=${currentTempConvId}`);
                  // --- BEGIN COMMENT ---
                  // 使用新的createConversation接口，处理Result类型
                  // 移除 last_message_preview 字段的设置，因为它现在由数据库触发器自动处理
                  // --- END COMMENT ---
                  const result = await createConversation({
                    user_id: currentUserId,
                    app_id: appId, 
                    external_id: difyConvId,
                    title: convTitle,
                    org_id: null, 
                    ai_config_id: null,
                    summary: null,
                    settings: {},
                    status: 'active', 
                    last_message_preview: null, // 由数据库触发器自动设置
                    metadata: {},
                  });

                  if (result.success && result.data) {
                    const localConversation = result.data;
                    // console.log(`[useCreateConversation] Saved to DB successfully. Local ID: ${localConversation.id}, Dify ID: ${difyConvId}`);
                    // setCurrentChatConversationId(difyConvId); // Already set to real ID or temp ID
                    setSupabasePKInPendingStore(difyConvId, localConversation.id); 
                    updateStatusInPendingStore(currentTempConvId, 'title_resolved'); 
                    markAsOptimistic(difyConvId); 
                    
                    // console.log(`[useCreateConversation] Marked ${currentTempConvId} (realId: ${difyConvId}, supabase_pk: ${localConversation.id}) as optimistic and set PK in pending store.`);

                    // 新增：调用回调函数，直接通知数据库ID创建完成
                    if (typeof onDbIdCreated === 'function') {
                      console.log(`[useCreateConversation] 数据库对话记录创建完成，通知调用者, difyId=${difyConvId}, dbId=${localConversation.id}`);
                      onDbIdCreated(difyConvId, localConversation.id);
                    }
                  } else {
                    console.error(`[useCreateConversation] 创建对话失败:`, result.error);
                    throw new Error(result.error?.message || "Failed to save conversation to local DB or local ID not returned.");
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

                  // 只有当前路由确实是这个对话时才更新选中状态
                  try {
                    const currentPath = window.location.pathname;
                    if (currentPath === `/chat/${id}`) {
                      const { selectItem } = require('@lib/stores/sidebar-store').useSidebarStore.getState();
                      selectItem('chat', id, true); // 保持当前展开状态
                    }
                  } catch (error) {
                    console.error('[useCreateConversation] Error selecting item in sidebar after title:', error);
                  }
                })
                .catch(async renameError => { 
                  console.error(`[useCreateConversation] Error fetching title for ${id}:`, renameError);
                  const fallbackTitle = "获取标题失败";
                  updateTitleInPendingStore(tempConvId, fallbackTitle, true); 
                  await saveConversationToDb(id, fallbackTitle, tempConvId); 
                  
                  // 只有当前路由确实是这个对话时才更新选中状态
                  try {
                    const currentPath = window.location.pathname;
                    if (currentPath === `/chat/${id}`) {
                      const { selectItem } = require('@lib/stores/sidebar-store').useSidebarStore.getState();
                      selectItem('chat', id, true); // 保持当前展开状态
                    }
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
            updateStatusInPendingStore(tempConvId, 'title_fetching'); 
            
            const currentPath = window.location.pathname;
            if (currentPath === `/chat/${tempConvId}` || currentPath.includes('/chat/temp-') || currentPath === '/chat/new') {
                console.log(`[useCreateConversation] Updating URL (fallback) from ${currentPath} to /chat/${realConvIdFromStream}`);
                window.history.replaceState({}, '', `/chat/${realConvIdFromStream}`);
            }
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
      markAsOptimistic,
      setSupabasePKInPendingStore,
      currentUserId,
      setCurrentChatConversationId,
    ]
  );

  return {
    initiateNewConversation,
    isLoading,
    error,
  };
}
