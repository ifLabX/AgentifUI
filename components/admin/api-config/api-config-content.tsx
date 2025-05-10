'use client';

import React from 'react';
import { Box } from '@mui/material';
import { ServiceInstance } from '@lib/stores/api-config-store';
import AppInstanceForm from './app-instance-form';
import AppInstanceList from './app-instance-list';

interface ApiConfigContentProps {
  isAddingInstance: boolean;
  editingInstance: ServiceInstance | null;
  providerId: string;
  serviceInstances: ServiceInstance[];
  processingInstance: boolean;
  instanceError: Error | null;
  onAddInstance: () => void;
  onEditInstance: (instance: ServiceInstance) => void;
  onDeleteInstance: (instanceId: string) => Promise<void>;
  onSaveInstance: (instance: Partial<ServiceInstance> & { apiKey?: string }) => Promise<void>;
  onCancelInstance: () => void;
}

/**
 * API配置内容组件
 * 根据当前状态显示应用实例列表或添加/编辑表单
 */
export default function ApiConfigContent({
  isAddingInstance,
  editingInstance,
  providerId,
  serviceInstances,
  processingInstance,
  instanceError,
  onAddInstance,
  onEditInstance,
  onDeleteInstance,
  onSaveInstance,
  onCancelInstance
}: ApiConfigContentProps) {
  return (
    <Box>
      {isAddingInstance ? (
        <AppInstanceForm 
          instance={editingInstance || undefined}
          providerId={providerId}
          onSave={onSaveInstance}
          onCancel={onCancelInstance}
          isProcessing={processingInstance}
          error={instanceError}
        />
      ) : (
        <AppInstanceList 
          serviceInstances={serviceInstances}
          onAddInstance={onAddInstance}
          onEditInstance={onEditInstance}
          onDeleteInstance={onDeleteInstance}
        />
      )}
    </Box>
  );
}
