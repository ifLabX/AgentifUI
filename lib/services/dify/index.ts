// lib/services/dify/index.ts
// 统一导出所有 Dify 服务函数
// Chat 服务
export { streamDifyChat, stopDifyStreamingTask } from './chat-service';

// Workflow 服务
export {
  executeDifyWorkflow,
  streamDifyWorkflow,
  stopDifyWorkflow,
  getDifyWorkflowRunDetail,
  getDifyWorkflowLogs,
} from './workflow-service';

// App 服务
export {
  getAllDifyApps,
  getDifyAppParameters,
  getDifyAppParametersWithConfig,
  getDifyAppInfo,
  getDifyAppInfoWithConfig,
  getDifyWebAppSettings,
  getDifyAppMeta,
  testDifyAppParameters,
} from './app-service';

// Message 服务
export {
  getConversationMessages,
  submitMessageFeedback,
  convertAudioToText,
} from './message-service';

// Conversation 服务
export {
  getConversations,
  deleteConversation,
  renameConversation,
  getConversationVariables,
} from './conversation-service';

// Completion 服务
export {
  executeDifyCompletion,
  streamDifyCompletion,
  stopDifyCompletion,
} from './completion-service';

// Annotation 服务
export {
  getDifyAnnotations,
  createDifyAnnotation,
  updateDifyAnnotation,
  deleteDifyAnnotation,
  setDifyAnnotationReplySettings,
  getDifyAnnotationReplyJobStatus,
} from './annotation-service';

// 类型定义
export type {
  // Chat 相关类型
  DifyChatRequestPayload,
  DifyStreamResponse,
  DifySseEvent,
  DifyUsage,
  DifyRetrieverResource,

  // Workflow 相关类型
  DifyWorkflowRequestPayload,
  DifyWorkflowCompletionResponse,
  DifyWorkflowStreamResponse,
  DifyWorkflowFinishedData,
  DifyWorkflowSseEvent,
  DifyWorkflowInputFile,
  DifyWorkflowErrorCode,
  DifyWorkflowRunDetailResponse,
  DifyWorkflowLogStatus,
  GetDifyWorkflowLogsParams,
  GetDifyWorkflowLogsResponse,
  DifyWorkflowLogEntry,

  // App 相关类型
  DifyAppParametersResponse,
  DifyAppInfoResponse,
  DifyWebAppSettingsResponse,
  DifyAppMetaResponse,
  DifyToolIconDetail,

  // Message 相关类型
  DifyMessageFeedbackRequestPayload,
  DifyMessageFeedbackResponse,
  DifyAudioToTextRequestPayload,
  DifyAudioToTextResponse,

  // Completion 相关类型
  DifyCompletionRequestPayload,
  DifyCompletionResponse,
  DifyCompletionStreamResponse,

  // Annotation 相关类型
  DifyAnnotationItem,
  GetDifyAnnotationsParams,
  DifyAnnotationListResponse,
  CreateDifyAnnotationRequest,
  CreateDifyAnnotationResponse,
  UpdateDifyAnnotationRequest,
  UpdateDifyAnnotationResponse,
  DeleteDifyAnnotationResponse,
  DifyAnnotationReplyAction,
  InitialDifyAnnotationReplySettingsRequest,
  DifyAsyncJobResponse,
  DifyAsyncJobStatusResponse,

  // 通用类型
  DifyFile,
  DifyApiError,
} from './types';
