/**
 * 聊天界面交互钩子
 * 
 * --- BEGIN COMMENT ---
 * 🎯 适用范围：仅用于对话类 Dify 应用（chatbot、agent、chatflow）
 * 这些应用的数据存储到 conversations + messages 表
 * 
 * 任务类应用（workflow、text-generation）使用独立的组件和存储逻辑，
 * 数据存储到 app_executions 表，不使用此 hook
 * --- END COMMENT ---
 * 
 * 提供完整的聊天功能，包括：
 * - 消息发送和接收
 * - 流式响应处理
 * - 对话创建和管理
 * - 消息持久化
 * - 文件上传支持
 * - 错误处理和重试
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useChatInputStore } from '@lib/stores/chat-input-store';
import { useChatStore, selectIsProcessing, ChatMessage } from '@lib/stores/chat-store';
import { streamDifyChat, stopDifyStreamingTask } from '@lib/services/dify/chat-service';
import { useSupabaseAuth } from '@lib/supabase/hooks'; // 假设 Supabase Auth Hook
import { useCurrentApp } from '@lib/hooks/use-current-app'; // 使用新的 hook
import type { DifyChatRequestPayload, DifyStopTaskResponse, DifyStreamResponse } from '@lib/services/dify/types';
import type { ServiceInstance } from '@lib/types/database';
import { useCreateConversation } from './use-create-conversation';
import { usePendingConversationStore } from '@lib/stores/pending-conversation-store';
import { useChatMessages } from './use-chat-messages';
import { getConversationByExternalId } from '@lib/db/conversations';

// --- BEGIN COMMENT ---
// 移除硬编码的 DIFY_APP_IDENTIFIER 和 currentUserIdentifier
// 这些将从 store 和 auth hook 中获取
// --- END COMMENT ---

// --- BEGIN COMMENT ---
// 🎯 优化流式体验：减少批量更新间隔，提高响应性
// 从100ms降低到30ms，让流式效果更加丝滑
// --- END COMMENT ---
const CHUNK_APPEND_INTERVAL = 30; 

export function useChatInterface() {
  const router = useRouter();
  const currentPathname = usePathname();
  const { isWelcomeScreen, setIsWelcomeScreen } = useChatInputStore();

  // --- BEGIN COMMENT ---
  // 获取认证状态和当前应用信息，使用新的 hook
  // --- END COMMENT ---
  const { session } = useSupabaseAuth();
  const currentUserId = session?.user?.id;
  const { 
    currentAppId, 
    currentAppInstance, 
    isLoading: isLoadingAppId, 
    error: errorLoadingAppId,
    hasCurrentApp,
    isReady: isAppReady,
    ensureAppReady, // 新增：强制等待App配置就绪的方法
    validateConfig // 新增：验证并切换App配置的方法
  } = useCurrentApp();
  // --- END COMMENT ---

  const messages = useChatStore(state => state.messages);
  const addMessage = useChatStore(state => state.addMessage);
  const appendMessageChunk = useChatStore(state => state.appendMessageChunk);
  const finalizeStreamingMessage = useChatStore(state => state.finalizeStreamingMessage);
  const markAsManuallyStopped = useChatStore(state => state.markAsManuallyStopped);
  const setMessageError = useChatStore(state => state.setMessageError);
  const setIsWaitingForResponse = useChatStore(state => state.setIsWaitingForResponse);
  const setCurrentConversationId = useChatStore(state => state.setCurrentConversationId);
  const setCurrentTaskId = useChatStore(state => state.setCurrentTaskId);
  const updateMessage = useChatStore(state => state.updateMessage); // 添加updateMessage函数

  const { initiateNewConversation } = useCreateConversation();
  const updatePendingStatus = usePendingConversationStore((state) => state.updateStatus);
  
  // --- BEGIN COMMENT ---
  // 使用消息持久化钩子，传入当前用户ID
  // --- END COMMENT ---
  const { saveMessage, saveStoppedAssistantMessage, saveErrorPlaceholder } = useChatMessages(currentUserId);

  // --- BEGIN COMMENT ---
  // 状态管理：
  // difyConversationId: Dify对话ID（外部ID），用于路由和 API 调用
  // dbConversationUUID: 数据库对话ID（内部ID），用于消息持久化
  // conversationAppId: 历史对话的原始appId，优先于localStorage中的当前app
  // --- END COMMENT ---
  const [difyConversationId, setDifyConversationId] = useState<string | null>(null);
  const [dbConversationUUID, setDbConversationUUID] = useState<string | null>(null);
  const [conversationAppId, setConversationAppId] = useState<string | null>(null);

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

  // --- BEGIN COMMENT ---
  // 路由监听逻辑：
  // 1. 如果是有效的对话URL，获取Dify对话ID并查询数据库对话ID
  // 2. 如果是新对话或临时对话，重置状态
  // --- END COMMENT ---
  useEffect(() => {
    // 如果当前路径包含对话ID（不是new或temp-开头），则尝试从 URL 中提取 Dify 对话 ID
    if (currentPathname && 
        currentPathname.startsWith('/chat/') && 
        !currentPathname.includes('/chat/new') && 
        !currentPathname.includes('/chat/temp-')) {
      const pathConversationId = currentPathname.replace('/chat/', '');
      
      // 设置 Dify 对话 ID
      setDifyConversationId(pathConversationId);
      
      // 根据 Dify 对话 ID 查询数据库对话记录
      const fetchDbConversation = async () => {
        try {
          console.log(`[路由监听] 开始查询外部ID为 ${pathConversationId} 的对话记录`);
          
          const result = await getConversationByExternalId(pathConversationId);
          
          if (result.success && result.data) {
            console.log(`[路由监听] 找到对话记录，数据库ID=${result.data.id}, 原始appId=${result.data.app_id}`);
            setDbConversationUUID(result.data.id);
            
            // --- BEGIN COMMENT ---
            // 🎯 关键修复：保存历史对话的原始appId
            // 这确保继续历史对话时使用正确的app，而不是localStorage中当前选中的app
            // --- END COMMENT ---
            if (result.data.app_id) {
              setConversationAppId(result.data.app_id);
              console.log(`[路由监听] 设置对话原始appId: ${result.data.app_id}`);
            } else {
              setConversationAppId(null);
              console.log(`[路由监听] 对话记录中没有appId，将使用当前选中的app`);
            }
          } else if (result.success && !result.data) {
            console.log(`[路由监听] 未找到外部ID为 ${pathConversationId} 的对话记录`);
            setDbConversationUUID(null);
            setConversationAppId(null);
          } else {
            console.error(`[路由监听] 查询对话记录失败:`, result.error);
            setDbConversationUUID(null);
            setConversationAppId(null);
          }
        } catch (error) {
          console.error(`[路由监听] 查询对话记录异常:`, error);
          setDbConversationUUID(null);
          setConversationAppId(null);
        }
      };
      
      fetchDbConversation();
      
    } else if (currentPathname === '/chat/new' || (currentPathname && currentPathname.includes('/chat/temp-'))) {
      // 新对话或临时对话，清除所有ID
      console.log(`[路由监听] 新对话或临时对话，重置状态`);
      setDifyConversationId(null);
      setDbConversationUUID(null);
      setConversationAppId(null);
    }
  }, [currentPathname]);

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
    // 在提交前检查用户是否登录
    // --- END COMMENT ---
    if (!currentUserId) {
      console.error("useChatInterface.handleSubmit: User not authenticated.");
      // TODO: 可以通过 useNotificationStore 显示提示
      return;
    }

    // --- BEGIN COMMENT ---
    // 🎯 核心修改：智能App选择逻辑
    // 1. 如果是历史对话，优先使用对话记录中的原始appId
    // 2. 如果是新对话或历史对话没有appId，使用当前选中的app
    // 3. 强制等待App配置就绪，解决时序问题
    // --- END COMMENT ---
    let appConfig: { appId: string; instance: ServiceInstance };
    try {
      console.log('[handleSubmit] 开始确定使用的App...');
      
      // 🎯 智能App选择：历史对话优先使用原始app，新对话使用当前app
      if (conversationAppId) {
        console.log(`[handleSubmit] 历史对话，使用原始appId: ${conversationAppId}`);
        // 对于历史对话，验证并切换到原始app
        await validateConfig(conversationAppId, 'message'); // 🎯 指定为消息发送上下文
        appConfig = await ensureAppReady();
        
        // 验证是否成功切换到目标app
        if (appConfig.appId !== conversationAppId) {
          console.warn(`[handleSubmit] 切换到原始app失败，期望: ${conversationAppId}, 实际: ${appConfig.appId}`);
          // 可以选择抛出错误或继续使用当前app
        }
      } else {
        console.log('[handleSubmit] 新对话或无原始appId，使用当前选中的app');
        // 对于新对话，使用当前选中的app
        appConfig = await ensureAppReady();
      }
      
      console.log(`[handleSubmit] 最终使用的App: ${appConfig.appId}`);
    } catch (error) {
      console.error('[handleSubmit] App配置获取失败:', error);
      
      // --- BEGIN COMMENT ---
      // 🎯 错误恢复机制：添加错误消息到聊天界面，提供用户反馈
      // --- END COMMENT ---
      const errorMessage = error instanceof Error ? error.message : '应用配置获取失败';
      addMessage({ 
        text: `抱歉，无法获取应用配置: ${errorMessage}。请检查网络连接或联系管理员。`, 
        isUser: false, 
        error: errorMessage,
        persistenceStatus: 'error' // 标记为错误状态，不尝试保存
      });
      
      return;
    }

    // --- BEGIN COMMENT ---
    // 记录开始时间，用于性能分析
    // --- END COMMENT ---
    const startTime = Date.now();
    
    isSubmittingRef.current = true;
    setIsWaitingForResponse(true);
    
    const messageAttachments = Array.isArray(files) && files.length > 0 
      ? files.map(file => ({
          id: file.upload_file_id, name: file.name, size: file.size,
          type: file.mime_type, upload_file_id: file.upload_file_id
        }))
      : undefined;
    
    // --- BEGIN COMMENT ---
    // 添加用户消息，设置初始状态为 pending，表示等待保存
    // --- END COMMENT ---  
    const userMessage = addMessage({ 
      text: message, 
      isUser: true, 
      attachments: messageAttachments,
      persistenceStatus: 'pending' // 设置持久化状态为等待保存
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
    // 修改判断新对话的逻辑，使用difyConversationId而不是currentConvId
    // 1. 如果 URL 是 /chat/new 或者包含 temp-，则是新对话
    // 2. 如果没有difyConversationId，也视为新对话
    // --- END MODIFIED COMMENT ---
    const urlIndicatesNew = window.location.pathname === '/chat/new' || window.location.pathname.includes('/chat/temp-');
    const isNewConversationFlow = urlIndicatesNew || !difyConversationId;
    


    if (isNewConversationFlow) {
      // 确保Dify对话ID为null
      if (difyConversationId !== null) {
        setDifyConversationId(null);
      }
      // 数据库ID可以保持不变，因为它是独立的
      let currentConvId = useChatStore.getState().currentConversationId;
      if (urlIndicatesNew && currentConvId !== null) {
        setCurrentConversationId(null);
      }
    }
    
    chunkBufferRef.current = ""; 
    let lastAppendTime = Date.now(); 

    let answerStream: AsyncGenerator<string, void, undefined> | undefined;
    let finalRealConvId: string | undefined;
    let finalTaskId: string | undefined;
    
    // --- BEGIN COMMENT ---
    // 用于存储数据库对话ID，这是消息持久化的关键
    // 只有在获取到有效的数据库对话ID后，才能保存消息
    // --- END COMMENT ---
    let finalDbConvUUID: string | null = null;

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
        // --- BEGIN COMMENT ---
        // 新对话逻辑：
        // 1. 调用initiateNewConversation创建新对话
        // 2. 获取Dify对话ID (finalRealConvId)
        // 3. 查询数据库对话ID (finalDbConvUUID)
        // --- END COMMENT ---
        
        const creationResult = await initiateNewConversation(
          basePayloadForNewConversation,
          appConfig.appId, // 使用确保就绪的 appId
          currentUserId, // 显式传递 userIdentifier
          // 添加数据库ID回调
          (difyId, dbId) => {
            console.log(`[handleSubmit] 收到数据库对话ID回调：difyId=${difyId}, dbId=${dbId}`);
            
            // 立即设置数据库对话ID
            finalDbConvUUID = dbId;
            setDbConversationUUID(dbId);
            
            // 保存用户消息
            if (userMessage && userMessage.persistenceStatus !== 'saved') {
              console.log(`[handleSubmit] 回调中保存用户消息，ID=${userMessage.id}, 数据库对话ID=${dbId}`);
              saveMessage(userMessage, dbId).catch(err => {
                console.error('[handleSubmit] 回调中保存用户消息失败:', err);
              });
            }
            
            // --- BEGIN COMMENT ---
            // 🎯 简化修复：在回调中保存用户消息，助手消息在流式响应结束后保存
            // 这样确保时序正确，避免复杂的定时器逻辑
            // --- END COMMENT ---
            console.log(`[handleSubmit] 数据库ID回调完成，用户消息已保存，助手消息将在流式响应结束后保存`);
          }
        );

        if (creationResult.error) {
          console.error('[handleSubmit] 创建新对话失败:', creationResult.error);
          throw creationResult.error;
        }
        
        answerStream = creationResult.answerStream;
        finalRealConvId = creationResult.realConvId;
        finalTaskId = creationResult.taskId;

        if (finalRealConvId) {
          // 更新UI和路由
          if (useChatStore.getState().currentConversationId !== finalRealConvId) {
            setCurrentConversationId(finalRealConvId);
          }
          if (currentPathname !== `/chat/${finalRealConvId}`) {
            router.replace(`/chat/${finalRealConvId}`, { scroll: false });
          }
          
          // --- BEGIN COMMENT ---
          // 查询数据库对话ID，这是消息持久化的关键
          // 注意：initiate函数内部已经创建了数据库记录，所以这里可以直接查询
          // --- END COMMENT ---
          try {
            const result = await getConversationByExternalId(finalRealConvId);
            
            if (result.success && result.data) {
              finalDbConvUUID = result.data.id;
              setDbConversationUUID(finalDbConvUUID);
            } else {
              finalDbConvUUID = null;
            }
          } catch (dbError) {
            console.error(`[handleSubmit] 查询新对话的数据库ID失败:`, dbError);
            finalDbConvUUID = null;
          }
        }
        
        if (finalTaskId) {
          setCurrentTaskId(finalTaskId);
        }

      } else {
        // --- BEGIN COMMENT ---
        // 现有对话逻辑：
        // 1. 首先获取数据库对话ID（如果还没有）
        // 2. 调用Dify API发送消息
        // 3. 更新各种ID和状态
        // --- END COMMENT ---
        
        // --- BEGIN COMMENT ---
        // 获取数据库对话ID，这是消息持久化的关键
        // --- END COMMENT ---
        if (dbConversationUUID) {
          // 如果已经有数据库对话ID，直接使用
          finalDbConvUUID = dbConversationUUID;
        } else if (difyConversationId) {
          // 如果没有数据库对话ID，但有Dify对话ID，尝试查询
          try {
            
            const result = await getConversationByExternalId(difyConversationId);
            
            if (result.success && result.data) {
              finalDbConvUUID = result.data.id;
              setDbConversationUUID(finalDbConvUUID);
            } else {
              finalDbConvUUID = null;
            }
          } catch (dbError) {
            console.error(`[handleSubmit] 查询现有对话的数据库ID失败:`, dbError);
            finalDbConvUUID = null;
          }
        }
        
        // 为现有对话构造一个不包含 user 的基础 payload，因为 DifyChatRequestPayload 会单独添加
        const payloadForExistingStream = {
            query: message,
            inputs: {}, // 与 basePayloadForNewConversation 的 inputs 保持一致
            ...(difyFiles && { files: difyFiles }),
        };
        
        // 检查对话ID格式
        if (difyConversationId) {
          console.log('[handleSubmit] 对话ID类型检查:', {
            type: typeof difyConversationId,
            length: difyConversationId.length,
            hasWhitespace: /\s/.test(difyConversationId),
            value: difyConversationId
          });
        }
        
        const difyPayload: DifyChatRequestPayload = {
          ...payloadForExistingStream,
          user: currentUserId, // 使用动态获取的 currentUserId
          response_mode: 'streaming',
          conversation_id: difyConversationId, // 使用Dify对话ID，而不是数据库ID
          auto_generate_name: false, 
        };
        
        const streamServiceResponse = await streamDifyChat(
          difyPayload,
          appConfig.appId, // 使用确保就绪的 appId
          (newlyFetchedConvId) => { 
            if (newlyFetchedConvId && difyConversationId !== newlyFetchedConvId) {
              // 更新Dify对话ID
              setDifyConversationId(newlyFetchedConvId);
              
              // 同时更新数据库ID以保持一致性
              setCurrentConversationId(newlyFetchedConvId);
              
              if (currentPathname !== `/chat/${newlyFetchedConvId}`) {
                router.replace(`/chat/${newlyFetchedConvId}`, { scroll: false });
              }
              
              // 如果获取到了新的Dify对话ID，需要重新查询数据库对话ID
              if (!finalDbConvUUID) {
                // 异步查询，不阻塞流式处理
                getConversationByExternalId(newlyFetchedConvId).then(result => {
                  if (result.success && result.data) {
                    finalDbConvUUID = result.data.id;
                    setDbConversationUUID(finalDbConvUUID);
                  }
                }).catch(err => {
                  console.error('[handleSubmit] 回调中查询数据库对话ID失败:', err);
                });
              }
            }
          }
        );
        answerStream = streamServiceResponse.answerStream;
        finalRealConvId = streamServiceResponse.getConversationId() || difyConversationId || undefined; // Fallback to currentConvId
        finalTaskId = streamServiceResponse.getTaskId() || undefined;
        
        // 更新Dify对话ID
        if (finalRealConvId && finalRealConvId !== difyConversationId) {
          setDifyConversationId(finalRealConvId);
          
          // 如果获取到了新的Dify对话ID，需要重新查询数据库对话ID
          if (!finalDbConvUUID && finalRealConvId !== difyConversationId) {
            try {
              const result = await getConversationByExternalId(finalRealConvId);
              
              if (result.success && result.data) {
                finalDbConvUUID = result.data.id;
                setDbConversationUUID(finalDbConvUUID);
                console.log(`[handleSubmit] 找到数据库对话ID: ${finalDbConvUUID}`);
              } else {
                console.warn(`[handleSubmit] 未找到数据库记录，Dify对话ID=${finalRealConvId}`);
              }
            } catch (dbError) {
              console.error(`[handleSubmit] 查询数据库对话ID失败:`, dbError);
            }
          }
        }
        
        // 更新任务ID
        if (finalTaskId && useChatStore.getState().currentTaskId !== finalTaskId) {
          setCurrentTaskId(finalTaskId);
        }
        
        // 记录当前状态
        console.log('[handleSubmit] 现有对话处理完成，状态:', {
          finalRealConvId,
          finalDbConvUUID,
          storeConversationId: useChatStore.getState().currentConversationId,
          urlPath: window.location.pathname
        });
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
            // --- BEGIN COMMENT ---
            // 🎯 优化流式更新条件：
            // 1. 时间间隔：30ms（更频繁的更新）
            // 2. 内容触发：遇到换行或长度超过200字符（更小的批次）
            // 3. 确保每个字符都能及时显示
            // --- END COMMENT ---
            if (Date.now() - lastAppendTime >= CHUNK_APPEND_INTERVAL || 
                chunkBufferRef.current.includes('\n') || 
                chunkBufferRef.current.length > 200) {
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

      // --- BEGIN COMMENT ---
      // 在流式响应结束后，我们需要：
      // 1. 确保所有ID都是最新的
      // 2. 尝试保存用户消息和助手消息
      // --- END COMMENT ---
      
      // 确保 Dify对话ID 和 数据库ID 都是最新的 (主要针对新对话)
      if (finalRealConvId) {
        // 更新Dify对话ID
        if (difyConversationId !== finalRealConvId) {
          setDifyConversationId(finalRealConvId);
        }
        
        // 更新数据库ID
        if (useChatStore.getState().currentConversationId !== finalRealConvId) {
          setCurrentConversationId(finalRealConvId);
        }
        
        // 更新URL
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
      
      // --- BEGIN COMMENT ---
      // 消息持久化逻辑：
      // 1. 只有在获取到有效的数据库对话ID后，才能保存消息
      // 2. 先保存用户消息，再保存助手消息
      // 🎯 修复：确保数据库ID的获取逻辑更加健壮
      // --- END COMMENT ---
      
      // 🎯 修复：重新获取最新的数据库对话ID，确保不会因为作用域问题丢失
      let currentDbConvId = finalDbConvUUID || dbConversationUUID;
      
      // 如果还是没有数据库ID，尝试从当前状态重新查询
      if (!currentDbConvId && finalRealConvId) {
        console.log(`[handleSubmit] 重新查询数据库对话ID，Dify对话ID=${finalRealConvId}`);
        try {
          const result = await getConversationByExternalId(finalRealConvId);
          if (result.success && result.data) {
            currentDbConvId = result.data.id;
            setDbConversationUUID(currentDbConvId);
            console.log(`[handleSubmit] 重新查询成功，数据库对话ID=${currentDbConvId}`);
          }
        } catch (error) {
          console.error(`[handleSubmit] 重新查询数据库对话ID失败:`, error);
        }
      }
      
      if (currentDbConvId) {
        console.log(`[handleSubmit] 流式响应结束，开始保存消息，数据库对话ID=${currentDbConvId}`);
        
        // 保存用户消息
        if (userMessage && userMessage.persistenceStatus !== 'saved') {
          console.log(`[handleSubmit] 保存用户消息，ID=${userMessage.id}, 数据库对话ID=${currentDbConvId}`);
          saveMessage(userMessage, currentDbConvId).catch(err => {
            console.error('[handleSubmit] 保存用户消息失败:', err);
          });
        }
        
        // 保存助手消息
        if (assistantMessageId) {
          // --- BEGIN COMMENT ---
          // 流式响应结束后，立即保存助手消息，不再延迟
          // 因为流式响应已经结束，消息内容应该是完整的
          // --- END COMMENT ---
          console.log(`[handleSubmit] 立即保存助手消息，ID=${assistantMessageId}, 数据库对话ID=${currentDbConvId}`);
          
          // 重新获取最新的消息对象，确保内容是完整的
          const finalAssistantMessage = useChatStore.getState().messages.find(m => m.id === assistantMessageId);
          
          // 🎯 修复：确保助手消息被正确finalize，然后保存
          if (finalAssistantMessage) {
            // 如果消息仍在流式传输状态，先finalize它
            if (finalAssistantMessage.isStreaming) {
              console.log(`[handleSubmit] 助手消息仍在流式状态，先finalize: ${assistantMessageId}`);
              finalizeStreamingMessage(assistantMessageId);
            }
            
            // 检查消息是否需要保存（更宽松的条件）
            const needsSaving = !finalAssistantMessage.db_id && 
                               finalAssistantMessage.persistenceStatus !== 'saved' &&
                               finalAssistantMessage.text.trim().length > 0;
                               
            if (needsSaving) {
              console.log(`[handleSubmit] 开始保存助手消息，内容长度=${finalAssistantMessage.text.length}, 数据库ID=${currentDbConvId}`);
              
              // 更新消息状态为待保存
              updateMessage(assistantMessageId, { persistenceStatus: 'pending' });
              
              saveMessage(finalAssistantMessage, currentDbConvId).catch(err => {
                console.error('[handleSubmit] 保存助手消息失败:', err);
                // 保存失败时更新状态
                if (assistantMessageId) {
                  updateMessage(assistantMessageId, { persistenceStatus: 'error' });
                }
              });
            } else {
              console.log(`[handleSubmit] 助手消息无需保存: 已有db_id=${!!finalAssistantMessage.db_id}, 状态=${finalAssistantMessage.persistenceStatus}, 内容长度=${finalAssistantMessage.text.length}`);
            }
          } else {
            console.warn(`[handleSubmit] 未找到助手消息: ${assistantMessageId}`);
          }
        }
      } else {
        console.warn(`[handleSubmit] 流式响应结束，但未获取到数据库对话ID，消息无法保存`);
        
        // 尝试从Dify对话ID再次查询数据库对话ID
        if (finalRealConvId) {
          console.log(`[handleSubmit] 尝试最后一次查询数据库对话ID，Dify对话ID=${finalRealConvId}`);
          getConversationByExternalId(finalRealConvId).then(result => {
            if (result.success && result.data) {
              console.log(`[handleSubmit] 查询到数据库对话ID，开始保存消息，ID=${result.data.id}`);
              // 设置数据库对话ID
              finalDbConvUUID = result.data.id;
              setDbConversationUUID(result.data.id);
              
              // 保存用户消息和助手消息
              if (userMessage && userMessage.persistenceStatus !== 'saved') {
                saveMessage(userMessage, result.data.id).catch(err => {
                  console.error('[handleSubmit] 二次查询后保存用户消息失败:', err);
                });
              }
              
              if (assistantMessageId) {
                const assistantMessage = useChatStore.getState().messages.find(m => m.id === assistantMessageId);
                if (assistantMessage && assistantMessage.persistenceStatus !== 'saved') {
                  saveMessage(assistantMessage, result.data.id).catch(err => {
                    console.error('[handleSubmit] 二次查询后保存助手消息失败:', err);
                  });
                }
              }
            } else {
              console.error(`[handleSubmit] 最终查询仍未获取到数据库对话ID，无法保存消息`);
            }
          }).catch(err => {
            console.error('[handleSubmit] 二次查询数据库对话ID失败:', err);
          });
        }
      }


    } catch (error) {
      console.error("[handleSubmit] 处理流式响应时发生错误:", error);
      streamError = error as Error;
      const errorMessage = streamError?.message || '未知错误'; // 确保错误消息不为空
      
      // --- BEGIN COMMENT ---
      // 错误处理逻辑：
      // 1. 更新UI状态，显示错误信息
      // 2. 如果有数据库对话ID，尝试保存用户消息和错误占位助手消息
      // --- END COMMENT ---
      
      if (assistantMessageId) {
        // 如果助手消息已创建，设置错误状态
        setMessageError(assistantMessageId, errorMessage);
        
        // 如果有数据库对话ID，尝试保存助手错误消息
        if (finalDbConvUUID && assistantMessageId) { // 确保assistantMessageId不为null
          const assistantMessage = useChatStore.getState().messages.find(m => m.id === assistantMessageId);
          if (assistantMessage && assistantMessage.persistenceStatus !== 'saved') {
            console.log(`[handleSubmit] 保存错误助手消息，ID=${assistantMessageId}`);
            // 设置持久化状态为等待保存
            updateMessage(assistantMessageId, { persistenceStatus: 'pending' });
            saveMessage(assistantMessage, finalDbConvUUID).catch(err => {
              console.error('[handleSubmit] 保存错误助手消息失败:', err);
              // 更新消息状态为保存失败
              if (assistantMessageId) { // 再次检查确保不为null
                updateMessage(assistantMessageId, { persistenceStatus: 'error' });
              }
            });
          }
        }
      } else {
        // 如果助手消息未创建，添加一个错误消息到UI
        const errorAssistantMessage = addMessage({ 
          text: `抱歉，处理您的请求时发生错误: ${errorMessage}`, 
          isUser: false, 
          error: errorMessage,
          persistenceStatus: 'pending' // 设置持久化状态为等待保存
        });
        
        // 如果有数据库对话ID，尝试保存用户消息和错误占位助手消息
        if (finalDbConvUUID) {
          // 保存用户消息
          if (userMessage && userMessage.persistenceStatus !== 'saved') {
            console.log(`[handleSubmit] 错误处理中保存用户消息，ID=${userMessage.id}`);
            saveMessage(userMessage, finalDbConvUUID).catch(err => {
              console.error('[handleSubmit] 错误处理中保存用户消息失败:', err);
            });
          }
          
          // 保存错误占位助手消息
          console.log(`[handleSubmit] 保存错误占位助手消息，ID=${errorAssistantMessage.id}`);
          saveMessage(errorAssistantMessage, finalDbConvUUID).catch(err => {
            console.error('[handleSubmit] 保存错误占位助手消息失败:', err);
            // 更新消息状态为保存失败
            updateMessage(errorAssistantMessage.id, { persistenceStatus: 'error' });
          });
          
          // 如果错误消息保存失败，尝试创建一个空的占位助手消息
          // 确保错误消息是字符串类型
          const errorText = typeof errorMessage === 'string' && errorMessage ? 
            `助手回复失败: ${errorMessage}` : 
            '助手回复失败: 未知错误';
            
          saveErrorPlaceholder(finalDbConvUUID, 'error', errorText).catch(err => {
            console.error('[handleSubmit] 创建错误占位助手消息失败:', err);
          });
        } else {
          console.warn('[handleSubmit] 未能获取数据库对话ID，错误消息将不会被持久化');
        }
      }
    } finally {
      if (appendTimerRef.current) clearTimeout(appendTimerRef.current);
      
      if (assistantMessageId) {
        const finalMessageState = useChatStore.getState().messages.find(m=>m.id===assistantMessageId);
        if (finalMessageState && finalMessageState.isStreaming) {
          finalizeStreamingMessage(assistantMessageId);
          
          // --- BEGIN COMMENT ---
          // 🎯 修复：在finally块中统一处理助手消息保存
          // 无论是正常结束还是被停止，都确保助手消息被保存
          // --- END COMMENT ---
          const currentDbConvId = finalDbConvUUID || dbConversationUUID;
          if (currentDbConvId && finalMessageState.persistenceStatus !== 'saved' && !finalMessageState.db_id) {
            console.log(`[handleSubmit-finally] 统一保存助手消息，ID=${assistantMessageId}, 是否被停止=${finalMessageState.wasManuallyStopped}`);
            
            // 重新获取最新的消息状态
            const latestMessage = useChatStore.getState().messages.find(m => m.id === assistantMessageId);
            if (latestMessage && latestMessage.text.trim().length > 0) {
              updateMessage(assistantMessageId, { persistenceStatus: 'pending' });
              
                             if (latestMessage.wasManuallyStopped) {
                 // 使用专门的停止消息保存方法
                 saveStoppedAssistantMessage(latestMessage, currentDbConvId).catch(err => {
                   console.error('[handleSubmit-finally] 保存停止的助手消息失败:', err);
                   if (assistantMessageId) {
                     updateMessage(assistantMessageId, { persistenceStatus: 'error' });
                   }
                 });
               } else {
                 // 使用普通的消息保存方法
                 saveMessage(latestMessage, currentDbConvId).catch(err => {
                   console.error('[handleSubmit-finally] 保存助手消息失败:', err);
                   if (assistantMessageId) {
                     updateMessage(assistantMessageId, { persistenceStatus: 'error' });
                   }
                 });
               }
            }
          }
          
          // --- BEGIN MODIFIED COMMENT ---
          // 流式响应结束时（骨架屏消失时），确保在侧边栏中高亮当前对话项
          // 保持当前侧边栏展开状态
          // --- END MODIFIED COMMENT ---
          const currentConvId = useChatStore.getState().currentConversationId;
          if (currentConvId) {
            try {
              // 检查当前路由是否在聊天页面
              const currentPath = window.location.pathname;
              if (currentPath === `/chat/${currentConvId}`) {
                // 使用侧边栏存储的 selectItem 方法选中当前对话
                const { selectItem } = require('@lib/stores/sidebar-store').useSidebarStore.getState();
                selectItem('chat', currentConvId, true);
              }
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
    ensureAppReady, // 替换 currentAppId，使用强制等待方法
    validateConfig, // 新增：验证配置方法
    conversationAppId, // 新增：历史对话的原始appId
    addMessage, setIsWaitingForResponse, isWelcomeScreen, setIsWelcomeScreen,
    appendMessageChunk, finalizeStreamingMessage, markAsManuallyStopped, setMessageError,
    setCurrentConversationId, setCurrentTaskId, router, currentPathname, flushChunkBuffer,
    initiateNewConversation, updatePendingStatus, difyConversationId, saveMessage, saveStoppedAssistantMessage, updateMessage
  ]);

  // --- BEGIN COMMENT ---
  // 🎯 新增：直接发送消息功能
  // 相当于在输入框中输入消息然后点击发送按钮
  // 完全复用现有的handleSubmit逻辑，包括验证、状态管理等
  // --- END COMMENT ---
  const sendDirectMessage = useCallback(async (messageText: string, files?: any[]) => {
    if (!messageText.trim()) {
      console.warn("[sendDirectMessage] 消息内容为空，跳过发送");
      return;
    }

    // 临时设置消息到输入框store（这样handleSubmit可以读取到）
    const { setMessage, clearMessage } = useChatInputStore.getState();
    const originalMessage = useChatInputStore.getState().message;
    
    try {
      // 设置消息内容
      setMessage(messageText);
      
      // 调用现有的handleSubmit逻辑
      await handleSubmit(messageText, files);
      
    } catch (error) {
      console.error("[sendDirectMessage] 发送失败:", error);
      // 恢复原始消息
      setMessage(originalMessage);
      throw error;
    }
  }, [handleSubmit]);

  const handleStopProcessing = useCallback(async () => {
    const state = useChatStore.getState();
    const currentStreamingId = state.streamingMessageId;
    const currentTaskId = state.currentTaskId;
    
    // --- BEGIN COMMENT ---
    // 检查用户是否登录
    // --- END COMMENT ---
    if (!currentUserId) {
      console.error("useChatInterface.handleStopProcessing: User not authenticated.");
      return;
    }

    // --- BEGIN COMMENT ---
    // 🎯 修复：停止操作不需要验证应用配置，直接使用当前配置
    // 停止操作应该立即响应，不应该触发全屏验证spinner
    // 即使应用配置有问题，本地停止仍然有效
    // --- END COMMENT ---
    let appConfig: { appId: string; instance: ServiceInstance } | null = null;
    
    // 尝试获取当前应用配置，但不强制验证
    if (currentAppId && currentAppInstance) {
      appConfig = { appId: currentAppId, instance: currentAppInstance };
      console.log(`[handleStopProcessing] 使用当前App配置: ${appConfig.appId}`);
    } else {
      console.warn('[handleStopProcessing] 当前App配置不可用，仅执行本地停止操作');
    }

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

      // 只有在有有效应用配置和任务ID时才尝试远程停止
      if (currentTaskId && appConfig) {
        try {
          await stopDifyStreamingTask(appConfig.appId, currentTaskId, currentUserId);
          setCurrentTaskId(null); 
        } catch (error) {
          console.error(`[handleStopProcessing] Error calling stopDifyStreamingTask:`, error);
          // 远程停止失败不影响本地停止的效果
        }
      } else if (currentTaskId) {
        console.warn('[handleStopProcessing] 无有效App配置，跳过远程停止操作');
        setCurrentTaskId(null); // 清除任务ID
      }
      
      // --- BEGIN COMMENT ---
      // 为中断的消息添加持久化处理
      // 1. 标记消息为手动中断
      // 2. 更新消息元数据，添加中断状态标记
      // 3. 如果数据库ID可用，立即保存中断消息
      // 4. 如果数据库ID不可用，尝试查询后保存
      // --- END COMMENT ---
      const assistantMessage = useChatStore.getState().messages.find(m => m.id === currentStreamingId);
      if (assistantMessage) {
        // 更新消息元数据，添加中断状态标记
        const updatedMetadata = {
          ...(assistantMessage.metadata || {}),
          stopped_manually: true, 
          stopped_at: new Date().toISOString()
        };
        
        // 更新消息状态，添加中断标记
        updateMessage(currentStreamingId, { 
          metadata: updatedMetadata, 
          wasManuallyStopped: true,
          persistenceStatus: 'pending' // 标记为待保存状态
        });
        
        // 🎯 关键修复：不立即保存助手消息，避免与handleSubmit重复保存
        // 助手消息的保存将由handleSubmit的finally块统一处理
        console.log(`[handleStopProcessing] 已标记助手消息为中断状态，等待统一保存，ID=${currentStreamingId}`);
      }
      
      // --- BEGIN COMMENT ---
      // 🎯 修复：智能用户消息保存逻辑（避免重复保存）
      // 只在新对话或用户消息确实未保存时才保存
      // --- END COMMENT ---
      const currentDbConvId = dbConversationUUID;
      if (currentDbConvId) {
        // 查找最近的未保存用户消息
        const messages = useChatStore.getState().messages;
        const recentUserMessage = messages
          .filter(m => m.isUser && m.persistenceStatus !== 'saved' && !m.db_id)
          .pop(); // 获取最后一条未保存的用户消息
          
        if (recentUserMessage) {
          // 🎯 关键修复：检查是否是新对话，避免重复保存
          const urlIndicatesNew = window.location.pathname === '/chat/new' || window.location.pathname.includes('/chat/temp-');
          const isNewConversationFlow = urlIndicatesNew || !difyConversationId;
          
          if (isNewConversationFlow) {
            // 新对话：用户消息可能还没有被保存，立即保存
            console.log(`[handleStopProcessing] 新对话中发现未保存的用户消息，立即保存，ID=${recentUserMessage.id}`);
            saveMessage(recentUserMessage, currentDbConvId).catch(error => {
              console.error('[handleStopProcessing] 保存用户消息失败:', error);
            });
          } else {
            // 历史对话：用户消息应该已经在handleSubmit中保存了，不重复保存
            console.log(`[handleStopProcessing] 历史对话中发现未保存的用户消息，但可能已在handleSubmit中保存，跳过重复保存，ID=${recentUserMessage.id}`);
          }
        }
      } else if (difyConversationId) {
        // 如果数据库ID不可用但有Dify对话ID，尝试查询数据库ID后保存用户消息
        console.log(`[handleStopProcessing] 尝试查询数据库ID后保存用户消息，Dify对话ID=${difyConversationId}`);
        getConversationByExternalId(difyConversationId).then(result => {
          if (result.success && result.data) {
            const messages = useChatStore.getState().messages;
            const recentUserMessage = messages
              .filter(m => m.isUser && m.persistenceStatus !== 'saved' && !m.db_id)
              .pop();
              
            if (recentUserMessage) {
              // 同样检查是否是新对话
              const urlIndicatesNew = window.location.pathname === '/chat/new' || window.location.pathname.includes('/chat/temp-');
              const isNewConversationFlow = urlIndicatesNew || !difyConversationId;
              
              if (isNewConversationFlow) {
                console.log(`[handleStopProcessing] 查询到数据库ID，新对话保存用户消息，ID=${recentUserMessage.id}`);
                saveMessage(recentUserMessage, result.data.id).catch(error => {
                  console.error('[handleStopProcessing] 查询后保存用户消息失败:', error);
                });
              } else {
                console.log(`[handleStopProcessing] 查询到数据库ID，但历史对话用户消息可能已保存，跳过，ID=${recentUserMessage.id}`);
              }
            }
          }
        }).catch(error => {
          console.error('[handleStopProcessing] 查询数据库ID失败:', error);
        });
      }
    }
    
    // 更新UI状态
    if (state.isWaitingForResponse && state.streamingMessageId === currentStreamingId) {
        setIsWaitingForResponse(false);
    }
  }, [
    currentUserId,
    currentAppId, // 🎯 修改：直接使用currentAppId和currentAppInstance
    currentAppInstance,
    markAsManuallyStopped, setCurrentTaskId, 
    appendMessageChunk, setIsWaitingForResponse, updatePendingStatus, flushChunkBuffer, 
    dbConversationUUID, difyConversationId, updateMessage, saveMessage
  ]);

  return {
    messages, handleSubmit, handleStopProcessing, 
    sendDirectMessage, // 🎯 新增：暴露直接发送消息的功能
    isProcessing: useChatStore(selectIsProcessing), 
    isWaitingForResponse: useChatStore(state => state.isWaitingForResponse),
    // --- BEGIN COMMENT ---
    // 暴露 AppId 加载状态和错误状态，以便 UI 层可以响应
    // --- END COMMENT ---
    isAppConfigLoading: isLoadingAppId,
    appConfigError: errorLoadingAppId,
    isUserLoggedIn: !!currentUserId, // 方便 UI 判断用户是否登录
    difyConversationId, // 暴露 Dify 对话 ID
    conversationAppId // 暴露历史对话的原始appId，用于调试和UI显示
  };
}
