// lib/services/dify/completion-service.ts
// --- BEGIN COMMENT ---
// 该文件负责处理与 Dify 文本生成应用相关的 API 交互
// 文本生成应用使用 completion-messages 端点而不是 chat-messages
// --- END COMMENT ---

import type { 
  DifyCompletionRequestPayload,
  DifyCompletionResponse,
  DifyCompletionStreamResponse,
  DifyApiError,
  DifyUsage,
  DifySseEvent
} from './types';

/**
 * 执行文本生成 (blocking 模式)
 * 
 * @param appId - 应用 ID
 * @param payload - 请求数据
 * @returns Promise<DifyCompletionResponse> - 生成结果
 */
export async function executeDifyCompletion(
  appId: string,
  payload: DifyCompletionRequestPayload
): Promise<DifyCompletionResponse> {
  const slug = 'completion-messages'; // Text-Generation API 端点
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
          message: response.statusText || '文本生成失败'
        };
      }
      
      console.error('[Dify Completion Service] 文本生成失败:', errorData);
      throw new Error(`文本生成失败: ${errorData.message}`);
    }

    const result: DifyCompletionResponse = await response.json();
    
    console.log('[Dify Completion Service] 成功生成文本:', {
      appId,
      messageId: result.message_id,
      answerLength: result.answer.length
    });
    
    return result;

  } catch (error) {
    console.error('[Dify Completion Service] 文本生成时发生错误:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('文本生成时发生未知错误');
  }
}

/**
 * 流式文本生成
 * 
 * @param appId - 应用 ID
 * @param payload - 请求数据
 * @returns Promise<DifyCompletionStreamResponse> - 流式响应
 */
export async function streamDifyCompletion(
  appId: string,
  payload: DifyCompletionRequestPayload
): Promise<DifyCompletionStreamResponse> {
  const slug = 'completion-messages'; // Text-Generation API 端点
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
          message: response.statusText || '流式文本生成失败'
        };
      }
      
      console.error('[Dify Completion Service] 流式文本生成失败:', errorData);
      throw new Error(`流式文本生成失败: ${errorData.message}`);
    }

    if (!response.body) {
      throw new Error('响应体为空');
    }

    const stream = response.body;
    let messageId: string | null = null;
    let taskId: string | null = null;
    
    // 创建完成 Promise
    let completionResolve: (value: { usage?: DifyUsage; metadata?: Record<string, any> }) => void;
    let completionReject: (reason: any) => void;
    
    const completionPromise = new Promise<{ usage?: DifyUsage; metadata?: Record<string, any> }>((resolve, reject) => {
      completionResolve = resolve;
      completionReject = reject;
    });

    // 创建文本流生成器
    async function* generateAnswerStream(): AsyncGenerator<string, void, undefined> {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                return;
              }
              
              try {
                const event: DifySseEvent = JSON.parse(data);
                
                // 提取 messageId 和 taskId
                if ('id' in event && event.id) {
                  messageId = event.id;
                }
                if ('task_id' in event && event.task_id) {
                  taskId = event.task_id;
                }
                
                // 处理不同类型的事件
                if (event.event === 'message' && 'answer' in event) {
                  yield event.answer;
                } else if (event.event === 'message_end' && 'usage' in event) {
                  // 完成时解析 Promise
                  completionResolve({
                    usage: event.usage,
                    metadata: event.metadata
                  });
                } else if (event.event === 'error') {
                  completionReject(new Error(event.message));
                  return;
                }
              } catch (parseError) {
                console.warn('[Dify Completion Service] 解析 SSE 事件失败:', parseError);
              }
            }
          }
        }
      } catch (error) {
        completionReject(error);
        throw error;
      } finally {
        reader.releaseLock();
      }
    }

    return {
      answerStream: generateAnswerStream(),
      getMessageId: () => messageId,
      getTaskId: () => taskId,
      completionPromise
    };

  } catch (error) {
    console.error('[Dify Completion Service] 流式文本生成时发生错误:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('流式文本生成时发生未知错误');
  }
}

/**
 * 停止文本生成任务
 * 
 * @param appId - 应用 ID
 * @param taskId - 任务 ID
 * @param user - 用户标识
 * @returns Promise<{ result: 'success' }> - 停止结果
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
          message: response.statusText || '停止任务失败'
        };
      }
      
      console.error('[Dify Completion Service] 停止任务失败:', errorData);
      throw new Error(`停止任务失败: ${errorData.message}`);
    }

    const result = await response.json();
    
    console.log('[Dify Completion Service] 成功停止任务:', {
      appId,
      taskId
    });
    
    return result;

  } catch (error) {
    console.error('[Dify Completion Service] 停止任务时发生错误:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('停止任务时发生未知错误');
  }
} 