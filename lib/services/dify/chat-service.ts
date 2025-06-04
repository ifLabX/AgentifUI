// --- BEGIN COMMENT ---
// lib/services/dify/chat-service.ts
// 实现与 Dify 聊天相关 API 的交互逻辑。
// --- END COMMENT ---

import { DifyChatRequestPayload, DifyStreamResponse, DifySseEvent } from './types';
import { parseSseStream } from '@lib/utils/sse-parser';

// --- BEGIN COMMENT ---
// 定义 Dify API 基础 URL (指向我们的后端代理)
// TODO: 考虑将 appId 移到函数参数或配置中，如果需要动态切换应用
// --- END COMMENT ---
const DIFY_API_BASE_URL = '/api/dify'; // 代理的基础路径

// --- BEGIN COMMENT ---
// Dify 服务层，用于与后端代理交互以调用 Dify API。
// --- END COMMENT ---

/**
 * 调用 Dify 的 chat-messages 接口并处理流式响应。
 * 
 * @param payload - 发送给 Dify API 的请求体。
 * @param appId - Dify 应用的 ID。
 * @param onConversationIdReceived - 可选的回调函数，当 conversationId 首次被提取时调用。
 * @returns 一个包含异步生成器 (answerStream)、conversationId 和 taskId 的 Promise。
 * @throws 如果 fetch 请求失败或 API 返回错误状态，则抛出错误。
 */
export async function streamDifyChat(
  payload: DifyChatRequestPayload,
  appId: string, // 将 appId 作为参数传入
  onConversationIdReceived?: (id: string) => void
): Promise<DifyStreamResponse> {
  console.log('[Dify Service] Sending request to proxy:', payload);
  
  const apiUrl = `${DIFY_API_BASE_URL}/${appId}/chat-messages`; // 构造完整的代理 URL
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 如果有认证 Token 等，也在这里添加
        // 'Authorization': `Bearer ${your_token}` 
      },
      body: JSON.stringify(payload),
    });

    console.log('[Dify Service] Received response status:', response.status);

    // --- BEGIN COMMENT ---
    // 检查响应状态，如果不是 2xx，则抛出错误
    // --- END COMMENT ---
    if (!response.ok) {
      let errorBody = 'Unknown error';
      try {
        errorBody = await response.text(); // 尝试读取错误响应体
      } catch (e) {
        // 忽略读取错误体时的错误
      }
      throw new Error(
        `Dify API request failed with status ${response.status}: ${response.statusText}. Body: ${errorBody}`
      );
    }

    // --- BEGIN COMMENT ---
    // 检查响应体是否存在
    // --- END COMMENT ---
    if (!response.body) {
      throw new Error('Dify API response body is null.');
    }

    const stream = response.body;
    let conversationId: string | null = null;
    let taskId: string | null = null;
    let conversationIdCallbackCalled = false;

    // --- BEGIN COMMENT ---
    // 🎯 新增：创建completionPromise来捕获message_end事件的metadata
    // 这个Promise将在message_end事件触发时resolve，携带完整的metadata信息
    // --- END COMMENT ---
    let completionResolve: (value: { usage?: any; metadata?: Record<string, any>; retrieverResources?: any[] }) => void;
    let completionReject: (reason?: any) => void;
    let completionResolved = false; // 🎯 添加标志位，防止重复resolve
    
    const completionPromise = new Promise<{ usage?: any; metadata?: Record<string, any>; retrieverResources?: any[] }>((resolve, reject) => {
      completionResolve = resolve;
      completionReject = reject;
    });

    // --- BEGIN COMMENT ---
    // 创建一个内部异步生成器来处理解析后的 SSE 事件并提取所需信息
    // --- END COMMENT ---
    async function* processStream(): AsyncGenerator<string, void, undefined> {
      try {
        // --- BEGIN COMMENT ---
        // 使用 sse-parser 解析流
        // --- END COMMENT ---
        for await (const result of parseSseStream(stream)) {
          if (result.type === 'error') {
            // --- BEGIN COMMENT ---
            // 如果 SSE 解析器报告错误，则向上抛出
            // --- END COMMENT ---
            console.error('[Dify Service] SSE Parser Error:', result.error);
            completionReject(new Error('Error parsing SSE stream.'));
            throw new Error('Error parsing SSE stream.'); // 或者更具体的错误处理
          }

          // --- BEGIN COMMENT ---
          // 处理成功解析的事件
          // --- END COMMENT ---
          const event = result.event as DifySseEvent; // 明确事件类型
          
          // 🎯 过滤message事件，只显示关键事件
          if (event.event !== 'message') {
            console.log(`[Dify Service] 🎯 收到关键SSE事件: ${event.event}${event.event === 'message_end' ? ' (关键事件!)' : ''}`);
          }

          // --- BEGIN COMMENT ---
          // 提取 conversation_id 和 task_id (通常在 message_end 事件中)
          // 注意：这些 ID 可能在流的早期或晚期出现，取决于 Dify 实现
          // Dify 文档指出 message_end 包含这些信息
          // --- END COMMENT ---
          if (event.conversation_id) {
            if (!conversationId) {
              conversationId = event.conversation_id;
              if (onConversationIdReceived && !conversationIdCallbackCalled) {
              try {
                onConversationIdReceived(conversationId);
                conversationIdCallbackCalled = true; // 标记回调已成功执行
              } catch (callbackError) {
                console.error('[Dify Service] Error in onConversationIdReceived callback:', callbackError);
                // 此处不应因回调错误中断主流程
              }
            } else if (conversationId !== event.conversation_id) {
              console.warn('[Dify Service] 警告：事件中的对话ID与已保存的不同！', {
                saved: conversationId,
                fromEvent: event.conversation_id
              });
            }
            }
          }
          if ('task_id' in event && event.task_id && !taskId) {
            taskId = event.task_id;
            console.log('[Dify Service] Extracted taskId:', taskId);
          }

          // --- BEGIN COMMENT ---
          // 根据事件类型处理
          // --- END COMMENT ---
          switch (event.event) {
            case 'agent_message': // Dify 返回的思考过程或中间消息
              // 可以选择性地处理或忽略 agent_message
              // console.log('[Dify Service] Agent Message:', event.answer);
              // yield event.answer; // 如果需要显示思考过程，可以 yield
              break;
            case 'message': // Dify 返回的最终答案文本块
              if (event.answer) {
                // --- BEGIN COMMENT ---
                // yield 出答案文本块，供 useChatInterface 使用
                // --- END COMMENT ---
                yield event.answer;
              }
              break;
            case 'message_end':
              // --- BEGIN COMMENT ---
              // 🎯 关键修复：在message_end事件中捕获metadata并resolve completionPromise
              // --- END COMMENT ---
              console.log('[Dify Service] Received message_end event with metadata:', {
                metadata: event.metadata,
                usage: event.metadata?.usage || event.usage,
                retrieverResources: event.metadata?.retriever_resources
              });
              
              // 确保此时已获取 conversationId 和 taskId
              if (event.conversation_id && !conversationId) { // 理论上此时 conversationId 应该已经有了
                conversationId = event.conversation_id;
                console.log('[Dify Service] Extracted conversationId from message_end:', conversationId);
                if (onConversationIdReceived && !conversationIdCallbackCalled) {
                  try {
                    onConversationIdReceived(conversationId);
                    conversationIdCallbackCalled = true; // 标记回调已成功执行
                  } catch (callbackError) {
                    console.error('[Dify Service] Error in onConversationIdReceived callback (message_end):', callbackError);
                  }
                }
              }
              if (event.task_id && !taskId) {
                taskId = event.task_id;
                console.log('[Dify Service] Extracted taskId from message_end:', taskId);
              }
              
              // 🎯 解析并传递完整的metadata信息
              const completionData = {
                usage: event.metadata?.usage || event.usage,
                metadata: event.metadata || {},
                retrieverResources: event.metadata?.retriever_resources || []
              };
              
              console.log('[Dify Service] Resolving completionPromise with data:', completionData);
              if (!completionResolved) {
                completionResolve(completionData);
                completionResolved = true;
              }
              
              console.log('[Dify Service] Message stream ended.');
              // 不需要 break，循环会在流结束后自动停止
              break;
            case 'error': // Dify API 返回的错误事件
              console.error('[Dify Service] Dify API Error Event:', event);
              const errorInfo = new Error(`Dify API error: ${event.code} - ${event.message}`);
              completionReject(errorInfo);
              throw errorInfo;
            default:
              // --- BEGIN COMMENT ---
              // 忽略其他未知类型的事件
              // console.log('[Dify Service] Ignoring unknown event type:', event.event);
              // --- END COMMENT ---
              break;
          }
        }
        console.log('[Dify Service] Finished processing stream.');
        
        // 🎯 如果流正常结束但没有收到message_end事件，使用空数据resolve
        if (completionResolve && !completionResolved) {
          console.log('[Dify Service] Stream ended without message_end, resolving with empty data');
          completionResolve({ usage: undefined, metadata: {}, retrieverResources: [] });
          completionResolved = true;
        }
      } catch (error) {
        console.error('[Dify Service] Error in processStream:', error);
        if (completionReject) {
          completionReject(error);
        }
        throw error;
      }
    }

    // --- BEGIN COMMENT ---
    // 返回包含 answerStream 和提取出的 ID 的对象
    // 🎯 新增：包含completionPromise以获取metadata
    // --- END COMMENT ---
    const responsePayload: DifyStreamResponse = {
      answerStream: processStream(),
      getConversationId: () => conversationId,
      getTaskId: () => taskId,
      completionPromise // 🎯 新增：提供completionPromise
    };

    return responsePayload;

  } catch (error) {
    console.error('[Dify Service] Error in streamDifyChat:', error);
    // --- BEGIN COMMENT ---
    // 将捕获到的错误重新抛出，以便上层调用者处理
    // --- END COMMENT ---
    throw error; // Re-throw the error after logging
  }
}

// --- BEGIN COMMENT ---
// TODO: 添加 stopStreamingTask 函数
// export async function stopDifyStreamingTask(taskId: string, user: string): Promise<void> { ... }
// --- END COMMENT ---

// --- BEGIN COMMENT ---
// 实现停止 Dify 流式任务的函数。
// 调用后端代理以安全地与 Dify API 交互。
// 参考 Dify 文档: POST /chat-messages/:task_id/stop
// --- END COMMENT ---
import { DifyStopTaskRequestPayload, DifyStopTaskResponse } from './types'; // 引入新添加的类型

/**
 * 请求停止 Dify 的流式聊天任务。
 * 
 * @param appId - Dify 应用的 ID。
 * @param taskId - 需要停止的任务 ID (从流式响应中获取)。
 * @param user - 发起请求的用户标识符，必须与启动任务时相同。
 * @returns 一个解析为 DifyStopTaskResponse 的 Promise (包含 { result: 'success' })。
 * @throws 如果请求失败或 API 返回错误状态，则抛出错误。
 */
export async function stopDifyStreamingTask(
  appId: string,
  taskId: string,
  user: string
): Promise<DifyStopTaskResponse> {
  console.log(`[Dify Service] Requesting to stop task ${taskId} for app ${appId} and user ${user}`);

  // --- BEGIN COMMENT ---
  // 构造指向后端代理的 URL，包含 task_id
  // slug 部分是 chat-messages/{taskId}/stop
  // --- END COMMENT ---
  const slug = `chat-messages/${taskId}/stop`;
  const apiUrl = `${DIFY_API_BASE_URL}/${appId}/${slug}`;

  // --- BEGIN COMMENT ---
  // 构造符合 Dify API 的请求体
  // --- END COMMENT ---
  const payload: DifyStopTaskRequestPayload = {
    user: user,
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[Dify Service] Stop task response status for ${taskId}:`, response.status);

    // --- BEGIN COMMENT ---
    // 检查响应状态
    // --- END COMMENT ---
    if (!response.ok) {
      let errorBody = 'Unknown error';
      try {
        errorBody = await response.text();
      } catch (e) {
        // 忽略读取错误
      }
      throw new Error(
        `Failed to stop Dify task ${taskId}. Status: ${response.status} ${response.statusText}. Body: ${errorBody}`
      );
    }

    // --- BEGIN COMMENT ---
    // 解析成功的响应体 (预期为 { result: 'success' })
    // --- END COMMENT ---
    const result: DifyStopTaskResponse = await response.json();

    // --- BEGIN COMMENT ---
    // 简单验证一下返回结果是否符合预期
    // --- END COMMENT ---
    if (result.result !== 'success') {
        console.warn(`[Dify Service] Stop task for ${taskId} returned success status but unexpected body:`, result);
    }

    console.log(`[Dify Service] Task ${taskId} stopped successfully.`);
    return result;

  } catch (error) {
    console.error(`[Dify Service] Error stopping task ${taskId}:`, error);
    // --- BEGIN COMMENT ---
    // 重新抛出错误，以便上层调用者处理
    // --- END COMMENT ---
    throw error;
  }
}