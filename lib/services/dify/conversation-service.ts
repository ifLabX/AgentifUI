// lib/services/dify/conversation-service.ts
// --- BEGIN COMMENT ---
// 该文件负责处理与 Dify 会话相关的 API 交互，例如获取会话列表。
// 它遵循与 message-service.ts 和 chat-service.ts 类似的设计模式，
// 即提供独立的、可导出的服务函数。
// --- END COMMENT ---

import type { GetConversationsParams, GetConversationsResponse, DifyApiError } from './types';

// --- BEGIN COMMENT ---
// 定义指向我们后端 Dify 代理 API 的基础 URL。
// 与其他服务保持一致，方便统一管理代理路径。
// --- END COMMENT ---
const DIFY_PROXY_BASE_URL = '/api/dify';

// --- BEGIN COMMENT ---
/**
 * 获取用户的会话列表。
 *
 * 通过向后端的 Dify 代理服务发送请求来工作。
 * 支持分页加载，通过 `last_id` 和 `limit` 参数控制。
 * 支持排序，通过 `sort_by` 参数控制。
 *
 * @param appId - 当前 Dify 应用的 ID。
 * @param params - 包含 `user`, 以及可选的 `last_id`, `limit` 和 `sort_by` 的对象。
 * @returns 一个解析为 `GetConversationsResponse` 对象的 Promise，其中包含了会话列表和分页信息。
 * @throws 如果请求失败或 API 返回非 2xx 状态码，则抛出一个包含错误详情的对象 (类似 DifyApiError)。
 */
// --- END COMMENT ---
export async function getConversations(
  appId: string,
  params: GetConversationsParams
): Promise<GetConversationsResponse> {
  if (!appId) {
    console.warn(
      '[Dify Conversation Service] Warning: appId is not provided. API call may fail or use a default app.'
    );
    // 或者根据业务需求抛出错误
    // throw new Error('[Dify Conversation Service] appId is required.');
  }

  const slug = 'conversations'; // Dify API 中用于获取会话列表的端点路径
  const apiUrl = `${DIFY_PROXY_BASE_URL}/${appId}/${slug}`;

  // 构造查询参数字符串
  const queryParams = new URLSearchParams();
  queryParams.append('user', params.user);

  if (params.limit !== undefined) {
    queryParams.append('limit', String(params.limit));
  }
  if (params.last_id !== undefined && params.last_id !== null) {
    // 只有当 last_id 存在且不为 null 时才添加它
    queryParams.append('last_id', params.last_id);
  }
  if (params.sort_by !== undefined) {
    queryParams.append('sort_by', params.sort_by);
  }

  const fullUrl = `${apiUrl}?${queryParams.toString()}`;

  console.log(`[Dify Conversation Service] Fetching conversations from: ${fullUrl}`);

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json', // 期望接收 JSON 格式的响应
      },
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
        console.warn('[Dify Conversation Service] Failed to parse error response JSON.', e);
      }

      console.error(
        `[Dify Conversation Service] Failed to get conversations (${response.status}):`,
        errorData
      );
      // 抛出错误对象，上层调用者可以捕获并处理
      throw errorData;
    }

    // 响应成功，解析 JSON 数据
    const data: GetConversationsResponse = await response.json();
    console.log('[Dify Conversation Service] Successfully fetched conversations.', data);
    return data;

  } catch (error) {
    // 处理 fetch 本身的网络错误或其他在 try 块中未被捕获的错误
    console.error('[Dify Conversation Service] Network or unexpected error while fetching conversations:', error);
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
// 可以根据需要在此文件中添加更多与会话相关的服务函数，
// 例如：创建会话、更新会话名称、删除会话等。
// --- END COMMENT ---