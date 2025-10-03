// Dify application parameter standard interface definitions
// Based on official API specification: GET /parameters

/** Suggested questions after answer configuration */
export interface DifySuggestedQuestionsAfterAnswer {
  enabled: boolean; // Whether enabled
}

/** Speech to text configuration */
export interface DifySpeechToText {
  enabled: boolean; // Whether enabled
}

/** Text to speech configuration */
export interface DifyTextToSpeech {
  enabled: boolean; // Whether enabled
  voice?: string; // Voice type
  language?: string; // Language
  autoPlay?: 'enabled' | 'disabled'; // Auto play: enabled or disabled
}

/** Retriever resource (reference and attribution) configuration */
export interface DifyRetrieverResourceConfig {
  enabled: boolean; // Whether enabled
}

/** Annotation reply configuration */
export interface DifyAnnotationReply {
  enabled: boolean; // Whether enabled
}

/** Text input control */
export interface DifyTextInputControl {
  label: string; // Control display label
  variable: string; // Control ID
  required: boolean; // Whether required
  default: string; // Default value
}

/** Paragraph text input control */
export interface DifyParagraphControl {
  label: string; // Control display label
  variable: string; // Control ID
  required: boolean; // Whether required
  default: string; // Default value
}

/** Select (dropdown) control */
export interface DifySelectControl {
  label: string; // Control display label
  variable: string; // Control ID
  required: boolean; // Whether required
  default: string; // Default value
  options: string[]; // List of option values
}

/** User input form item */
export interface DifyUserInputFormItem {
  'text-input'?: DifyTextInputControl;
  paragraph?: DifyParagraphControl;
  select?: DifySelectControl;
}

/** Image upload configuration */
export interface DifyImageUploadConfig {
  enabled: boolean; // Whether enabled
  number_limits: number; // Image number limit, default 3
  transfer_methods: ('remote_url' | 'local_file')[]; // List of transfer methods, at least one required
}

/** Document upload configuration */
export interface DifyDocumentUploadConfig {
  enabled: boolean; // Whether enabled
  number_limits: number; // Document number limit
  transfer_methods: ('remote_url' | 'local_file')[]; // List of transfer methods
}

/** Audio upload configuration */
export interface DifyAudioUploadConfig {
  enabled: boolean; // Whether enabled
  number_limits: number; // Audio number limit
  transfer_methods: ('remote_url' | 'local_file')[]; // List of transfer methods
}

/** Video upload configuration */
export interface DifyVideoUploadConfig {
  enabled: boolean; // Whether enabled
  number_limits: number; // Video number limit
  transfer_methods: ('remote_url' | 'local_file')[]; // List of transfer methods
}

/** Other file type upload configuration */
export interface DifyOtherUploadConfig {
  enabled: boolean; // Whether enabled
  number_limits: number; // File number limit
  transfer_methods: ('remote_url' | 'local_file')[]; // List of transfer methods
  custom_extensions?: string[]; // Custom file extension list
}

/** File upload configuration */
export interface DifyFileUploadConfig {
  enabled?: boolean; // Top-level file upload switch
  allowed_file_types?: string[]; // Allowed file type list
  allowed_file_extensions?: string[]; // Allowed file extension list
  allowed_file_upload_methods?: string[]; // Allowed upload methods
  max_file_size_mb?: number; // Max file size (MB)
  number_limits?: number; // File number limit (possible field name 1)
  max_files?: number; // File number limit (possible field name 2)
  file_count_limit?: number; // File number limit (possible field name 3)
  image?: DifyImageUploadConfig; // Image settings
  document?: DifyDocumentUploadConfig; // Document settings
  audio?: DifyAudioUploadConfig; // Audio settings
  video?: DifyVideoUploadConfig; // Video settings
  other?: DifyOtherUploadConfig; // Other file type settings
}

/** System parameters configuration */
export interface DifySystemParameters {
  file_size_limit: number; // Document upload size limit (MB)
  image_file_size_limit: number; // Image file upload size limit (MB)
  audio_file_size_limit: number; // Audio file upload size limit (MB)
  video_file_size_limit: number; // Video file upload size limit (MB)
}

/** Complete Dify application parameter configuration */
export interface DifyParametersConfig {
  opening_statement: string; // Opening statement
  suggested_questions: string[]; // List of suggested questions at opening
  suggested_questions_after_answer: DifySuggestedQuestionsAfterAnswer; // Enable suggested questions after answer
  speech_to_text: DifySpeechToText; // Speech to text
  text_to_speech: DifyTextToSpeech; // Text to speech
  retriever_resource: DifyRetrieverResourceConfig; // Reference and attribution
  annotation_reply: DifyAnnotationReply; // Annotation reply
  user_input_form: DifyUserInputFormItem[]; // User input form configuration
  file_upload: DifyFileUploadConfig; // File upload configuration
  system_parameters: DifySystemParameters; // System parameters
}

/** Simplified config (for UI components, includes all API fields) */
export interface DifyParametersSimplifiedConfig {
  opening_statement?: string; // Opening statement
  suggested_questions?: string[]; // List of suggested questions at opening
  suggested_questions_after_answer?: DifySuggestedQuestionsAfterAnswer; // Enable suggested questions after answer
  speech_to_text?: DifySpeechToText; // Speech to text
  text_to_speech?: DifyTextToSpeech; // Text to speech
  retriever_resource?: DifyRetrieverResourceConfig; // Reference and attribution
  annotation_reply?: DifyAnnotationReply; // Annotation reply
  user_input_form?: DifyUserInputFormItem[]; // User input form configuration
  file_upload?: DifyFileUploadConfig; // File upload configuration
  system_parameters?: DifySystemParameters; // System parameters
}
