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

interface FeedbackState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

// Toast通知组件
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
          <span className="text-sm font-medium">{feedback.message}</span>
          <button onClick={onClose} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// 应用实例表单组件
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
    // 添加dify配置
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
  
  // 添加建议问题
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
  
  // 更新建议问题
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
  
  // 删除建议问题
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
        "text-lg font-bold mb-6",
        isDark ? "text-stone-100" : "text-stone-900"
      )}>
        {isEditing ? '编辑应用实例' : '添加应用实例'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基础配置 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
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
                "text-xs mt-1",
                isDark ? "text-stone-400" : "text-stone-500"
              )}>
                应用 ID 创建后不可修改
              </p>
            )}
          </div>
          
          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
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
            "block text-sm font-medium mb-2",
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

        {/* 应用类型配置 */}
        <div>
          <label className={cn(
            "block text-sm font-medium mb-3",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            应用类型 (app_type) *
          </label>
          <div className="flex gap-4">
            {/* 模型类型选项 */}
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
                  "font-medium text-sm",
                  isDark ? "text-stone-100" : "text-stone-900"
                )}>
                  模型 (Model)
                </div>
                <div className={cn(
                  "text-xs",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  用于模型切换
                </div>
              </div>
            </button>

            {/* 应用市场类型选项 */}
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
                  "font-medium text-sm",
                  isDark ? "text-stone-100" : "text-stone-900"
                )}>
                  应用市场 (Marketplace)
                </div>
                <div className={cn(
                  "text-xs",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  用于应用市场
                </div>
              </div>
            </button>
          </div>
          <p className={cn(
            "text-xs mt-2",
            isDark ? "text-stone-400" : "text-stone-500"
          )}>
            选择"模型"类型的应用会出现在聊天界面的模型选择器中
          </p>
        </div>

        {/* API配置 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
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
              "text-xs mt-1",
              isDark ? "text-stone-400" : "text-stone-500"
            )}>
              留空将使用默认URL: https://api.dify.ai/v1
            </p>
          </div>

          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
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

        {/* 应用参数配置 */}
        <div className="space-y-4">
          <h4 className={cn(
            "text-md font-semibold",
            isDark ? "text-stone-200" : "text-stone-800"
          )}>
            应用参数配置
          </h4>
          
          <div>
            <label className={cn(
              "block text-sm font-medium mb-2",
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
                "block text-sm font-medium",
                isDark ? "text-stone-300" : "text-stone-700"
              )}>
                建议问题 (config.dify_parameters.suggested_questions)
              </label>
              <button
                type="button"
                onClick={addSuggestedQuestion}
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors",
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
                  "text-sm text-center py-4",
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
              "flex-1 py-2 px-4 rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2",
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
              "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
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
  const {
    serviceInstances: instances,
    providers,
    isLoading: instancesLoading,
    loadConfigData: loadInstances,
    deleteAppInstance: deleteInstance,
    createAppInstance: addInstance,
    updateAppInstance: updateInstance
  } = useApiConfigStore();
  
  const { isDark } = useTheme();
  
  const [selectedInstance, setSelectedInstance] = useState<ServiceInstance | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [isLoadingInstance, setIsLoadingInstance] = useState(false);

  // 加载实例数据 - 只在首次加载时执行
  useEffect(() => {
    if (!hasInitiallyLoaded && isInitialMount) {
      loadInstances().finally(() => {
        setHasInitiallyLoaded(true);
        setIsInitialMount(false);
      });
    } else if (isInitialMount) {
      // 如果已经有数据，直接标记为已加载
      setHasInitiallyLoaded(true);
      setIsInitialMount(false);
    }
  }, [hasInitiallyLoaded, isInitialMount, loadInstances]);

  // --- 提示相关函数 ---
  const showFeedback = (message: string, severity: FeedbackState['severity'] = 'info') => {
    setFeedback({ open: true, message, severity });
  };

  const handleCloseFeedback = () => {
    setFeedback({ open: false, message: '', severity: 'info' });
  };

  // --- 实例操作函数 ---
  const handleSelectInstance = (instance: ServiceInstance) => {
    // 如果点击的是当前已选中的实例，不做任何操作
    if (selectedInstance?.instance_id === instance.instance_id) {
      return;
    }
    
    // 设置加载状态
    setIsLoadingInstance(true);
    
    // 确保关闭添加表单
    setShowAddForm(false);
    
    // 使用 setTimeout 来模拟异步操作并确保状态更新的顺序
    setTimeout(() => {
      setSelectedInstance(instance);
      setIsLoadingInstance(false);
    }, 50); // 很短的延迟，确保状态更新顺序正确
  };

  const handleAddInstance = () => {
    setSelectedInstance(null);
    setShowAddForm(true);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    if (!confirm('确定要删除此应用实例吗？此操作不可撤销。')) {
      return;
    }

    setIsProcessing(true);
    try {
      // 找到要删除的实例对象
      const instanceToDelete = instances.find(inst => inst.instance_id === instanceId);
      if (!instanceToDelete) {
        throw new Error('未找到要删除的实例');
      }
      
      await deleteInstance(instanceToDelete.id); // 使用数据库ID
      
      // 如果删除的是当前选中的实例，清除选择
      if (selectedInstance?.instance_id === instanceId) {
        setSelectedInstance(null);
      }
      
      showFeedback('应用实例删除成功', 'success');
      
      // 删除后不需要全局重新加载，store会自动更新状态
    } catch (error) {
      console.error('删除失败:', error);
      showFeedback('删除应用实例失败', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* 左侧应用列表 */}
      <div className="w-80 flex-shrink-0">
        <div className="p-4 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className={cn(
                "font-bold text-lg",
                isDark ? "text-stone-100" : "text-stone-900"
              )}>
                应用实例
              </h2>
              {/* 初始加载时的小spinner */}
              {instancesLoading && !hasInitiallyLoaded && (
                <Loader2 className="h-3 w-3 animate-spin text-stone-400" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddInstance}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isDark 
                    ? "bg-stone-800 hover:bg-stone-700 text-stone-300" 
                    : "bg-white hover:bg-stone-100 text-stone-600"
                )}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className={cn(
            "text-sm",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            共 {instances.length} 个应用
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {!hasInitiallyLoaded && instancesLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-stone-400" />
              <p className={cn(
                "text-sm",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                加载应用实例中...
              </p>
            </div>
          ) : instances.length === 0 ? (
            <div className="p-4 text-center">
              <Database className="h-12 w-12 mx-auto mb-3 text-stone-400" />
              <p className={cn(
                "text-sm",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                暂无应用实例
              </p>
              <button
                onClick={handleAddInstance}
                className={cn(
                  "mt-2 text-sm transition-colors",
                  isDark ? "text-stone-300 hover:text-stone-100" : "text-stone-600 hover:text-stone-800"
                )}
              >
                添加第一个应用
              </button>
            </div>
          ) : (
            <div className="p-2">
              {instances.map((instance) => {
                const isSelected = selectedInstance?.instance_id === instance.instance_id;
                
                return (
                  <div
                    key={instance.instance_id}
                    className={cn(
                      "p-3 rounded-lg mb-2 cursor-pointer group",
                      "transition-colors duration-150 ease-in-out",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2",
                      isSelected
                        ? isDark 
                          ? "bg-stone-800 border border-stone-600 focus:ring-stone-500" 
                          : "bg-white border border-stone-300 shadow-sm focus:ring-stone-400"
                        : isDark
                          ? "hover:bg-stone-800/50 focus:ring-stone-600"
                          : "hover:bg-white/50 focus:ring-stone-300"
                    )}
                    onClick={() => handleSelectInstance(instance)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectInstance(instance);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Globe className={cn(
                            "h-4 w-4 flex-shrink-0",
                            isDark ? "text-stone-400" : "text-stone-500"
                          )} />
                          <h3 className={cn(
                            "font-medium text-sm truncate",
                            isDark ? "text-stone-100" : "text-stone-900"
                          )}>
                            {instance.display_name}
                          </h3>
                        </div>
                        <p className={cn(
                          "text-xs truncate",
                          isDark ? "text-stone-400" : "text-stone-600"
                        )}>
                          {instance.description || instance.instance_id}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteInstance(instance.instance_id);
                          }}
                          className={cn(
                            "p-1 rounded transition-colors",
                            "hover:bg-red-100 dark:hover:bg-red-900/30",
                            "focus:outline-none focus:ring-2 focus:ring-red-500"
                          )}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* 右侧配置面板 */}
      <div className="flex-1 flex flex-col">
        {showAddForm ? (
          <div className="flex-1 overflow-y-auto p-6">
            <InstanceForm
              instance={null}
              isEditing={false}
              onSave={(data) => {
                setIsProcessing(true);
                // 获取有效的provider_id
                const defaultProviderId = providers.find(p => p.name === 'Dify')?.id || 
                                        providers[0]?.id || 
                                        '1'; // 最后的备选方案
                addInstance({
                  ...data,
                  provider_id: defaultProviderId
                }, data.apiKey)
                  .then(() => {
                    showFeedback('应用实例创建成功', 'success');
                    setShowAddForm(false);
                  })
                  .catch((error) => {
                    console.error('创建失败:', error);
                    showFeedback('创建应用实例失败', 'error');
                  })
                  .finally(() => {
                    setIsProcessing(false);
                  });
              }}
              onCancel={() => {
                setShowAddForm(false);
              }}
              isProcessing={isProcessing}
            />
          </div>
        ) : selectedInstance ? (
          <div className="flex-1 overflow-y-auto p-6">
            {/* 移除横线，直接在内容区域显示标题 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className={cn(
                    "text-xl font-bold",
                    isDark ? "text-stone-100" : "text-stone-900"
                  )}>
                    {selectedInstance.display_name}
                  </h2>
                  <p className={cn(
                    "text-sm mt-1",
                    isDark ? "text-stone-400" : "text-stone-600"
                  )}>
                    {selectedInstance.description || selectedInstance.instance_id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedInstance(null)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2",
                    isDark 
                      ? "hover:bg-stone-700 text-stone-400 focus:ring-stone-500" 
                      : "hover:bg-stone-100 text-stone-600 focus:ring-stone-400"
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {isLoadingInstance ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
              </div>
            ) : (
              <InstanceForm
                instance={selectedInstance}
                isEditing={true}
                onSave={(data) => {
                  setIsProcessing(true);
                  updateInstance(selectedInstance.id, data, data.apiKey)
                    .then(() => {
                      showFeedback('应用实例更新成功', 'success');
                      setSelectedInstance(null);
                    })
                    .catch((error) => {
                      console.error('更新失败:', error);
                      showFeedback('更新应用实例失败', 'error');
                    })
                    .finally(() => {
                      setIsProcessing(false);
                    });
                }}
                onCancel={() => {
                  setSelectedInstance(null);
                }}
                isProcessing={isProcessing}
              />
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Settings className="h-16 w-16 mx-auto mb-4 text-stone-400" />
              <h3 className={cn(
                "text-lg font-medium mb-2",
                isDark ? "text-stone-300" : "text-stone-700"
              )}>
                选择应用实例
              </h3>
              <p className={cn(
                "text-sm",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                从左侧列表中选择一个应用实例来查看和编辑其配置，或点击添加按钮创建新的应用实例
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Toast通知 */}
      <Toast feedback={feedback} onClose={handleCloseFeedback} />
    </div>
  );
}