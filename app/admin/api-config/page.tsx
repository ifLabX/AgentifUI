'use client';

import React, { useState, useEffect } from 'react';
import { useApiConfigStore, ServiceInstance } from '@lib/stores/api-config-store';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
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
  Loader2
} from 'lucide-react';

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
    <div className="fixed top-4 right-4 z-50 max-w-sm">
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
  isProcessing 
}: {
  instance: Partial<ServiceInstance> | null
  isEditing: boolean
  onSave: (data: any) => void
  onCancel: () => void
  isProcessing: boolean
}) => {
  const { isDark } = useTheme();
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
        is_common_model: instance?.config?.app_metadata?.is_common_model || false,
        tags: instance?.config?.app_metadata?.tags || [],
      },
      dify_parameters: {
        opening_statement: instance?.config?.dify_parameters?.opening_statement || '',
        suggested_questions: instance?.config?.dify_parameters?.suggested_questions || [],
        file_upload: instance?.config?.dify_parameters?.file_upload || {
          image: { enabled: false, number_limits: 3, detail: 'high' }
        }
      }
    }
  });
  const [showApiKey, setShowApiKey] = useState(false);
  
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
            is_common_model: instance.config?.app_metadata?.is_common_model || false,
            tags: instance.config?.app_metadata?.tags || [],
          },
          dify_parameters: {
            opening_statement: instance.config?.dify_parameters?.opening_statement || '',
            suggested_questions: instance.config?.dify_parameters?.suggested_questions || [],
            file_upload: instance.config?.dify_parameters?.file_upload || {
              image: { enabled: false, number_limits: 3, detail: 'high' }
            }
          }
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
            is_common_model: false,
            tags: [],
          },
          dify_parameters: {
            opening_statement: '',
            suggested_questions: [],
            file_upload: {
              image: { enabled: false, number_limits: 3, detail: 'high' }
            }
          }
        }
      });
    }
  }, [instance]);
  
  const addSuggestedQuestion = () => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        dify_parameters: {
          ...prev.config.dify_parameters,
          suggested_questions: [...prev.config.dify_parameters.suggested_questions, '']
        }
      }
    }));
  };
  
  const updateSuggestedQuestion = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        dify_parameters: {
          ...prev.config.dify_parameters,
          suggested_questions: prev.config.dify_parameters.suggested_questions.map((q, i) => 
            i === index ? value : q
          )
        }
      }
    }));
  };
  
  const removeSuggestedQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        dify_parameters: {
          ...prev.config.dify_parameters,
          suggested_questions: prev.config.dify_parameters.suggested_questions.filter((_, i) => i !== index)
        }
      }
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <div className={cn(
      "rounded-xl border p-6 mb-6",
      isDark ? "bg-stone-800 border-stone-600" : "bg-white border-stone-200"
    )}>
      <h3 className={cn(
        "text-lg font-bold mb-6 font-serif",
        isDark ? "text-stone-100" : "text-stone-900"
      )}>
        {isEditing ? '编辑应用实例' : '添加应用实例'}
      </h3>
      
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
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
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
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
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
            <label className={cn(
              "block text-sm font-medium mb-2 font-serif",
              isDark ? "text-stone-300" : "text-stone-700"
            )}>
              API 密钥 (key_value) {!isEditing && '*'}
            </label>
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
                  <EyeOff className="h-4 w-4 text-stone-500" />
                ) : (
                  <Eye className="h-4 w-4 text-stone-500" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className={cn(
            "text-md font-semibold font-serif",
            isDark ? "text-stone-200" : "text-stone-800"
          )}>
            应用参数配置
          </h4>
          
          <div>
            <label className={cn(
              "block text-sm font-medium mb-2 font-serif",
              isDark ? "text-stone-300" : "text-stone-700"
            )}>
              开场白 (config.dify_parameters.opening_statement)
            </label>
            <textarea
              value={formData.config.dify_parameters.opening_statement}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                config: {
                  ...prev.config,
                  dify_parameters: {
                    ...prev.config.dify_parameters,
                    opening_statement: e.target.value
                  }
                }
              }))}
              className={cn(
                "w-full px-3 py-2 rounded-lg border font-serif",
                isDark 
                  ? "bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400" 
                  : "bg-white border-stone-300 text-stone-900 placeholder-stone-500"
              )}
              placeholder="输入应用的开场白..."
              rows={4}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={cn(
                "block text-sm font-medium font-serif",
                isDark ? "text-stone-300" : "text-stone-700"
              )}>
                建议问题 (config.dify_parameters.suggested_questions)
              </label>
              <button
                type="button"
                onClick={addSuggestedQuestion}
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors font-serif",
                  isDark 
                    ? "bg-stone-700 hover:bg-stone-600 text-stone-300" 
                    : "bg-stone-200 hover:bg-stone-300 text-stone-700"
                )}
              >
                <Plus className="h-4 w-4" />
                添加问题
              </button>
            </div>
            
            <div className="space-y-2">
              {formData.config.dify_parameters.suggested_questions.map((question, index) => (
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
                    placeholder={`建议问题 ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeSuggestedQuestion(index)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isDark 
                        ? "hover:bg-stone-700 text-stone-400" 
                        : "hover:bg-stone-200 text-stone-600"
                    )}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {formData.config.dify_parameters.suggested_questions.length === 0 && (
                <p className={cn(
                  "text-sm text-center py-4 font-serif",
                  isDark ? "text-stone-400" : "text-stone-500"
                )}>
                  暂无建议问题，点击上方"添加问题"按钮添加
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isProcessing}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-serif",
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
              "flex-1 py-2 px-4 rounded-lg font-medium transition-colors font-serif",
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

    window.addEventListener('selectInstance', handleSelectInstance as EventListener)
    window.addEventListener('toggleAddForm', handleToggleAddForm)
    window.addEventListener('instanceDeleted', handleInstanceDeleted as EventListener)
    
    return () => {
      window.removeEventListener('selectInstance', handleSelectInstance as EventListener)
      window.removeEventListener('toggleAddForm', handleToggleAddForm)
      window.removeEventListener('instanceDeleted', handleInstanceDeleted as EventListener)
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
              addInstance({
                ...data,
                provider_id: defaultProviderId
              }, data.apiKey)
                .then(() => {
                  showFeedback('应用实例创建成功', 'success')
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