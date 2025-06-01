/**
 * 新对话创建钩子
 * 
 * --- BEGIN COMMENT ---
 * 🎯 适用范围：仅用于对话类 Dify 应用（chatbot、agent、chatflow）
 * 这些应用的数据存储到 conversations + messages 表
 * 
 * 任务类应用（workflow、text-generation）使用独立的组件和存储逻辑，
 * 数据存储到 app_executions 表，不使用此 hook
 * --- END COMMENT ---
 * 
 * 提供新对话的创建和初始化功能，包括：
 * - Dify API 调用和流式响应处理
 * - 数据库对话记录创建
 * - 路由和状态管理
 * - 对话标题自动生成
 * - 常用应用管理
 */

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
import { useAutoAddFavoriteApp } from '@lib/stores/favorite-apps-store';

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

  // --- BEGIN COMMENT ---
  // 🎯 新增：打字机效果相关Actions
  // --- END COMMENT ---
  const startTitleTypewriter = usePendingConversationStore((state) => state.startTitleTypewriter);
  const completeTitleTypewriter = usePendingConversationStore((state) => state.completeTitleTypewriter);

  const { session } = useSupabaseAuth();
  const currentUserId = session?.user?.id;
  const setCurrentChatConversationId = useChatStore((state) => state.setCurrentConversationId);
  
  // --- BEGIN COMMENT ---
  // 添加常用应用管理hook
  // --- END COMMENT ---
  const { addToFavorites } = useAutoAddFavoriteApp();

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
        if (currentPath === '/chat/new' || 
            !currentPath.startsWith('/chat/temp-') ||
            currentPath.startsWith('/apps/')) { // 🎯 添加应用详情页面的路径支持
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
              } else if (currentPath.includes('/chat/temp-') || 
                        currentPath === '/chat/new' ||
                        currentPath.startsWith('/apps/')) { // 🎯 添加应用详情页面的路径支持
                 console.log(`[useCreateConversation] Updating URL (from new/temp/apps) to /chat/${id}`);
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

              // --- BEGIN COMMENT ---
              // 立即创建数据库记录，不等待标题获取完成
              // 这确保在流式响应期间消息可以被保存
              // --- END COMMENT ---
              const saveConversationToDb = async (difyConvId: string, convTitle: string, currentTempConvId: string) => {
                if (!currentUserId || !appId) {
                  console.error("[useCreateConversation] Cannot save to DB: userId or appId is missing.", { currentUserId, appId });
                  updateStatusInPendingStore(currentTempConvId, 'failed'); 
                  updateTitleInPendingStore(currentTempConvId, "保存对话失败", true);
                  return;
                }
                try {
                  console.log(`[useCreateConversation] 立即创建数据库记录: difyId=${difyConvId}, title=${convTitle}, userId=${currentUserId}, appId=${appId}`);
                  
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
                    console.log(`[useCreateConversation] 数据库记录创建成功，数据库ID: ${localConversation.id}, Dify对话ID: ${difyConvId}`);
                    
                    // --- BEGIN COMMENT ---
                    // 🎯 在对话创建成功后添加应用到常用列表
                    // 这是最佳时机：确保对话真正创建成功，且只在新对话时执行一次
                    // --- END COMMENT ---
                    console.log(`[useCreateConversation] 添加应用到常用列表: ${appId}`);
                    addToFavorites(appId);
                    
                    setSupabasePKInPendingStore(difyConvId, localConversation.id); 
                    updateStatusInPendingStore(currentTempConvId, 'title_resolved'); 
                    markAsOptimistic(difyConvId);

                    // 立即调用回调函数，通知数据库ID创建完成
                    if (typeof onDbIdCreated === 'function') {
                      console.log(`[useCreateConversation] 立即通知数据库ID创建完成: difyId=${difyConvId}, dbId=${localConversation.id}`);
                      onDbIdCreated(difyConvId, localConversation.id);
                    }
                    
                    return localConversation.id;
                  } else {
                    console.error(`[useCreateConversation] 创建对话失败:`, result.error);
                    throw new Error(result.error?.message || "Failed to save conversation to local DB or local ID not returned.");
                  }
                } catch (dbError) {
                  console.error(`[useCreateConversation] Error saving conversation (difyId: ${difyConvId}) to DB:`, dbError);
                  updateStatusInPendingStore(currentTempConvId, 'failed');
                  updateTitleInPendingStore(currentTempConvId, "保存对话失败", true);
                  return null;
                }
              };

              // --- BEGIN COMMENT ---
              // 使用立即执行的异步函数处理数据库记录创建
              // 这避免了在非异步回调中使用await的问题
              // --- END COMMENT ---
              (async () => {
                // 立即创建数据库记录，使用临时标题
                const tempTitle = "创建中...";
                console.log(`[useCreateConversation] 立即创建数据库记录，Dify对话ID=${id}`);
                const dbId = await saveConversationToDb(id, tempTitle, tempConvId);
                
                // 异步获取正式标题并更新数据库记录
                renameConversation(appId, id, { user: userIdentifier, auto_generate: true })
                  .then(async renameResponse => { 
                    const finalTitle = (renameResponse && renameResponse.name) ? renameResponse.name : "新对话";
                    console.log(`[useCreateConversation] 标题获取成功，启动打字机效果: ${finalTitle}`);
                    
                    // --- BEGIN COMMENT ---
                    // 🎯 启动打字机效果而不是直接更新标题
                    // --- END COMMENT ---
                    startTitleTypewriter(tempConvId, finalTitle);
                    
                    // 更新数据库中的标题
                    if (dbId && finalTitle !== tempTitle) {
                      try {
                        const { updateConversation } = require('@lib/db/conversations');
                        await updateConversation(dbId, { title: finalTitle });
                        console.log(`[useCreateConversation] 数据库标题更新成功: ${finalTitle}`);
                      } catch (updateError) {
                        console.error(`[useCreateConversation] 更新数据库标题失败:`, updateError);
                      }
                    }

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
                    console.error(`[useCreateConversation] 标题获取失败，使用默认标题:`, renameError);
                    const fallbackTitle = "新对话";
                    
                    // --- BEGIN COMMENT ---
                    // 🎯 启动打字机效果显示默认标题
                    // --- END COMMENT ---
                    startTitleTypewriter(tempConvId, fallbackTitle);
                    
                    // 更新数据库中的标题
                    if (dbId) {
                      try {
                        const { updateConversation } = require('@lib/db/conversations');
                        await updateConversation(dbId, { title: fallbackTitle });
                        console.log(`[useCreateConversation] 使用默认标题更新数据库: ${fallbackTitle}`);
                      } catch (updateError) {
                        console.error(`[useCreateConversation] 更新默认标题失败:`, updateError);
                      }
                    }
                    
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
              })().catch(error => {
                console.error('[useCreateConversation] 数据库记录创建过程发生错误:', error);
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
            if (currentPath === `/chat/${tempConvId}` || 
                currentPath.includes('/chat/temp-') || 
                currentPath === '/chat/new' ||
                currentPath.startsWith('/apps/')) { // 🎯 添加应用详情页面的路径支持
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
      startTitleTypewriter,
      completeTitleTypewriter,
      currentUserId,
      setCurrentChatConversationId,
      addToFavorites,
    ]
  );

  return {
    initiateNewConversation,
    isLoading,
    error,
  };
}
