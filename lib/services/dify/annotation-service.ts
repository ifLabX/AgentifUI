// lib/services/dify/annotation-service.ts
// --- BEGIN COMMENT ---
// 该文件负责处理与 Dify 标注相关的 API 交互，例如获取标注列表。
// 它遵循与其他服务文件类似的设计模式，提供独立的、可导出的服务函数。
// --- END COMMENT ---

import type { 
  GetDifyAnnotationsParams, 
  DifyAnnotationListResponse, 
  DifyApiError,
  CreateDifyAnnotationRequest,
  CreateDifyAnnotationResponse,
  UpdateDifyAnnotationRequest,
  UpdateDifyAnnotationResponse,
  DeleteDifyAnnotationResponse,
  DifyAnnotationReplyAction,
  InitialDifyAnnotationReplySettingsRequest,
  DifyAsyncJobResponse,
  DifyAsyncJobStatusResponse
} from './types';

// --- BEGIN COMMENT ---
// 定义指向我们后端 Dify 代理 API 的基础 URL。
// 与其他服务保持一致，方便统一管理代理路径。
// --- END COMMENT ---
const DIFY_PROXY_BASE_URL = '/api/dify';

// --- BEGIN COMMENT ---
/**
 * 获取应用的标注列表。
 *
 * 通过向后端的 Dify 代理服务发送请求来工作。
 * 支持分页加载，通过 `page` 和 `limit` 参数控制。
 *
 * @param appId - 当前 Dify 应用的 ID。
 * @param params - 包含可选的 `page` 和 `limit` 的对象。
 * @returns 一个解析为 `DifyAnnotationListResponse` 对象的 Promise，其中包含了标注列表和分页信息。
 * @throws 如果请求失败或 API 返回非 2xx 状态码，则抛出一个包含错误详情的对象 (类似 DifyApiError)。
 */
// --- END COMMENT ---
export async function getDifyAnnotations(
  appId: string,
  params: GetDifyAnnotationsParams = {}
): Promise<DifyAnnotationListResponse> {
  if (!appId) {
    console.warn(
      '[Dify Annotation Service] Warning: appId is not provided. API call may fail or use a default app.'
    );
    // 或者根据业务需求抛出错误
    // throw new Error('[Dify Annotation Service] appId is required.');
  }

  const slug = 'apps/annotations'; // Dify API 中用于获取标注列表的端点路径
  const apiUrl = `${DIFY_PROXY_BASE_URL}/${appId}/${slug}`;

  // 构造查询参数字符串
  const queryParams = new URLSearchParams();

  if (params.page !== undefined) {
    queryParams.append('page', String(params.page));
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', String(params.limit));
  }

  const fullUrl = queryParams.toString() ? `${apiUrl}?${queryParams.toString()}` : apiUrl;

  console.log(`[Dify Annotation Service] Fetching annotations from: ${fullUrl}`);

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
        console.warn('[Dify Annotation Service] Failed to parse error response JSON.', e);
      }

      console.error(
        `[Dify Annotation Service] Failed to get annotations (${response.status}):`,
        errorData
      );
      // 抛出错误对象，上层调用者可以捕获并处理
      throw errorData;
    }

    // 响应成功，解析 JSON 数据
    const data: DifyAnnotationListResponse = await response.json();
    console.log('[Dify Annotation Service] Successfully fetched annotations.', {
      total: data.total,
      page: data.page,
      limit: data.limit,
      has_more: data.has_more,
      count: data.data.length
    });
    return data;

  } catch (error) {
    // 处理 fetch 本身的网络错误或其他在 try 块中未被捕获的错误
    console.error('[Dify Annotation Service] Network or unexpected error while fetching annotations:', error);
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
 * 创建一个新的标注。
 *
 * @param appId - 当前 Dify 应用的 ID。
 * @param request - 包含问题和答案的创建请求体。
 * @returns 一个解析为 `CreateDifyAnnotationResponse` 对象的 Promise，包含创建的标注信息。
 * @throws 如果请求失败或 API 返回非 2xx 状态码，则抛出一个包含错误详情的对象。
 */
// --- END COMMENT ---
export async function createDifyAnnotation(
  appId: string,
  request: CreateDifyAnnotationRequest
): Promise<CreateDifyAnnotationResponse> {
  if (!appId) {
    throw new Error('[Dify Annotation Service] appId is required for creating annotation.');
  }

  if (!request.question || !request.answer) {
    throw new Error('[Dify Annotation Service] Both question and answer are required.');
  }

  const slug = 'apps/annotations';
  const apiUrl = `${DIFY_PROXY_BASE_URL}/${appId}/${slug}`;

  console.log(`[Dify Annotation Service] Creating annotation at: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorData: DifyApiError = {
        status: response.status,
        code: response.status.toString(),
        message: `Failed to create annotation: ${response.statusText}`,
      };

      try {
        const parsedError = await response.json();
        errorData = {
          status: response.status,
          code: parsedError.code || response.status.toString(),
          message: parsedError.message || response.statusText,
          ...parsedError,
        };
      } catch (e) {
        console.warn('[Dify Annotation Service] Failed to parse error response JSON.', e);
      }

      console.error(`[Dify Annotation Service] Failed to create annotation (${response.status}):`, errorData);
      throw errorData;
    }

    const data: CreateDifyAnnotationResponse = await response.json();
    console.log('[Dify Annotation Service] Successfully created annotation:', { id: data.id });
    return data;

  } catch (error) {
    console.error('[Dify Annotation Service] Network or unexpected error while creating annotation:', error);
    if (error && typeof error === 'object' && ('status' in error || 'message' in error)) {
      throw error;
    }
    throw {
      message: (error instanceof Error) ? error.message : 'An unexpected error occurred',
      code: 'NETWORK_ERROR',
    } as DifyApiError;
  }
}

// --- BEGIN COMMENT ---
/**
 * 更新一个已存在的标注。
 *
 * @param appId - 当前 Dify 应用的 ID。
 * @param annotationId - 要更新的标注 ID。
 * @param request - 包含更新后问题和答案的请求体。
 * @returns 一个解析为 `UpdateDifyAnnotationResponse` 对象的 Promise，包含更新后的标注信息。
 * @throws 如果请求失败或 API 返回非 2xx 状态码，则抛出一个包含错误详情的对象。
 */
// --- END COMMENT ---
export async function updateDifyAnnotation(
  appId: string,
  annotationId: string,
  request: UpdateDifyAnnotationRequest
): Promise<UpdateDifyAnnotationResponse> {
  if (!appId) {
    throw new Error('[Dify Annotation Service] appId is required for updating annotation.');
  }

  if (!annotationId) {
    throw new Error('[Dify Annotation Service] annotationId is required for updating annotation.');
  }

  if (!request.question || !request.answer) {
    throw new Error('[Dify Annotation Service] Both question and answer are required.');
  }

  const slug = `apps/annotations/${annotationId}`;
  const apiUrl = `${DIFY_PROXY_BASE_URL}/${appId}/${slug}`;

  console.log(`[Dify Annotation Service] Updating annotation at: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorData: DifyApiError = {
        status: response.status,
        code: response.status.toString(),
        message: `Failed to update annotation: ${response.statusText}`,
      };

      try {
        const parsedError = await response.json();
        errorData = {
          status: response.status,
          code: parsedError.code || response.status.toString(),
          message: parsedError.message || response.statusText,
          ...parsedError,
        };
      } catch (e) {
        console.warn('[Dify Annotation Service] Failed to parse error response JSON.', e);
      }

      console.error(`[Dify Annotation Service] Failed to update annotation (${response.status}):`, errorData);
      throw errorData;
    }

    const data: UpdateDifyAnnotationResponse = await response.json();
    console.log('[Dify Annotation Service] Successfully updated annotation:', { id: data.id });
    return data;

  } catch (error) {
    console.error('[Dify Annotation Service] Network or unexpected error while updating annotation:', error);
    if (error && typeof error === 'object' && ('status' in error || 'message' in error)) {
      throw error;
    }
    throw {
      message: (error instanceof Error) ? error.message : 'An unexpected error occurred',
      code: 'NETWORK_ERROR',
    } as DifyApiError;
  }
}

// --- BEGIN COMMENT ---
/**
 * 删除一个标注。
 *
 * @param appId - 当前 Dify 应用的 ID。
 * @param annotationId - 要删除的标注 ID。
 * @returns 一个解析为 void 的 Promise，表示删除成功（204 状态码）。
 * @throws 如果请求失败或 API 返回非 2xx 状态码，则抛出一个包含错误详情的对象。
 */
// --- END COMMENT ---
export async function deleteDifyAnnotation(
  appId: string,
  annotationId: string
): Promise<void> {
  if (!appId) {
    throw new Error('[Dify Annotation Service] appId is required for deleting annotation.');
  }

  if (!annotationId) {
    throw new Error('[Dify Annotation Service] annotationId is required for deleting annotation.');
  }

  const slug = `apps/annotations/${annotationId}`;
  const apiUrl = `${DIFY_PROXY_BASE_URL}/${appId}/${slug}`;

  console.log(`[Dify Annotation Service] Deleting annotation at: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      let errorData: DifyApiError = {
        status: response.status,
        code: response.status.toString(),
        message: `Failed to delete annotation: ${response.statusText}`,
      };

      try {
        const parsedError = await response.json();
        errorData = {
          status: response.status,
          code: parsedError.code || response.status.toString(),
          message: parsedError.message || response.statusText,
          ...parsedError,
        };
      } catch (e) {
        console.warn('[Dify Annotation Service] Failed to parse error response JSON.', e);
      }

      console.error(`[Dify Annotation Service] Failed to delete annotation (${response.status}):`, errorData);
      throw errorData;
    }

    console.log('[Dify Annotation Service] Successfully deleted annotation:', { annotationId });
    // 204 状态码表示删除成功，无响应体

  } catch (error) {
    console.error('[Dify Annotation Service] Network or unexpected error while deleting annotation:', error);
    if (error && typeof error === 'object' && ('status' in error || 'message' in error)) {
      throw error;
    }
    throw {
      message: (error instanceof Error) ? error.message : 'An unexpected error occurred',
      code: 'NETWORK_ERROR',
    } as DifyApiError;
  }
}

// --- BEGIN COMMENT ---
/**
 * 启用或禁用标注回复设置，并配置嵌入模型。
 * 此接口异步执行。
 *
 * @param appId - 当前 Dify 应用的 ID。
 * @param action - 动作类型，'enable' 或 'disable'。
 * @param request - 包含嵌入模型配置和相似度阈值的请求体。
 * @returns 一个解析为 `DifyAsyncJobResponse` 对象的 Promise，包含异步任务信息。
 * @throws 如果请求失败或 API 返回非 2xx 状态码，则抛出一个包含错误详情的对象。
 */
// --- END COMMENT ---
export async function setDifyAnnotationReplySettings(
  appId: string,
  action: DifyAnnotationReplyAction,
  request: InitialDifyAnnotationReplySettingsRequest
): Promise<DifyAsyncJobResponse> {
  if (!appId) {
    throw new Error('[Dify Annotation Service] appId is required for setting annotation reply.');
  }

  if (!action || (action !== 'enable' && action !== 'disable')) {
    throw new Error('[Dify Annotation Service] action must be either "enable" or "disable".');
  }

  if (typeof request.score_threshold !== 'number') {
    throw new Error('[Dify Annotation Service] score_threshold is required and must be a number.');
  }

  const slug = `apps/annotation-reply/${action}`;
  const apiUrl = `${DIFY_PROXY_BASE_URL}/${appId}/${slug}`;

  console.log(`[Dify Annotation Service] Setting annotation reply (${action}) at: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorData: DifyApiError = {
        status: response.status,
        code: response.status.toString(),
        message: `Failed to set annotation reply settings: ${response.statusText}`,
      };

      try {
        const parsedError = await response.json();
        errorData = {
          status: response.status,
          code: parsedError.code || response.status.toString(),
          message: parsedError.message || response.statusText,
          ...parsedError,
        };
      } catch (e) {
        console.warn('[Dify Annotation Service] Failed to parse error response JSON.', e);
      }

      console.error(`[Dify Annotation Service] Failed to set annotation reply settings (${response.status}):`, errorData);
      throw errorData;
    }

    const data: DifyAsyncJobResponse = await response.json();
    console.log('[Dify Annotation Service] Successfully initiated annotation reply settings:', { 
      job_id: data.job_id, 
      job_status: data.job_status 
    });
    return data;

  } catch (error) {
    console.error('[Dify Annotation Service] Network or unexpected error while setting annotation reply:', error);
    if (error && typeof error === 'object' && ('status' in error || 'message' in error)) {
      throw error;
    }
    throw {
      message: (error instanceof Error) ? error.message : 'An unexpected error occurred',
      code: 'NETWORK_ERROR',
    } as DifyApiError;
  }
}

// --- BEGIN COMMENT ---
/**
 * 查询异步执行的标注回复初始设置任务的状态。
 *
 * @param appId - 当前 Dify 应用的 ID。
 * @param action - 动作类型，'enable' 或 'disable'。
 * @param jobId - 任务 ID，从标注回复初始设置接口返回。
 * @returns 一个解析为 `DifyAsyncJobStatusResponse` 对象的 Promise，包含任务状态信息。
 * @throws 如果请求失败或 API 返回非 2xx 状态码，则抛出一个包含错误详情的对象。
 */
// --- END COMMENT ---
export async function getDifyAnnotationReplyJobStatus(
  appId: string,
  action: DifyAnnotationReplyAction,
  jobId: string
): Promise<DifyAsyncJobStatusResponse> {
  if (!appId) {
    throw new Error('[Dify Annotation Service] appId is required for getting job status.');
  }

  if (!action || (action !== 'enable' && action !== 'disable')) {
    throw new Error('[Dify Annotation Service] action must be either "enable" or "disable".');
  }

  if (!jobId) {
    throw new Error('[Dify Annotation Service] jobId is required for getting job status.');
  }

  const slug = `apps/annotation-reply/${action}/status/${jobId}`;
  const apiUrl = `${DIFY_PROXY_BASE_URL}/${appId}/${slug}`;

  console.log(`[Dify Annotation Service] Getting job status at: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      let errorData: DifyApiError = {
        status: response.status,
        code: response.status.toString(),
        message: `Failed to get job status: ${response.statusText}`,
      };

      try {
        const parsedError = await response.json();
        errorData = {
          status: response.status,
          code: parsedError.code || response.status.toString(),
          message: parsedError.message || response.statusText,
          ...parsedError,
        };
      } catch (e) {
        console.warn('[Dify Annotation Service] Failed to parse error response JSON.', e);
      }

      console.error(`[Dify Annotation Service] Failed to get job status (${response.status}):`, errorData);
      throw errorData;
    }

    const data: DifyAsyncJobStatusResponse = await response.json();
    console.log('[Dify Annotation Service] Successfully fetched job status:', { 
      job_id: data.job_id, 
      job_status: data.job_status,
      error_msg: data.error_msg 
    });
    return data;

  } catch (error) {
    console.error('[Dify Annotation Service] Network or unexpected error while getting job status:', error);
    if (error && typeof error === 'object' && ('status' in error || 'message' in error)) {
      throw error;
    }
    throw {
      message: (error instanceof Error) ? error.message : 'An unexpected error occurred',
      code: 'NETWORK_ERROR',
    } as DifyApiError;
  }
}

export {}; // 确保文件被视为一个 ES模块 