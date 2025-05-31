// --- BEGIN COMMENT ---
// lib/services/dify/index.ts
// 统一导出所有 Dify 服务函数
// --- END COMMENT ---

// Chat 服务
export {
  streamDifyChat,
  stopDifyStreamingTask
} from './chat-service';

// Workflow 服务
export {
  executeDifyWorkflow,
  streamDifyWorkflow,
  stopDifyWorkflow,
  getDifyWorkflowRunDetail
} from './workflow-service';

// App 服务
export {
  getAllDifyApps,
  getDifyAppParameters,
  getDifyAppInfo,
  getDifyWebAppSettings,
  getDifyAppMeta,
  testDifyAppParameters
} from './app-service';

// Message 服务
export {
  getConversationMessages,
  submitMessageFeedback,
  convertAudioToText
} from './message-service';

// Conversation 服务
export {
  getConversations,
  deleteConversation,
  renameConversation,
  getConversationVariables
} from './conversation-service';

// Completion 服务
export {
  executeDifyCompletion,
  streamDifyCompletion,
  stopDifyCompletion
} from './completion-service';

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
  
  // 通用类型
  DifyFile,
  DifyApiError
} from './types'; 