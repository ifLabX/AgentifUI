// lib/services/dify/message-service.ts
// This file is responsible for handling Dify message-related API interactions, such as fetching message history.
// It follows a similar design pattern as file-service.ts and chat-service.ts (if present),
// providing independent, exportable service functions.
import type {
  DifyApiError,
  DifyAudioToTextRequestPayload,
  DifyAudioToTextResponse,
  DifyMessageFeedbackRequestPayload,
  DifyMessageFeedbackResponse,
  GetMessagesParams,
  GetMessagesResponse,
} from './types';

// Define the base URL pointing to our backend Dify proxy API.
// This is consistent with file-service.ts for unified proxy path management.
const DIFY_PROXY_BASE_URL = '/api/dify';

/**
 * Fetch the chat history for a specific conversation.
 *
 * Sends a request to the backend Dify proxy service.
 * Supports pagination via `first_id` and `limit` parameters.
 *
 * @param appId - The current Dify application ID.
 * @param params - An object containing `conversation_id`, `user`, and optional `first_id` and `limit`.
 * @returns A Promise resolving to a `GetMessagesResponse` object containing the message list and pagination info.
 * @throws Throws an object (similar to DifyApiError) with error details if the request fails or the API returns a non-2xx status code.
 */
export async function getConversationMessages(
  appId: string,
  params: GetMessagesParams
): Promise<GetMessagesResponse> {
  if (!appId) {
    console.warn(
      '[Dify Message Service] Warning: appId is not provided. API call may fail or use a default app.'
    );
    // Or throw an error according to business requirements
    // throw new Error('[Dify Message Service] appId is required.');
  }

  const slug = 'messages'; // Dify API endpoint for fetching messages
  const apiUrl = `${DIFY_PROXY_BASE_URL}/${appId}/${slug}`;

  // Build query parameter string
  const queryParams = new URLSearchParams();
  queryParams.append('conversation_id', params.conversation_id);
  queryParams.append('user', params.user);

  if (params.limit !== undefined) {
    queryParams.append('limit', String(params.limit));
  }
  if (params.first_id !== undefined && params.first_id !== null) {
    // Only add first_id if it exists and is not null
    queryParams.append('first_id', params.first_id);
  }

  const fullUrl = `${apiUrl}?${queryParams.toString()}`;

  console.log(`[Dify Message Service] Fetching messages from: ${fullUrl}`);

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        // 'Content-Type': 'application/json', // Content-Type is usually not needed for GET
        Accept: 'application/json', // Expect JSON response
      },
      // No body for GET request
      // cache: 'no-store', // Usually API calls should not be cached by browser
    });

    if (!response.ok) {
      // Try to parse error response body for more detailed error info
      let errorData: DifyApiError | { message: string; code?: string } = {
        message: `API request failed with status ${response.status}: ${response.statusText}`,
      };
      try {
        // Try to parse error response as JSON. Dify error responses are usually JSON.
        const parsedError = await response.json();
        errorData = {
          status: response.status,
          code: parsedError.code || response.status.toString(),
          message: parsedError.message || response.statusText,
          ...parsedError, // Include any other possible error fields
        };
      } catch (e) {
        // If error response body is not valid JSON, use HTTP status text as message.
        console.warn(
          '[Dify Message Service] Failed to parse error response JSON.',
          e
        );
      }

      console.error(
        `[Dify Message Service] Failed to get conversation messages (${response.status}):`,
        errorData
      );
      // Throw error object for upper caller to catch and handle
      throw errorData;
    }

    // Response successful, parse JSON data
    const data: GetMessagesResponse = await response.json();
    console.log('[Dify Message Service] Successfully fetched messages.', data);
    return data;
  } catch (error) {
    // Handle network errors or other errors not caught in try block
    console.error(
      '[Dify Message Service] Network or unexpected error while fetching messages:',
      error
    );
    // Rethrow error, or wrap it into a standardized error object
    // If error is already our errorData structure above, just throw it
    if (
      error &&
      typeof error === 'object' &&
      ('status' in error || 'message' in error)
    ) {
      throw error;
    }
    // Otherwise, wrap as a generic error structure
    throw {
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
      code: 'NETWORK_ERROR',
    } as DifyApiError;
  }
}

// You can add more message-related service functions in this file as needed,
// for example: send message, feedback message, etc.
export {}; // Ensure the file is treated as an ES module

// Message feedback API service function
/**
 * Submit message feedback
 *
 * @param appId - Application ID
 * @param messageId - Message ID
 * @param payload - Feedback data
 * @returns Promise<DifyMessageFeedbackResponse> - Feedback result
 */
export async function submitMessageFeedback(
  appId: string,
  messageId: string,
  payload: DifyMessageFeedbackRequestPayload
): Promise<DifyMessageFeedbackResponse> {
  const slug = `messages/${messageId}/feedbacks`; // Dify API path
  const apiUrl = `/api/dify/${appId}/${slug}`; // Points to backend proxy

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Try to parse error response
      let errorData: DifyApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          status: response.status,
          code: response.status.toString(),
          message: response.statusText || 'Feedback submission failed',
        };
      }

      console.error(
        '[Dify Message Service] Failed to submit message feedback:',
        errorData
      );
      throw new Error(`Feedback submission failed: ${errorData.message}`);
    }

    const result: DifyMessageFeedbackResponse = await response.json();

    console.log(
      '[Dify Message Service] Successfully submitted message feedback:',
      {
        appId,
        messageId,
        rating: payload.rating,
      }
    );

    return result;
  } catch (error) {
    console.error(
      '[Dify Message Service] Error occurred while submitting message feedback:',
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Unknown error occurred while submitting message feedback');
  }
}

/**
 * Audio to text conversion
 *
 * @param appId - Application ID
 * @param payload - Audio data
 * @returns Promise<DifyAudioToTextResponse> - Conversion result
 */
export async function convertAudioToText(
  appId: string,
  payload: DifyAudioToTextRequestPayload
): Promise<DifyAudioToTextResponse> {
  const slug = 'audio-to-text'; // Dify API path
  const apiUrl = `/api/dify/${appId}/${slug}`; // Points to backend proxy

  try {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('user', payload.user);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData, // Use FormData, do not set Content-Type
    });

    if (!response.ok) {
      // Try to parse error response
      let errorData: DifyApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          status: response.status,
          code: response.status.toString(),
          message: response.statusText || 'Audio to text conversion failed',
        };
      }

      console.error(
        '[Dify Message Service] Audio to text conversion failed:',
        errorData
      );
      throw new Error(`Audio to text conversion failed: ${errorData.message}`);
    }

    const result: DifyAudioToTextResponse = await response.json();

    console.log(
      '[Dify Message Service] Successfully converted audio to text:',
      {
        appId,
        textLength: result.text.length,
      }
    );

    return result;
  } catch (error) {
    console.error(
      '[Dify Message Service] Error occurred during audio to text conversion:',
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Unknown error occurred during audio to text conversion');
  }
}
