// lib/services/dify/completion-service.ts
/**
 * Dify Text Generation Service
 * @description Handles API interactions related to Dify text generation applications.
 * The text generation app uses the completion-messages endpoint instead of chat-messages.
 */
import type {
  DifyApiError,
  DifyCompletionRequestPayload,
  DifyCompletionResponse,
  DifyCompletionStreamResponse,
  DifySseEvent,
  DifyUsage,
} from './types';

/**
 * Execute text generation (blocking mode).
 *
 * @param appId - Application ID
 * @param payload - Request payload
 * @returns Promise<DifyCompletionResponse> - Generation result
 */
export async function executeDifyCompletion(
  appId: string,
  payload: DifyCompletionRequestPayload
): Promise<DifyCompletionResponse> {
  const slug = 'completion-messages'; // Text-Generation API endpoint
  const apiUrl = `/api/dify/${appId}/${slug}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorData: DifyApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          status: response.status,
          code: response.status.toString(),
          message: response.statusText || 'Text generation failed',
        };
      }

      console.error(
        '[Dify Completion Service] Text generation failed:',
        errorData
      );
      throw new Error(`Text generation failed: ${errorData.message}`);
    }

    const result: DifyCompletionResponse = await response.json();

    console.log('[Dify Completion Service] Text generated successfully:', {
      appId,
      messageId: result.message_id,
      answerLength: result.answer.length,
    });

    return result;
  } catch (error) {
    console.error(
      '[Dify Completion Service] Error occurred during text generation:',
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Unknown error occurred during text generation');
  }
}

/**
 * Streamed text generation.
 *
 * @param appId - Application ID
 * @param payload - Request payload
 * @returns Promise<DifyCompletionStreamResponse> - Streamed response
 */
export async function streamDifyCompletion(
  appId: string,
  payload: DifyCompletionRequestPayload
): Promise<DifyCompletionStreamResponse> {
  const slug = 'completion-messages'; // Text-Generation API endpoint
  const apiUrl = `/api/dify/${appId}/${slug}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...payload, response_mode: 'streaming' }),
    });

    if (!response.ok) {
      let errorData: DifyApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          status: response.status,
          code: response.status.toString(),
          message: response.statusText || 'Streamed text generation failed',
        };
      }

      console.error(
        '[Dify Completion Service] Streamed text generation failed:',
        errorData
      );
      throw new Error(`Streamed text generation failed: ${errorData.message}`);
    }

    if (!response.body) {
      throw new Error('Response body is empty');
    }

    const stream = response.body;
    let messageId: string | null = null;
    let taskId: string | null = null;

    // Create completion Promise
    let completionResolve: (value: {
      usage?: DifyUsage;
      metadata?: Record<string, unknown>;
    }) => void;
    let completionReject: (reason: unknown) => void;

    const completionPromise = new Promise<{
      usage?: DifyUsage;
      metadata?: Record<string, unknown>;
    }>((resolve, reject) => {
      completionResolve = resolve;
      completionReject = reject;
    });

    /**
     * Async generator for answer stream.
     */
    async function* generateAnswerStream(): AsyncGenerator<
      string,
      void,
      undefined
    > {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let hasReceivedContent = false;
      let completionResolved = false;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('[Dify Completion Service] Stream reading finished');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                console.log('[Dify Completion Service] Received [DONE] signal');
                // If message_end event not received, resolve manually
                if (!completionResolved) {
                  console.log(
                    '[Dify Completion Service] message_end not received, completing manually'
                  );
                  completionResolve({
                    usage: undefined,
                    metadata: {
                      stream_ended: true,
                      has_content: hasReceivedContent,
                    },
                  });
                  completionResolved = true;
                }
                return;
              }

              try {
                const event: DifySseEvent = JSON.parse(data);

                // Extract messageId and taskId
                if ('id' in event && event.id) {
                  messageId = event.id;
                  console.log(
                    '[Dify Completion Service] Extracted messageId:',
                    messageId
                  );
                }
                if ('task_id' in event && event.task_id) {
                  taskId = event.task_id;
                  console.log(
                    '[Dify Completion Service] Extracted taskId:',
                    taskId
                  );
                }

                // Handle different event types
                if (event.event === 'message' && 'answer' in event) {
                  if (event.answer && event.answer.length > 0) {
                    hasReceivedContent = true;
                  }
                  yield event.answer;
                } else if (event.event === 'message_end') {
                  console.log(
                    '[Dify Completion Service] Received message_end event:',
                    {
                      usage: event.usage,
                      metadata: event.metadata,
                      hasContent: hasReceivedContent,
                    }
                  );

                  // Resolve completion Promise
                  if (!completionResolved) {
                    completionResolve({
                      usage: event.usage,
                      metadata: {
                        ...event.metadata,
                        has_content: hasReceivedContent,
                        message_id: messageId,
                        task_id: taskId,
                      },
                    });
                    completionResolved = true;
                  }
                } else if (event.event === 'error') {
                  console.error(
                    '[Dify Completion Service] Received error event:',
                    event.message
                  );
                  if (!completionResolved) {
                    completionReject(new Error(event.message));
                    completionResolved = true;
                  }
                  return;
                } else {
                  // Log other event types
                  console.log(
                    '[Dify Completion Service] Received other event:',
                    event.event
                  );
                }
              } catch (parseError) {
                console.warn(
                  '[Dify Completion Service] Failed to parse SSE event:',
                  parseError,
                  'Raw data:',
                  data
                );
              }
            }
          }
        }

        // Stream ended normally but no explicit completion signal received
        if (!completionResolved) {
          console.log(
            '[Dify Completion Service] Stream ended normally, completing manually'
          );
          completionResolve({
            usage: undefined,
            metadata: {
              stream_completed: true,
              has_content: hasReceivedContent,
              message_id: messageId,
              task_id: taskId,
            },
          });
          completionResolved = true;
        }
      } catch (error) {
        console.error(
          '[Dify Completion Service] Stream processing error:',
          error
        );
        if (!completionResolved) {
          completionReject(
            error instanceof Error ? error : new Error(String(error))
          );
          completionResolved = true;
        }
        throw error;
      } finally {
        reader.releaseLock();
      }
    }

    return {
      answerStream: generateAnswerStream(),
      getMessageId: () => messageId,
      getTaskId: () => taskId,
      completionPromise,
    };
  } catch (error) {
    console.error(
      '[Dify Completion Service] Error occurred during streamed text generation:',
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Unknown error occurred during streamed text generation');
  }
}

/**
 * Stop text generation task.
 *
 * @param appId - Application ID
 * @param taskId - Task ID
 * @param user - User identifier
 * @returns Promise<{ result: 'success' }> - Stop result
 */
export async function stopDifyCompletion(
  appId: string,
  taskId: string,
  user: string
): Promise<{ result: 'success' }> {
  const slug = `completion-messages/${taskId}/stop`;
  const apiUrl = `/api/dify/${appId}/${slug}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user }),
    });

    if (!response.ok) {
      let errorData: DifyApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          status: response.status,
          code: response.status.toString(),
          message: response.statusText || 'Failed to stop task',
        };
      }

      console.error(
        '[Dify Completion Service] Failed to stop task:',
        errorData
      );
      throw new Error(`Failed to stop task: ${errorData.message}`);
    }

    const result = await response.json();

    console.log('[Dify Completion Service] Task stopped successfully:', {
      appId,
      taskId,
    });

    return result;
  } catch (error) {
    console.error(
      '[Dify Completion Service] Error occurred while stopping task:',
      error
    );

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Unknown error occurred while stopping task');
  }
}
