/**
 * Dify API type definitions
 * @description Defines data structures for interacting with Dify API
 * @see https://docs.dify.ai/
 */

/**
 * Dify file object structure
 * @description Used for file uploads in request body
 */
export interface DifyFile {
  /** File type */
  type: 'image' | 'document' | 'audio' | 'video' | 'custom';
  /** Transfer method */
  transfer_method: 'remote_url' | 'local_file';
  /** Remote URL, required when transfer_method is remote_url */
  url?: string;
  /** Local file ID, required when transfer_method is local_file */
  upload_file_id?: string;
}

/**
 * Chat file upload structure
 * @description Used for file uploads in chat components
 */
export interface ChatUploadFile {
  type: string;
  transfer_method: string;
  upload_file_id: string;
  name: string;
  size: number;
  mime_type: string;
}

/**
 * Dify chat message request body
 * @description Chat request data structure sent to Dify API
 */
export interface DifyChatRequestPayload {
  /** User input content */
  query: string;
  /** App input variables, defaults to empty object */
  inputs?: Record<string, unknown>;
  /** Response mode */
  response_mode: 'streaming' | 'blocking';
  /** Unique user identifier */
  user: string;
  /** Conversation ID, null or empty string indicates new conversation */
  conversation_id?: string | null;
  /** File list */
  files?: DifyFile[];
  /** whether to auto-generate title, defaults to true */
  auto_generate_name?: boolean;
}

/**
 * SSE event base structure
 * @description Base interface for all Dify SSE events
 */
interface DifySseBaseEvent {
  /** Task ID */
  task_id: string;
  /** Event or message ID */
  id?: string;
  /** Conversation ID */
  conversation_id: string;
  /** Event type */
  event: string;
}

/**
 * Message text chunk event
 * @description event: message - LLM returned text chunk content
 */
export interface DifySseMessageEvent extends DifySseBaseEvent {
  event: 'message';
  /** Message ID */
  id: string;
  /** LLM returned text chunk content */
  answer: string;
  /** Creation timestamp */
  created_at: number;
}

/**
 * Message file event
 * @description event: message_file - File message
 */
export interface DifySseMessageFileEvent extends DifySseBaseEvent {
  event: 'message_file';
  /** File ID */
  id: string;
  /** File type */
  type: string;
  /** File owner */
  belongs_to: 'user' | 'assistant';
  /** File access URL */
  url: string;
}

/**
 * Message end event
 * @description event: message_end - Message transmission complete
 */
export interface DifySseMessageEndEvent extends DifySseBaseEvent {
  event: 'message_end';
  /** Message ID */
  id: string;
  /** Metadata */
  metadata: Record<string, unknown>;
  /** Model usage information */
  usage: DifyUsage;
  /** Reference and attribution resources */
  retriever_resources?: DifyRetrieverResource[];
}

/**
 * TTS audio chunk event
 * @description event: tts_message - Text-to-speech audio chunk
 */
export interface DifySseTtsMessageEvent extends DifySseBaseEvent {
  event: 'tts_message';
  /** Message ID */
  id: string;
  /** Base64 encoded audio chunk */
  audio: string;
  /** Creation timestamp */
  created_at: number;
}

/**
 * TTS end event
 * @description event: tts_message_end - TTS transmission end
 */
export interface DifySseTtsMessageEndEvent extends DifySseBaseEvent {
  event: 'tts_message_end';
  /** Message ID */
  id: string;
  /** Empty audio string */
  audio: string;
  /** Creation timestamp */
  created_at: number;
}

/**
 * Message replacement event
 * @description event: message_replace - Content replacement
 */
export interface DifySseMessageReplaceEvent extends DifySseBaseEvent {
  event: 'message_replace';
  /** Message ID */
  id: string;
  /** Complete content after replacement */
  answer: string;
  /** Creation timestamp */
  created_at: number;
}

/**
 * Workflow start event
 * @description event: workflow_started - Workflow execution start
 */
export interface DifySseWorkflowStartedEvent extends DifySseBaseEvent {
  event: 'workflow_started';
  /** Workflow run ID */
  workflow_run_id: string;
  /** Workflow data */
  data: {
    id: string;
    workflow_id: string;
    sequence_number: number;
    created_at: number;
  };
}
/**
 * Node Started Event
 * @description event: node_started - A workflow node has started execution
 */
export interface DifySseNodeStartedEvent extends DifySseBaseEvent {
  event: 'node_started';
  /** Workflow run ID */
  workflow_run_id: string;
  /** Node data */
  data: {
    id: string;
    node_id: string;
    node_type: string;
    title: string;
    index: number;
    predecessor_node_id?: string;
    inputs: Record<string, unknown>;
    created_at: number;
  };
}

/**
 * Node Finished Event
 * @description event: node_finished - A workflow node has finished execution
 */
export interface DifySseNodeFinishedEvent extends DifySseBaseEvent {
  event: 'node_finished';
  /** Workflow run ID */
  workflow_run_id: string;
  /** Node execution result data */
  data: {
    id: string;
    node_id: string;
    index: number;
    predecessor_node_id?: string;
    inputs?: Record<string, unknown>;
    process_data?: unknown;
    outputs?: unknown;
    status: 'running' | 'succeeded' | 'failed' | 'stopped';
    error?: string;
    elapsed_time?: number;
    execution_metadata?: unknown;
    total_tokens?: number;
    total_price?: string;
    currency?: string;
    created_at: number;
  };
}

/**
 * Workflow Finished Event
 * @description event: workflow_finished - The workflow execution has completed
 */
export interface DifySseWorkflowFinishedEvent extends DifySseBaseEvent {
  event: 'workflow_finished';
  /** Workflow run ID */
  workflow_run_id: string;
  /** Workflow execution result data */
  data: {
    id: string;
    workflow_id: string;
    status: 'running' | 'succeeded' | 'failed' | 'stopped';
    outputs?: unknown;
    error?: string;
    elapsed_time?: number;
    total_tokens?: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

/**
 * Stream Error Event
 * @description event: error - An error occurred in the SSE stream processing
 */
export interface DifySseErrorEvent extends DifySseBaseEvent {
  event: 'error';
  /** Message ID, may be empty */
  id?: string;
  /** HTTP status code */
  status: number;
  /** Error code */
  code: string;
  /** Error message */
  message: string;
}

/**
 * Ping Event
 * @description event: ping - A heartbeat packet to keep the SSE connection alive
 */
export interface DifySsePingEvent extends DifySseBaseEvent {
  event: 'ping';
}

/**
 * Agent Thought Event
 * @description event: agent_thought - The thinking process of the Agent
 */
export interface DifySseAgentThoughtEvent extends DifySseBaseEvent {
  event: 'agent_thought';
  /** Agent thought message ID */
  id: string;
  /** Associated message ID */
  message_id: string;
  /** Position index */
  position: number;
  /** Text content of the thought process */
  thought: string;
  /** Observation result */
  observation: string;
  /** The tool being used */
  tool: string;
  /** Tool labels */
  tool_labels: Record<string, unknown>;
  /** Tool input */
  tool_input: string;
  /** Message files */
  message_files: DifyMessageFile[];
  /** Creation timestamp */
  created_at: number;
}

/**
 * Agent Message Event
 * @description event: agent_message - The streaming response content from an Agent application
 */
export interface DifySseAgentMessageEvent extends DifySseBaseEvent {
  event: 'agent_message';
  /** Agent message ID */
  id: string;
  /** Associated message ID */
  message_id: string;
  /** Text chunk of the Agent's answer */
  answer: string;
  /** Creation timestamp */
  created_at: number;
}

/**
 * Dify Model Usage Information
 * @description Records token usage and costs for API calls
 */
export interface DifyUsage {
  /** Number of prompt tokens */
  prompt_tokens?: number;
  /** Prompt unit price */
  prompt_unit_price?: string;
  /** Prompt price unit */
  prompt_price_unit?: string;
  /** Total prompt price */
  prompt_price?: string;
  /** Number of completion tokens */
  completion_tokens?: number;
  /** Completion unit price */
  completion_unit_price?: string;
  /** Completion price unit */
  completion_price_unit?: string;
  /** Total completion price */
  completion_price?: string;
  /** Total number of tokens */
  total_tokens: number;
  /** Total price */
  total_price?: string;
  /** Currency */
  currency?: string;
  /** Latency */
  latency?: number;
}

/**
 * Dify Retriever Resource Information
 * @description Records citation and attribution information
 */
export interface DifyRetrieverResource {
  /** Segment ID */
  segment_id: string;
  /** Document ID */
  document_id: string;
  /** Document name */
  document_name: string;
  /** Position */
  position: number;
  /** Content */
  content: string;
  /** Score */
  score?: number;
  // Other possible fields
}

/**
 * Iteration Started Event
 * @description event: iteration_started - An iteration has started
 */
export interface DifySseIterationStartedEvent extends DifySseBaseEvent {
  event: 'iteration_started';
  /** Workflow run ID */
  workflow_run_id: string;
  /** Node data */
  data: {
    id: string;
    node_id: string;
    node_type: string;
    title: string;
    iteration_id: string;
    iteration_index: number;
    total_iterations?: number;
    inputs: Record<string, unknown>;
    created_at: number;
  };
}

/**
 * Iteration Next Event
 * @description event: iteration_next - The next round of an iteration
 */
export interface DifySseIterationNextEvent extends DifySseBaseEvent {
  event: 'iteration_next';
  /** Workflow run ID */
  workflow_run_id: string;
  /** Node data */
  data: {
    id: string;
    node_id: string;
    iteration_id: string;
    iteration_index: number;
    outputs?: Record<string, unknown>;
    created_at: number;
  };
}

/**
 * Iteration Completed Event
 * @description event: iteration_completed - The iteration has completed
 */
export interface DifySseIterationCompletedEvent extends DifySseBaseEvent {
  event: 'iteration_completed';
  /** Workflow run ID */
  workflow_run_id: string;
  /** Node data */
  data: {
    id: string;
    node_id: string;
    iteration_id: string;
    total_iterations: number;
    outputs: Record<string, unknown>;
    elapsed_time: number;
    created_at: number;
  };
}

/**
 * Parallel Branch Started Event
 * @description event: parallel_branch_started - A parallel branch has started
 */
export interface DifySseParallelBranchStartedEvent extends DifySseBaseEvent {
  event: 'parallel_branch_started';
  /** Workflow run ID */
  workflow_run_id: string;
  /** Node data */
  data: {
    id: string;
    node_id: string;
    branch_id: string;
    branch_index: number;
    total_branches?: number;
    inputs: Record<string, unknown>;
    created_at: number;
  };
}

/**
 * Parallel Branch Finished Event
 * @description event: parallel_branch_finished - A parallel branch has finished
 */
export interface DifySseParallelBranchFinishedEvent extends DifySseBaseEvent {
  event: 'parallel_branch_finished';
  /** Workflow run ID */
  workflow_run_id: string;
  /** Node data */
  data: {
    id: string;
    node_id: string;
    branch_id: string;
    branch_index: number;
    status: 'succeeded' | 'failed' | 'stopped';
    outputs?: Record<string, unknown>;
    error?: string;
    elapsed_time: number;
    created_at: number;
  };
}

// New: SSE event types related to Loop
// Difference between Loop and Iteration:
// - Loop: Repetitive execution based on a condition, can be an infinite loop or based on a counter.
// - Iteration: Traversal-based execution on an input data list, with a clear ending condition.
/**
 * Loop Started Event
 * @description event: loop_started - A loop has started
 */
export interface DifySseLoopStartedEvent extends DifySseBaseEvent {
  event: 'loop_started';
  /** Workflow run ID */
  workflow_run_id: string;
  /** Node data */
  data: {
    id: string;
    node_id: string;
    node_type: string;
    title: string;
    inputs: Record<string, unknown>;
    metadata?: { loop_length?: number }; // Loop limit information
    created_at: number;
  };
}

/**
 * Loop Next Event
 * @description event: loop_next - The next round of a loop
 */
export interface DifySseLoopNextEvent extends DifySseBaseEvent {
  event: 'loop_next';
  /** Workflow run ID */
  workflow_run_id: string;
  /** Node data */
  data: {
    id: string;
    node_id: string;
    node_type: string;
    title: string;
    index: number;
    pre_loop_output?: Record<string, unknown>;
    created_at: number;
  };
}

/**
 * Loop Completed Event
 * @description event: loop_completed - The loop has completed
 */
export interface DifySseLoopCompletedEvent extends DifySseBaseEvent {
  event: 'loop_completed';
  /** Workflow run ID */
  workflow_run_id: string;
  /** Node data */
  data: {
    id: string;
    node_id: string;
    // 🎯 Fix: The actual data does not contain the total_loops field, it needs to be inferred from elsewhere.
    outputs?: Record<string, unknown>;
    elapsed_time?: number;
    created_at: number;
  };
}

// --- Service Function Return Types --- (For Hook usage)

export interface DifyStreamResponse {
  // A stream of processed text chunks, containing only the 'answer' field content from 'event: message' events.
  // The service layer is responsible for parsing the SSE and filtering the text.
  answerStream: AsyncGenerator<string, void, undefined>;

  // Provides a method to get the conversation_id during or after stream processing.
  // This method returns null at the start of the stream and returns the ID once it's captured from the stream.
  getConversationId: () => string | null;

  // Provides a method to get the task_id during or after stream processing.
  getTaskId: () => string | null;

  // An optional Promise that resolves when the message_end event arrives,
  // carrying the final usage, metadata, etc., for scenarios that require the complete response.
  completionPromise?: Promise<{
    usage?: DifyUsage;
    metadata?: Record<string, unknown>;
    retrieverResources?: DifyRetrieverResource[];
  }>;

  // Other non-text events extracted from the stream, such as file events, can be added here as needed.
  // fileEventsStream?: AsyncGenerator<DifySseMessageFileEvent, void, undefined>;
}

// Dify Stop Streaming Task API Types
// POST /chat-messages/:task_id/stop
/**
 * Dify Stop Task Request Payload
 * @description Data structure for the request to stop a streaming task.
 */
export interface DifyStopTaskRequestPayload {
  /** Unique user identifier, must be consistent with the one used when sending the message. */
  user: string;
}

/**
 * Dify Stop Task Response
 * @description Data structure for the response of stopping a streaming task.
 */
export interface DifyStopTaskResponse {
  result: 'success'; // Always returns 'success'
}

/**
 * Dify file upload API response
 * @description POST /files/upload
 */
export interface DifyFileUploadResponse {
  id: string; // File ID (UUID)
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string | number; // User ID (can be number or string)
  created_at: number; // Unix timestamp
}

/**
 * File preview request options
 * @description Options for file preview/download API requests
 */
export interface DifyFilePreviewOptions {
  /** Whether to force download the file as an attachment. Default is false (preview in browser) */
  as_attachment?: boolean;
}

/**
 * File preview response metadata
 * @description Response headers and metadata for file preview API
 */
export interface DifyFilePreviewResponse {
  /** File content as blob */
  content: Blob;
  /** Response headers */
  headers: {
    /** MIME type of the file */
    contentType: string;
    /** File size in bytes */
    contentLength?: number;
    /** Content disposition header */
    contentDisposition?: string;
    /** Cache control header */
    cacheControl?: string;
    /** Accept ranges header for audio/video files */
    acceptRanges?: string;
  };
}

/**
 * Messages API Type Definitions
 * @description Type definitions for Dify messages API endpoints
 */

// /messages API - Common error response structure
// This can be used as a type reference for message-service.ts error handling
export interface DifyApiError {
  status: number; // HTTP status code
  code: string; // Dify internal error code or HTTP status code string
  message: string; // Error description
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Allow dynamic error fields from external Dify API (e.g., validation_errors)
  [key: string]: any; // Allow other possible error fields like validation_errors from Dify
}

// /messages API - Message file object structure
export interface DifyMessageFile {
  id: string; // File ID
  type: string; // File type, e.g. "image"
  url: string; // File preview URL
  belongs_to: 'user' | 'assistant'; // File owner: "user" or "assistant"
}

// /messages API - Message feedback information structure
export interface DifyMessageFeedback {
  rating: 'like' | 'dislike' | null; // Like 'like' / Dislike 'dislike', or null
  // May have other feedback-related fields based on the actual API, e.g. content
}

// /messages API - Single message object structure (This is different from DifyMessage in SSE, it's a specific structure for fetching historical messages)
export interface ConversationMessage {
  id: string; // Unique ID of the message
  conversation_id: string; // ID of the conversation this message belongs to
  inputs: Record<string, unknown>; // User-provided parameters, content depends on the application design
  query: string; // The original query content sent by the user
  answer: string; // The AI assistant's response content
  message_files: DifyMessageFile[]; // List of files included in the message
  created_at: number; // Message creation timestamp (Unix timestamp)
  feedback: DifyMessageFeedback | null; // User feedback on this response
  retriever_resources: DifyRetrieverResource[]; // List of citation and attribution segments
}

// /messages API - Query Parameters interface for fetching historical messages
export interface GetMessagesParams {
  conversation_id: string; // Conversation ID (required)
  user: string; // User identifier (required)
  first_id?: string | null; // The ID of the earliest message in the current list, for pagination (optional, defaults to null)
  limit?: number; // The number of chat records to return in one request (optional, defaults to 20)
}

// /messages API - Response body structure for fetching historical messages
export interface GetMessagesResponse {
  data: ConversationMessage[]; // List of message objects fetched in this request
  has_more: boolean; // Indicates if there are more older chat records to load
  limit: number; // The actual number of chat records returned in this request
}
/**
 * Conversations API Type Definitions
 * @description Type definitions for Dify conversations API endpoints
 */
// /conversations API - Parameters for fetching the conversation list
export interface GetConversationsParams {
  user: string; // User identifier, required
  last_id?: string | null; // The ID of the last record on the current page, for pagination, optional
  limit?: number; // Number of records to return at once, default 20, optional
  sort_by?: 'created_at' | '-created_at' | 'updated_at' | '-updated_at'; // Sort field, default -updated_at
}

// /conversations API - Single conversation object structure
export interface Conversation {
  id: string; // Conversation ID
  name: string; // Conversation name, generated by the large language model by default
  inputs: Record<string, unknown>; // User input parameters
  status: string; // Conversation status
  introduction: string; // Opening remark
  created_at: number; // Creation time (timestamp)
  updated_at: number; // Update time (timestamp)
}

// /conversations API - Response body structure for fetching the conversation list
export interface GetConversationsResponse {
  data: Conversation[]; // List of conversations
  has_more: boolean; // Indicates if there are more conversations
  limit: number; // Number of records returned
}
// /conversations API - Request body structure for deleting a conversation
export interface DeleteConversationRequestPayload {
  user: string; // User identifier, defined by the developer, must be unique within the application
}

// /conversations API - Response body structure for deleting a conversation
export interface DeleteConversationResponse {
  result: 'success';
}

// /conversations API - Request body structure for renaming a conversation
export interface RenameConversationRequestPayload {
  name?: string; // (Optional) Name. This parameter can be omitted if auto_generate is true.
  auto_generate?: boolean; // (Optional) Auto-generate title, default is false
  user: string; // User identifier, defined by the developer, must be unique within the application
}

// /conversations API - Response body structure for renaming a conversation, returns the updated conversation info
export type RenameConversationResponse = Conversation;

// /conversations API - Request parameters for getting conversation variables
export interface GetConversationVariablesParams {
  user: string; // User identifier, defined by the developer, must be unique within the application
  last_id?: string | null; // (Optional) The ID of the last record on the current page, default null
  limit?: number; // (Optional) Number of records to return at once, default 20, max 100, min 1
}

// /conversations API - Conversation variable object structure
export interface ConversationVariable {
  id: string; // Variable ID
  name: string; // Variable name
  value_type: string; // Variable type (string, number, boolean, etc.)
  value: string; // Variable value
  description: string; // Variable description
  created_at: number; // Creation timestamp
  updated_at: number; // Last updated timestamp
}

// /conversations API - Response body structure for getting conversation variables
export interface GetConversationVariablesResponse {
  limit: number; // Number of items per page
  has_more: boolean; // Indicates if there are more items
  data: ConversationVariable[]; // List of variables
}

// End of Conversations API types

// Application parameters related type definitions (GET /parameters)
/**
 * Dify Number Input Control
 * @description A number input control for forms
 */
export interface DifyNumberInputControl {
  label: string; // Display label for the control
  variable: string; // Control ID
  required: boolean; // Whether it is required
  default: number | string; // Default value (can be number or string)
  min?: number; // Minimum value constraint
  max?: number; // Maximum value constraint
  step?: number; // Step increment, defaults to 1
  precision?: number; // Decimal places constraint
}

/**
 * Dify Text Input Control
 * @description A text input control for forms
 */
export interface DifyTextInputControl {
  label: string; // Display label for the control
  variable: string; // Control ID
  required: boolean; // Whether it is required
  max_length?: number; // Maximum length constraint
  default: string; // Default value
}

/**
 * User Input Form Control - Paragraph Text Input
 * @description A paragraph text input control for forms
 */
export interface DifyParagraphControl {
  label: string; // Display label for the control
  variable: string; // Control ID
  required: boolean; // Whether it is required
  default: string; // Default value
}

/**
 * User Input Form Control - Select Dropdown
 * @description A select dropdown control for forms
 */
export interface DifySelectControl {
  label: string; // Display label for the control
  variable: string; // Control ID
  required: boolean; // Whether it is required
  default: string; // Default value
  options: string[]; // List of option values
}

/**
 * File Input Control
 * @description A file input control for forms
 */
export interface DifyFileInputControl {
  label: string; // Display label for the control
  variable: string; // Control ID
  required: boolean; // Whether it is required
  default?: File[]; // Default value (array of files)
  number_limits?: number; // File count limit
  allowed_file_types?: string[]; // Allowed file types
  max_file_size_mb?: number; // Maximum file size (MB)
}

/**
 * User Input Form Item
 * @description A user input item within a form
 */
export interface DifyUserInputFormItem {
  'text-input'?: DifyTextInputControl;
  number?: DifyNumberInputControl;
  paragraph?: DifyParagraphControl;
  select?: DifySelectControl;
  file?: DifyFileInputControl;
  'file-list'?: DifyFileInputControl; // Multi-file mode
}

/**
 * Image Upload Configuration
 * @description Settings related to image uploads
 */
export interface DifyImageUploadConfig {
  enabled: boolean; // Whether it is enabled
  number_limits: number; // Image count limit, default 3
  transfer_methods: ('remote_url' | 'local_file')[]; // List of transfer methods, at least one is required
}

/**
 * Document Upload Configuration
 * @description Settings related to document uploads
 */
export interface DifyDocumentUploadConfig {
  enabled: boolean; // Whether it is enabled
  number_limits: number; // Document count limit
  transfer_methods: ('remote_url' | 'local_file')[]; // List of transfer methods
}

/**
 * Audio Upload Configuration
 * @description Settings related to audio uploads
 */
export interface DifyAudioUploadConfig {
  enabled: boolean; // Whether it is enabled
  number_limits: number; // Audio count limit
  transfer_methods: ('remote_url' | 'local_file')[]; // List of transfer methods
}

/**
 * Video Upload Configuration
 * @description Settings related to video uploads
 */
export interface DifyVideoUploadConfig {
  enabled: boolean; // Whether it is enabled
  number_limits: number; // Video count limit
  transfer_methods: ('remote_url' | 'local_file')[]; // List of transfer methods
}

/**
 * Other File Types Upload Configuration
 * @description Settings for uploading other file types
 */
export interface DifyOtherUploadConfig {
  enabled: boolean; // Whether it is enabled
  number_limits: number; // File count limit
  transfer_methods: ('remote_url' | 'local_file')[]; // List of transfer methods
  custom_extensions?: string[]; // List of custom file extensions
}

/**
 * File Upload Configuration
 * @description Settings related to file uploads
 */
export interface DifyFileUploadConfig {
  enabled?: boolean; // Top-level master switch for file uploads
  allowed_file_types?: string[]; // List of allowed file types
  allowed_file_extensions?: string[]; // List of allowed file extensions
  allowed_file_upload_methods?: string[]; // Allowed upload methods
  max_file_size_mb?: number; // Maximum file size (MB)
  number_limits?: number; // File count limit (possible field name 1)
  max_files?: number; // File count limit (possible field name 2)
  file_count_limit?: number; // File count limit (possible field name 3)
  image?: DifyImageUploadConfig; // Image settings
  document?: DifyDocumentUploadConfig; // Document settings
  audio?: DifyAudioUploadConfig; // Audio settings
  video?: DifyVideoUploadConfig; // Video settings
  other?: DifyOtherUploadConfig; // Other file type settings
}

/**
 * System Parameters Configuration
 * @description System-related parameter configurations
 */
export interface DifySystemParameters {
  file_size_limit: number; // Document upload size limit (MB)
  image_file_size_limit: number; // Image file upload size limit (MB)
  audio_file_size_limit: number; // Audio file upload size limit (MB)
  video_file_size_limit: number; // Video file upload size limit (MB)
}

/**
 * Suggested Questions After Answer Configuration
 * @description Settings for suggested questions after an answer is provided
 */
export interface DifySuggestedQuestionsAfterAnswer {
  enabled: boolean; // Whether it is enabled
}

/**
 * Speech-to-Text Configuration
 * @description Settings for speech-to-text functionality
 */
export interface DifySpeechToText {
  enabled: boolean; // Whether it is enabled
}

/**
 * Text-to-Speech Configuration
 * @description Settings for text-to-speech functionality
 */
export interface DifyTextToSpeech {
  enabled: boolean; // Whether it is enabled
  voice?: string; // Voice type
  language?: string; // Language
  autoPlay?: 'enabled' | 'disabled'; // Autoplay: enabled or disabled
}

/**
 * Retriever Resource (Citation and Attribution) Configuration
 * @description Settings for citation and attribution
 */
export interface DifyRetrieverResourceConfig {
  enabled: boolean; // Whether it is enabled
}

/**
 * Annotation Reply Configuration
 * @description Settings for annotation replies
 */
export interface DifyAnnotationReply {
  enabled: boolean; // Whether it is enabled
}

/**
 * Get Application Parameters Response
 * @description Response containing application-related parameters
 */
export interface DifyAppParametersResponse {
  opening_statement: string; // Opening statement
  suggested_questions: string[]; // List of suggested opening questions
  suggested_questions_after_answer: DifySuggestedQuestionsAfterAnswer; // Enable suggested questions after answer
  speech_to_text: DifySpeechToText; // Speech-to-text
  text_to_speech: DifyTextToSpeech; // Text-to-speech
  retriever_resource: DifyRetrieverResourceConfig; // Citation and attribution
  annotation_reply: DifyAnnotationReply; // Annotation reply
  user_input_form: DifyUserInputFormItem[]; // User input form configuration
  file_upload: DifyFileUploadConfig; // File upload configuration
  system_parameters: DifySystemParameters; // System parameters
}

// Workflow API Related Type Definitions
// POST /workflows/run
// Updated based on the complete OpenAPI documentation
/**
 * Workflow Input File Object
 * @description Describes the structure of a workflow input file
 */
export interface DifyWorkflowInputFile {
  type: 'document' | 'image' | 'audio' | 'video' | 'custom';
  transfer_method: 'remote_url' | 'local_file';
  url?: string; // Required when transfer_method is 'remote_url'
  upload_file_id?: string; // Required when transfer_method is 'local_file'
}

/**
 * Dify Workflow Request Payload
 * @description Describes the structure of a workflow request
 */
export interface DifyWorkflowRequestPayload {
  inputs: Record<string, unknown>; // Structured input parameters, supporting string, number, boolean, object, file array
  response_mode: 'streaming' | 'blocking';
  user: string;
  // Note: Workflow does not have the concept of a conversation_id
}

/**
 * Dify Workflow Completion Response (blocking mode)
 * @description Describes the structure of a workflow execution response
 */
export interface DifyWorkflowCompletionResponse {
  workflow_run_id: string; // UUID format
  task_id: string; // UUID format
  data: DifyWorkflowFinishedData;
}

/**
 * Workflow Finished Data
 * @description Describes the data structure when a workflow execution is finished
 */
export interface DifyWorkflowFinishedData {
  id: string; // Workflow execution ID (UUID)
  workflow_id: string; // Associated Workflow ID (UUID)
  status: 'running' | 'succeeded' | 'failed' | 'stopped';
  outputs?: Record<string, unknown> | null; // Structured output (JSON)
  error?: string | null;
  elapsed_time?: number | null; // Time elapsed (seconds)
  total_tokens?: number | null;
  total_steps: number; // Total steps, default 0
  created_at: number; // Start time (Unix timestamp)
  finished_at: number; // End time (Unix timestamp)
}

/**
 * Workflow SSE Event - workflow_started
 * @description event: workflow_started - Workflow execution has started
 */
export interface DifyWorkflowSseStartedEvent {
  event: 'workflow_started';
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    workflow_id: string;
    sequence_number: number;
    created_at: number;
  };
}

/**
 * Workflow SSE Event - workflow_finished
 * @description event: workflow_finished - Workflow execution has completed
 */
export interface DifyWorkflowSseFinishedEvent {
  event: 'workflow_finished';
  task_id: string;
  workflow_run_id: string;
  data: DifyWorkflowFinishedData;
}

/**
 * Workflow SSE Event - node_started
 * @description event: node_started - A workflow node has started execution
 */
export interface DifyWorkflowSseNodeStartedEvent {
  event: 'node_started';
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    node_type: string;
    title: string;
    index: number;
    predecessor_node_id?: string;
    inputs: Record<string, unknown>;
    created_at: number;
  };
}

/**
 * Workflow SSE Event - node_finished
 * @description event: node_finished - A workflow node has finished execution
 */
export interface DifyWorkflowSseNodeFinishedEvent {
  event: 'node_finished';
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    index: number;
    predecessor_node_id?: string;
    inputs?: Record<string, unknown>;
    process_data?: unknown;
    outputs?: unknown;
    status: 'running' | 'succeeded' | 'failed' | 'stopped';
    error?: string;
    elapsed_time?: number;
    execution_metadata?: unknown;
    total_tokens?: number;
    total_price?: string;
    currency?: string;
    created_at: number;
  };
}

/**
 * Workflow SSE Event - error
 * @description event: error - An error occurred in the SSE stream processing
 */
export interface DifyWorkflowSseErrorEvent {
  event: 'error';
  task_id: string;
  workflow_run_id?: string;
  status: number;
  code: string;
  message: string;
}

/**
 * Union type for all Workflow SSE events
 * @description Describes the union type of all possible Workflow SSE events
 */
export type DifyWorkflowSseEvent =
  | DifyWorkflowSseStartedEvent
  | DifyWorkflowSseFinishedEvent
  | DifyWorkflowSseNodeStartedEvent
  | DifyWorkflowSseNodeFinishedEvent
  | DifyWorkflowSseErrorEvent
  | DifySseIterationStartedEvent
  | DifySseIterationNextEvent
  | DifySseIterationCompletedEvent
  | DifySseLoopStartedEvent
  | DifySseLoopNextEvent
  | DifySseLoopCompletedEvent;

/**
 * Workflow Stream Response Interface
 * @description Describes the interface for a workflow streaming response
 */
export interface DifyWorkflowStreamResponse {
  // 🎯 Fix: Node execution progress stream, supporting all workflow event types
  progressStream: AsyncGenerator<DifyWorkflowSseEvent, void, undefined>;

  // Get workflow_run_id
  getWorkflowRunId: () => string | null;

  // Get task_id
  getTaskId: () => string | null;

  // Promise that resolves on completion, containing the final result
  completionPromise: Promise<DifyWorkflowFinishedData>;
}

/**
 * Workflow API Error Codes
 * @description Describes possible error codes for the Workflow API
 */
export type DifyWorkflowErrorCode =
  | 'invalid_param'
  | 'app_unavailable'
  | 'provider_not_initialize'
  | 'provider_quota_exceeded'
  | 'model_currently_not_support'
  | 'workflow_request_error';

// Get Application Basic Info API Type Definition
// GET /info
/**
 * Get Application Basic Info Response
 * @description Returns basic information about the application
 */
export interface DifyAppInfoResponse {
  name: string; // Application name
  description: string; // Application description
  tags: string[]; // Application tags
}

// Message Feedback API Type Definitions
// POST /messages/:message_id/feedbacks
/**
 * Message Feedback Request Payload
 * @description Describes the structure of a message feedback request
 */
export interface DifyMessageFeedbackRequestPayload {
  rating: 'like' | 'dislike' | null; // Feedback type: 'like', 'dislike', or 'null' to retract
  user: string; // User identifier
  content?: string; // Specific feedback message (optional)
}

/**
 * Message Feedback Response
 * @description Describes the structure of a message feedback response
 */
export interface DifyMessageFeedbackResponse {
  result: 'success'; // Always returns 'success'
}

// Speech-to-Text API Type Definitions
// POST /audio-to-text
/**
 * Speech-to-Text Request Payload
 * @description Describes the structure of a speech-to-text request
 */
export interface DifyAudioToTextRequestPayload {
  file: File; // Audio file
  user: string; // User identifier
}

/**
 * Speech-to-Text Response
 * @description Describes the structure of a speech-to-text response
 */
export interface DifyAudioToTextResponse {
  text: string; // The converted text
}

// Text-Generation API Type Definitions
// POST /completion-messages
/**
 * Text Generation Request Payload
 * @description Describes the structure of a text generation request
 */
export interface DifyCompletionRequestPayload {
  inputs: Record<string, unknown>; // Input parameters
  response_mode: 'streaming' | 'blocking'; // Response mode
  user: string; // User identifier
  files?: DifyFile[]; // List of files (optional)
}

/**
 * Text Generation Completion Response (blocking mode)
 * @description Describes the structure of a text generation completion response
 */
export interface DifyCompletionResponse {
  message_id: string; // Message ID
  mode: string; // App mode, always "completion"
  answer: string; // The generated text
  metadata: Record<string, unknown>; // Metadata
  usage: DifyUsage; // Usage information
  created_at: number; // Creation timestamp
}

/**
 * Text Generation Stream Response Interface
 * @description Describes the interface for a text generation streaming response
 */
export interface DifyCompletionStreamResponse {
  // Stream of text chunks
  answerStream: AsyncGenerator<string, void, undefined>;

  // Get Message ID
  getMessageId: () => string | null;

  // Get Task ID
  getTaskId: () => string | null;

  // Promise that resolves on completion
  completionPromise: Promise<{
    usage?: DifyUsage;
    metadata?: Record<string, unknown>;
  }>;
}

// WebApp Settings API Type Definitions
// GET /site
/**
 * WebApp Settings Response
 * @description Returns the WebApp settings
 */
export interface DifyWebAppSettingsResponse {
  title: string; // WebApp name
  chat_color_theme: string; // Chat color theme, in hex format
  chat_color_theme_inverted: boolean; // Whether the chat color theme is inverted
  icon_type: 'emoji' | 'image'; // Icon type
  icon: string; // Icon content (emoji or image URL)
  icon_background: string; // Background color in hex format
  icon_url: string | null; // Icon URL
  description: string; // Description
  copyright: string; // Copyright information
  privacy_policy: string; // Privacy policy link
  custom_disclaimer: string; // Custom disclaimer
  default_language: string; // Default language
  show_workflow_steps: boolean; // Whether to show workflow details
  use_icon_as_answer_icon: boolean; // Whether to use the WebApp icon to replace the bot icon in the chat
}

// Application Meta Info API Type Definitions
// GET /meta
/**
 * Tool Icon Detail
 * @description Describes the structure of a tool icon
 */
export interface DifyToolIconDetail {
  background: string; // Background color in hex format
  content: string; // emoji
}

/**
 * Application Meta Info Response
 * @description Returns the application's meta information
 */
export interface DifyAppMetaResponse {
  tool_icons: Record<string, string | DifyToolIconDetail>; // Tool icons, key is the tool name, value is the icon URL or detail object
}

/**
 * Workflow Run Detail Response
 * @description Describes the structure of a workflow run detail response
 */
export interface DifyWorkflowRunDetailResponse {
  id: string; // Workflow execution ID (UUID)
  workflow_id: string; // Associated Workflow ID (UUID)
  status: 'running' | 'succeeded' | 'failed' | 'stopped'; // Execution status
  inputs: string; // JSON string of the task input content
  outputs: Record<string, unknown> | null; // JSON object of the task output content
  error: string | null; // Reason for error
  total_steps: number; // Total steps in the task execution
  total_tokens: number; // Total tokens used in the task execution
  created_at: number; // Task start time (Unix timestamp)
  finished_at: number | null; // Task end time (Unix timestamp)
  elapsed_time: number | null; // Time elapsed (seconds)
}

// Workflow Logs API Type Definitions
// GET /workflows/logs
/**
 * Workflow Execution Status Enum
 * @description Describes the enum for workflow execution statuses
 */
export type DifyWorkflowLogStatus =
  | 'succeeded'
  | 'failed'
  | 'stopped'
  | 'running';

/**
 * Request Parameters for Getting Workflow Logs
 * @description Describes the parameter structure for a workflow log request
 */
export interface GetDifyWorkflowLogsParams {
  keyword?: string; // Keyword (optional)
  status?: DifyWorkflowLogStatus; // Execution status (optional)
  page?: number; // Current page number, default 1
  limit?: number; // Number of items per page, default 20
}

/**
 * Workflow Log Single Entry
 * @description Describes the structure of a single workflow log entry
 */
export interface DifyWorkflowLogEntry {
  id: string; // Workflow execution ID (UUID)
  workflow_id: string; // Associated Workflow ID (UUID)
  status: DifyWorkflowLogStatus; // Execution status
  inputs: string; // JSON string of the task input content
  outputs: Record<string, unknown> | null; // JSON object of the task output content
  error: string | null; // Reason for error
  total_steps: number; // Total steps in the task execution
  total_tokens: number; // Total tokens used in the task execution
  created_at: number; // Task start time (Unix timestamp)
  finished_at: number | null; // Task end time (Unix timestamp)
  elapsed_time: number | null; // Time elapsed (seconds)
}

/**
 * Response Body for Getting Workflow Logs
 * @description Returns the response for a workflow log request
 */
export interface GetDifyWorkflowLogsResponse {
  page: number; // Current page number
  limit: number; // Number of items per page
  total: number; // Total number of items
  has_more: boolean; // Indicates if there is more data
  data: DifyWorkflowLogEntry[]; // Data for the current page
}

// Annotation List API Type Definitions
// GET /apps/annotations
/**
 * Single Annotation Item
 * @description Describes the structure of a single annotation item
 */
export interface DifyAnnotationItem {
  id: string; // Annotation ID (UUID format)
  question: string; // Question
  answer: string; // Answer content
  hit_count: number; // Hit count
  created_at: number; // Creation timestamp
}

/**
 * Request Parameters for Getting Annotation List
 * @description Describes the parameter structure for an annotation list request
 */
export interface GetDifyAnnotationsParams {
  page?: number; // Page number for pagination, default: 1
  limit?: number; // Number of items per page, default 20, range 1-100
}

/**
 * Annotation List Response
 * @description Returns the response for an annotation list request
 */
export interface DifyAnnotationListResponse {
  data: DifyAnnotationItem[]; // List of annotations
  has_more: boolean; // Indicates if there is more data
  limit: number; // Number of items per page
  total: number; // Total number of items
  page: number; // Current page number
}

// Create Annotation API Type Definitions
// POST /apps/annotations
/**
 * Create Annotation Request Payload
 * @description Describes the structure of a create annotation request
 */
export interface CreateDifyAnnotationRequest {
  question: string; // Question
  answer: string; // Answer content
}

/**
 * Create Annotation Response (returns the created annotation item)
 * @description Describes the structure of a create annotation response
 */
export type CreateDifyAnnotationResponse = DifyAnnotationItem;

// Update Annotation API Type Definitions
// PUT /apps/annotations/{annotation_id}
/**
 * Update Annotation Request Payload
 * @description Describes the structure of an update annotation request
 */
export interface UpdateDifyAnnotationRequest {
  question: string; // Question
  answer: string; // Answer content
}

/**
 * Update Annotation Response (returns the updated annotation item)
 * @description Describes the structure of an update annotation response
 */
export type UpdateDifyAnnotationResponse = DifyAnnotationItem;

// Delete Annotation API Type Definitions
// DELETE /apps/annotations/{annotation_id}
// Successful deletion returns a 204 status code with no response body
/**
 * Delete Annotation Response (204 status code, no content)
 * @description Describes the structure of a delete annotation response
 */
export type DeleteDifyAnnotationResponse = void;

// Annotation Reply Initial Settings API Type Definitions
// POST /apps/annotation-reply/{action}
/**
 * Annotation Reply Settings Action Type
 * @description Describes the enum for annotation reply setting actions
 */
export type DifyAnnotationReplyAction = 'enable' | 'disable';

/**
 * Initial Annotation Reply Settings Request Payload
 * @description Describes the structure of an initial annotation reply settings request
 */
export interface InitialDifyAnnotationReplySettingsRequest {
  embedding_provider_name?: string | null; // (Optional) Specified embedding model provider name
  embedding_model_name?: string | null; // (Optional) Specified embedding model name
  score_threshold: number; // Similarity threshold
}

/**
 * Asynchronous Job Response
 * @description Describes the structure of an asynchronous job response
 */
export interface DifyAsyncJobResponse {
  job_id: string; // Job ID (UUID format)
  job_status: string; // Job status
}

/**
 * Asynchronous Job Status Response
 * @description Describes the structure of an asynchronous job status response
 */
export interface DifyAsyncJobStatusResponse {
  job_id: string; // Job ID (UUID format)
  job_status: string; // Job status
  error_msg?: string | null; // Error message (if the job failed)
}

/**
 * Union type for all possible SSE events
 * @description A union type that encompasses all possible Server-Sent Events from Dify.
 */
export type DifySseEvent =
  | DifySseMessageEvent
  | DifySseMessageFileEvent
  | DifySseMessageEndEvent
  | DifySseTtsMessageEvent
  | DifySseTtsMessageEndEvent
  | DifySseMessageReplaceEvent
  | DifySseWorkflowStartedEvent
  | DifySseNodeStartedEvent
  | DifySseNodeFinishedEvent
  | DifySseWorkflowFinishedEvent
  | DifySseIterationStartedEvent
  | DifySseIterationNextEvent
  | DifySseIterationCompletedEvent
  | DifySseParallelBranchStartedEvent
  | DifySseParallelBranchFinishedEvent
  | DifySseLoopStartedEvent
  | DifySseLoopNextEvent
  | DifySseLoopCompletedEvent
  | DifySseErrorEvent
  | DifySsePingEvent
  | DifySseAgentThoughtEvent
  | DifySseAgentMessageEvent;
