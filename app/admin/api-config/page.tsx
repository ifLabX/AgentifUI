'use client';

import React, { useState, useEffect } from 'react';
import { useApiConfigStore, ServiceInstance } from '@lib/stores/api-config-store';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import DifyParametersPanel from '@components/admin/api-config/dify-parameters-panel';
import type { DifyParametersSimplifiedConfig } from '@lib/types/dify-parameters';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Key,
  Database,
  Eye,
  EyeOff,
  Save,
  X,
  FileText,
  Globe,
  Zap,
  Loader2,
  Sliders,
  Star
} from 'lucide-react';
import { DifyAppTypeSelector } from '@components/admin/api-config/dify-app-type-selector';
import { validateDifyFormData } from '@lib/services/dify/validation';
import type { DifyAppType } from '@lib/types/dify-app-types';

interface ApiConfigPageProps {
  selectedInstance?: ServiceInstance | null
  showAddForm?: boolean
  onClearSelection?: () => void
  instances?: ServiceInstance[]
}

interface FeedbackState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const Toast = ({ feedback, onClose }: { feedback: FeedbackState; onClose: () => void }) => {
  const { isDark } = useTheme();
  
  useEffect(() => {
    if (feedback.open) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // 3秒后自动关闭
      
      return () => clearTimeout(timer);
    }
  }, [feedback.open, onClose]);
  
  if (!feedback.open) return null;
  
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full mx-4">
      <div className={cn(
        "rounded-lg p-4 shadow-lg border animate-in slide-in-from-top-2",
        feedback.severity === 'success' && "bg-green-500 text-white border-green-600",
        feedback.severity === 'error' && "bg-red-500 text-white border-red-600",
        feedback.severity === 'warning' && "bg-yellow-500 text-white border-yellow-600",
        feedback.severity === 'info' && (isDark ? "bg-stone-800 text-stone-100 border-stone-700" : "bg-white text-stone-900 border-stone-200")
      )}>
        <div className="flex items-center gap-2">
          {feedback.severity === 'success' && <CheckCircle className="h-5 w-5" />}
          {feedback.severity === 'error' && <XCircle className="h-5 w-5" />}
          {feedback.severity === 'warning' && <AlertCircle className="h-5 w-5" />}
          {feedback.severity === 'info' && <AlertCircle className="h-5 w-5" />}
          <span className="text-sm font-medium font-serif">{feedback.message}</span>
          <button onClick={onClose} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const InstanceForm = ({ 
  instance, 
  isEditing, 
  onSave, 
  onCancel, 
  isProcessing,
  showFeedback
}: {
  instance: Partial<ServiceInstance> | null
  isEditing: boolean
  onSave: (data: any) => void
  onCancel: () => void
  isProcessing: boolean
  showFeedback: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void
}) => {
  const { isDark } = useTheme();
  const { serviceInstances, apiKeys } = useApiConfigStore();
  
  // --- 获取当前实例的最新状态 ---
  const currentInstance = instance ? serviceInstances.find(inst => inst.id === instance.id) : null;
  const isCurrentDefault = currentInstance?.is_default || false;
  
  // --- 检查当前实例是否已配置API密钥 ---
  const hasApiKey = instance ? apiKeys.some(key => key.service_instance_id === instance.id) : false;
  
  const [formData, setFormData] = useState({
    instance_id: instance?.instance_id || '',
    display_name: instance?.display_name || '',
    description: instance?.description || '',
    api_path: instance?.api_path || '',
    apiKey: '',
    config: {
      api_url: instance?.config?.api_url || '',
      app_metadata: {
        app_type: instance?.config?.app_metadata?.app_type || 'model',
        dify_apptype: instance?.config?.app_metadata?.dify_apptype || 'chatbot',
        tags: instance?.config?.app_metadata?.tags || [],
      },
      dify_parameters: instance?.config?.dify_parameters || {}
    }
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showDifyPanel, setShowDifyPanel] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(false);
  
  useEffect(() => {
    if (instance) {
      setFormData({
        instance_id: instance.instance_id || '',
        display_name: instance.display_name || '',
        description: instance.description || '',
        api_path: instance.api_path || '',
        apiKey: '',
        config: {
          api_url: instance.config?.api_url || '',
          app_metadata: {
            app_type: instance.config?.app_metadata?.app_type || 'model',
            dify_apptype: instance.config?.app_metadata?.dify_apptype || 'chatbot',
            tags: instance.config?.app_metadata?.tags || [],
          },
          dify_parameters: instance.config?.dify_parameters || {}
        }
      });
    } else {
      setFormData({
        instance_id: '',
        display_name: '',
        description: '',
        api_path: '',
        apiKey: '',
        config: {
          api_url: '',
          app_metadata: {
            app_type: 'model',
            dify_apptype: 'chatbot',
            tags: [],
          },
          dify_parameters: {}
        }
      });
    }
  }, [instance]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- BEGIN COMMENT ---
    // 🎯 新增：表单验证，确保Dify应用类型必填
    // --- END COMMENT ---
    const validationErrors = validateDifyFormData(formData);
    if (validationErrors.length > 0) {
      showFeedback(validationErrors.join(', '), 'error');
      return;
    }
    
    // --- 自动设置 is_marketplace_app 字段与 app_type 保持一致 ---
    const dataToSave = {
      ...formData,
      config: {
        ...formData.config,
        app_metadata: {
          ...formData.config.app_metadata,
          // --- BEGIN COMMENT ---
          // 🎯 确保dify_apptype字段被保存
          // --- END COMMENT ---
          dify_apptype: formData.config.app_metadata.dify_apptype,
          is_marketplace_app: formData.config.app_metadata.app_type === 'marketplace'
        }
      },
      setAsDefault
    };
    
    onSave(dataToSave);
  };

  const handleDifyParametersSave = (difyConfig: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        dify_parameters: difyConfig
      }
    }));
    setShowDifyPanel(false);
  };
  
  return (
    <>
      <div className={cn(
        "rounded-xl border p-6 mb-6",
        isDark ? "bg-stone-800 border-stone-600" : "bg-white border-stone-200"
      )}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={cn(
            "text-lg font-bold font-serif",
            isDark ? "text-stone-100" : "text-stone-900"
          )}>
            {isEditing ? '编辑应用实例' : '添加应用实例'}
          </h3>
          
          <div className="flex items-center gap-3">
            {/* 设为默认应用按钮 */}
            {isEditing ? (
              /* 编辑模式：显示当前状态并允许修改 */
              instance && (
                <button
                  type="button"
                  onClick={() => {
                    // --- 简化逻辑：直接使用实时状态 ---
                    if (isCurrentDefault) {
                      return // 已经是默认应用，无需操作
                    }
                    
                    if (confirm(`确定要将"${formData.display_name || formData.instance_id}"设置为默认应用吗？`)) {
                      // 直接调用store的方法
                      if (instance.id) {
                        useApiConfigStore.getState().setDefaultInstance(instance.id)
                          .then(() => {
                            showFeedback('默认应用设置成功', 'success')
                          })
                          .catch((error) => {
                            console.error('设置默认应用失败:', error)
                            showFeedback('设置默认应用失败', 'error')
                          })
                      } else {
                        showFeedback('实例ID不存在，无法设置为默认应用', 'error')
                      }
                    }
                  }}
                  disabled={isCurrentDefault}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                    "border",
                    isCurrentDefault
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer hover:scale-105",
                    isCurrentDefault
                      ? isDark
                        ? "border-stone-600/50 bg-stone-700/30 text-stone-400"
                        : "border-stone-300/50 bg-stone-100/50 text-stone-500"
                      : isDark
                        ? "border-stone-600 bg-stone-700 hover:bg-stone-600 text-stone-300"
                        : "border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-700"
                  )}
                >
                  <Star className={cn(
                    "h-4 w-4",
                    isCurrentDefault && "fill-current"
                  )} />
                  <span className="text-sm font-medium font-serif">
                    {isCurrentDefault ? '默认应用' : '设为默认'}
                  </span>
                </button>
              )
            ) : (
              /* 添加模式：允许选择是否设为默认 */
              <button
                type="button"
                onClick={() => setSetAsDefault(!setAsDefault)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer",
                  "border hover:scale-105",
                  setAsDefault
                    ? isDark
                      ? "border-stone-500 bg-stone-600 text-stone-200"
                      : "border-stone-400 bg-stone-200 text-stone-800"
                    : isDark
                      ? "border-stone-600 bg-stone-700 hover:bg-stone-600 text-stone-300"
                      : "border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-700"
                )}
              >
                <Star className={cn(
                  "h-4 w-4",
                  setAsDefault && "fill-current"
                )} />
                <span className="text-sm font-medium font-serif">
                  {setAsDefault ? '将设为默认' : '设为默认'}
                </span>
              </button>
            )}
            
            {/* Dify参数配置按钮 */}
            <button
              type="button"
              onClick={() => setShowDifyPanel(true)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer",
                "border border-dashed hover:scale-105",
                isDark 
                  ? "border-stone-500/50 bg-stone-600/10 hover:bg-stone-600/20 text-stone-400" 
                  : "border-stone-500/50 bg-stone-50 hover:bg-stone-100 text-stone-600"
              )}
            >
              <Sliders className="h-4 w-4" />
              <span className="text-sm font-medium font-serif">Dify 参数配置</span>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className={cn(
                "block text-sm font-medium mb-2 font-serif",
                isDark ? "text-stone-300" : "text-stone-700"
              )}>
                应用 ID (instance_id) *
              </label>
              <input
                type="text"
                value={formData.instance_id}
                onChange={(e) => setFormData(prev => ({ ...prev, instance_id: e.target.value }))}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border font-serif",
                  isDark 
                    ? "bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400" 
                    : "bg-white border-stone-300 text-stone-900 placeholder-stone-500",
                  isEditing && (isDark ? "bg-stone-800 cursor-not-allowed" : "bg-stone-100 cursor-not-allowed")
                )}
                placeholder="输入应用 ID"
                required
                disabled={isEditing}
              />
              {isEditing && (
                <p className={cn(
                  "text-xs mt-1 font-serif",
                  isDark ? "text-stone-400" : "text-stone-500"
                )}>
                  应用 ID 创建后不可修改
                </p>
              )}
            </div>
            
            <div>
              <label className={cn(
                "block text-sm font-medium mb-2 font-serif",
                isDark ? "text-stone-300" : "text-stone-700"
              )}>
                显示名称 (display_name) *
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border font-serif",
                  isDark 
                    ? "bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400" 
                    : "bg-white border-stone-300 text-stone-900 placeholder-stone-500"
                )}
                placeholder="输入显示名称"
                required
              />
            </div>
          </div>

          <div>
            <label className={cn(
              "block text-sm font-medium mb-2 font-serif",
              isDark ? "text-stone-300" : "text-stone-700"
            )}>
              描述 (description)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={cn(
                "w-full px-3 py-2 rounded-lg border font-serif",
                isDark 
                  ? "bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400" 
                  : "bg-white border-stone-300 text-stone-900 placeholder-stone-500"
              )}
              placeholder="输入应用描述"
              rows={3}
            />
          </div>

          <div>
            <label className={cn(
              "block text-sm font-medium mb-3 font-serif",
              isDark ? "text-stone-300" : "text-stone-700"
            )}>
              应用类型 (app_type) *
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  config: {
                    ...prev.config,
                    app_metadata: {
                      ...prev.config.app_metadata,
                      app_type: 'model'
                    }
                  }
                }))}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                  formData.config.app_metadata.app_type === 'model'
                    ? isDark
                      ? "border-stone-500 bg-stone-700/50"
                      : "border-stone-400 bg-stone-100"
                    : isDark
                      ? "border-stone-600 hover:border-stone-500"
                      : "border-stone-300 hover:border-stone-400"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  formData.config.app_metadata.app_type === 'model'
                    ? isDark
                      ? "border-stone-400 bg-stone-400"
                      : "border-stone-600 bg-stone-600"
                    : isDark
                      ? "border-stone-500"
                      : "border-stone-400"
                )}>
                  {formData.config.app_metadata.app_type === 'model' && (
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isDark ? "bg-stone-800" : "bg-white"
                    )} />
                  )}
                </div>
                <div>
                  <div className={cn(
                    "font-medium text-sm font-serif",
                    isDark ? "text-stone-100" : "text-stone-900"
                  )}>
                    模型 (Model)
                  </div>
                  <div className={cn(
                    "text-xs font-serif",
                    isDark ? "text-stone-400" : "text-stone-600"
                  )}>
                    用于模型切换
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  config: {
                    ...prev.config,
                    app_metadata: {
                      ...prev.config.app_metadata,
                      app_type: 'marketplace'
                    }
                  }
                }))}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                  formData.config.app_metadata.app_type === 'marketplace'
                    ? isDark
                      ? "border-stone-500 bg-stone-700/50"
                      : "border-stone-400 bg-stone-100"
                    : isDark
                      ? "border-stone-600 hover:border-stone-500"
                      : "border-stone-300 hover:border-stone-400"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  formData.config.app_metadata.app_type === 'marketplace'
                    ? isDark
                      ? "border-stone-400 bg-stone-400"
                      : "border-stone-600 bg-stone-600"
                    : isDark
                      ? "border-stone-500"
                      : "border-stone-400"
                )}>
                  {formData.config.app_metadata.app_type === 'marketplace' && (
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isDark ? "bg-stone-800" : "bg-white"
                    )} />
                  )}
                </div>
                <div>
                  <div className={cn(
                    "font-medium text-sm font-serif",
                    isDark ? "text-stone-100" : "text-stone-900"
                  )}>
                    应用市场 (Marketplace)
                  </div>
                  <div className={cn(
                    "text-xs font-serif",
                    isDark ? "text-stone-400" : "text-stone-600"
                  )}>
                    用于应用市场
                  </div>
                </div>
              </button>
            </div>
            <p className={cn(
              "text-xs mt-2 font-serif",
              isDark ? "text-stone-400" : "text-stone-500"
            )}>
              选择"模型"类型的应用会出现在聊天界面的模型选择器中
            </p>
          </div>

          {/* --- BEGIN COMMENT --- */}
          {/* 🎯 新增：Dify应用类型选择器 */}
          {/* 在现有app_type选择器下方添加，保持一致的设计风格 */}
          {/* --- END COMMENT --- */}
          <DifyAppTypeSelector
            value={formData.config.app_metadata.dify_apptype}
            onChange={(type: DifyAppType) => {
              setFormData(prev => ({
                ...prev,
                config: {
                  ...prev.config,
                  app_metadata: {
                    ...prev.config.app_metadata,
                    dify_apptype: type
                  }
                }
              }))
            }}
          />

          {/* 应用标签配置 - 紧凑设计 */}
          <div>
            <label className={cn(
              "block text-sm font-medium mb-3 font-serif",
              isDark ? "text-stone-300" : "text-stone-700"
            )}>
              应用标签 (tags)
            </label>
            <div className="space-y-3">
              {/* 预定义标签选择 - 按类别分组 */}
              <div className="space-y-3">
                {/* 模型类型 */}
                <div>
                  <div className={cn(
                    "text-xs font-medium mb-2 font-serif",
                    isDark ? "text-stone-400" : "text-stone-600"
                  )}>
                    模型类型
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      '对话模型', '推理模型', '文档模型', '多模态'
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const isSelected = formData.config.app_metadata.tags.includes(tag)
                          setFormData(prev => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              app_metadata: {
                                ...prev.config.app_metadata,
                                tags: isSelected
                                  ? prev.config.app_metadata.tags.filter(t => t !== tag)
                                  : [...prev.config.app_metadata.tags, tag]
                              }
                            }
                          }))
                        }}
                        className={cn(
                          "px-2 py-1.5 rounded text-xs font-medium font-serif transition-colors cursor-pointer",
                          formData.config.app_metadata.tags.includes(tag)
                            ? isDark
                              ? "bg-stone-600 text-stone-200 border border-stone-500"
                              : "bg-stone-200 text-stone-800 border border-stone-300"
                            : isDark
                              ? "bg-stone-700/50 text-stone-400 border border-stone-600 hover:bg-stone-700"
                              : "bg-stone-50 text-stone-600 border border-stone-300 hover:bg-stone-100"
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 应用场景 */}
                <div>
                  <div className={cn(
                    "text-xs font-medium mb-2 font-serif",
                    isDark ? "text-stone-400" : "text-stone-600"
                  )}>
                    应用场景
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      '文本生成', '代码生成', '数据分析', '翻译'
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const isSelected = formData.config.app_metadata.tags.includes(tag)
                          setFormData(prev => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              app_metadata: {
                                ...prev.config.app_metadata,
                                tags: isSelected
                                  ? prev.config.app_metadata.tags.filter(t => t !== tag)
                                  : [...prev.config.app_metadata.tags, tag]
                              }
                            }
                          }))
                        }}
                        className={cn(
                          "px-2 py-1.5 rounded text-xs font-medium font-serif transition-colors cursor-pointer",
                          formData.config.app_metadata.tags.includes(tag)
                            ? isDark
                              ? "bg-stone-600 text-stone-200 border border-stone-500"
                              : "bg-stone-200 text-stone-800 border border-stone-300"
                            : isDark
                              ? "bg-stone-700/50 text-stone-400 border border-stone-600 hover:bg-stone-700"
                              : "bg-stone-50 text-stone-600 border border-stone-300 hover:bg-stone-100"
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 技术特性 */}
                <div>
                  <div className={cn(
                    "text-xs font-medium mb-2 font-serif",
                    isDark ? "text-stone-400" : "text-stone-600"
                  )}>
                    技术特性
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      '高精度', '快速响应', '本地部署', '企业级'
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const isSelected = formData.config.app_metadata.tags.includes(tag)
                          setFormData(prev => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              app_metadata: {
                                ...prev.config.app_metadata,
                                tags: isSelected
                                  ? prev.config.app_metadata.tags.filter(t => t !== tag)
                                  : [...prev.config.app_metadata.tags, tag]
                              }
                            }
                          }))
                        }}
                        className={cn(
                          "px-2 py-1.5 rounded text-xs font-medium font-serif transition-colors cursor-pointer",
                          formData.config.app_metadata.tags.includes(tag)
                            ? isDark
                              ? "bg-stone-600 text-stone-200 border border-stone-500"
                              : "bg-stone-200 text-stone-800 border border-stone-300"
                            : isDark
                              ? "bg-stone-700/50 text-stone-400 border border-stone-600 hover:bg-stone-700"
                              : "bg-stone-50 text-stone-600 border border-stone-300 hover:bg-stone-100"
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 自定义标签输入 - 更小的输入框 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="自定义标签（回车添加）"
                  className={cn(
                    "flex-1 px-2 py-1.5 rounded border font-serif text-xs",
                    isDark 
                      ? "bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400" 
                      : "bg-white border-stone-300 text-stone-900 placeholder-stone-500"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const input = e.target as HTMLInputElement
                      const tag = input.value.trim()
                      if (tag && !formData.config.app_metadata.tags.includes(tag)) {
                        setFormData(prev => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            app_metadata: {
                              ...prev.config.app_metadata,
                              tags: [...prev.config.app_metadata.tags, tag]
                            }
                          }
                        }))
                        input.value = ''
                      }
                    }
                  }}
                />
              </div>
              
              {/* 已选标签显示 - 更小的标签 */}
              {formData.config.app_metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.config.app_metadata.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium font-serif",
                        isDark 
                          ? "bg-stone-700 text-stone-300 border border-stone-600" 
                          : "bg-stone-100 text-stone-700 border border-stone-300"
                      )}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              app_metadata: {
                                ...prev.config.app_metadata,
                                tags: prev.config.app_metadata.tags.filter((_, i) => i !== index)
                              }
                            }
                          }))
                        }}
                        className={cn(
                          "hover:bg-red-500 hover:text-white rounded-full p-0.5 transition-colors",
                          isDark ? "text-stone-400" : "text-stone-500"
                        )}
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <p className={cn(
                "text-xs font-serif",
                isDark ? "text-stone-400" : "text-stone-500"
              )}>
                标签用于应用分类和搜索
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className={cn(
                "block text-sm font-medium mb-2 font-serif",
                isDark ? "text-stone-300" : "text-stone-700"
              )}>
                API URL (config.api_url)
              </label>
              <input
                type="url"
                value={formData.config.api_url}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  config: {
                    ...prev.config,
                    api_url: e.target.value
                  }
                }))}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border font-serif",
                  isDark 
                    ? "bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400" 
                    : "bg-white border-stone-300 text-stone-900 placeholder-stone-500"
                )}
                placeholder="https://api.dify.ai/v1"
              />
              <p className={cn(
                "text-xs mt-1 font-serif",
                isDark ? "text-stone-400" : "text-stone-500"
              )}>
                留空将使用默认URL: https://api.dify.ai/v1
              </p>
            </div>

            <div>
              <div className="flex items-start justify-between mb-2">
                <label className={cn(
                  "text-sm font-medium font-serif",
                  isDark ? "text-stone-300" : "text-stone-700"
                )}>
                  API 密钥 (key_value) {!isEditing && '*'}
                </label>
                
                {/* --- API密钥配置状态标签 - 靠上对齐，避免挤压输入框 --- */}
                {isEditing && (
                  <span className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium font-serif -mt-0.5",
                    hasApiKey
                      ? isDark
                        ? "bg-green-900/20 border-green-700/30 text-green-300 border"
                        : "bg-green-50 border-green-200 text-green-700 border"
                      : isDark
                        ? "bg-orange-900/20 border-orange-700/30 text-orange-300 border"
                        : "bg-orange-50 border-orange-200 text-orange-700 border"
                  )}>
                    <Key className="h-3 w-3" />
                    {hasApiKey ? '已配置' : '未配置'}
                  </span>
                )}
              </div>
              
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={formData.apiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                  className={cn(
                    "w-full px-3 py-2 pr-10 rounded-lg border font-serif",
                    isDark 
                      ? "bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400" 
                      : "bg-white border-stone-300 text-stone-900 placeholder-stone-500"
                  )}
                  placeholder={isEditing ? "留空则不更新 API 密钥" : "输入 API 密钥"}
                  required={!isEditing}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showApiKey ? (
                    <Eye className="h-4 w-4 text-stone-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-stone-500" />
                  )}
                </button>
              </div>
              
              {/* --- 提示信息（仅在编辑模式且已配置时显示） --- */}
              {isEditing && hasApiKey && (
                <p className={cn(
                  "text-xs mt-1 font-serif",
                  isDark ? "text-stone-400" : "text-stone-500"
                )}>
                  留空输入框将保持现有密钥不变
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isProcessing}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-serif cursor-pointer",
                isDark 
                  ? "bg-stone-600 hover:bg-stone-500 text-stone-100" 
                  : "bg-stone-800 hover:bg-stone-700 text-white"
              )}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isProcessing ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg font-medium transition-colors font-serif cursor-pointer",
                isDark 
                  ? "bg-stone-700 hover:bg-stone-600 text-stone-200" 
                  : "bg-stone-200 hover:bg-stone-300 text-stone-800"
              )}
            >
              取消
            </button>
          </div>
        </form>
      </div>

      {/* Dify参数配置面板 */}
      <DifyParametersPanel
        isOpen={showDifyPanel}
        onClose={() => setShowDifyPanel(false)}
        config={formData.config.dify_parameters || {}}
        onSave={handleDifyParametersSave}
        instanceName={formData.display_name || '应用实例'}
      />
    </>
  );
};

export default function ApiConfigPage() {
  const { isDark } = useTheme()
  
  const {
    serviceInstances: instances,
    providers,
    createAppInstance: addInstance,
    updateAppInstance: updateInstance,
  } = useApiConfigStore()
  
  const [selectedInstance, setSelectedInstance] = useState<ServiceInstance | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>({
    open: false,
    message: '',
    severity: 'info'
  })
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const handleSelectInstance = (event: CustomEvent) => {
      const instance = event.detail as ServiceInstance
      setSelectedInstance(instance)
      setShowAddForm(false)
    }

    const handleToggleAddForm = () => {
      if (showAddForm) {
        setShowAddForm(false)
        setSelectedInstance(null)
      } else {
        setSelectedInstance(null)
        setShowAddForm(true)
      }
    }

    const handleInstanceDeleted = (event: CustomEvent) => {
      const { instanceId } = event.detail
      if (selectedInstance?.instance_id === instanceId) {
        setSelectedInstance(null)
        setShowAddForm(false)
      }
    }

    const handleDefaultInstanceChanged = (event: CustomEvent) => {
      const { instanceId } = event.detail
      // --- 始终显示成功提示，不管是否是当前选中的实例 ---
      showFeedback('默认应用设置成功', 'success')
      
      // --- 重新加载服务实例数据以更新UI状态 ---
      setTimeout(() => {
        // 给数据库操作一点时间完成
        window.dispatchEvent(new CustomEvent('reloadInstances'))
      }, 100)
    }

    window.addEventListener('selectInstance', handleSelectInstance as EventListener)
    window.addEventListener('toggleAddForm', handleToggleAddForm)
    window.addEventListener('instanceDeleted', handleInstanceDeleted as EventListener)
    window.addEventListener('defaultInstanceChanged', handleDefaultInstanceChanged as EventListener)
    
    return () => {
      window.removeEventListener('selectInstance', handleSelectInstance as EventListener)
      window.removeEventListener('toggleAddForm', handleToggleAddForm)
      window.removeEventListener('instanceDeleted', handleInstanceDeleted as EventListener)
      window.removeEventListener('defaultInstanceChanged', handleDefaultInstanceChanged as EventListener)
    }
  }, [showAddForm, selectedInstance])

  const showFeedback = (message: string, severity: FeedbackState['severity'] = 'info') => {
    setFeedback({ open: true, message, severity })
  }

  const handleCloseFeedback = () => {
    setFeedback({ open: false, message: '', severity: 'info' })
  }

  const handleClearSelection = () => {
    setSelectedInstance(null)
    setShowAddForm(false)
    window.dispatchEvent(new CustomEvent('addFormToggled', {
      detail: { 
        showAddForm: false,
        selectedInstance: null
      }
    }))
  }

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('addFormToggled', {
      detail: { 
        showAddForm,
        selectedInstance
      }
    }))
  }, [showAddForm, selectedInstance])

  return (
    <div className="h-full flex flex-col">
      {showAddForm ? (
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <InstanceForm
            instance={null}
            isEditing={false}
            onSave={(data) => {
              setIsProcessing(true)
              const defaultProviderId = providers.find(p => p.name === 'Dify')?.id || 
                                      providers[0]?.id || 
                                      '1'
              
              // --- 提取setAsDefault状态和其他数据 ---
              const { setAsDefault, ...instanceData } = data
              
              addInstance({
                ...instanceData,
                provider_id: defaultProviderId
              }, data.apiKey)
                .then((newInstance) => {
                  showFeedback('应用实例创建成功', 'success')
                  
                  // --- 如果选择了设为默认，则在创建成功后设置为默认应用 ---
                  if (setAsDefault && newInstance?.id) {
                    return useApiConfigStore.getState().setDefaultInstance(newInstance.id)
                      .then(() => {
                        showFeedback('应用实例已设为默认应用', 'success')
                      })
                      .catch((error) => {
                        console.error('设置默认应用失败:', error)
                        showFeedback('应用创建成功，但设置默认应用失败', 'warning')
                      })
                  }
                })
                .then(() => {
                  handleClearSelection()
                })
                .catch((error) => {
                  console.error('创建失败:', error)
                  showFeedback('创建应用实例失败', 'error')
                })
                .finally(() => {
                  setIsProcessing(false)
                })
            }}
            onCancel={handleClearSelection}
            isProcessing={isProcessing}
            showFeedback={showFeedback}
          />
        </div>
      ) : selectedInstance ? (
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={cn(
                  "text-xl font-bold font-serif",
                  isDark ? "text-stone-100" : "text-stone-900"
                )}>
                  {selectedInstance.display_name}
                </h2>
                <p className={cn(
                  "text-sm mt-1 font-serif",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  {selectedInstance.description || selectedInstance.instance_id}
                </p>
              </div>
              <button
                onClick={handleClearSelection}
                className={cn(
                  "p-2 rounded-lg transition-colors cursor-pointer",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2",
                  isDark 
                    ? "bg-stone-600 hover:bg-stone-500 text-stone-200 hover:text-stone-100 focus:ring-stone-500" 
                    : "bg-stone-200 hover:bg-stone-300 text-stone-700 hover:text-stone-900 focus:ring-stone-400"
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <InstanceForm
            instance={selectedInstance}
            isEditing={true}
            onSave={(data) => {
              setIsProcessing(true)
              updateInstance(selectedInstance.id, data, data.apiKey)
                .then(() => {
                  showFeedback('应用实例更新成功', 'success')
                  handleClearSelection()
                })
                .catch((error) => {
                  console.error('更新失败:', error)
                  showFeedback('更新应用实例失败', 'error')
                })
                .finally(() => {
                  setIsProcessing(false)
                })
            }}
            onCancel={handleClearSelection}
            isProcessing={isProcessing}
            showFeedback={showFeedback}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Settings className="h-16 w-16 mx-auto mb-4 text-stone-400" />
            <h3 className={cn(
              "text-lg font-medium mb-2 font-serif",
              isDark ? "text-stone-300" : "text-stone-700"
            )}>
              选择应用实例
            </h3>
            <p className={cn(
              "text-sm font-serif",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              从左侧列表中选择一个应用实例来查看和编辑其配置，或点击添加按钮创建新的应用实例
            </p>
          </div>
        </div>
      )}
      
      <Toast feedback={feedback} onClose={handleCloseFeedback} />
    </div>
  )
}