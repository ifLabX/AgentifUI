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
  ExternalLink
} from 'lucide-react';

interface DifyParametersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: DifyParametersSimplifiedConfig;
  onSave: (config: DifyParametersSimplifiedConfig) => void;
  instanceName?: string;
}

// --- 文件类型配置 ---
const FILE_TYPE_CONFIG = {
  "文档": {
    icon: FileText,
    extensions: ["txt", "md", "mdx", "markdown", "pdf", "html", "xlsx", "xls", "doc", "docx", "csv", "eml", "msg", "pptx", "ppt", "xml", "epub"],
    maxSize: "15.00MB"
  },
  "图片": {
    icon: Image,
    extensions: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
    maxSize: "10.00MB"
  },
  "音频": {
    icon: Music,
    extensions: ["mp3", "m4a", "wav", "amr", "mpga"],
    maxSize: "50.00MB"
  },
  "视频": {
    icon: Video,
    extensions: ["mp4", "mov", "mpeg", "webm"],
    maxSize: "100.00MB"
  },
  "其他文件类型": {
    icon: File,
    extensions: [],
    maxSize: "指定其他文件类型"
  }
};

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
  
  // --- 文件上传配置状态 ---
  const [fileUploadEnabled, setFileUploadEnabled] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'local' | 'url' | 'both'>('both');
  const [maxFiles, setMaxFiles] = useState(3);
  const [enabledFileTypes, setEnabledFileTypes] = useState<Set<string>>(new Set(['图片']));
  const [customFileTypes, setCustomFileTypes] = useState<string>(''); // 新增：自定义文件类型

  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
    // 检查是否已有文件上传配置
    const hasFileUpload = !!(config.file_upload?.image?.enabled || 
                            config.file_upload?.document?.enabled || 
                            config.file_upload?.audio?.enabled || 
                            config.file_upload?.video?.enabled);
    setFileUploadEnabled(hasFileUpload);
    
    // 初始化文件上传配置状态
    if (config.file_upload) {
      // 从现有配置中获取最大文件数（取所有类型中的最大值）
      const maxLimits = Math.max(
        config.file_upload.image?.number_limits || 0,
        config.file_upload.document?.number_limits || 0,
        config.file_upload.audio?.number_limits || 0,
        config.file_upload.video?.number_limits || 0
      );
      setMaxFiles(maxLimits || 3);
      
      // 根据transfer_methods设置上传方式（以图片配置为准）
      const methods = config.file_upload.image?.transfer_methods || [];
      if (methods.includes('local_file') && methods.includes('remote_url')) {
        setUploadMethod('both');
      } else if (methods.includes('local_file')) {
        setUploadMethod('local');
      } else if (methods.includes('remote_url')) {
        setUploadMethod('url');
      }
      
      // 设置启用的文件类型
      const enabledTypes = new Set<string>();
      if (config.file_upload.image?.enabled) enabledTypes.add('图片');
      if (config.file_upload.document?.enabled) enabledTypes.add('文档');
      if (config.file_upload.audio?.enabled) enabledTypes.add('音频');
      if (config.file_upload.video?.enabled) enabledTypes.add('视频');
      setEnabledFileTypes(enabledTypes);
    }
  }, [config]);

  useEffect(() => {
    const configChanged = JSON.stringify(localConfig) !== JSON.stringify(config);
    setHasChanges(configChanged);
  }, [localConfig, config]);

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
  };

  const handleReset = () => {
    setLocalConfig(config);
    setHasChanges(false);
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
      // 关闭时清空文件上传配置
      updateConfig('file_upload', undefined);
    } else {
      // 开启时设置默认配置（只启用图片）
      updateConfig('file_upload', {
        image: {
          enabled: true,
          number_limits: 3,
          transfer_methods: ['local_file', 'remote_url']
        }
      });
    }
  };

  const openFileUploadModal = () => {
    if (fileUploadEnabled) {
      setShowFileUploadModal(true);
    }
  };

  const handleFileUploadSave = () => {
    // 构建文件上传配置 - 根据启用的文件类型构建配置
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
    
    // 处理其他文件类型
    if (enabledFileTypes.has('其他文件类型') && customFileTypes.trim()) {
      fileUploadConfig.other = {
        enabled: true,
        number_limits: maxFiles,
        transfer_methods: transferMethods,
        custom_extensions: customFileTypes.split(/[,\s]+/).filter(ext => ext.trim())
      };
    }
    
    if (Object.keys(fileUploadConfig).length > 0) {
      updateConfig('file_upload', fileUploadConfig);
    } else {
      // 如果没有启用任何文件类型，则清空配置
      updateConfig('file_upload', undefined);
      setFileUploadEnabled(false);
    }
    
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
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  isDark ? "bg-stone-800" : "bg-stone-100"
                )}>
                  <Settings className={cn(
                    "h-5 w-5",
                    isDark ? "text-stone-400" : "text-stone-600"
                  )} />
                </div>
                <div>
                  <h2 className={cn(
                    "text-lg font-bold font-serif",
                    isDark ? "text-stone-100" : "text-stone-900"
                  )}>
                    Dify 参数配置
                  </h2>
                  <p className={cn(
                    "text-sm font-serif",
                    isDark ? "text-stone-400" : "text-stone-600"
                  )}>
                    {instanceName}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "p-2 rounded-lg transition-colors cursor-pointer",
                  isDark 
                    ? "hover:bg-stone-800 text-stone-400 hover:text-stone-200" 
                    : "hover:bg-stone-100 text-stone-600 hover:text-stone-900"
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
                      <ChevronDown className="h-4 w-4 text-stone-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-stone-400" />
                    )}
                  </button>

                  {expandedSections.has('basic') && (
                    <div className={cn(
                      "p-4 rounded-xl border",
                      isDark ? "bg-stone-800/50 border-stone-700" : "bg-stone-50/50 border-stone-200"
                    )}>
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
                  )}
                </div>

                {/* --- 推荐问题配置 --- */}
                <div className="space-y-4">
                  <button
                    onClick={() => toggleSection('questions')}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl transition-colors cursor-pointer",
                      isDark 
                        ? "bg-stone-800 hover:bg-stone-700" 
                        : "bg-stone-50 hover:bg-stone-100"
                    )}
                  >
                    <Sparkles className={cn(
                      "h-4 w-4",
                      isDark ? "text-stone-400" : "text-stone-600"
                    )} />
                    <span className={cn(
                      "flex-1 text-left font-medium font-serif",
                      isDark ? "text-stone-200" : "text-stone-800"
                    )}>
                      推荐问题
                    </span>
                    {expandedSections.has('questions') ? (
                      <ChevronDown className="h-4 w-4 text-stone-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-stone-400" />
                    )}
                  </button>

                  {expandedSections.has('questions') && (
                    <div className={cn(
                      "p-4 rounded-xl border space-y-3",
                      isDark ? "bg-stone-800/50 border-stone-700" : "bg-stone-50/50 border-stone-200"
                    )}>
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
                        添加问题
                      </button>
                    </div>
                  )}
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
              </div>
            </div>

            {/* --- 底部操作栏 --- */}
            <div className={cn(
              "p-6 border-t flex-shrink-0",
              isDark ? "border-stone-700" : "border-stone-200"
            )}>
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
              
              {hasChanges && (
                <p className={cn(
                  "text-xs text-center mt-3 font-serif",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  您有未保存的更改
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- 文件上传配置小模态框 --- */}
      {showFileUploadModal && (
        <>
          <div 
            className="fixed inset-0 z-60 bg-black/30 backdrop-blur-sm cursor-pointer"
            onClick={() => setShowFileUploadModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-60 w-[420px] max-h-[70vh] flex flex-col">
            <div className={cn(
              "rounded-xl border shadow-2xl flex flex-col max-h-full",
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
                  onClick={() => setShowFileUploadModal(false)}
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
                  onClick={() => setShowFileUploadModal(false)}
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
        </>
      )}
    </>
  );
};

export default DifyParametersPanel; 