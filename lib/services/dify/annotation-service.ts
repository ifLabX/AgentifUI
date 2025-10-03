/**
 * Dify Annotation Service
 *
 * Handles Dify annotation-related API interactions, such as fetching annotation lists.
 * Follows similar design patterns to other service files, providing independent, exportable service functions.
 */
import type {
  CreateDifyAnnotationRequest,
  CreateDifyAnnotationResponse,
  DifyAnnotationListResponse,
  DifyAnnotationReplyAction,
  DifyApiError,
  DifyAsyncJobResponse,
  DifyAsyncJobStatusResponse,
  GetDifyAnnotationsParams,
  InitialDifyAnnotationReplySettingsRequest,
  UpdateDifyAnnotationRequest,
  UpdateDifyAnnotationResponse,
} from './types';

// Define the base URL for our backend Dify proxy API.
// Keeps consistency with other services for easier proxy path management.
const DIFY_PROXY_BASE_URL = '/api/dify';

/**
 * Get the list of annotations for an application.
 *
 * Works by sending requests to the backend Dify proxy service.
 * Supports pagination, controlled by `page` and `limit` parameters.
 *
 * @param appId - The ID of the current Dify application.
 * @param params - An object containing optional `page` and `limit` parameters.
 * @returns A Promise that resolves to a `DifyAnnotationListResponse` object, containing the annotation list and pagination information.
 * @throws An object containing error details (similar to DifyApiError) if the request fails or the API returns a non-2xx status code.
 */
export async function getDifyAnnotations(
  appId: string,
  params: GetDifyAnnotationsParams = {}
): Promise<DifyAnnotationListResponse> {
  if (!appId) {
    console.warn(
      '[Dify Annotation Service] Warning: appId is not provided. API call may fail or use a default app.'
    );
    // or throw an error based on business requirements
    // throw new Error('[Dify Annotation Service] appId is required.');
  }

  const slug = 'apps/annotations'; // Endpoint path for fetching annotation lists in Dify API
  const apiUrl = `${DIFY_PROXY_BASE_URL}/${appId}/${slug}`;

  // Construct query string parameters
  const queryParams = new URLSearchParams();

  if (params.page !== undefined) {
    queryParams.append('page', String(params.page));
  }
  if (params.limit !== undefined) {
    queryParams.append('limit', String(params.limit));
  }

  const fullUrl = queryParams.toString()
    ? `${apiUrl}?${queryParams.toString()}`
    : apiUrl;

  console.log(
    `[Dify Annotation Service] Fetching annotations from: ${fullUrl}`
  );

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json', // Expect JSON response format
      },
    });

    if (!response.ok) {
      // Try to parse the error response body to provide more detailed error information
      let errorData: DifyApiError | { message: string; code?: string } = {
        message: `API request failed with status ${response.status}: ${response.statusText}`,
      };
      try {
        // Try to parse the error response as JSON. Dify's error responses are usually in JSON format.
        const parsedError = await response.json();
        errorData = {
          status: response.status,
          code: parsedError.code || response.status.toString(),
          message: parsedError.message || response.statusText,
          ...parsedError, // Include other possible error fields
        };
      } catch (e) {
        // If the error response body is not a valid JSON, use the HTTP status text as the message.
        console.warn(
          '[Dify Annotation Service] Failed to parse error response JSON.',
          e
        );
      }

      console.error(
        `[Dify Annotation Service] Failed to get annotations (${response.status}):`,
        errorData
      );
      // Throw the error object, allowing the caller to catch and handle it
      throw errorData;
    }

    // Response successful, parse JSON data
    const data: DifyAnnotationListResponse = await response.json();
    console.log('[Dify Annotation Service] Successfully fetched annotations.', {
      total: data.total,
      page: data.page,
      limit: data.limit,
      has_more: data.has_more,
      count: data.data.length,
    });
    return data;
  } catch (error) {
    // Handle network errors from fetch itself or other errors not caught in the try block
    console.error(
      '[Dify Annotation Service] Network or unexpected error while fetching annotations:',
      error
    );
    // Re-throw the error or wrap it in a standardized error object
    // If error is already our errorData structure, throw it directly
    if (
      error &&
      typeof error === 'object' &&
      ('status' in error || 'message' in error)
    ) {
      throw error;
    }
    // Otherwise, wrap it in a generic error structure
    throw {
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'NETWORK_ERROR',
    } as DifyApiError;
  }
}

/**
 * Create a new annotation.
 *
 * @param appId - The ID of the current Dify application.
 * @param request - The request body containing the question and answer.
 * @returns A Promise that resolves to a `CreateDifyAnnotationResponse` object, containing the created annotation information.
 * @throws An object containing error details if the request fails or the API returns a non-2xx status code.
 */
export async function createDifyAnnotation(
  appId: string,
  request: CreateDifyAnnotationRequest
): Promise<CreateDifyAnnotationResponse> {
  if (!appId) {
    throw new Error(
      '[Dify Annotation Service] appId is required for creating annotation.'
    );
  }

  if (!request.question || !request.answer) {
    throw new Error(
      '[Dify Annotation Service] Both question and answer are required.'
    );
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
        console.warn(
          '[Dify Annotation Service] Failed to parse error response JSON.',
          e
        );
      }

      console.error(
        `[Dify Annotation Service] Failed to create annotation (${response.status}):`,
        errorData
      );
      throw errorData;
    }

    const data: CreateDifyAnnotationResponse = await response.json();
    console.log('[Dify Annotation Service] Successfully created annotation:', {
      id: data.id,
    });
    return data;
  } catch (error) {
    console.error(
      '[Dify Annotation Service] Network or unexpected error while creating annotation:',
      error
    );
    if (
      error &&
      typeof error === 'object' &&
      ('status' in error || 'message' in error)
    ) {
      throw error;
    }
    throw {
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'NETWORK_ERROR',
    } as DifyApiError;
  }
}

/**
 * Update an existing annotation.
 *
 * @param appId - The ID of the current Dify application.
 * @param annotationId - The ID of the annotation to update.
 * @param request - The request body containing the updated question and answer.
 * @returns A Promise that resolves to a `UpdateDifyAnnotationResponse` object, containing the updated annotation information.
 * @throws An object containing error details if the request fails or the API returns a non-2xx status code.
 */
export async function updateDifyAnnotation(
  appId: string,
  annotationId: string,
  request: UpdateDifyAnnotationRequest
): Promise<UpdateDifyAnnotationResponse> {
  if (!appId) {
    throw new Error(
      '[Dify Annotation Service] appId is required for updating annotation.'
    );
  }

  if (!annotationId) {
    throw new Error(
      '[Dify Annotation Service] annotationId is required for updating annotation.'
    );
  }

  if (!request.question || !request.answer) {
    throw new Error(
      '[Dify Annotation Service] Both question and answer are required.'
    );
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
        console.warn(
          '[Dify Annotation Service] Failed to parse error response JSON.',
          e
        );
      }

      console.error(
        `[Dify Annotation Service] Failed to update annotation (${response.status}):`,
        errorData
      );
      throw errorData;
    }

    const data: UpdateDifyAnnotationResponse = await response.json();
    console.log('[Dify Annotation Service] Successfully updated annotation:', {
      id: data.id,
    });
    return data;
  } catch (error) {
    console.error(
      '[Dify Annotation Service] Network or unexpected error while updating annotation:',
      error
    );
    if (
      error &&
      typeof error === 'object' &&
      ('status' in error || 'message' in error)
    ) {
      throw error;
    }
    throw {
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'NETWORK_ERROR',
    } as DifyApiError;
  }
}

/**
 * Delete an annotation.
 *
 * @param appId - The ID of the current Dify application.
 * @param annotationId - The ID of the annotation to delete.
 * @returns A Promise that resolves to void, indicating successful deletion (204 status code).
 * @throws An object containing error details if the request fails or the API returns a non-2xx status code.
 */
export async function deleteDifyAnnotation(
  appId: string,
  annotationId: string
): Promise<void> {
  if (!appId) {
    throw new Error(
      '[Dify Annotation Service] appId is required for deleting annotation.'
    );
  }

  if (!annotationId) {
    throw new Error(
      '[Dify Annotation Service] annotationId is required for deleting annotation.'
    );
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
        console.warn(
          '[Dify Annotation Service] Failed to parse error response JSON.',
          e
        );
      }

      console.error(
        `[Dify Annotation Service] Failed to delete annotation (${response.status}):`,
        errorData
      );
      throw errorData;
    }

    console.log('[Dify Annotation Service] Successfully deleted annotation:', {
      annotationId,
    });
    // 204 status
  } catch (error) {
    console.error(
      '[Dify Annotation Service] Network or unexpected error while deleting annotation:',
      error
    );
    if (
      error &&
      typeof error === 'object' &&
      ('status' in error || 'message' in error)
    ) {
      throw error;
    }
    throw {
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'NETWORK_ERROR',
    } as DifyApiError;
  }
}

/**
 * Enable or disable annotation reply settings and configure the embedding model.
 * This interface is asynchronous.
 *
 * @param appId - The ID of the current Dify application.
 * @param action - The action type, 'enable' or 'disable'.
 * @param request - The request body containing the embedding model configuration and similarity threshold.
 * @returns A Promise that resolves to a `DifyAsyncJobResponse` object, containing the asynchronous task information.
 * @throws An object containing error details if the request fails or the API returns a non-2xx status code.
 */
export async function setDifyAnnotationReplySettings(
  appId: string,
  action: DifyAnnotationReplyAction,
  request: InitialDifyAnnotationReplySettingsRequest
): Promise<DifyAsyncJobResponse> {
  if (!appId) {
    throw new Error(
      '[Dify Annotation Service] appId is required for setting annotation reply.'
    );
  }

  if (!action || (action !== 'enable' && action !== 'disable')) {
    throw new Error(
      '[Dify Annotation Service] action must be either "enable" or "disable".'
    );
  }

  if (typeof request.score_threshold !== 'number') {
    throw new Error(
      '[Dify Annotation Service] score_threshold is required and must be a number.'
    );
  }

  const slug = `apps/annotation-reply/${action}`;
  const apiUrl = `${DIFY_PROXY_BASE_URL}/${appId}/${slug}`;

  console.log(
    `[Dify Annotation Service] Setting annotation reply (${action}) at: ${apiUrl}`
  );

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
        console.warn(
          '[Dify Annotation Service] Failed to parse error response JSON.',
          e
        );
      }

      console.error(
        `[Dify Annotation Service] Failed to set annotation reply settings (${response.status}):`,
        errorData
      );
      throw errorData;
    }

    const data: DifyAsyncJobResponse = await response.json();
    console.log(
      '[Dify Annotation Service] Successfully initiated annotation reply settings:',
      {
        job_id: data.job_id,
        job_status: data.job_status,
      }
    );
    return data;
  } catch (error) {
    console.error(
      '[Dify Annotation Service] Network or unexpected error while setting annotation reply:',
      error
    );
    if (
      error &&
      typeof error === 'object' &&
      ('status' in error || 'message' in error)
    ) {
      throw error;
    }
    throw {
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'NETWORK_ERROR',
    } as DifyApiError;
  }
}

/**
 * Query the status of the asynchronous execution of the annotation reply initial settings task.
 *
 * @param appId - The ID of the current Dify application.
 * @param action - The action type, 'enable' or 'disable'.
 * @param jobId - The task ID, returned from the annotation reply initial settings interface.
 * @returns A Promise that resolves to a `DifyAsyncJobStatusResponse` object, containing the task status information.
 * @throws An object containing error details if the request fails or the API returns a non-2xx status code.
 */
export async function getDifyAnnotationReplyJobStatus(
  appId: string,
  action: DifyAnnotationReplyAction,
  jobId: string
): Promise<DifyAsyncJobStatusResponse> {
  if (!appId) {
    throw new Error(
      '[Dify Annotation Service] appId is required for getting job status.'
    );
  }

  if (!action || (action !== 'enable' && action !== 'disable')) {
    throw new Error(
      '[Dify Annotation Service] action must be either "enable" or "disable".'
    );
  }

  if (!jobId) {
    throw new Error(
      '[Dify Annotation Service] jobId is required for getting job status.'
    );
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
        console.warn(
          '[Dify Annotation Service] Failed to parse error response JSON.',
          e
        );
      }

      console.error(
        `[Dify Annotation Service] Failed to get job status (${response.status}):`,
        errorData
      );
      throw errorData;
    }

    const data: DifyAsyncJobStatusResponse = await response.json();
    console.log('[Dify Annotation Service] Successfully fetched job status:', {
      job_id: data.job_id,
      job_status: data.job_status,
      error_msg: data.error_msg,
    });
    return data;
  } catch (error) {
    console.error(
      '[Dify Annotation Service] Network or unexpected error while getting job status:',
      error
    );
    if (
      error &&
      typeof error === 'object' &&
      ('status' in error || 'message' in error)
    ) {
      throw error;
    }
    throw {
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'NETWORK_ERROR',
    } as DifyApiError;
  }
}

export {}; // Ensure the file is treated as an ES module
