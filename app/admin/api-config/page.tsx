'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  AlertTitle,
  Container,
  Tabs,
  Tab
} from '@mui/material';
import { useAdminAuth } from '@lib/hooks/use-admin-auth';
import { useApiConfigStore, ServiceInstance } from '@lib/stores/api-config-store';
import AdminLayout from '@components/admin/admin-layout';
import AppInstanceList from '@components/admin/app-instance-list';
import AppInstanceForm from '@components/admin/app-instance-form';
import CurrentDifyConfig from '@components/admin/current-dify-config';

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
  
  // 组件状态
  const [tabValue, setTabValue] = useState(0);
  const [isAddingInstance, setIsAddingInstance] = useState(false);
  const [editingInstance, setEditingInstance] = useState<ServiceInstance | null>(null);
  const [processingInstance, setProcessingInstance] = useState(false);
  const [instanceError, setInstanceError] = useState<Error | null>(null);
  
  // 找到 Dify 提供商
  const difyProvider = providers.find(p => p.name === 'Dify');
  
  // 加载配置数据
  useEffect(() => {
    if (isAdmin) {
      loadConfigData();
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
      // 删除成功后会自动重新加载数据
    } catch (error) {
      setInstanceError(error instanceof Error ? error : new Error('删除应用实例时出错'));
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
        console.log('已更新应用实例:', instanceData.display_name);
      } else {
        // 创建新实例
        await createAppInstance(instanceData, apiKey);
        console.log('已创建新应用实例:', instanceData.display_name);
      }
      
      // 重新加载数据已在函数内完成
      
      // 关闭表单
      setIsAddingInstance(false);
      setEditingInstance(null);
    } catch (error) {
      console.error('保存应用实例时出错:', error);
      setInstanceError(error instanceof Error ? error : new Error('保存应用实例时出错'));
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
  
  // 显示加载状态
  if (isAuthLoading || isDataLoading) {
    return (
      <AdminLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            加载中...
          </Typography>
        </Box>
      </AdminLayout>
    );
  }
  
  // 显示错误信息
  if (authError) {
    return (
      <AdminLayout>
        <Alert severity="error">
          <AlertTitle>权限验证错误</AlertTitle>
          {authError.message}
        </Alert>
      </AdminLayout>
    );
  }
  
  // 显示访问被拒绝信息
  if (!isAdmin) {
    return (
      <AdminLayout>
        <Alert severity="error">
          <AlertTitle>访问被拒绝</AlertTitle>
          您没有管理员权限访问此页面。
        </Alert>
      </AdminLayout>
    );
  }
  
  // 显示数据加载错误
  if (dataError) {
    return (
      <AdminLayout>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>数据加载错误</AlertTitle>
          {dataError.message}
        </Alert>
        
        {/* 显示应用实例列表，即使有错误 */}
        <AppInstanceList 
          serviceInstances={serviceInstances}
          onAddInstance={handleAddInstance}
          onEditInstance={handleEditInstance}
          onDeleteInstance={handleDeleteInstance}
        />
      </AdminLayout>
    );
  }
  
  // 显示 API 配置管理界面
  return (
    <AdminLayout>
      <Typography variant="h4" component="h1" gutterBottom>
        API 配置管理
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        管理应用程序使用的 API 密钥和配置
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Dify 应用" />
          <Tab label="全局设置" disabled />
        </Tabs>
      </Box>
      
      {tabValue === 0 && (
        <Box>
          {/* 显示当前 Dify 配置 */}
          <CurrentDifyConfig />
          
          {isAddingInstance ? (
            <AppInstanceForm 
              instance={editingInstance || undefined}
              providerId={difyProvider?.id || ''}
              onSave={handleSaveInstance}
              onCancel={handleCancelInstance}
              isProcessing={processingInstance}
              error={instanceError}
            />
          ) : (
            <AppInstanceList 
              serviceInstances={serviceInstances}
              onAddInstance={handleAddInstance}
              onEditInstance={handleEditInstance}
              onDeleteInstance={handleDeleteInstance}
            />
          )}
        </Box>
      )}
    </AdminLayout>
  );
}