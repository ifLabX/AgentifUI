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
  File
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'questions', 'upload']));
  const [hasChanges, setHasChanges] = useState(false);
  
  // --- 文件上传配置状态 ---
  const [uploadMethod, setUploadMethod] = useState<'local' | 'url' | 'both'>('both');
  const [maxFiles, setMaxFiles] = useState(3);
  const [enabledFileTypes, setEnabledFileTypes] = useState<Set<string>>(new Set(['图片']));

  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
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

  if (!isOpen) return null;

  return (
    <>
      {/* --- 背景遮罩 --- */}
      <div 
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300",
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
            "flex-1 flex flex-col my-8",
            "rounded-2xl border shadow-2xl",
            isDark 
              ? "bg-stone-900 border-stone-700" 
              : "bg-white border-stone-200"
          )}>
            
            {/* --- 头部 --- */}
            <div className={cn(
              "flex items-center justify-between p-6 border-b",
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
                  "p-2 rounded-lg transition-colors",
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
                      "w-full flex items-center gap-3 p-4 rounded-xl transition-colors",
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
                    <div className="ml-6 space-y-4">
                      <div>
                        <label className={cn(
                          "block text-sm font-medium mb-2 font-serif",
                          isDark ? "text-stone-300" : "text-stone-700"
                        )}>
                          开场白 (opening_statement)
                        </label>
                        <textarea
                          value={localConfig.opening_statement || ''}
                          onChange={(e) => updateConfig('opening_statement', e.target.value)}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl border font-serif resize-none",
                            "focus:ring-2 focus:ring-stone-500/20 focus:border-stone-500",
                            isDark 
                              ? "bg-stone-800 border-stone-600 text-stone-100 placeholder-stone-400" 
                              : "bg-white border-stone-300 text-stone-900 placeholder-stone-500"
                          )}
                          placeholder="输入应用的开场白..."
                          rows={4}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* --- 推荐问题 --- */}
                <div className="space-y-4">
                  <button
                    onClick={() => toggleSection('questions')}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl transition-colors",
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
                      推荐问题 (suggested_questions)
                    </span>
                    <div className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      isDark ? "bg-stone-700 text-stone-300" : "bg-stone-200 text-stone-600"
                    )}>
                      {localConfig.suggested_questions?.length || 0}
                    </div>
                    {expandedSections.has('questions') ? (
                      <ChevronDown className="h-4 w-4 text-stone-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-stone-400" />
                    )}
                  </button>

                  {expandedSections.has('questions') && (
                    <div className="ml-6 space-y-3">
                      {(localConfig.suggested_questions || []).map((question, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={question}
                            onChange={(e) => updateSuggestedQuestion(index, e.target.value)}
                            className={cn(
                              "flex-1 px-4 py-2 rounded-xl border font-serif",
                              "focus:ring-2 focus:ring-stone-500/20 focus:border-stone-500",
                              isDark 
                                ? "bg-stone-800 border-stone-600 text-stone-100 placeholder-stone-400" 
                                : "bg-white border-stone-300 text-stone-900 placeholder-stone-500"
                            )}
                            placeholder={`推荐问题 ${index + 1}`}
                          />
                          <button
                            onClick={() => removeSuggestedQuestion(index)}
                            className={cn(
                              "p-2 rounded-xl transition-colors",
                              "hover:bg-red-500/10 text-red-500"
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      
                      <button
                        onClick={addSuggestedQuestion}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 p-4 rounded-xl",
                          "border-2 border-dashed transition-colors",
                          isDark 
                            ? "border-stone-600 hover:border-stone-500 hover:bg-stone-800/50" 
                            : "border-stone-300 hover:border-stone-400 hover:bg-stone-50"
                        )}
                      >
                        <Plus className="h-4 w-4 text-stone-500" />
                        <span className={cn(
                          "font-medium font-serif",
                          isDark ? "text-stone-300" : "text-stone-700"
                        )}>
                          添加推荐问题
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* --- 文件上传配置 --- */}
                <div className="space-y-4">
                  <button
                    onClick={() => toggleSection('upload')}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl transition-colors",
                      isDark 
                        ? "bg-stone-800 hover:bg-stone-700" 
                        : "bg-stone-50 hover:bg-stone-100"
                    )}
                  >
                    <Upload className={cn(
                      "h-4 w-4",
                      isDark ? "text-stone-400" : "text-stone-600"
                    )} />
                    <span className={cn(
                      "flex-1 text-left font-medium font-serif",
                      isDark ? "text-stone-200" : "text-stone-800"
                    )}>
                      文件上传设置
                    </span>
                    {expandedSections.has('upload') ? (
                      <ChevronDown className="h-4 w-4 text-stone-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-stone-400" />
                    )}
                  </button>

                  {expandedSections.has('upload') && (
                    <div className="ml-6 space-y-6">
                      
                      {/* --- 上传文件类型 --- */}
                      <div>
                        <label className={cn(
                          "block text-sm font-medium mb-3 font-serif",
                          isDark ? "text-stone-300" : "text-stone-700"
                        )}>
                          上传文件类型
                        </label>
                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={() => setUploadMethod('local')}
                            className={cn(
                              "px-4 py-2 rounded-lg text-sm font-serif transition-colors",
                              uploadMethod === 'local'
                                ? "bg-blue-500 text-white"
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
                              "px-4 py-2 rounded-lg text-sm font-serif transition-colors",
                              uploadMethod === 'url'
                                ? "bg-blue-500 text-white"
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
                              "px-4 py-2 rounded-lg text-sm font-serif transition-colors",
                              uploadMethod === 'both'
                                ? "bg-blue-500 text-white"
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
                          "text-xs mb-3 font-serif",
                          isDark ? "text-stone-400" : "text-stone-600"
                        )}>
                          文档 &lt; 15.00MB, 图片 &lt; 10.00MB, 音频 &lt; 50.00MB, 视频 &lt; 100.00MB
                        </p>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={maxFiles}
                            onChange={(e) => setMaxFiles(parseInt(e.target.value))}
                            className="flex-1"
                          />
                          <span className={cn(
                            "text-lg font-medium font-serif min-w-[2rem] text-center",
                            isDark ? "text-stone-200" : "text-stone-800"
                          )}>
                            {maxFiles}
                          </span>
                        </div>
                      </div>

                      {/* --- 支持的文件类型 --- */}
                      <div>
                        <label className={cn(
                          "block text-sm font-medium mb-3 font-serif",
                          isDark ? "text-stone-300" : "text-stone-700"
                        )}>
                          支持的文件类型
                        </label>
                        <div className="space-y-3">
                          {Object.entries(FILE_TYPE_CONFIG).map(([fileType, config]) => {
                            const IconComponent = config.icon;
                            const isEnabled = enabledFileTypes.has(fileType);
                            
                            return (
                              <div
                                key={fileType}
                                className={cn(
                                  "flex items-center justify-between p-4 rounded-xl border-2 transition-colors",
                                  isEnabled
                                    ? "border-blue-500 bg-blue-50/50"
                                    : isDark
                                      ? "border-stone-600 bg-stone-800/50"
                                      : "border-stone-200 bg-stone-50/50"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "p-2 rounded-lg",
                                    isEnabled
                                      ? "bg-blue-500 text-white"
                                      : isDark
                                        ? "bg-stone-700 text-stone-400"
                                        : "bg-stone-200 text-stone-600"
                                  )}>
                                    <IconComponent className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className={cn(
                                      "font-medium font-serif",
                                      isDark ? "text-stone-200" : "text-stone-800"
                                    )}>
                                      {fileType}
                                    </div>
                                    <div className={cn(
                                      "text-xs font-serif",
                                      isDark ? "text-stone-400" : "text-stone-600"
                                    )}>
                                      {config.extensions.length > 0 
                                        ? config.extensions.join(', ').toUpperCase()
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
                                    "w-5 h-5 rounded border-2",
                                    isEnabled
                                      ? "bg-blue-500 border-blue-500"
                                      : isDark
                                        ? "border-stone-500"
                                        : "border-stone-300"
                                  )}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --- 底部操作栏 --- */}
            <div className={cn(
              "p-6 border-t",
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
                        ? "bg-stone-700 hover:bg-stone-600 text-stone-200"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-700"
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
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
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
    </>
  );
};

export default DifyParametersPanel; 