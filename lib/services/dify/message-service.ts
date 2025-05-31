// lib/services/dify/message-service.ts
// --- BEGIN COMMENT ---
// 该文件负责处理与 Dify 消息相关的 API 交互，例如获取历史消息。
// 它遵循与 file-service.ts 和 chat-service.ts (如果存在) 类似的设计模式，
// 即提供独立的、可导出的服务函数。
// --- END COMMENT ---

import type { 
  GetMessagesParams, 
  GetMessagesResponse, 
  DifyApiError,
  DifyMessageFeedbackRequestPayload,
  DifyMessageFeedbackResponse,
  DifyAudioToTextRequestPayload,
  DifyAudioToTextResponse
} from './types';

// --- BEGIN COMMENT ---
// 定义指向我们后端 Dify 代理 API 的基础 URL。
// 与 file-service.ts 保持一致，方便统一管理代理路径。
// --- END COMMENT ---
const DIFY_PROXY_BASE_URL = '/api/dify';

// --- BEGIN COMMENT ---
/**
 * 获取指定会话的历史聊天记录。
 *
 * 通过向后端的 Dify 代理服务发送请求来工作。
 * 支持分页加载，通过 `first_id` 和 `limit` 参数控制。
 *
 * @param appId - 当前 Dify 应用的 ID。
 * @param params - 包含 `conversation_id`, `user`, 以及可选的 `first_id` 和 `limit` 的对象。
 * @returns 一个解析为 `GetMessagesResponse` 对象的 Promise，其中包含了消息列表和分页信息。
 * @throws 如果请求失败或 API 返回非 2xx 状态码，则抛出一个包含错误详情的对象 (类似 DifyApiError)。
 */
// --- END COMMENT ---
export async function getConversationMessages(
  appId: string,
  params: GetMessagesParams
): Promise<GetMessagesResponse> {
  if (!appId) {
    console.warn(
      '[Dify Message Service] Warning: appId is not provided. API call may fail or use a default app.'
    );
    // 或者根据业务需求抛出错误
    // throw new Error('[Dify Message Service] appId is required.');
  }

  const slug = 'messages'; // Dify API 中用于获取消息的端点路径
  const apiUrl = `${DIFY_PROXY_BASE_URL}/${appId}/${slug}`;

  // 构造查询参数字符串
  const queryParams = new URLSearchParams();
  queryParams.append('conversation_id', params.conversation_id);
  queryParams.append('user', params.user);

  if (params.limit !== undefined) {
    queryParams.append('limit', String(params.limit));
  }
  if (params.first_id !== undefined && params.first_id !== null) {
    // 只有当 first_id 存在且不为 null 时才添加它
    queryParams.append('first_id', params.first_id);
  }

  const fullUrl = `${apiUrl}?${queryParams.toString()}`;

  console.log(`[Dify Message Service] Fetching messages from: ${fullUrl}`);

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        // 'Content-Type': 'application/json', // GET 请求通常不需要 Content-Type
        Accept: 'application/json', // 期望接收 JSON 格式的响应
      },
      // GET 请求没有 body
      // cache: 'no-store', // 根据需要，通常 API 调用不建议浏览器缓存
    });

    if (!response.ok) {
      // 尝试解析错误响应体，以便提供更详细的错误信息
      let errorData: DifyApiError | { message: string, code?: string } = {
        message: `API request failed with status ${response.status}: ${response.statusText}`,
      };
      try {
        // 尝试将错误响应解析为 JSON。Dify 的错误响应通常是 JSON 格式。
        const parsedError = await response.json();
        errorData = {
          status: response.status,
          code: parsedError.code || response.status.toString(),
          message: parsedError.message || response.statusText,
          ...parsedError, // 包含其他可能的错误字段
        };
      } catch (e) {
        // 如果错误响应体不是有效的 JSON，则使用 HTTP 状态文本作为消息。
        console.warn('[Dify Message Service] Failed to parse error response JSON.', e);
      }

      console.error(
        `[Dify Message Service] Failed to get conversation messages (${response.status}):`,
        errorData
      );
      // 抛出错误对象，上层调用者可以捕获并处理
      throw errorData;
    }

    // 响应成功，解析 JSON 数据
    const data: GetMessagesResponse = await response.json();
    console.log('[Dify Message Service] Successfully fetched messages.', data);
    return data;

  } catch (error) {
    // 处理 fetch 本身的网络错误或其他在 try 块中未被捕获的错误
    console.error('[Dify Message Service] Network or unexpected error while fetching messages:', error);
    // 重新抛出错误，或者将其包装成一个标准化的错误对象
    // 如果 error 已经是我们上面抛出的 errorData 结构，直接抛出
    if (error && typeof error === 'object' && ('status' in error || 'message' in error)) {
      throw error; 
    }
    // 否则，包装成一个通用的错误结构
    throw {
      message: (error instanceof Error) ? error.message : 'An unexpected error occurred',
      code: 'NETWORK_ERROR',
    } as DifyApiError;
  }
}

// --- BEGIN COMMENT ---
// 可以根据需要在此文件中添加更多与消息相关的服务函数，
// 例如：发送消息、反馈消息等。
// --- END COMMENT ---

export {}; // 确保文件被视为一个 ES模块 

// --- BEGIN COMMENT ---
// 消息反馈 API 服务函数
// --- END COMMENT ---

/**
 * 提交消息反馈
 * 
 * @param appId - 应用 ID
 * @param messageId - 消息 ID
 * @param payload - 反馈数据
 * @returns Promise<DifyMessageFeedbackResponse> - 反馈结果
 */
export async function submitMessageFeedback(
  appId: string,
  messageId: string,
  payload: DifyMessageFeedbackRequestPayload
): Promise<DifyMessageFeedbackResponse> {
  const slug = `messages/${messageId}/feedbacks`; // Dify API 路径
  const apiUrl = `/api/dify/${appId}/${slug}`; // 指向后端代理

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // 尝试解析错误响应
      let errorData: DifyApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          status: response.status,
          code: response.status.toString(),
          message: response.statusText || '提交反馈失败'
        };
      }
      
      console.error('[Dify Message Service] 提交消息反馈失败:', errorData);
      throw new Error(`提交消息反馈失败: ${errorData.message}`);
    }

    const result: DifyMessageFeedbackResponse = await response.json();
    
    console.log('[Dify Message Service] 成功提交消息反馈:', {
      appId,
      messageId,
      rating: payload.rating
    });
    
    return result;

  } catch (error) {
    console.error('[Dify Message Service] 提交消息反馈时发生错误:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('提交消息反馈时发生未知错误');
  }
}

/**
 * 语音转文本
 * 
 * @param appId - 应用 ID
 * @param payload - 语音数据
 * @returns Promise<DifyAudioToTextResponse> - 转换结果
 */
export async function convertAudioToText(
  appId: string,
  payload: DifyAudioToTextRequestPayload
): Promise<DifyAudioToTextResponse> {
  const slug = 'audio-to-text'; // Dify API 路径
  const apiUrl = `/api/dify/${appId}/${slug}`; // 指向后端代理

  try {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('user', payload.user);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData, // 使用 FormData，不设置 Content-Type
    });

    if (!response.ok) {
      // 尝试解析错误响应
      let errorData: DifyApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          status: response.status,
          code: response.status.toString(),
          message: response.statusText || '语音转文本失败'
        };
      }
      
      console.error('[Dify Message Service] 语音转文本失败:', errorData);
      throw new Error(`语音转文本失败: ${errorData.message}`);
    }

    const result: DifyAudioToTextResponse = await response.json();
    
    console.log('[Dify Message Service] 成功转换语音为文本:', {
      appId,
      textLength: result.text.length
    });
    
    return result;

  } catch (error) {
    console.error('[Dify Message Service] 语音转文本时发生错误:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('语音转文本时发生未知错误');
  }
} 