import { create } from 'zustand';

// --- 文件附件定义 ---
export interface MessageAttachment {
  id: string;            // 附件ID
  name: string;          // 文件名
  size: number;          // 文件大小
  type: string;          // MIME类型
  upload_file_id: string; // 上传后的文件ID
}

// --- BEGIN COMMENT ---
// 消息定义，增加了持久化相关的字段
// db_id: 数据库中的消息ID，成功保存后才会有值
// persistenceStatus: 消息持久化状态，用于UI展示
// role: 消息角色，与数据库保持一致
// dify_message_id: Dify 消息ID，用于关联外部消息
// token_count: token计数，可用于计费或统计
// metadata: 元数据，存储附加信息
// --- END COMMENT ---
export interface ChatMessage {
  id: string; // 唯一消息 ID (前端生成)
  text: string; // 消息内容
  isUser: boolean; // 是否为用户消息
  isStreaming?: boolean; // 标记助手消息是否仍在流式传输中
  wasManuallyStopped?: boolean; // 标记是否被用户手动停止
  error?: string | null; // 消息相关的错误信息
  attachments?: MessageAttachment[]; // 消息附带的文件附件
  
  // 消息持久化相关字段
  db_id?: string; // 数据库中的消息ID，保存成功后才有值
  persistenceStatus?: 'pending' | 'saving' | 'saved' | 'error'; // 持久化状态
  role?: 'user' | 'assistant' | 'system'; // 消息角色，与数据库保持一致
  dify_message_id?: string; // Dify 消息ID
  token_count?: number; // Token计数
  metadata?: Record<string, any>; // 元数据
}

// --- Store 状态接口 ---
interface ChatState {
  messages: ChatMessage[]; // 完整的消息列表
  streamingMessageId: string | null; // 当前正在流式传输的助手消息ID，null表示没有进行中的流
  isWaitingForResponse: boolean; // 是否正在等待API响应（流开始之前或非流式响应）
  // --- BEGIN COMMENT ---
  // 当前活跃对话的唯一标识符。
  // null 表示当前是一个全新的对话，尚未从后端获取到 ID。
  // --- END COMMENT ---
  currentConversationId: string | null;

  // --- BEGIN COMMENT ---
  // 当前流式任务的 Task ID。
  // 从 Dify 流式响应中获取，用于后续可能的操作（如停止任务）。
  // null 表示当前没有活动的或已知的流式任务 ID。
  // --- END COMMENT ---
  currentTaskId: string | null;

  // --- 操作 Actions ---
  /**
   * 添加一条新消息到列表
   * @param messageData 消息数据 (除ID外)
   * @returns 添加的消息对象 (包含生成的ID)
   */
  addMessage: (messageData: Omit<ChatMessage, 'id'>) => ChatMessage;

  /**
   * 向指定ID的消息追加文本块 (用于流式输出)
   * @param id 消息ID
   * @param chunk 要追加的文本块
   */
  appendMessageChunk: (id: string, chunk: string) => void;

  /**
   * 标记指定ID的消息流式传输完成
   * @param id 消息ID
   */
  finalizeStreamingMessage: (id: string) => void;

  /**
   * 标记消息为手动停止
   * @param id 消息ID
   */
  markAsManuallyStopped: (id: string) => void;

  /**
   * 设置指定ID消息的错误状态
   * @param id 消息ID
   * @param error 错误信息，null表示清除错误
   */
  setMessageError: (id: string, error: string | null) => void;

  /**
   * 清除所有消息
   */
  clearMessages: () => void;

  /**
   * 设置是否正在等待API响应的状态
   * @param status 等待状态
   */
  setIsWaitingForResponse: (status: boolean) => void;

  // --- 对话管理 ---
  /**
   * 设置/更新当前对话ID
   * @param conversationId 对话ID，null表示新对话
   */
  setCurrentConversationId: (conversationId: string | null) => void;

  /**
   * 设置/更新当前流式任务ID
   * @param taskId 任务ID，null表示无进行中任务
   */
  setCurrentTaskId: (taskId: string | null) => void;

  /**
   * 更新消息的特定属性
   * @param id 消息ID
   * @param updates 要更新的属性
   */
  updateMessage: (id: string, updates: Partial<Omit<ChatMessage, 'id' | 'isUser'>>) => void;
}

// --- Store 实现 ---
export const useChatStore = create<ChatState>((set, get) => ({
  // --- 初始状态 ---
  messages: [],
  streamingMessageId: null,
  isWaitingForResponse: false,
  currentConversationId: null, // 初始为 null
  currentTaskId: null, // --- BEGIN COMMENT --- 初始化 Task ID 为 null --- END COMMENT ---

  // --- Action 实现 ---
  addMessage: (messageData) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const newMessage = { id, ...messageData }
    
    set((state) => ({
      messages: [...state.messages, newMessage],
      streamingMessageId: messageData.isStreaming ? id : state.streamingMessageId,
    }))
    
    return newMessage
  },

  appendMessageChunk: (id, chunk) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, text: message.text + chunk } : message
      ),
    }))
  },

  finalizeStreamingMessage: (id) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, isStreaming: false } : message
      ),
      streamingMessageId: state.streamingMessageId === id ? null : state.streamingMessageId,
    }))
  },

  markAsManuallyStopped: (id) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, wasManuallyStopped: true, isStreaming: false } : message
      ),
      streamingMessageId: state.streamingMessageId === id ? null : state.streamingMessageId,
    }))
  },

  setMessageError: (id, error) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, error } : message
      ),
    }))
  },

  clearMessages: () => {
    set(() => ({
      messages: [],
      streamingMessageId: null,
    }))
  },

  setIsWaitingForResponse: (status) => {
    set(() => ({
      isWaitingForResponse: status,
    }))
  },

  setCurrentConversationId: (conversationId) => {
    set(() => ({
      currentConversationId: conversationId
    }))
  },

  setCurrentTaskId: (taskId) => {
    set(() => ({
      currentTaskId: taskId
    }))
  },

  // --- BEGIN COMMENT ---
  // 实现updateMessage函数，用于更新消息的特定属性
  // 特别是持久化相关的状态，如persistenceStatus和db_id
  // --- END COMMENT ---
  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, ...updates } : message
      )
    }))
  }
}));


// --- BEGIN COMMENT ---
// --- 导出常量 (如果项目需要) ---
// 例如: export const MAX_MESSAGES = 100;
// --- END COMMENT ---

// --- BEGIN COMMENT ---
// --- 辅助 Selector (可选，用于优化性能或封装复杂逻辑) ---
// --- END COMMENT ---
/**
 * 获取当前是否正在处理消息（等待响应或正在流式传输）
 */
export const selectIsProcessing = (state: ChatState): boolean =>
  state.isWaitingForResponse || state.streamingMessageId !== null;
