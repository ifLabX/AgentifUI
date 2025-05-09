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
    // 创建一个内部异步生成器来处理解析后的 SSE 事件并提取所需信息
    // --- END COMMENT ---
    async function* processStream(): AsyncGenerator<string, void, undefined> {
      // --- BEGIN COMMENT ---
      // 使用 sse-parser 解析流
      // --- END COMMENT ---
      for await (const result of parseSseStream(stream)) {
        if (result.type === 'error') {
          // --- BEGIN COMMENT ---
          // 如果 SSE 解析器报告错误，则向上抛出
          // --- END COMMENT ---
          console.error('[Dify Service] SSE Parser Error:', result.error);
          throw new Error('Error parsing SSE stream.'); // 或者更具体的错误处理
        }

        // --- BEGIN COMMENT ---
        // 处理成功解析的事件
        // --- END COMMENT ---
        const event = result.event as DifySseEvent; // 明确事件类型
        // console.log(`[Dify Service] Received SSE event type: ${event.event}`);

        // --- BEGIN COMMENT ---
        // 提取 conversation_id 和 task_id (通常在 message_end 事件中)
        // 注意：这些 ID 可能在流的早期或晚期出现，取决于 Dify 实现
        // Dify 文档指出 message_end 包含这些信息
        // --- END COMMENT ---
        if (event.conversation_id && !conversationId) {
          conversationId = event.conversation_id;
          console.log('[Dify Service] Extracted conversationId:', conversationId);
          if (onConversationIdReceived && !conversationIdCallbackCalled) {
            try {
              onConversationIdReceived(conversationId);
              conversationIdCallbackCalled = true; // 标记回调已成功执行
            } catch (callbackError) {
              console.error('[Dify Service] Error in onConversationIdReceived callback:', callbackError);
              // 此处不应因回调错误中断主流程
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
            // 流结束事件
            // 确保此时已获取 conversationId 和 taskId
            // --- END COMMENT ---
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
            console.log('[Dify Service] Message stream ended.');
            // 不需要 break，循环会在流结束后自动停止
            break;
          case 'error': // Dify API 返回的错误事件
            console.error('[Dify Service] Dify API Error Event:', event);
            throw new Error(`Dify API error: ${event.code} - ${event.message}`);
          default:
            // --- BEGIN COMMENT ---
            // 忽略其他未知类型的事件
            // console.log('[Dify Service] Ignoring unknown event type:', event.event);
            // --- END COMMENT ---
            break;
        }
      }
      console.log('[Dify Service] Finished processing stream.');
    }

    // --- BEGIN COMMENT ---
    // 返回包含 answerStream 和提取出的 ID 的对象
    // answerStream 是上面定义的 processStream 函数的调用结果 (一个异步生成器)
    // 注意：此时 processStream 还没有开始执行，直到 useChatInterface 中的 for-await-of 循环开始消费它
    // conversationId 和 taskId 在 processStream 执行过程中会被填充
    // --- END COMMENT ---
    const responsePayload: DifyStreamResponse = {
      answerStream: processStream(),
      // --- BEGIN COMMENT ---
      // 这里返回的 conversationId 和 taskId 初始是 null
      // 它们会在 processStream 被消费时，从流数据中被提取并赋值
      // useChatInterface 需要在流结束后再读取这两个值，或者服务层提供另一种方式传递它们
      // 一个改进：让 processStream 返回一个包含最终 ID 的对象，或者使用回调/事件
      // 暂时先这样，让 Hook 在流结束后从某个地方获取 ID (例如 Store?)
      // 更好的方法：让 streamDifyChat 在 processStream 结束后才 resolve 一个包含所有信息的对象
      // --- END COMMENT ---
      // --- BEGIN REVISED APPROACH --- 
      // 为了确保在 streamDifyChat 的 Promise resolve 时能拿到 ID，
      // 我们需要先完整地消费（或部分消费直到拿到 ID）processStream。
      // 但这会破坏流式传输的初衷。 
      // 折中方案：返回 answerStream，让调用者 (Hook) 负责在流中提取 ID。
      // 或者，修改 DifyStreamResponse 结构，让 ID 成为 Promise 或回调？
      // 最终决定：让 Hook 从流的 message_end 事件中获取 ID。
      // 因此，这里暂时返回 null，Hook 层需要自己处理。
      // --- END REVISED APPROACH --- 
      getConversationId: () => conversationId,
      getTaskId: () => taskId,
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