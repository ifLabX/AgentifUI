// --- BEGIN COMMENT ---
// Dify 应用参数标准接口定义
// 基于官方API规范：GET /parameters
// --- END COMMENT ---

/** 回答后推荐问题配置 */
export interface DifySuggestedQuestionsAfterAnswer {
  enabled: boolean; // 是否开启
}

/** 语音转文本配置 */
export interface DifySpeechToText {
  enabled: boolean; // 是否开启
}

/** 文本转语音配置 */
export interface DifyTextToSpeech {
  enabled: boolean; // 是否开启
  voice?: string; // 语音类型
  language?: string; // 语言
  autoPlay?: 'enabled' | 'disabled'; // 自动播放：enabled 开启 | disabled 关闭
}

/** 引用和归属配置 */
export interface DifyRetrieverResourceConfig {
  enabled: boolean; // 是否开启
}

/** 标记回复配置 */
export interface DifyAnnotationReply {
  enabled: boolean; // 是否开启
}

/** 文本输入控件 */
export interface DifyTextInputControl {
  label: string; // 控件展示标签名
  variable: string; // 控件 ID
  required: boolean; // 是否必填
  default: string; // 默认值
}

/** 段落文本输入控件 */
export interface DifyParagraphControl {
  label: string; // 控件展示标签名
  variable: string; // 控件 ID
  required: boolean; // 是否必填
  default: string; // 默认值
}

/** 下拉选择控件 */
export interface DifySelectControl {
  label: string; // 控件展示标签名
  variable: string; // 控件 ID
  required: boolean; // 是否必填
  default: string; // 默认值
  options: string[]; // 选项值列表
}

/** 用户输入表单项 */
export interface DifyUserInputFormItem {
  'text-input'?: DifyTextInputControl;
  'paragraph'?: DifyParagraphControl;
  'select'?: DifySelectControl;
}

/** 图片上传配置 */
export interface DifyImageUploadConfig {
  enabled: boolean; // 是否开启
  number_limits: number; // 图片数量限制，默认 3
  transfer_methods: ('remote_url' | 'local_file')[]; // 传递方式列表，remote_url | local_file，必选一个
}

/** 文档上传配置 */
export interface DifyDocumentUploadConfig {
  enabled: boolean; // 是否开启
  number_limits: number; // 文档数量限制
  transfer_methods: ('remote_url' | 'local_file')[]; // 传递方式列表
}

/** 音频上传配置 */
export interface DifyAudioUploadConfig {
  enabled: boolean; // 是否开启
  number_limits: number; // 音频数量限制
  transfer_methods: ('remote_url' | 'local_file')[]; // 传递方式列表
}

/** 视频上传配置 */
export interface DifyVideoUploadConfig {
  enabled: boolean; // 是否开启
  number_limits: number; // 视频数量限制
  transfer_methods: ('remote_url' | 'local_file')[]; // 传递方式列表
}

/** 其他文件类型上传配置 */
export interface DifyOtherUploadConfig {
  enabled: boolean; // 是否开启
  number_limits: number; // 文件数量限制
  transfer_methods: ('remote_url' | 'local_file')[]; // 传递方式列表
  custom_extensions?: string[]; // 自定义文件扩展名列表
}

/** 文件上传配置 */
export interface DifyFileUploadConfig {
  enabled?: boolean; // 顶层的文件上传总开关
  allowed_file_types?: string[]; // 允许的文件类型列表
  allowed_file_extensions?: string[]; // 允许的文件扩展名列表
  allowed_file_upload_methods?: string[]; // 允许的上传方式
  max_file_size_mb?: number; // 最大文件大小(MB)
  number_limits?: number; // 文件数量限制（可能的字段名1）
  max_files?: number; // 文件数量限制（可能的字段名2）
  file_count_limit?: number; // 文件数量限制（可能的字段名3）
  image?: DifyImageUploadConfig; // 图片设置
  document?: DifyDocumentUploadConfig; // 文档设置
  audio?: DifyAudioUploadConfig; // 音频设置
  video?: DifyVideoUploadConfig; // 视频设置
  other?: DifyOtherUploadConfig; // 其他文件类型设置
}

/** 系统参数配置 */
export interface DifySystemParameters {
  file_size_limit: number; // 文档上传大小限制 (MB)
  image_file_size_limit: number; // 图片文件上传大小限制 (MB)
  audio_file_size_limit: number; // 音频文件上传大小限制 (MB)
  video_file_size_limit: number; // 视频文件上传大小限制 (MB)
}

/** 完整的Dify应用参数配置 */
export interface DifyParametersConfig {
  opening_statement: string; // 开场白
  suggested_questions: string[]; // 开场推荐问题列表
  suggested_questions_after_answer: DifySuggestedQuestionsAfterAnswer; // 启用回答后给出推荐问题
  speech_to_text: DifySpeechToText; // 语音转文本
  text_to_speech: DifyTextToSpeech; // 文本转语音
  retriever_resource: DifyRetrieverResourceConfig; // 引用和归属
  annotation_reply: DifyAnnotationReply; // 标记回复
  user_input_form: DifyUserInputFormItem[]; // 用户输入表单配置
  file_upload: DifyFileUploadConfig; // 文件上传配置
  system_parameters: DifySystemParameters; // 系统参数
}

/** 简化版配置（用于UI组件，包含所有API字段） */
export interface DifyParametersSimplifiedConfig {
  opening_statement?: string; // 开场白
  suggested_questions?: string[]; // 开场推荐问题列表
  suggested_questions_after_answer?: DifySuggestedQuestionsAfterAnswer; // 启用回答后给出推荐问题
  speech_to_text?: DifySpeechToText; // 语音转文本
  text_to_speech?: DifyTextToSpeech; // 文本转语音
  retriever_resource?: DifyRetrieverResourceConfig; // 引用和归属
  annotation_reply?: DifyAnnotationReply; // 标记回复
  user_input_form?: DifyUserInputFormItem[]; // 用户输入表单配置
  file_upload?: DifyFileUploadConfig; // 文件上传配置
  system_parameters?: DifySystemParameters; // 系统参数
} 