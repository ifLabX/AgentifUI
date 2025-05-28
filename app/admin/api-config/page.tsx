'use client';

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '@lib/hooks/use-admin-auth';
import { useApiConfigStore, ServiceInstance } from '@lib/stores/api-config-store';
import AdminLayout from '@components/admin/admin-layout';
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
  Shield,
  Database,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';

// 导入拆分后的组件
import ApiConfigHeader from '@components/admin/api-config/api-config-header';
import ApiKeyInfo from '@components/admin/api-config/api-key-info';
import ApiConfigTabs from '@components/admin/api-config/api-config-tabs';
import ApiConfigContent from '@components/admin/api-config/api-config-content';
import FeedbackNotification from '@components/admin/api-config/feedback-notification';
import { AuthError, AccessDenied, DataError } from '@components/admin/api-config/error-display';

interface FeedbackState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

// 加载状态组件
const LoadingSkeleton = () => {
  const { isDark } = useTheme();
  
  return (
    <div className="space-y-6">
      <div className={cn(
        "h-8 rounded animate-pulse",
        isDark ? "bg-stone-800" : "bg-stone-200"
      )} />
      <div className={cn(
        "h-32 rounded-lg animate-pulse",
        isDark ? "bg-stone-800" : "bg-stone-200"
      )} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className={cn(
            "h-24 rounded-lg animate-pulse",
            isDark ? "bg-stone-800" : "bg-stone-200"
          )} />
        ))}
      </div>
    </div>
  );
};

// Toast通知组件
const Toast = ({ feedback, onClose }: { feedback: FeedbackState; onClose: () => void }) => {
  const { isDark } = useTheme();
  
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

// 错误显示组件
const ErrorDisplay = ({ error, type }: { error: Error; type: 'auth' | 'data' | 'access' }) => {
  const { isDark } = useTheme();
  
  const getErrorContent = () => {
    switch (type) {
      case 'auth':
        return {
          title: '认证失败',
          description: '无法验证您的管理员权限，请重新登录。',
          icon: Shield
        };
      case 'access':
        return {
          title: '访问被拒绝',
          description: '您没有访问管理后台的权限。',
          icon: Shield
        };
      case 'data':
        return {
          title: '数据加载失败',
          description: '无法加载配置数据，请检查网络连接或稍后重试。',
          icon: Database
        };
    }
  };
  
  const { title, description, icon: Icon } = getErrorContent();
  
  return (
    <AdminLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={cn(
          "text-center p-8 rounded-xl border",
          isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
        )}>
          <Icon className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className={cn(
            "text-xl font-bold mb-2",
            isDark ? "text-stone-100" : "text-stone-900"
          )}>
            {title}
          </h2>
          <p className={cn(
            "text-sm mb-4",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            {description}
          </p>
          <p className={cn(
            "text-xs p-2 rounded bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"
          )}>
            {error.message}
          </p>
        </div>
      </div>
    </AdminLayout>
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
    apiKey: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <div className={cn(
      "rounded-xl border p-6",
      isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
    )}>
      <h3 className={cn(
        "text-lg font-bold mb-4",
        isDark ? "text-stone-100" : "text-stone-900"
      )}>
        {isEditing ? '编辑应用实例' : '添加应用实例'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={cn(
            "block text-sm font-medium mb-2",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            应用 ID *
          </label>
          <input
            type="text"
            value={formData.instance_id}
            onChange={(e) => setFormData(prev => ({ ...prev, instance_id: e.target.value }))}
            className={cn(
              "w-full px-3 py-2 rounded-lg border",
              isDark 
                ? "bg-stone-700 border-stone-600 text-stone-200" 
                : "bg-white border-stone-300 text-stone-800"
            )}
            placeholder="输入 Dify 应用 ID"
            required
          />
        </div>
        
        <div>
          <label className={cn(
            "block text-sm font-medium mb-2",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            显示名称 *
          </label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
            className={cn(
              "w-full px-3 py-2 rounded-lg border",
              isDark 
                ? "bg-stone-700 border-stone-600 text-stone-200" 
                : "bg-white border-stone-300 text-stone-800"
            )}
            placeholder="输入显示名称"
            required
          />
        </div>
        
        <div>
          <label className={cn(
            "block text-sm font-medium mb-2",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            描述
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className={cn(
              "w-full px-3 py-2 rounded-lg border",
              isDark 
                ? "bg-stone-700 border-stone-600 text-stone-200" 
                : "bg-white border-stone-300 text-stone-800"
            )}
            placeholder="输入应用描述"
            rows={3}
          />
        </div>
        
        <div>
          <label className={cn(
            "block text-sm font-medium mb-2",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            API 密钥 {!isEditing && '*'}
          </label>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={formData.apiKey}
              onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
              className={cn(
                "w-full px-3 py-2 pr-10 rounded-lg border",
                isDark 
                  ? "bg-stone-700 border-stone-600 text-stone-200" 
                  : "bg-white border-stone-300 text-stone-800"
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
        
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isProcessing}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
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
  // 使用管理员权限检查 hook
  const { isAdmin, isLoading: isAuthLoading, error: authError } = useAdminAuth();
  const { isDark } = useTheme();
  
  // 使用 API 配置 store
  const { 
    providers,
    serviceInstances,
    apiKeys,
    loadConfigData, 
    isLoading: isDataLoading,
    error: dataError,
    updateDifyConfig,
    createAppInstance,
    updateAppInstance,
    deleteAppInstance
  } = useApiConfigStore();
  
  // 防止页面闪烁，在完全加载前始终显示加载状态
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  
  // 组件状态
  const [isAddingInstance, setIsAddingInstance] = useState(false);
  const [editingInstance, setEditingInstance] = useState<ServiceInstance | null>(null);
  const [processingInstance, setProcessingInstance] = useState(false);
  const [instanceError, setInstanceError] = useState<Error | null>(null);
  
  // 操作反馈状态
  const [feedback, setFeedback] = useState<FeedbackState>({ open: false, message: '', severity: 'info' });
  
  // 找到 Dify 提供商
  const difyProvider = providers.find(p => p.name === 'Dify');
  
  // 加载配置数据
  useEffect(() => {
    if (isAdmin) {
      loadConfigData().then(() => {
        setTimeout(() => {
          setIsFullyLoaded(true);
        }, 300);
      });
    }
  }, [isAdmin, loadConfigData]);
  
  // 显示成功反馈
  const showFeedback = (message: string, severity: FeedbackState['severity'] = 'info') => {
    setFeedback({ open: true, message, severity });
    setTimeout(() => setFeedback(prev => ({ ...prev, open: false })), 3000);
  };
  
  // 添加应用实例
  const handleAddInstance = () => {
    setEditingInstance(null);
    setIsAddingInstance(true);
    setInstanceError(null);
  };
  
  // 编辑应用实例
  const handleEditInstance = (instance: ServiceInstance) => {
    setEditingInstance(instance);
    setIsAddingInstance(true);
    setInstanceError(null);
  };
  
  // 删除应用实例
  const handleDeleteInstance = async (instanceId: string) => {
    if (!window.confirm('确定要删除这个应用实例吗？此操作不可恢复。')) {
      return;
    }
    
    setProcessingInstance(true);
    setInstanceError(null);
    
    try {
      await deleteAppInstance(instanceId);
      showFeedback('应用实例已成功删除', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除应用实例时出错';
      setInstanceError(error instanceof Error ? error : new Error(errorMessage));
      showFeedback(errorMessage, 'error');
    } finally {
      setProcessingInstance(false);
    }
  };
  
  // 保存应用实例
  const handleSaveInstance = async (formData: any) => {
    setProcessingInstance(true);
    setInstanceError(null);
    
    try {
      const { apiKey, ...instanceData } = formData;
      
      if (!instanceData.instance_id) {
        throw new Error('应用 ID 不能为空');
      }
      
      if (!instanceData.display_name) {
        throw new Error('显示名称不能为空');
      }
      
      if (!instanceData.name) {
        instanceData.name = instanceData.display_name;
      }
      
      if (editingInstance) {
        await updateAppInstance(editingInstance.id, instanceData, apiKey);
        showFeedback(`应用实例 "${instanceData.display_name}" 已成功更新`, 'success');
      } else {
        await createAppInstance(instanceData, apiKey);
        showFeedback(`应用实例 "${instanceData.display_name}" 已成功创建`, 'success');
      }
      
      setIsAddingInstance(false);
      setEditingInstance(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存应用实例时出错';
      console.error('保存应用实例时出错:', error);
      setInstanceError(error instanceof Error ? error : new Error(errorMessage));
      showFeedback(errorMessage, 'error');
    } finally {
      setProcessingInstance(false);
    }
  };
  
  // 取消添加/编辑
  const handleCancelInstance = () => {
    setIsAddingInstance(false);
    setEditingInstance(null);
    setInstanceError(null);
  };
  
  // 关闭反馈通知
  const handleCloseFeedback = () => {
    setFeedback(prev => ({ ...prev, open: false }));
  };
  
  // 显示加载状态
  if (isAuthLoading || isDataLoading || !isFullyLoaded) {
    return (
      <AdminLayout>
        <div className="font-serif">
          <LoadingSkeleton />
        </div>
      </AdminLayout>
    );
  }
  
  // 显示错误信息
  if (authError) {
    return <ErrorDisplay error={authError} type="auth" />;
  }
  
  // 显示访问被拒绝信息
  if (!isAdmin) {
    return <ErrorDisplay error={new Error('访问被拒绝')} type="access" />;
  }
  
  // 显示数据加载错误
  if (dataError) {
    return <ErrorDisplay error={dataError} type="data" />;
  }
  
  // 显示 API 配置管理界面
  return (
    <AdminLayout>
      <div className="font-serif space-y-8">
        {/* --- BEGIN COMMENT ---
        页面标题和描述
        --- END COMMENT --- */}
        <div className="space-y-2">
          <h1 className={cn(
            "text-3xl md:text-4xl font-bold flex items-center gap-3",
            isDark ? "text-stone-100" : "text-stone-800"
          )}>
            <Settings className="h-8 w-8 md:h-10 md:w-10" />
            API 配置管理
          </h1>
          <p className={cn(
            "text-base md:text-lg",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            管理 Dify 应用实例和 API 密钥配置
          </p>
        </div>

        {/* --- BEGIN COMMENT ---
        API密钥安全提示
        --- END COMMENT --- */}
        <div className={cn(
          "p-4 rounded-lg border-l-4 border-blue-500",
          isDark ? "bg-blue-900/20 text-blue-200" : "bg-blue-50 text-blue-800"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-5 w-5" />
            <span className="font-medium">API 密钥安全说明</span>
          </div>
          <ul className="text-sm space-y-1">
            <li>• API 密钥采用单向加密存储，无法查看已保存的密钥</li>
            <li>• 编辑实例时留空 API 密钥字段将保留现有密钥</li>
            <li>• 请妥善保管您的 API 密钥，避免泄露</li>
          </ul>
        </div>

        {/* --- BEGIN COMMENT ---
        应用实例列表
        --- END COMMENT --- */}
        <div className={cn(
          "rounded-xl border",
          isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
        )}>
          <div className="p-6 border-b border-stone-200 dark:border-stone-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className={cn(
                  "text-xl font-bold",
                  isDark ? "text-stone-100" : "text-stone-900"
                )}>
                  应用实例
                </h2>
                <p className={cn(
                  "text-sm mt-1",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  管理已配置的 Dify 应用实例
                </p>
              </div>
              <button
                onClick={handleAddInstance}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                添加应用实例
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* 添加/编辑表单 */}
            {isAddingInstance && (
              <div className="mb-6">
                <InstanceForm
                  instance={editingInstance}
                  isEditing={!!editingInstance}
                  onSave={handleSaveInstance}
                  onCancel={handleCancelInstance}
                  isProcessing={processingInstance}
                />
              </div>
            )}

            {/* 实例列表 */}
            {serviceInstances.length === 0 ? (
              <div className="text-center py-12">
                <Database className="h-12 w-12 mx-auto mb-4 text-stone-400" />
                <h3 className={cn(
                  "text-lg font-medium mb-2",
                  isDark ? "text-stone-100" : "text-stone-900"
                )}>
                  暂无应用实例
                </h3>
                <p className={cn(
                  "text-sm mb-4",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  点击上方按钮添加第一个 Dify 应用实例
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {serviceInstances.map((instance) => (
                  <div
                    key={instance.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all hover:shadow-md",
                      isDark ? "bg-stone-750 border-stone-600" : "bg-stone-50 border-stone-200"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "font-medium truncate",
                          isDark ? "text-stone-100" : "text-stone-900"
                        )}>
                          {instance.display_name}
                        </h3>
                        <p className={cn(
                          "text-sm text-stone-500 truncate",
                          isDark ? "text-stone-400" : "text-stone-600"
                        )}>
                          ID: {instance.instance_id}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditInstance(instance)}
                          className={cn(
                            "p-2 rounded transition-colors",
                            isDark ? "hover:bg-stone-600 text-stone-300" : "hover:bg-stone-200 text-stone-600"
                          )}
                          title="编辑"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInstance(instance.id)}
                          className="p-2 rounded transition-colors hover:bg-red-100 text-red-600 dark:hover:bg-red-900/20"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {instance.description && (
                      <p className={cn(
                        "text-sm mb-3",
                        isDark ? "text-stone-300" : "text-stone-700"
                      )}>
                        {instance.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm text-stone-500">
                          已配置
                        </span>
                      </div>
                      
                      <span className="text-xs text-stone-400">
                        {new Date(instance.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* 操作反馈通知 */}
        <Toast feedback={feedback} onClose={handleCloseFeedback} />
      </div>
    </AdminLayout>
  );
}