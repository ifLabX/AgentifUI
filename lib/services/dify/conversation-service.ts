// lib/services/dify/conversation-service.ts
// --- BEGIN COMMENT ---
// 该文件负责处理与 Dify 会话相关的 API 交互，例如获取会话列表。
// 它遵循与 message-service.ts 和 chat-service.ts 类似的设计模式，
// 即提供独立的、可导出的服务函数。
// --- END COMMENT ---

import type { 
  GetConversationsParams, 
  GetConversationsResponse, 
  DeleteConversationRequestPayload,
  DeleteConversationResponse,
  RenameConversationRequestPayload,
  RenameConversationResponse,
  GetConversationVariablesParams,
  GetConversationVariablesResponse,
  DifyApiError 
} from './types';

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
/**
 * 删除指定的会话。
 *
 * 通过向后端的 Dify 代理服务发送 DELETE 请求来工作。
 * 删除成功后会返回 { result: 'success' }。
 *
 * @param appId - 当前 Dify 应用的 ID。
 * @param conversationId - 要删除的会话 ID。
 * @param payload - 包含 `user` 的对象，用于标识用户。
 * @returns 一个解析为 `DeleteConversationResponse` 对象的 Promise，表示操作结果。
 * @throws 如果请求失败或 API 返回非 2xx 状态码，则抛出一个包含错误详情的对象 (类似 DifyApiError)。
 */
// --- END COMMENT ---
export async function deleteConversation(
  appId: string,
  conversationId: string,
  payload: DeleteConversationRequestPayload
): Promise<DeleteConversationResponse> {
  if (!appId) {
    console.warn(
      '[Dify Conversation Service] Warning: appId is not provided. API call may fail or use a default app.'
    );
  }

  if (!conversationId) {
    throw new Error('[Dify Conversation Service] conversationId is required.');
  }

  const slug = `conversations/${conversationId}`; // Dify API 中用于删除特定会话的端点路径
  const apiUrl = `${DIFY_PROXY_BASE_URL}/${appId}/${slug}`;

  console.log(`[Dify Conversation Service] Deleting conversation: ${conversationId}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
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
        `[Dify Conversation Service] Failed to delete conversation (${response.status}):`,
        errorData
      );
      // 抛出错误对象，上层调用者可以捕获并处理
      throw errorData;
    }

    // 响应成功，解析 JSON 数据
    const data: DeleteConversationResponse = await response.json();
    console.log('[Dify Conversation Service] Successfully deleted conversation.', data);
    return data;

  } catch (error) {
    // 处理 fetch 本身的网络错误或其他在 try 块中未被捕获的错误
    console.error('[Dify Conversation Service] Network or unexpected error while deleting conversation:', error);
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
/**
 * 重命名指定的会话或触发异步标题生成。
 *
 * 通过向后端的 Dify 代理服务发送 POST 请求到 `/conversations/{conversationId}/name` 端点。
 * 
 * 双重功能:
 * 1. **直接重命名**: 当 `payload` 中提供 `name` 字段时，直接将会话重命名为指定名称。
 * 2. **异步获取/生成标题**: 当 `payload` 中设置 `auto_generate: true` 且不提供 `name` 字段时，
 *    此接口会触发 Dify 后端异步为该会话生成一个标题。
 *    操作成功后，返回的 `RenameConversationResponse` (即更新后的会话对象) 中的 `name` 字段将包含 Dify 生成或已有的标题。
 *
 * @param appId - 当前 Dify 应用的 ID。
 * @param conversationId - 要操作的会话 ID。
 * @param payload - 包含 `user` 标识符的对象。
 *                  - 若要直接重命名，还需包含 `name` 字段。
 *                  - 若要异步生成/获取标题，需包含 `auto_generate: true` 且不包含 `name`。
 * @returns 一个解析为 `RenameConversationResponse` 对象的 Promise，其中包含了更新后的会话信息（包括其 `name` 即标题）。
 * @throws 如果请求失败或 API 返回非 2xx 状态码，则抛出一个包含错误详情的对象 (类似 DifyApiError)。
 */
// --- END COMMENT ---
export async function renameConversation(
  appId: string,
  conversationId: string,
  payload: RenameConversationRequestPayload
): Promise<RenameConversationResponse> {
  if (!appId) {
    console.warn(
      '[Dify Conversation Service] Warning: appId is not provided. API call may fail or use a default app.'
    );
  }

  if (!conversationId) {
    throw new Error('[Dify Conversation Service] conversationId is required.');
  }

  const slug = `conversations/${conversationId}/name`; // Dify API 中用于重命名会话的端点路径
  const apiUrl = `${DIFY_PROXY_BASE_URL}/${appId}/${slug}`;

  console.log(`[Dify Conversation Service] Renaming conversation: ${conversationId}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
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
        `[Dify Conversation Service] Failed to rename conversation (${response.status}):`,
        errorData
      );
      // 抛出错误对象，上层调用者可以捕获并处理
      throw errorData;
    }

    // 响应成功，解析 JSON 数据
    const data: RenameConversationResponse = await response.json();
    console.log('[Dify Conversation Service] Successfully renamed conversation.', data);
    return data;

  } catch (error) {
    // 处理 fetch 本身的网络错误或其他在 try 块中未被捕获的错误
    console.error('[Dify Conversation Service] Network or unexpected error while renaming conversation:', error);
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
/**
 * 获取指定对话的变量。
 *
 * 通过向后端的 Dify 代理服务发送 GET 请求来工作。
 * 支持分页加载，通过 `last_id` 和 `limit` 参数控制。
 *
 * @param appId - 当前 Dify 应用的 ID。
 * @param conversationId - 要获取变量的对话 ID。
 * @param params - 包含 `user`, 以及可选的 `last_id` 和 `limit` 的对象。
 * @returns 一个解析为 `GetConversationVariablesResponse` 对象的 Promise，其中包含了变量列表和分页信息。
 * @throws 如果请求失败或 API 返回非 2xx 状态码，则抛出一个包含错误详情的对象 (类似 DifyApiError)。
 */
// --- END COMMENT ---
export async function getConversationVariables(
  appId: string,
  conversationId: string,
  params: GetConversationVariablesParams
): Promise<GetConversationVariablesResponse> {
  if (!appId) {
    console.warn(
      '[Dify Conversation Service] Warning: appId is not provided. API call may fail or use a default app.'
    );
  }

  if (!conversationId) {
    throw new Error('[Dify Conversation Service] conversationId is required.');
  }

  const slug = `conversations/${conversationId}/variables`; // Dify API 中用于获取对话变量的端点路径
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

  const fullUrl = `${apiUrl}?${queryParams.toString()}`;

  console.log(`[Dify Conversation Service] Fetching conversation variables from: ${fullUrl}`);

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
        `[Dify Conversation Service] Failed to get conversation variables (${response.status}):`,
        errorData
      );
      // 抛出错误对象，上层调用者可以捕获并处理
      throw errorData;
    }

    // 响应成功，解析 JSON 数据
    const data: GetConversationVariablesResponse = await response.json();
    console.log('[Dify Conversation Service] Successfully fetched conversation variables.', data);
    return data;

  } catch (error) {
    // 处理 fetch 本身的网络错误或其他在 try 块中未被捕获的错误
    console.error('[Dify Conversation Service] Network or unexpected error while fetching conversation variables:', error);
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
// 例如：创建会话等。
// --- END COMMENT ---
