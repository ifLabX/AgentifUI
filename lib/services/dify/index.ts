/**
 * Dify Service Index
 * @description Exports all Dify service functions
 * @module lib/services/dify/index
 */

// Chat Service
export { streamDifyChat, stopDifyStreamingTask } from './chat-service';

// Workflow Service
export {
  executeDifyWorkflow,
  streamDifyWorkflow,
  stopDifyWorkflow,
  getDifyWorkflowRunDetail,
  getDifyWorkflowLogs,
} from './workflow-service';

// App Service
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

// Message Service
export {
  getConversationMessages,
  submitMessageFeedback,
  convertAudioToText,
} from './message-service';

// Conversation Service
export {
  getConversations,
  deleteConversation,
  renameConversation,
  getConversationVariables,
} from './conversation-service';

// Completion Service
export {
  executeDifyCompletion,
  streamDifyCompletion,
  stopDifyCompletion,
} from './completion-service';

// Annotation Service
export {
  getDifyAnnotations,
  createDifyAnnotation,
  updateDifyAnnotation,
  deleteDifyAnnotation,
  setDifyAnnotationReplySettings,
  getDifyAnnotationReplyJobStatus,
} from './annotation-service';

// File Service
export { uploadDifyFile, previewDifyFile } from './file-service';

// Type Definitions
export type {
  // Chat Related Types
  DifyChatRequestPayload,
  DifyStreamResponse,
  DifySseEvent,
  DifyUsage,
  DifyRetrieverResource,

  // Workflow Related Types
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

  // App Related Types
  DifyAppParametersResponse,
  DifyAppInfoResponse,
  DifyWebAppSettingsResponse,
  DifyAppMetaResponse,
  DifyToolIconDetail,

  // Message Related Types
  DifyMessageFeedbackRequestPayload,
  DifyMessageFeedbackResponse,
  DifyAudioToTextRequestPayload,
  DifyAudioToTextResponse,

  // Completion Related Types
  DifyCompletionRequestPayload,
  DifyCompletionResponse,
  DifyCompletionStreamResponse,

  // Annotation Related Types
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

  // File Related Types
  DifyFile,
  DifyFileUploadResponse,
  DifyFilePreviewOptions,
  DifyFilePreviewResponse,

  // Common Types
  DifyApiError,
} from './types';
