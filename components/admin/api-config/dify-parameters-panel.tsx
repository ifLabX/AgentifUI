'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import type { DifyParametersSimplifiedConfig } from '@lib/types/dify-parameters';
import {
  X,
  Settings,
  MessageSquare,
  Upload,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Image,
  Save,
  RotateCcw,
  FileText,
  Globe,
  Music,
  Video,
  File,
  ExternalLink,
  Circle,
  Check,
  Mic,
  Volume2,
  BookOpen,
  Tag,
  FormInput,
  Settings2
} from 'lucide-react';
import { FILE_TYPE_CONFIG } from "@lib/constants/file-types";

interface DifyParametersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: DifyParametersSimplifiedConfig;
  onSave: (config: DifyParametersSimplifiedConfig) => void;
  instanceName?: string;
}

const DifyParametersPanel: React.FC<DifyParametersPanelProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  instanceName = '应用实例'
}) => {
  const { isDark } = useTheme();
  const [localConfig, setLocalConfig] = useState<DifyParametersSimplifiedConfig>(config);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // --- 文件上传配置状态 ---
  const [fileUploadEnabled, setFileUploadEnabled] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'local' | 'url' | 'both'>('both');
  const [maxFiles, setMaxFiles] = useState(3);
  const [enabledFileTypes, setEnabledFileTypes] = useState<Set<string>>(new Set(['图片']));
  const [customFileTypes, setCustomFileTypes] = useState<string>(''); // 新增：自定义文件类型

  // --- 初始状态保存（用于取消操作） ---
  const [initialFileUploadState, setInitialFileUploadState] = useState({
    fileUploadEnabled: false,
    uploadMethod: 'both' as 'local' | 'url' | 'both',
    maxFiles: 3,
    enabledFileTypes: new Set<string>(['图片']),
    customFileTypes: ''
  });

  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
    setIsInitialized(false);
    
    // --- BEGIN COMMENT ---
    // 🎯 更新：初始化所有配置字段的默认值
    // --- END COMMENT ---
    const initializeConfig = () => {
      const initializedConfig: DifyParametersSimplifiedConfig = {
        opening_statement: config.opening_statement || '',
        suggested_questions: config.suggested_questions || [],
        suggested_questions_after_answer: config.suggested_questions_after_answer || { enabled: false },
        speech_to_text: config.speech_to_text || { enabled: false },
        text_to_speech: config.text_to_speech || { enabled: false },
        retriever_resource: config.retriever_resource || { enabled: false },
        annotation_reply: config.annotation_reply || { enabled: false },
        user_input_form: config.user_input_form || [],
        // --- BEGIN COMMENT ---
        // 🎯 修复：不要覆盖从 Dify 同步来的 file_upload 配置
        // 只有当 config.file_upload 为 undefined 时才设置默认值
        // --- END COMMENT ---
        file_upload: config.file_upload,
        system_parameters: config.system_parameters || {
          file_size_limit: 15,
          image_file_size_limit: 10,
          audio_file_size_limit: 50,
          video_file_size_limit: 100
        }
      };
      
      setLocalConfig(initializedConfig);
      setTimeout(() => setIsInitialized(true), 100);
    };
    
    initializeConfig();
    
    // 初始化文件上传配置状态
    const initializeFileUploadState = () => {
      const fileUploadConfig = config.file_upload;
      
      // --- BEGIN COMMENT ---
      // 🎯 文件上传配置初始化完成，移除调试日志
      // --- END COMMENT ---
      
      // --- BEGIN COMMENT ---
      // 🎯 修复：根据实际的 Dify API 返回格式检测文件上传是否启用
      // 实际格式：{enabled: true, image: {...}, allowed_file_types: [...]}
      // 而不是我们之前假设的：{image: {enabled: true, ...}}
      // --- END COMMENT ---
      const hasFileUpload = !!(
        fileUploadConfig?.enabled || // 检查顶层的 enabled 字段
        fileUploadConfig?.image?.enabled || // 兼容标准格式
        fileUploadConfig?.document?.enabled || 
        fileUploadConfig?.audio?.enabled || 
        fileUploadConfig?.video?.enabled ||
        fileUploadConfig?.other?.enabled
      );
      
      console.log('[文件上传初始化] 检测到文件上传启用状态:', hasFileUpload);
      
      let uploadMethodValue: 'local' | 'url' | 'both' = 'both';
      let maxFilesValue = 3;
      const enabledTypesSet = new Set<string>();
      let customFileTypesValue = '';
      
      if (hasFileUpload && fileUploadConfig) {
        // --- BEGIN COMMENT ---
        // 🎯 修复：根据实际的 Dify API 返回格式获取配置参数
        // 优先从顶层字段获取，然后从具体文件类型配置获取
        // --- END COMMENT ---
        
        // 从顶层配置或第一个启用的文件类型获取通用配置
        let configSource = null;
        if (fileUploadConfig.allowed_file_upload_methods) {
          // 使用顶层配置
          const methods = fileUploadConfig.allowed_file_upload_methods || [];
          if (methods.includes('local_file') && methods.includes('remote_url')) {
            uploadMethodValue = 'both';
          } else if (methods.includes('local_file')) {
            uploadMethodValue = 'local';
          } else if (methods.includes('remote_url')) {
            uploadMethodValue = 'url';
          }
          
          // 获取文件数量限制
          maxFilesValue = fileUploadConfig.number_limits || 
                         fileUploadConfig.max_files || 
                         fileUploadConfig.file_count_limit || 
                         3; // 默认值
        } else {
          // 回退到具体文件类型配置
          configSource = fileUploadConfig.image || fileUploadConfig.document || 
                        fileUploadConfig.audio || fileUploadConfig.video || 
                        fileUploadConfig.other;
          
          if (configSource) {
            maxFilesValue = configSource.number_limits || 3;
            const methods = configSource.transfer_methods || [];
            if (methods.includes('local_file') && methods.includes('remote_url')) {
              uploadMethodValue = 'both';
            } else if (methods.includes('local_file')) {
              uploadMethodValue = 'local';
            } else if (methods.includes('remote_url')) {
              uploadMethodValue = 'url';
            }
          }
        }
        
        // --- BEGIN COMMENT ---
        // 🎯 修复：根据实际的 API 返回格式设置启用的文件类型
        // 从 allowed_file_types 字段或具体的文件类型配置中获取
        // 注意：Dify 中"其他文件类型"与前四个类型是互斥的
        // --- END COMMENT ---
        if (fileUploadConfig.allowed_file_types) {
          // 从顶层的 allowed_file_types 字段获取
          const allowedTypes = fileUploadConfig.allowed_file_types;
          
          // 检查是否包含标准类型
          const hasStandardTypes = allowedTypes.some(type => 
            ['image', 'document', 'audio', 'video'].includes(type)
          );
          
          if (hasStandardTypes) {
            // 如果有标准类型，只添加标准类型
            if (allowedTypes.includes('image')) enabledTypesSet.add('图片');
            if (allowedTypes.includes('document')) enabledTypesSet.add('文档');
            if (allowedTypes.includes('audio')) enabledTypesSet.add('音频');
            if (allowedTypes.includes('video')) enabledTypesSet.add('视频');
          } else if (allowedTypes.includes('custom')) {
            // 如果包含 custom，说明选择了"其他文件类型"
            enabledTypesSet.add('其他文件类型');
            // 从 allowed_file_extensions 获取自定义扩展名
            if (fileUploadConfig.allowed_file_extensions) {
              customFileTypesValue = fileUploadConfig.allowed_file_extensions.join(', ');
            }
          } else {
            // 如果没有标准类型也没有custom，可能是其他未知类型
            console.warn('[文件上传初始化] 未知的文件类型:', allowedTypes);
            enabledTypesSet.add('其他文件类型');
          }
        } else {
          // 回退到检查具体的文件类型配置
          if (fileUploadConfig.image?.enabled) enabledTypesSet.add('图片');
          if (fileUploadConfig.document?.enabled) enabledTypesSet.add('文档');
          if (fileUploadConfig.audio?.enabled) enabledTypesSet.add('音频');
          if (fileUploadConfig.video?.enabled) enabledTypesSet.add('视频');
          if (fileUploadConfig.other?.enabled) {
            enabledTypesSet.add('其他文件类型');
            customFileTypesValue = (fileUploadConfig.other as any).custom_extensions?.join(', ') || '';
          }
        }
      }
      
      // 如果没有启用任何类型，应该保持空集合，让用户自己选择
      // 不再默认启用任何文件类型
      
      const newState = {
        fileUploadEnabled: hasFileUpload,
        uploadMethod: uploadMethodValue,
        maxFiles: maxFilesValue,
        enabledFileTypes: enabledTypesSet,
        customFileTypes: customFileTypesValue
      };
      
      // 设置当前状态
      setFileUploadEnabled(newState.fileUploadEnabled);
      setUploadMethod(newState.uploadMethod);
      setMaxFiles(newState.maxFiles);
      setEnabledFileTypes(newState.enabledFileTypes);
      setCustomFileTypes(newState.customFileTypes);
      
      // 保存初始状态
      setInitialFileUploadState(newState);
    };
    
    initializeFileUploadState();
  }, [config]);

  useEffect(() => {
    if (isInitialized) {
      const configChanged = JSON.stringify(localConfig) !== JSON.stringify(config);
      setHasChanges(configChanged);
    }
  }, [localConfig, config, isInitialized]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateConfig = (path: string, value: any) => {
    setLocalConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current: any = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const addSuggestedQuestion = () => {
    const questions = localConfig.suggested_questions || [];
    updateConfig('suggested_questions', [...questions, '']);
  };

  const updateSuggestedQuestion = (index: number, value: string) => {
    const questions = localConfig.suggested_questions || [];
    const newQuestions = [...questions];
    newQuestions[index] = value;
    updateConfig('suggested_questions', newQuestions);
  };

  const removeSuggestedQuestion = (index: number) => {
    const questions = localConfig.suggested_questions || [];
    const newQuestions = questions.filter((_, i) => i !== index);
    updateConfig('suggested_questions', newQuestions);
  };

  const handleSave = () => {
    onSave(localConfig);
    setHasChanges(false);
    
    // 更新初始状态
    setInitialFileUploadState({
      fileUploadEnabled,
      uploadMethod,
      maxFiles,
      enabledFileTypes: new Set(enabledFileTypes),
      customFileTypes
    });
  };

  const handleReset = () => {
    setLocalConfig(config);
    setHasChanges(false);
    
    // 恢复文件上传状态到初始状态
    setFileUploadEnabled(initialFileUploadState.fileUploadEnabled);
    setUploadMethod(initialFileUploadState.uploadMethod);
    setMaxFiles(initialFileUploadState.maxFiles);
    setEnabledFileTypes(new Set(initialFileUploadState.enabledFileTypes));
    setCustomFileTypes(initialFileUploadState.customFileTypes);
  };

  const toggleFileType = (fileType: string) => {
    const newEnabledTypes = new Set(enabledFileTypes);
    if (newEnabledTypes.has(fileType)) {
      newEnabledTypes.delete(fileType);
    } else {
      newEnabledTypes.add(fileType);
    }
    setEnabledFileTypes(newEnabledTypes);
  };

  const handleFileUploadToggle = (enabled: boolean) => {
    setFileUploadEnabled(enabled);
    if (!enabled) {
      // 关闭时清空本地配置，但保持表单状态供用户重新配置
      updateConfig('file_upload', undefined);
    } else {
      // 开启时根据当前表单状态生成配置
      generateFileUploadConfig();
    }
  };

  const generateFileUploadConfig = () => {
    // --- BEGIN COMMENT ---
    // 🎯 修复：根据用户选择的文件类型生成对应的配置
    // --- END COMMENT ---
    const fileUploadConfig: any = {};
    
    const transferMethods = uploadMethod === 'local' ? ['local_file'] : 
                           uploadMethod === 'url' ? ['remote_url'] : 
                           ['local_file', 'remote_url'];
    
    if (enabledFileTypes.has('图片')) {
      fileUploadConfig.image = {
        enabled: true,
        number_limits: maxFiles,
        transfer_methods: transferMethods
      };
    }
    
    if (enabledFileTypes.has('文档')) {
      fileUploadConfig.document = {
        enabled: true,
        number_limits: maxFiles,
        transfer_methods: transferMethods
      };
    }
    
    if (enabledFileTypes.has('音频')) {
      fileUploadConfig.audio = {
        enabled: true,
        number_limits: maxFiles,
        transfer_methods: transferMethods
      };
    }
    
    if (enabledFileTypes.has('视频')) {
      fileUploadConfig.video = {
        enabled: true,
        number_limits: maxFiles,
        transfer_methods: transferMethods
      };
    }
    
    if (enabledFileTypes.has('其他文件类型') && customFileTypes.trim()) {
      fileUploadConfig.other = {
        enabled: true,
        number_limits: maxFiles,
        transfer_methods: transferMethods,
        custom_extensions: customFileTypes.split(/[,\s]+/).filter(ext => ext.trim())
      };
    }
    
    updateConfig('file_upload', Object.keys(fileUploadConfig).length > 0 ? fileUploadConfig : undefined);
  };

  const openFileUploadModal = () => {
    if (fileUploadEnabled) {
      setShowFileUploadModal(true);
    }
  };

  const handleFileUploadSave = () => {
    generateFileUploadConfig();
    setShowFileUploadModal(false);
  };

  const handleFileUploadCancel = () => {
    // 取消时恢复到打开模态框前的状态
    // 不改变fileUploadEnabled状态，因为这是在外层控制的
    setShowFileUploadModal(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* --- 背景遮罩 --- */}
      <div 
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300 cursor-pointer",
          "bg-black/20 backdrop-blur-sm",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* --- 侧边栏 --- */}
      <div className={cn(
        "fixed right-0 top-0 bottom-0 w-[520px] z-50",
        "transform transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* --- 弹窗容器，留上下空间 --- */}
        <div className="h-full p-4 flex flex-col">
          <div className={cn(
            "flex-1 flex flex-col mt-4 mb-4 max-h-[calc(100vh-8rem)]",
            "rounded-2xl border shadow-2xl",
            isDark 
              ? "bg-stone-900 border-stone-700" 
              : "bg-white border-stone-200"
          )}>
            
            {/* --- 头部 --- */}
            <div className={cn(
              "flex items-center justify-between p-6 border-b flex-shrink-0",
              isDark ? "border-stone-700" : "border-stone-200"
            )}>
              {/* 标题 */}
              <h2 className={cn(
                "text-xl font-bold font-serif",
                isDark ? "text-stone-100" : "text-stone-900"
              )}>
                {instanceName} - Dify 参数配置
              </h2>
              
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className={cn(
                  "p-2 rounded-lg transition-colors cursor-pointer",
                  isDark 
                    ? "hover:bg-stone-700 text-stone-400 hover:text-stone-300" 
                    : "hover:bg-stone-100 text-stone-600 hover:text-stone-700"
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* --- 内容区域 --- */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-6 space-y-6 pb-8">
                
                {/* --- 开场白配置 --- */}
                <div className="space-y-4">
                  <button
                    onClick={() => toggleSection('basic')}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl transition-colors cursor-pointer",
                      isDark 
                        ? "bg-stone-800 hover:bg-stone-700" 
                        : "bg-stone-50 hover:bg-stone-100"
                    )}
                  >
                    <MessageSquare className={cn(
                      "h-4 w-4",
                      isDark ? "text-stone-400" : "text-stone-600"
                    )} />
                    <span className={cn(
                      "flex-1 text-left font-medium font-serif",
                      isDark ? "text-stone-200" : "text-stone-800"
                    )}>
                      开场白配置
                    </span>
                    {expandedSections.has('basic') ? (
                      <ChevronDown className={cn(
                        "h-4 w-4",
                        isDark ? "text-stone-400" : "text-stone-500"
                      )} />
                    ) : (
                      <ChevronRight className={cn(
                        "h-4 w-4",
                        isDark ? "text-stone-400" : "text-stone-500"
                      )} />
                    )}
                  </button>

                  {expandedSections.has('basic') && (
                    <div className={cn(
                      "p-4 rounded-xl border space-y-4",
                      isDark ? "bg-stone-800/50 border-stone-700" : "bg-stone-50/50 border-stone-200"
                    )}>
                      {/* 开场白内容 */}
                      <div>
                        <label className={cn(
                          "block text-sm font-medium mb-2 font-serif",
                          isDark ? "text-stone-300" : "text-stone-700"
                        )}>
                          开场白内容
                        </label>
                        <textarea
                          value={localConfig.opening_statement || ''}
                          onChange={(e) => updateConfig('opening_statement', e.target.value)}
                          className={cn(
                            "w-full px-3 py-2 rounded-lg border font-serif resize-none",
                            isDark 
                              ? "bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400" 
                              : "bg-white border-stone-300 text-stone-900 placeholder-stone-500"
                          )}
                          placeholder="输入开场白内容..."
                          rows={3}
                        />
                      </div>

                      {/* 开场推荐问题 */}
                      <div>
                        <label className={cn(
                          "block text-sm font-medium mb-2 font-serif",
                          isDark ? "text-stone-300" : "text-stone-700"
                        )}>
                          开场推荐问题
                        </label>
                        <div className="space-y-3">
                          {(localConfig.suggested_questions || []).map((question, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={question}
                                onChange={(e) => updateSuggestedQuestion(index, e.target.value)}
                                className={cn(
                                  "flex-1 px-3 py-2 rounded-lg border font-serif",
                                  isDark 
                                    ? "bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400" 
                                    : "bg-white border-stone-300 text-stone-900 placeholder-stone-500"
                                )}
                                placeholder={`推荐问题 ${index + 1}`}
                              />
                              <button
                                onClick={() => removeSuggestedQuestion(index)}
                                className={cn(
                                  "p-2 rounded-lg transition-colors cursor-pointer",
                                  isDark 
                                    ? "hover:bg-stone-700 text-stone-400 hover:text-stone-200" 
                                    : "hover:bg-stone-200 text-stone-600 hover:text-stone-900"
                                )}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          
                          <button
                            onClick={addSuggestedQuestion}
                            className={cn(
                              "w-full py-2 px-3 rounded-lg border border-dashed transition-colors cursor-pointer",
                              "flex items-center justify-center gap-2 text-sm font-serif",
                              isDark 
                                ? "border-stone-600 hover:border-stone-500 text-stone-400 hover:text-stone-300" 
                                : "border-stone-300 hover:border-stone-400 text-stone-600 hover:text-stone-700"
                            )}
                          >
                            <Plus className="h-4 w-4" />
                            添加推荐问题
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- 回答后推荐问题配置 --- */}
                <div className="space-y-4">
                  <div className={cn(
                    "flex items-center justify-between p-4 rounded-xl",
                    isDark 
                      ? "bg-stone-800" 
                      : "bg-stone-50"
                  )}>
                    <div className="flex items-center gap-3">
                      <Sparkles className={cn(
                        "h-4 w-4",
                        isDark ? "text-stone-400" : "text-stone-600"
                      )} />
                      <span className={cn(
                        "font-medium font-serif",
                        isDark ? "text-stone-200" : "text-stone-800"
                      )}>
                        回答后推荐问题
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localConfig.suggested_questions_after_answer?.enabled || false}
                        onChange={(e) => updateConfig('suggested_questions_after_answer.enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className={cn(
                        "w-11 h-6 rounded-full peer transition-colors relative",
                        "peer-focus:ring-2",
                        localConfig.suggested_questions_after_answer?.enabled
                          ? isDark 
                            ? "bg-stone-600 peer-focus:ring-stone-500" 
                            : "bg-stone-700 peer-focus:ring-stone-300"
                          : isDark 
                            ? "bg-stone-600 peer-focus:ring-stone-500" 
                            : "bg-stone-300 peer-focus:ring-stone-300"
                      )}>
                        <div className={cn(
                          "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform",
                          localConfig.suggested_questions_after_answer?.enabled ? "translate-x-5" : "translate-x-0"
                        )} />
                      </div>
                    </label>
                  </div>
                </div>

                {/* --- 文件上传配置 --- */}
                <div className="space-y-4">
                  <div className={cn(
                    "flex items-center justify-between p-4 rounded-xl",
                    isDark 
                      ? "bg-stone-800" 
                      : "bg-stone-50"
                  )}>
                    <div className="flex items-center gap-3">
                      <Upload className={cn(
                        "h-4 w-4",
                        isDark ? "text-stone-400" : "text-stone-600"
                      )} />
                      <span className={cn(
                        "font-medium font-serif",
                        isDark ? "text-stone-200" : "text-stone-800"
                      )}>
                        文件上传功能
                      </span>
                    </div>
                    <div className="flex items-center gap-3 h-6"> {/* 固定高度防止变化 */}
                      {fileUploadEnabled && (
                        <button
                          onClick={openFileUploadModal}
                          className={cn(
                            "p-2 rounded-lg transition-colors cursor-pointer",
                            isDark 
                              ? "hover:bg-stone-700 text-stone-400 hover:text-stone-200" 
                              : "hover:bg-stone-200 text-stone-600 hover:text-stone-900"
                          )}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fileUploadEnabled}
                          onChange={(e) => handleFileUploadToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className={cn(
                          "w-11 h-6 rounded-full peer transition-colors relative",
                          "peer-focus:ring-2",
                          fileUploadEnabled 
                            ? isDark 
                              ? "bg-stone-600 peer-focus:ring-stone-500" 
                              : "bg-stone-700 peer-focus:ring-stone-300"
                            : isDark 
                              ? "bg-stone-600 peer-focus:ring-stone-500" 
                              : "bg-stone-300 peer-focus:ring-stone-300"
                        )}>
                          <div className={cn(
                            "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform",
                            fileUploadEnabled ? "translate-x-5" : "translate-x-0"
                          )} />
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* --- 语音转文本配置 --- */}
                <div className="space-y-4">
                  <div className={cn(
                    "flex items-center justify-between p-4 rounded-xl",
                    isDark 
                      ? "bg-stone-800" 
                      : "bg-stone-50"
                  )}>
                    <div className="flex items-center gap-3">
                      <Mic className={cn(
                        "h-4 w-4",
                        isDark ? "text-stone-400" : "text-stone-600"
                      )} />
                      <span className={cn(
                        "font-medium font-serif",
                        isDark ? "text-stone-200" : "text-stone-800"
                      )}>
                        语音转文本
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localConfig.speech_to_text?.enabled || false}
                        onChange={(e) => updateConfig('speech_to_text.enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className={cn(
                        "w-11 h-6 rounded-full peer transition-colors relative",
                        "peer-focus:ring-2",
                        localConfig.speech_to_text?.enabled
                          ? isDark 
                            ? "bg-stone-600 peer-focus:ring-stone-500" 
                            : "bg-stone-700 peer-focus:ring-stone-300"
                          : isDark 
                            ? "bg-stone-600 peer-focus:ring-stone-500" 
                            : "bg-stone-300 peer-focus:ring-stone-300"
                      )}>
                        <div className={cn(
                          "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform",
                          localConfig.speech_to_text?.enabled ? "translate-x-5" : "translate-x-0"
                        )} />
                      </div>
                    </label>
                  </div>
                </div>

                {/* --- 文本转语音配置 --- */}
                <div className="space-y-4">
                  <button
                    onClick={() => toggleSection('tts')}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl transition-colors cursor-pointer",
                      isDark 
                        ? "bg-stone-800 hover:bg-stone-700" 
                        : "bg-stone-50 hover:bg-stone-100"
                    )}
                  >
                    <Volume2 className={cn(
                      "h-4 w-4",
                      isDark ? "text-stone-400" : "text-stone-600"
                    )} />
                    <span className={cn(
                      "flex-1 text-left font-medium font-serif",
                      isDark ? "text-stone-200" : "text-stone-800"
                    )}>
                      文本转语音
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-serif",
                        localConfig.text_to_speech?.enabled 
                          ? isDark ? "text-green-400" : "text-green-600"
                          : isDark ? "text-stone-500" : "text-stone-400"
                      )}>
                        {localConfig.text_to_speech?.enabled ? '已启用' : '已禁用'}
                      </span>
                      {expandedSections.has('tts') ? (
                        <ChevronDown className="h-4 w-4 text-stone-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {expandedSections.has('tts') && (
                    <div className={cn(
                      "p-4 rounded-xl border space-y-4",
                      isDark ? "bg-stone-800/50 border-stone-700" : "bg-stone-50/50 border-stone-200"
                    )}>
                      {/* 启用开关 */}
                      <div className="flex items-center justify-between">
                        <label className={cn(
                          "text-sm font-medium font-serif",
                          isDark ? "text-stone-300" : "text-stone-700"
                        )}>
                          启用文本转语音
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localConfig.text_to_speech?.enabled || false}
                            onChange={(e) => updateConfig('text_to_speech.enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className={cn(
                            "w-11 h-6 rounded-full peer transition-colors relative",
                            "peer-focus:ring-2",
                            localConfig.text_to_speech?.enabled
                              ? isDark 
                                ? "bg-stone-600 peer-focus:ring-stone-500" 
                                : "bg-stone-700 peer-focus:ring-stone-300"
                              : isDark 
                                ? "bg-stone-600 peer-focus:ring-stone-500" 
                                : "bg-stone-300 peer-focus:ring-stone-300"
                          )}>
                            <div className={cn(
                              "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform",
                              localConfig.text_to_speech?.enabled ? "translate-x-5" : "translate-x-0"
                            )} />
                          </div>
                        </label>
                      </div>

                      {/* 语音类型 */}
                      {localConfig.text_to_speech?.enabled && (
                        <>
                          <div>
                            <label className={cn(
                              "block text-sm font-medium mb-2 font-serif",
                              isDark ? "text-stone-300" : "text-stone-700"
                            )}>
                              语音类型
                            </label>
                            <input
                              type="text"
                              value={localConfig.text_to_speech?.voice || ''}
                              onChange={(e) => updateConfig('text_to_speech.voice', e.target.value)}
                              className={cn(
                                "w-full px-3 py-2 rounded-lg border font-serif",
                                isDark 
                                  ? "bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400" 
                                  : "bg-white border-stone-300 text-stone-900 placeholder-stone-500"
                              )}
                              placeholder="例如: alloy, echo, fable"
                            />
                          </div>

                          {/* 语言 */}
                          <div>
                            <label className={cn(
                              "block text-sm font-medium mb-2 font-serif",
                              isDark ? "text-stone-300" : "text-stone-700"
                            )}>
                              语言
                            </label>
                            <select
                              value={localConfig.text_to_speech?.language || ''}
                              onChange={(e) => updateConfig('text_to_speech.language', e.target.value)}
                              className={cn(
                                "w-full px-3 py-2 rounded-lg border font-serif",
                                isDark 
                                  ? "bg-stone-700 border-stone-600 text-stone-100" 
                                  : "bg-white border-stone-300 text-stone-900"
                              )}
                            >
                              <option value="">选择语言</option>
                              <option value="zh">中文</option>
                              <option value="en">英文</option>
                              <option value="ja">日文</option>
                              <option value="ko">韩文</option>
                            </select>
                          </div>

                          {/* 自动播放 */}
                          <div>
                            <label className={cn(
                              "block text-sm font-medium mb-2 font-serif",
                              isDark ? "text-stone-300" : "text-stone-700"
                            )}>
                              自动播放
                            </label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => updateConfig('text_to_speech.autoPlay', 'enabled')}
                                className={cn(
                                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium font-serif transition-colors cursor-pointer",
                                  localConfig.text_to_speech?.autoPlay === 'enabled'
                                    ? isDark
                                      ? "bg-stone-600 text-white"
                                      : "bg-stone-700 text-white"
                                    : isDark
                                      ? "bg-stone-700 text-stone-300 hover:bg-stone-600"
                                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                                )}
                              >
                                开启
                              </button>
                              <button
                                type="button"
                                onClick={() => updateConfig('text_to_speech.autoPlay', 'disabled')}
                                className={cn(
                                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium font-serif transition-colors cursor-pointer",
                                  localConfig.text_to_speech?.autoPlay === 'disabled'
                                    ? isDark
                                      ? "bg-stone-600 text-white"
                                      : "bg-stone-700 text-white"
                                    : isDark
                                      ? "bg-stone-700 text-stone-300 hover:bg-stone-600"
                                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                                )}
                              >
                                关闭
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* --- 引用和归属配置 --- */}
                <div className="space-y-4">
                  <div className={cn(
                    "flex items-center justify-between p-4 rounded-xl",
                    isDark 
                      ? "bg-stone-800" 
                      : "bg-stone-50"
                  )}>
                    <div className="flex items-center gap-3">
                      <BookOpen className={cn(
                        "h-4 w-4",
                        isDark ? "text-stone-400" : "text-stone-600"
                      )} />
                      <span className={cn(
                        "font-medium font-serif",
                        isDark ? "text-stone-200" : "text-stone-800"
                      )}>
                        引用和归属
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localConfig.retriever_resource?.enabled || false}
                        onChange={(e) => updateConfig('retriever_resource.enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className={cn(
                        "w-11 h-6 rounded-full peer transition-colors relative",
                        "peer-focus:ring-2",
                        localConfig.retriever_resource?.enabled
                          ? isDark 
                            ? "bg-stone-600 peer-focus:ring-stone-500" 
                            : "bg-stone-700 peer-focus:ring-stone-300"
                          : isDark 
                            ? "bg-stone-600 peer-focus:ring-stone-500" 
                            : "bg-stone-300 peer-focus:ring-stone-300"
                      )}>
                        <div className={cn(
                          "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform",
                          localConfig.retriever_resource?.enabled ? "translate-x-5" : "translate-x-0"
                        )} />
                      </div>
                    </label>
                  </div>
                </div>

                {/* --- 标记回复配置 --- */}
                <div className="space-y-4">
                  <div className={cn(
                    "flex items-center justify-between p-4 rounded-xl",
                    isDark 
                      ? "bg-stone-800" 
                      : "bg-stone-50"
                  )}>
                    <div className="flex items-center gap-3">
                      <Tag className={cn(
                        "h-4 w-4",
                        isDark ? "text-stone-400" : "text-stone-600"
                      )} />
                      <span className={cn(
                        "font-medium font-serif",
                        isDark ? "text-stone-200" : "text-stone-800"
                      )}>
                        标记回复
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localConfig.annotation_reply?.enabled || false}
                        onChange={(e) => updateConfig('annotation_reply.enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className={cn(
                        "w-11 h-6 rounded-full peer transition-colors relative",
                        "peer-focus:ring-2",
                        localConfig.annotation_reply?.enabled
                          ? isDark 
                            ? "bg-stone-600 peer-focus:ring-stone-500" 
                            : "bg-stone-700 peer-focus:ring-stone-300"
                          : isDark 
                            ? "bg-stone-600 peer-focus:ring-stone-500" 
                            : "bg-stone-300 peer-focus:ring-stone-300"
                      )}>
                        <div className={cn(
                          "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform",
                          localConfig.annotation_reply?.enabled ? "translate-x-5" : "translate-x-0"
                        )} />
                      </div>
                    </label>
                  </div>
                </div>

                {/* --- 用户输入表单配置 --- */}
                <div className="space-y-4">
                  <button
                    onClick={() => toggleSection('user_input')}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl transition-colors cursor-pointer",
                      isDark 
                        ? "bg-stone-800 hover:bg-stone-700" 
                        : "bg-stone-50 hover:bg-stone-100"
                    )}
                  >
                    <FormInput className={cn(
                      "h-4 w-4",
                      isDark ? "text-stone-400" : "text-stone-600"
                    )} />
                    <span className={cn(
                      "flex-1 text-left font-medium font-serif",
                      isDark ? "text-stone-200" : "text-stone-800"
                    )}>
                      用户输入表单
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-serif",
                        isDark ? "text-stone-400" : "text-stone-600"
                      )}>
                        {(localConfig.user_input_form?.length || 0)} 个字段
                      </span>
                      {expandedSections.has('user_input') ? (
                        <ChevronDown className="h-4 w-4 text-stone-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {expandedSections.has('user_input') && (
                    <div className={cn(
                      "p-4 rounded-xl border space-y-4",
                      isDark ? "bg-stone-800/50 border-stone-700" : "bg-stone-50/50 border-stone-200"
                    )}>
                      <div className={cn(
                        "text-sm font-serif",
                        isDark ? "text-stone-400" : "text-stone-600"
                      )}>
                        用户输入表单配置通常由 Dify 应用自动生成，建议通过同步功能获取最新配置。
                      </div>
                      
                      {(localConfig.user_input_form || []).length > 0 ? (
                        <div className="space-y-3">
                          {(localConfig.user_input_form || []).map((formItem, index) => {
                            const fieldType = Object.keys(formItem)[0];
                            const fieldConfig = formItem[fieldType as keyof typeof formItem];
                            
                            return (
                              <div key={index} className={cn(
                                "p-3 rounded-lg border",
                                isDark ? "bg-stone-700/50 border-stone-600" : "bg-stone-100/50 border-stone-300"
                              )}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className={cn(
                                    "text-sm font-medium font-serif",
                                    isDark ? "text-stone-200" : "text-stone-800"
                                  )}>
                                    {fieldConfig?.label || `字段 ${index + 1}`}
                                  </span>
                                  <span className={cn(
                                    "text-xs px-2 py-1 rounded font-serif",
                                    isDark ? "bg-stone-600 text-stone-300" : "bg-stone-200 text-stone-700"
                                  )}>
                                    {fieldType}
                                  </span>
                                </div>
                                <div className={cn(
                                  "text-xs font-serif",
                                  isDark ? "text-stone-400" : "text-stone-600"
                                )}>
                                  变量名: {fieldConfig?.variable || 'N/A'} | 
                                  必填: {fieldConfig?.required ? '是' : '否'} | 
                                  默认值: {fieldConfig?.default || '无'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={cn(
                          "text-center py-8 text-sm font-serif",
                          isDark ? "text-stone-500" : "text-stone-400"
                        )}>
                          暂无用户输入表单配置
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* --- 系统参数配置 --- */}
                <div className="space-y-4">
                  <button
                    onClick={() => toggleSection('system')}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl transition-colors cursor-pointer",
                      isDark 
                        ? "bg-stone-800 hover:bg-stone-700" 
                        : "bg-stone-50 hover:bg-stone-100"
                    )}
                  >
                    <Settings2 className={cn(
                      "h-4 w-4",
                      isDark ? "text-stone-400" : "text-stone-600"
                    )} />
                    <span className={cn(
                      "flex-1 text-left font-medium font-serif",
                      isDark ? "text-stone-200" : "text-stone-800"
                    )}>
                      系统参数
                    </span>
                    {expandedSections.has('system') ? (
                      <ChevronDown className="h-4 w-4 text-stone-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-stone-400" />
                    )}
                  </button>

                  {expandedSections.has('system') && (
                    <div className={cn(
                      "p-4 rounded-xl border space-y-4",
                      isDark ? "bg-stone-800/50 border-stone-700" : "bg-stone-50/50 border-stone-200"
                    )}>
                      <div className="grid grid-cols-2 gap-4">
                        {/* 文档上传大小限制 */}
                        <div>
                          <label className={cn(
                            "block text-sm font-medium mb-2 font-serif",
                            isDark ? "text-stone-300" : "text-stone-700"
                          )}>
                            文档大小限制 (MB)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={localConfig.system_parameters?.file_size_limit || 15}
                            onChange={(e) => updateConfig('system_parameters.file_size_limit', parseInt(e.target.value))}
                            className={cn(
                              "w-full px-3 py-2 rounded-lg border font-serif",
                              isDark 
                                ? "bg-stone-700 border-stone-600 text-stone-100" 
                                : "bg-white border-stone-300 text-stone-900"
                            )}
                          />
                        </div>

                        {/* 图片上传大小限制 */}
                        <div>
                          <label className={cn(
                            "block text-sm font-medium mb-2 font-serif",
                            isDark ? "text-stone-300" : "text-stone-700"
                          )}>
                            图片大小限制 (MB)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={localConfig.system_parameters?.image_file_size_limit || 10}
                            onChange={(e) => updateConfig('system_parameters.image_file_size_limit', parseInt(e.target.value))}
                            className={cn(
                              "w-full px-3 py-2 rounded-lg border font-serif",
                              isDark 
                                ? "bg-stone-700 border-stone-600 text-stone-100" 
                                : "bg-white border-stone-300 text-stone-900"
                            )}
                          />
                        </div>

                        {/* 音频上传大小限制 */}
                        <div>
                          <label className={cn(
                            "block text-sm font-medium mb-2 font-serif",
                            isDark ? "text-stone-300" : "text-stone-700"
                          )}>
                            音频大小限制 (MB)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={localConfig.system_parameters?.audio_file_size_limit || 50}
                            onChange={(e) => updateConfig('system_parameters.audio_file_size_limit', parseInt(e.target.value))}
                            className={cn(
                              "w-full px-3 py-2 rounded-lg border font-serif",
                              isDark 
                                ? "bg-stone-700 border-stone-600 text-stone-100" 
                                : "bg-white border-stone-300 text-stone-900"
                            )}
                          />
                        </div>

                        {/* 视频上传大小限制 */}
                        <div>
                          <label className={cn(
                            "block text-sm font-medium mb-2 font-serif",
                            isDark ? "text-stone-300" : "text-stone-700"
                          )}>
                            视频大小限制 (MB)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={localConfig.system_parameters?.video_file_size_limit || 100}
                            onChange={(e) => updateConfig('system_parameters.video_file_size_limit', parseInt(e.target.value))}
                            className={cn(
                              "w-full px-3 py-2 rounded-lg border font-serif",
                              isDark 
                                ? "bg-stone-700 border-stone-600 text-stone-100" 
                                : "bg-white border-stone-300 text-stone-900"
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --- 底部操作栏 --- */}
            <div className={cn(
              "p-6 border-t flex-shrink-0",
              isDark ? "border-stone-700" : "border-stone-200"
            )}>
              {hasChanges && (
                <p className={cn(
                  "text-xs text-center mb-3 font-serif",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  您有未保存的更改
                </p>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl",
                    "font-medium font-serif transition-colors",
                    hasChanges
                      ? isDark
                        ? "bg-stone-700 hover:bg-stone-600 text-stone-200 cursor-pointer"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                      : "opacity-50 cursor-not-allowed bg-stone-500/20 text-stone-500"
                  )}
                >
                  <RotateCcw className="h-4 w-4" />
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl",
                    "font-medium font-serif transition-colors",
                    hasChanges
                      ? isDark
                        ? "bg-stone-600 hover:bg-stone-500 text-white cursor-pointer"
                        : "bg-stone-700 hover:bg-stone-800 text-white cursor-pointer"
                      : "opacity-50 cursor-not-allowed bg-stone-500/20 text-stone-500"
                  )}
                >
                  <Save className="h-4 w-4" />
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- 文件上传配置小模态框 --- */}
      {showFileUploadModal && (
        <>
          <div 
            className="fixed inset-0 z-60 bg-black/30 backdrop-blur-sm cursor-pointer"
            onClick={handleFileUploadCancel}
          />
          <div className="fixed inset-x-4 top-4 bottom-24 z-60 flex items-center justify-center">
            <div className="w-full max-w-[420px] max-h-full flex flex-col">
              <div className={cn(
                "rounded-xl border shadow-2xl flex flex-col h-full",
                isDark 
                  ? "bg-stone-900 border-stone-700" 
                  : "bg-white border-stone-200"
              )}>
                {/* --- 模态框头部 --- */}
                <div className={cn(
                  "flex items-center justify-between p-4 border-b flex-shrink-0",
                  isDark ? "border-stone-700" : "border-stone-200"
                )}>
                  <h3 className={cn(
                    "text-base font-bold font-serif",
                    isDark ? "text-stone-100" : "text-stone-900"
                  )}>
                    文件上传配置
                  </h3>
                  <button
                    onClick={handleFileUploadCancel}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors cursor-pointer",
                      isDark 
                        ? "hover:bg-stone-800 text-stone-400 hover:text-stone-200" 
                        : "hover:bg-stone-100 text-stone-600 hover:text-stone-900"
                    )}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* --- 模态框内容区域（可滚动） --- */}
                <div className="flex-1 overflow-y-auto min-h-0 p-4">
                  <div className="space-y-4">
                    {/* --- 上传文件类型 --- */}
                    <div>
                      <label className={cn(
                        "block text-sm font-medium mb-2 font-serif",
                        isDark ? "text-stone-300" : "text-stone-700"
                      )}>
                        上传文件类型
                      </label>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setUploadMethod('local')}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-serif transition-colors cursor-pointer",
                            uploadMethod === 'local'
                              ? isDark
                                ? "bg-stone-600 text-white"
                                : "bg-stone-700 text-white"
                              : isDark
                                ? "bg-stone-700 text-stone-300 hover:bg-stone-600"
                                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                          )}
                        >
                          本地上传
                        </button>
                        <button
                          onClick={() => setUploadMethod('url')}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-serif transition-colors cursor-pointer",
                            uploadMethod === 'url'
                              ? isDark
                                ? "bg-stone-600 text-white"
                                : "bg-stone-700 text-white"
                              : isDark
                                ? "bg-stone-700 text-stone-300 hover:bg-stone-600"
                                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                          )}
                        >
                          URL
                        </button>
                        <button
                          onClick={() => setUploadMethod('both')}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-serif transition-colors cursor-pointer",
                            uploadMethod === 'both'
                              ? isDark
                                ? "bg-stone-600 text-white"
                                : "bg-stone-700 text-white"
                              : isDark
                                ? "bg-stone-700 text-stone-300 hover:bg-stone-600"
                                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                          )}
                        >
                          两者
                        </button>
                      </div>
                    </div>

                    {/* --- 最大上传数 --- */}
                    <div>
                      <label className={cn(
                        "block text-sm font-medium mb-2 font-serif",
                        isDark ? "text-stone-300" : "text-stone-700"
                      )}>
                        最大上传数
                      </label>
                      <p className={cn(
                        "text-xs mb-2 font-serif",
                        isDark ? "text-stone-400" : "text-stone-600"
                      )}>
                        文档 &lt; 15MB, 图片 &lt; 10MB, 音频 &lt; 50MB, 视频 &lt; 100MB
                      </p>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={maxFiles}
                          onChange={(e) => setMaxFiles(parseInt(e.target.value))}
                          className={cn(
                            "flex-1 cursor-pointer",
                            isDark ? "accent-stone-600" : "accent-stone-700"
                          )}
                        />
                        <span className={cn(
                          "text-base font-medium font-serif min-w-[1.5rem] text-center",
                          isDark ? "text-stone-200" : "text-stone-800"
                        )}>
                          {maxFiles}
                        </span>
                      </div>
                    </div>

                    {/* --- 支持的文件类型 --- */}
                    <div>
                      <label className={cn(
                        "block text-sm font-medium mb-2 font-serif",
                        isDark ? "text-stone-300" : "text-stone-700"
                      )}>
                        支持的文件类型
                      </label>
                      <div className="space-y-2">
                        {Object.entries(FILE_TYPE_CONFIG).map(([fileType, config]) => {
                          const IconComponent = config.icon;
                          const isEnabled = enabledFileTypes.has(fileType);
                          
                          return (
                            <div key={fileType} className="space-y-2">
                              <div
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
                                  isEnabled
                                    ? isDark
                                      ? "border-stone-500 bg-stone-700/50"
                                      : "border-stone-400 bg-stone-100/50"
                                    : isDark
                                      ? "border-stone-600 bg-stone-800/50"
                                      : "border-stone-200 bg-stone-50/50"
                                )}
                                onClick={() => toggleFileType(fileType)}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "p-1.5 rounded-lg",
                                    isEnabled
                                      ? isDark
                                        ? "bg-stone-600 text-white"
                                        : "bg-stone-700 text-white"
                                      : isDark
                                        ? "bg-stone-700 text-stone-400"
                                        : "bg-stone-200 text-stone-600"
                                  )}>
                                    <IconComponent className="h-3 w-3" />
                                  </div>
                                  <div>
                                    <div className={cn(
                                      "font-medium text-sm font-serif",
                                      isDark ? "text-stone-200" : "text-stone-800"
                                    )}>
                                      {fileType}
                                    </div>
                                    <div className={cn(
                                      "text-xs font-serif",
                                      isDark ? "text-stone-400" : "text-stone-600"
                                    )}>
                                      {config.extensions.length > 0 
                                        ? config.extensions.slice(0, 3).join(', ').toUpperCase() + (config.extensions.length > 3 ? '...' : '')
                                        : config.maxSize
                                      }
                                    </div>
                                  </div>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={() => toggleFileType(fileType)}
                                  className={cn(
                                    "w-4 h-4 rounded border cursor-pointer",
                                    isEnabled
                                      ? isDark
                                        ? "bg-stone-600 border-stone-600 accent-stone-600"
                                        : "bg-stone-700 border-stone-700 accent-stone-700"
                                      : isDark
                                        ? "border-stone-500 accent-stone-600"
                                        : "border-stone-300 accent-stone-700"
                                  )}
                                />
                              </div>
                              
                              {/* --- 其他文件类型的自定义输入 --- */}
                              {fileType === '其他文件类型' && isEnabled && (
                                <div className={cn(
                                  "ml-4 p-3 rounded-lg border",
                                  isDark ? "bg-stone-800 border-stone-600" : "bg-stone-50 border-stone-200"
                                )}>
                                  <label className={cn(
                                    "block text-xs font-medium mb-2 font-serif",
                                    isDark ? "text-stone-300" : "text-stone-700"
                                  )}>
                                    自定义文件扩展名（用逗号或空格分隔）
                                  </label>
                                  <input
                                    type="text"
                                    value={customFileTypes}
                                    onChange={(e) => setCustomFileTypes(e.target.value)}
                                    className={cn(
                                      "w-full px-2 py-1.5 rounded text-xs font-serif border",
                                      isDark 
                                        ? "bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400" 
                                        : "bg-white border-stone-300 text-stone-900 placeholder-stone-500"
                                    )}
                                    placeholder="例如: zip, rar, 7z, tar"
                                  />
                                  <p className={cn(
                                    "text-xs mt-1 font-serif",
                                    isDark ? "text-stone-400" : "text-stone-600"
                                  )}>
                                    支持格式：zip, rar, 7z, tar, gz, bz2, xz 等
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- 模态框底部按钮 --- */}
                <div className={cn(
                  "flex gap-2 p-4 border-t flex-shrink-0",
                  isDark ? "border-stone-700" : "border-stone-200"
                )}>
                  <button
                    onClick={handleFileUploadCancel}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm font-medium font-serif transition-colors cursor-pointer",
                      isDark
                        ? "bg-stone-700 hover:bg-stone-600 text-stone-200"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                    )}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleFileUploadSave}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm font-medium font-serif transition-colors cursor-pointer",
                      isDark
                        ? "bg-stone-600 hover:bg-stone-500 text-white"
                        : "bg-stone-700 hover:bg-stone-800 text-white"
                    )}
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default DifyParametersPanel; 