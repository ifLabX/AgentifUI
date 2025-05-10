'use client';

import React from 'react';
import { Alert, AlertTitle } from '@mui/material';
import AdminLayout from '@components/admin/admin-layout';
import AppInstanceList from './app-instance-list';
import { ServiceInstance } from '@lib/stores/api-config-store';

interface AuthErrorProps {
  message: string;
}

/**
 * 权限验证错误组件
 */
export function AuthError({ message }: AuthErrorProps) {
  return (
    <AdminLayout>
      <Alert severity="error">
        <AlertTitle>权限验证错误</AlertTitle>
        {message}
      </Alert>
    </AdminLayout>
  );
}

/**
 * 访问被拒绝组件
 */
export function AccessDenied() {
  return (
    <AdminLayout>
      <Alert severity="error">
        <AlertTitle>访问被拒绝</AlertTitle>
        您没有管理员权限访问此页面。
      </Alert>
    </AdminLayout>
  );
}

interface DataErrorProps {
  message: string;
  serviceInstances: ServiceInstance[];
  onAddInstance: () => void;
  onEditInstance: (instance: ServiceInstance) => void;
  onDeleteInstance: (instanceId: string) => Promise<void>;
}

/**
 * 数据加载错误组件
 * 显示错误信息并尝试显示已加载的应用实例列表
 */
export function DataError({ 
  message, 
  serviceInstances,
  onAddInstance,
  onEditInstance,
  onDeleteInstance
}: DataErrorProps) {
  return (
    <AdminLayout>
      <Alert severity="error" sx={{ mb: 3 }}>
        <AlertTitle>数据加载错误</AlertTitle>
        {message}
      </Alert>
      
      {/* 显示应用实例列表，即使有错误 */}
      <AppInstanceList 
        serviceInstances={serviceInstances}
        onAddInstance={onAddInstance}
        onEditInstance={onEditInstance}
        onDeleteInstance={onDeleteInstance}
      />
    </AdminLayout>
  );
}
