// --- BEGIN COMMENT ---
// lib/services/dify/types.ts
// 定义与 Dify API (特别是 /chat-messages) 交互相关的数据结构
// 基于官方文档: https://docs.dify.ai/api-reference/workflow-api/chat-message
// --- END COMMENT ---

// --- 请求体 Payload 类型 --- (用于 POST /chat-messages)

/** Dify 文件对象结构 (用于请求体) */
export interface DifyFile {
  type: 'image' | 'document' | 'audio' | 'video' | 'custom';
  transfer_method: 'remote_url' | 'local_file';
  url?: string; // transfer_method 为 remote_url 时必需
  upload_file_id?: string; // transfer_method 为 local_file 时必需
}

/** Dify 聊天消息请求体 */
export interface DifyChatRequestPayload {
  query: string; // 用户输入
  inputs?: Record<string, any>; // App 输入变量, 默认为 {}
  response_mode: 'streaming' | 'blocking'; // 响应模式
  user: string; // 用户唯一标识符
  conversation_id?: string | null; // 对话 ID (null 或空字符串表示新对话)
  files?: DifyFile[]; // 文件列表
  auto_generate_name?: boolean; // 是否自动生成标题, 默认 true
}

// --- 流式响应 (SSE) 事件类型 --- (用于 response_mode: 'streaming')

// 基础 SSE 事件结构
interface DifySseBaseEvent {
  task_id: string; // 任务 ID
  id?: string; // 事件或消息 ID (message 事件有)
  conversation_id: string; // 对话 ID
  event: string; // 事件类型
}

/** event: message (文本块) */
export interface DifySseMessageEvent extends DifySseBaseEvent {
  event: 'message';
  id: string; // 消息 ID
  answer: string; // LLM 返回的文本块内容
  created_at: number;
}

/** event: message_file (文件) */
export interface DifySseMessageFileEvent extends DifySseBaseEvent {
  event: 'message_file';
  id: string; // 文件 ID
  type: string; // 文件类型 (例如 'image')
  belongs_to: 'user' | 'assistant';
  url: string; // 文件访问地址
}

/** event: message_end (消息结束) */
export interface DifySseMessageEndEvent extends DifySseBaseEvent {
  event: 'message_end';
  id: string; // 消息 ID
  metadata: Record<string, any>; // 元数据
  usage: DifyUsage; // 模型用量信息
  retriever_resources?: DifyRetrieverResource[]; // 引用和归属
}

/** event: tts_message (TTS 音频块) */
export interface DifySseTtsMessageEvent extends DifySseBaseEvent {
  event: 'tts_message';
  id: string; // 消息 ID
  audio: string; // Base64 编码的音频块
  created_at: number;
}

/** event: tts_message_end (TTS 结束) */
export interface DifySseTtsMessageEndEvent extends DifySseBaseEvent {
  event: 'tts_message_end';
  id: string; // 消息 ID
  audio: string; // 空字符串
  created_at: number;
}

/** event: message_replace (内容替换) */
export interface DifySseMessageReplaceEvent extends DifySseBaseEvent {
  event: 'message_replace';
  id: string; // 消息 ID
  answer: string; // 替换后的完整内容
  created_at: number;
}

/** event: workflow_started (工作流开始) */
export interface DifySseWorkflowStartedEvent extends DifySseBaseEvent {
  event: 'workflow_started';
  workflow_run_id: string;
  data: { id: string; workflow_id: string; sequence_number: number; created_at: number; };
}

/** event: node_started (节点开始) */
export interface DifySseNodeStartedEvent extends DifySseBaseEvent {
  event: 'node_started';
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    node_type: string;
    title: string;
    index: number;
    predecessor_node_id?: string;
    inputs: Record<string, any>;
    created_at: number;
  };
}

/** event: node_finished (节点结束) */
export interface DifySseNodeFinishedEvent extends DifySseBaseEvent {
  event: 'node_finished';
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    index: number;
    predecessor_node_id?: string;
    inputs?: Record<string, any>;
    process_data?: any;
    outputs?: any;
    status: 'running' | 'succeeded' | 'failed' | 'stopped';
    error?: string;
    elapsed_time?: number;
    execution_metadata?: any;
    total_tokens?: number;
    total_price?: string;
    currency?: string;
    created_at: number;
  };
}

/** event: workflow_finished (工作流结束) */
export interface DifySseWorkflowFinishedEvent extends DifySseBaseEvent {
  event: 'workflow_finished';
  workflow_run_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: 'running' | 'succeeded' | 'failed' | 'stopped';
    outputs?: any;
    error?: string;
    elapsed_time?: number;
    total_tokens?: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

/** event: error (流错误) */
export interface DifySseErrorEvent extends DifySseBaseEvent {
  event: 'error';
  id?: string; // 消息 ID (可能没有)
  status: number; // HTTP 状态码 (可能是 Dify 内部的)
  code: string; // 错误码
  message: string; // 错误消息
}

/** event: ping (保持连接) */
export interface DifySsePingEvent extends DifySseBaseEvent {
  event: 'ping';
}

/** event: agent_message (模型思考过程/中间步骤) */
export interface DifySseAgentMessageEvent extends DifySseBaseEvent {
  event: 'agent_message';
  id?: string; // Agent 消息可能没有稳定 ID
  answer: string; // 思考过程的文本块
  created_at?: number; // 可能没有创建时间
}

/** Dify 模型用量信息 */
export interface DifyUsage {
  prompt_tokens?: number;
  prompt_unit_price?: string;
  prompt_price_unit?: string;
  prompt_price?: string;
  completion_tokens?: number;
  completion_unit_price?: string;
  completion_price_unit?: string;
  completion_price?: string;
  total_tokens: number;
  total_price?: string;
  currency?: string;
  latency?: number;
}

/** Dify 引用和归属信息 */
export interface DifyRetrieverResource {
  segment_id: string;
  document_id: string;
  document_name: string;
  position: number;
  content: string;
  score?: number;
  // 其他可能的字段
}

// 所有可能的 SSE 事件联合类型
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
  | DifySseErrorEvent
  | DifySsePingEvent
  | DifySseAgentMessageEvent;


// --- 服务函数返回类型 --- (供 Hook 使用)

export interface DifyStreamResponse {
  // --- BEGIN COMMENT ---
  // 经过处理的文本块流，只包含 `event: message` 中的 `answer` 字段内容。
  // 服务层负责解析 SSE 并过滤出文本。
  // --- END COMMENT ---
  answerStream: AsyncGenerator<string, void, undefined>; 
  
  // --- BEGIN COMMENT ---
  // 提供方法以在流处理过程中或结束后获取 conversation_id。
  // 该方法在流开始时返回 null，在流中捕获到 ID 后返回 ID。
  // --- END COMMENT ---
  getConversationId: () => string | null;

  // --- BEGIN COMMENT ---
  // 提供方法以在流处理过程中或结束后获取 task_id。
  // --- END COMMENT ---
  getTaskId: () => string | null;

  // --- BEGIN COMMENT ---
  // 可以添加一个 Promise，在 message_end 事件到达时 resolve，
  // 并携带最终的 usage 和 metadata 等信息，供需要完整响应的场景使用。
  // --- END COMMENT ---
  completionPromise?: Promise<{ usage?: DifyUsage; metadata?: Record<string, any>; retrieverResources?: DifyRetrieverResource[] }>;

  // --- BEGIN COMMENT ---
  // 可能还需要传递其他从流中提取的非文本事件，如文件事件等，根据需求添加。
  // fileEventsStream?: AsyncGenerator<DifySseMessageFileEvent, void, undefined>;
  // --- END COMMENT ---
}

// --- BEGIN COMMENT ---
// Dify 停止流式任务 API 类型
// POST /chat-messages/:task_id/stop
// --- END COMMENT ---

/** Dify 停止任务请求体 */
export interface DifyStopTaskRequestPayload {
  user: string; // 用户唯一标识符，必须和发送消息时一致
}

/** Dify 停止任务响应体 */
export interface DifyStopTaskResponse {
  result: 'success'; // 固定返回 success
}

// --- BEGIN ADDITION ---
// --- BEGIN COMMENT ---
// Dify 文件上传 API 响应体
// POST /files/upload
// --- END COMMENT ---
export interface DifyFileUploadResponse {
  id: string; // 文件 ID (UUID)
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string | number; // 用户 ID (可能是数字或字符串)
  created_at: number; // Unix 时间戳
}
// --- END ADDITION --- 

// --- BEGIN MESSAGES API TYPES ---

// --- BEGIN COMMENT ---
// /messages API - 通用错误响应结构
// 这个可以作为 message-service.ts 抛出错误的类型参考
// --- END COMMENT ---
export interface DifyApiError {
  status: number;      // HTTP 状态码
  code: string;        // Dify 内部错误码或 HTTP 状态码字符串
  message: string;     // 错误描述
  [key: string]: any; // 允许其他可能的错误字段，如 Dify 返回的 validation_errors 等
}

// --- BEGIN COMMENT ---
// /messages API - 消息文件对象结构
// --- END COMMENT ---
export interface DifyMessageFile {
  id: string; // 文件 ID
  type: string; // 文件类型，例如 "image" (图片)
  url: string; // 文件的预览地址
  belongs_to: 'user' | 'assistant'; // 文件归属方，"user" (用户) 或 "assistant" (助手)
}

// --- BEGIN COMMENT ---
// /messages API - 消息反馈信息结构
// --- END COMMENT ---
export interface DifyMessageFeedback {
  rating: 'like' | 'dislike' | null; // 点赞 'like' / 点踩 'dislike'，或者可能为 null
  // 根据实际 API 可能还有其他反馈相关的字段，例如 content
}

// --- BEGIN COMMENT ---
// /messages API - 单条消息对象结构 (与 SSE 中的 DifyMessage 不同，这是获取历史消息的特定结构)
// --- END COMMENT ---
export interface ConversationMessage {
  id: string; // 消息的唯一 ID
  conversation_id: string; // 该消息所属的会话 ID
  inputs: Record<string, any>; // 用户输入的参数，具体内容取决于应用设计
  query: string; // 用户发送的原始提问内容
  answer: string; // AI 助手的回答内容
  message_files: DifyMessageFile[]; // 消息中包含的文件列表
  created_at: number; // 消息创建的时间戳 (Unix timestamp)
  feedback: DifyMessageFeedback | null; // 用户对这条回答的反馈信息
  retriever_resources: DifyRetrieverResource[]; // 引用和归属分段列表
}

// --- BEGIN COMMENT ---
// /messages API - 获取历史消息的请求查询参数 (Query Parameters) 接口
// --- END COMMENT ---
export interface GetMessagesParams {
  conversation_id: string; // 会话 ID (必需)
  user: string; // 用户标识 (必需)
  first_id?: string | null; // 当前消息列表最上面 (最早) 那条消息的 ID，用于分页 (可选, 默认为 null)
  limit?: number; // 一次请求希望返回多少条聊天记录 (可选, 默认为 20)
}

// --- BEGIN COMMENT ---
// /messages API - 获取历史消息的响应体结构
// --- END COMMENT ---
export interface GetMessagesResponse {
  data: ConversationMessage[]; // 本次请求获取到的消息对象列表
  has_more: boolean; // 是否还有更早的聊天记录可以加载
  limit: number; // 本次请求实际返回的聊天记录条数
}
// --- END MESSAGES API TYPES --- 


// --- BEGIN CONVERSATIONS API TYPES ---
// --- BEGIN COMMENT ---
// /conversations API - 获取会话列表的参数
// --- END COMMENT ---
export interface GetConversationsParams {
  user: string; // 用户标识，必需
  last_id?: string | null; // 当前页最后一条记录的ID，用于分页，选填
  limit?: number; // 一次返回多少条记录，默认20，选填
  sort_by?: 'created_at' | '-created_at' | 'updated_at' | '-updated_at'; // 排序字段，默认-updated_at
}

// --- BEGIN COMMENT ---
// /conversations API - 单个会话对象结构
// --- END COMMENT ---
export interface Conversation {
  id: string; // 会话ID
  name: string; // 会话名称，默认由大语言模型生成
  inputs: Record<string, any>; // 用户输入参数
  status: string; // 会话状态
  introduction: string; // 开场白
  created_at: number; // 创建时间(时间戳)
  updated_at: number; // 更新时间(时间戳)
}

// --- BEGIN COMMENT ---
// /conversations API - 获取会话列表的响应体结构
// --- END COMMENT ---
export interface GetConversationsResponse {
  data: Conversation[]; // 会话列表
  has_more: boolean; // 是否有更多会话
  limit: number; // 返回条数
}
// --- BEGIN COMMENT ---
// /conversations API - 删除会话的请求体结构
// --- END COMMENT ---
export interface DeleteConversationRequestPayload {
  user: string; // 用户标识，由开发者定义规则，需保证用户标识在应用内唯一
}

// --- BEGIN COMMENT ---
// /conversations API - 删除会话的响应体结构
// --- END COMMENT ---
export interface DeleteConversationResponse {
  result: 'success';
}

// --- BEGIN COMMENT ---
// /conversations API - 重命名会话的请求体结构
// --- END COMMENT ---
export interface RenameConversationRequestPayload {
  name?: string; // （选填）名称，若 auto_generate 为 true 时，该参数可不传
  auto_generate?: boolean; // （选填）自动生成标题，默认 false
  user: string; // 用户标识，由开发者定义规则，需保证用户标识在应用内唯一
}

// --- BEGIN COMMENT ---
// /conversations API - 重命名会话的响应体结构，返回更新后的会话信息
// --- END COMMENT ---
export interface RenameConversationResponse extends Conversation {
  // 继承了 Conversation 接口的所有字段
}

// --- BEGIN COMMENT ---
// /conversations API - 获取对话变量的请求参数
// --- END COMMENT ---
export interface GetConversationVariablesParams {
  user: string; // 用户标识符，由开发人员定义的规则，在应用程序内必须唯一
  last_id?: string | null; // （选填）当前页最后面一条记录的 ID，默认 null
  limit?: number; // （选填）一次请求返回多少条记录，默认 20 条，最大 100 条，最小 1 条
}

// --- BEGIN COMMENT ---
// /conversations API - 对话变量对象结构
// --- END COMMENT ---
export interface ConversationVariable {
  id: string; // 变量 ID
  name: string; // 变量名称
  value_type: string; // 变量类型（字符串、数字、布尔等）
  value: string; // 变量值
  description: string; // 变量描述
  created_at: number; // 创建时间戳
  updated_at: number; // 最后更新时间戳
}

// --- BEGIN COMMENT ---
// /conversations API - 获取对话变量的响应体结构
// --- END COMMENT ---
export interface GetConversationVariablesResponse {
  limit: number; // 每页项目数
  has_more: boolean; // 是否有更多项目
  data: ConversationVariable[]; // 变量列表
}

// --- END CONVERSATIONS API TYPES ---