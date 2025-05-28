'use client';

import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useAdminAuth } from '@lib/hooks/use-admin-auth';
import { useApiConfigStore, ServiceInstance } from '@lib/stores/api-config-store';
import AdminLayout from '@components/admin/admin-layout';
import { ApiConfigSkeleton } from '@components/ui/skeleton';

// 导入拆分后的组件
import ApiConfigHeader from '@components/admin/api-config/api-config-header';
import ApiKeyInfo from '@components/admin/api-config/api-key-info';
import ApiConfigTabs from '@components/admin/api-config/api-config-tabs';
import ApiConfigContent from '@components/admin/api-config/api-config-content';
import FeedbackNotification from '@components/admin/api-config/feedback-notification';
import { AuthError, AccessDenied, DataError } from '@components/admin/api-config/error-display';

export default function ApiConfigPage() {
  // 使用管理员权限检查 hook
  const { isAdmin, isLoading: isAuthLoading, error: authError } = useAdminAuth();
  
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
  const [tabValue, setTabValue] = useState(0);
  const [isAddingInstance, setIsAddingInstance] = useState(false);
  const [editingInstance, setEditingInstance] = useState<ServiceInstance | null>(null);
  const [processingInstance, setProcessingInstance] = useState(false);
  const [instanceError, setInstanceError] = useState<Error | null>(null);
  
  // 操作反馈状态
  const [feedback, setFeedback] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });
  
  // 找到 Dify 提供商
  const difyProvider = providers.find(p => p.name === 'Dify');
  
  // 加载配置数据
  useEffect(() => {
    if (isAdmin) {
      // 加载数据
      loadConfigData().then(() => {
        // 数据加载完成后设置状态
        setTimeout(() => {
          setIsFullyLoaded(true);
        }, 300); // 添加小延迟确保数据已完全加载到组件
      });
    }
  }, [isAdmin, loadConfigData]);
  
  // 切换标签页
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
      // 显示成功反馈
      setFeedback({
        open: true,
        message: '应用实例已成功删除',
        severity: 'success'
      });
      // 删除成功后会自动重新加载数据
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除应用实例时出错';
      setInstanceError(error instanceof Error ? error : new Error(errorMessage));
      // 显示错误反馈
      setFeedback({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setProcessingInstance(false);
    }
  };
  
  // 保存应用实例
  const handleSaveInstance = async (instance: Partial<ServiceInstance> & { apiKey?: string }) => {
    setProcessingInstance(true);
    setInstanceError(null);
    
    try {
      const { apiKey, ...instanceData } = instance;
      
      // 确保实例数据完整
      if (!instanceData.instance_id) {
        throw new Error('应用 ID 不能为空');
      }
      
      if (!instanceData.display_name) {
        throw new Error('显示名称不能为空');
      }
      
      // 如果没有设置 name，使用 display_name
      if (!instanceData.name) {
        instanceData.name = instanceData.display_name;
      }
      
      if (editingInstance) {
        // 更新现有实例
        await updateAppInstance(editingInstance.id, instanceData, apiKey);
        // 显示成功反馈
        setFeedback({
          open: true,
          message: `应用实例 "${instanceData.display_name}" 已成功更新`,
          severity: 'success'
        });
      } else {
        // 创建新实例
        await createAppInstance(instanceData, apiKey);
        // 显示成功反馈
        setFeedback({
          open: true,
          message: `应用实例 "${instanceData.display_name}" 已成功创建`,
          severity: 'success'
        });
      }
      
      // 重新加载数据已在函数内完成
      
      // 关闭表单
      setIsAddingInstance(false);
      setEditingInstance(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存应用实例时出错';
      console.error('保存应用实例时出错:', error);
      setInstanceError(error instanceof Error ? error : new Error(errorMessage));
      // 显示错误反馈
      setFeedback({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
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
        <Box sx={{ p: 3 }} className="font-serif">
          {/* 使用骨架屏代替简单的加载指示器 */}
          <ApiConfigSkeleton />
        </Box>
      </AdminLayout>
    );
  }
  
  // 显示错误信息
  if (authError) {
    return <AuthError message={authError.message} />;
  }
  
  // 显示访问被拒绝信息
  if (!isAdmin) {
    return <AccessDenied />;
  }
  
  // 显示数据加载错误
  if (dataError) {
    return (
      <DataError 
        message={dataError.message}
        serviceInstances={serviceInstances}
        onAddInstance={handleAddInstance}
        onEditInstance={handleEditInstance}
        onDeleteInstance={handleDeleteInstance}
      />
    );
  }
  
  // 显示 API 配置管理界面
  return (
    <AdminLayout>
      <div className="font-serif">
        {/* 标题和描述 */}
        <ApiConfigHeader />
        
        {/* API密钥单向配置的提示信息 */}
        <ApiKeyInfo />
        
        {/* 标签页切换 */}
        <ApiConfigTabs value={tabValue} onChange={handleTabChange} />
        
        {/* 根据标签页显示相应内容 */}
        {tabValue === 0 && (
          <ApiConfigContent
            isAddingInstance={isAddingInstance}
            editingInstance={editingInstance}
            providerId={difyProvider?.id || ''}
            serviceInstances={serviceInstances}
            processingInstance={processingInstance}
            instanceError={instanceError}
            onAddInstance={handleAddInstance}
            onEditInstance={handleEditInstance}
            onDeleteInstance={handleDeleteInstance}
            onSaveInstance={handleSaveInstance}
            onCancelInstance={handleCancelInstance}
          />
        )}
        
        {/* 操作反馈通知 */}
        <FeedbackNotification
          open={feedback.open}
          message={feedback.message}
          severity={feedback.severity}
          onClose={handleCloseFeedback}
        />
      </div>
    </AdminLayout>
  );
}