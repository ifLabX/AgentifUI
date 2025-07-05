'use client';

import { useApiConfigStore } from '@lib/stores/api-config-store';
import { toast } from 'sonner';

import { useTranslations } from 'next-intl';

// --- 创建实例的保存处理逻辑 ---
export const handleCreateInstance = async (
  data: any,
  providers: any[],
  addInstance: Function,
  setIsProcessing: (value: boolean) => void,
  handleClearSelection: () => void
) => {
  const t = useTranslations('pages.admin.apiConfig.instanceSaveHandlers');
  setIsProcessing(true);

  // --- 提取setAsDefault状态和其他数据 ---
  const { setAsDefault, ...instanceData } = data;

  // --- 使用用户选择的提供商 ---
  const providerId = data.selectedProviderId;
  if (!providerId) {
    toast.error(t('errors.selectProvider'));
    setIsProcessing(false);
    return;
  }

  // 验证选择的提供商是否有效
  const selectedProvider = providers.find(p => p.id === providerId);
  if (!selectedProvider) {
    toast.error(t('errors.invalidProvider'));
    setIsProcessing(false);
    return;
  }

  if (!selectedProvider.is_active) {
    toast.error(t('errors.inactiveProvider'));
    setIsProcessing(false);
    return;
  }

  try {
    const newInstance = await addInstance(
      {
        ...instanceData,
        provider_id: providerId,
      },
      data.apiKey
    );

    toast.success(t('success.instanceCreated'));

    // --- 如果选择了设为默认，则在创建成功后设置为默认应用 ---
    if (setAsDefault && newInstance?.id) {
      try {
        await useApiConfigStore.getState().setDefaultInstance(newInstance.id);
        toast.success(t('success.setAsDefault'));
      } catch (error) {
        console.error('Set default application failed:', error);
        toast.warning(t('warnings.createSuccessButDefaultFailed'));
      }
    }

    handleClearSelection();
  } catch (error) {
    console.error('Create instance failed:', error);
    toast.error(t('errors.createFailed'));
  } finally {
    setIsProcessing(false);
  }
};

// --- 更新实例的保存处理逻辑 ---
export const handleUpdateInstance = async (
  selectedInstance: any,
  data: any,
  updateInstance: Function,
  setIsProcessing: (value: boolean) => void,
  handleClearSelection: () => void
) => {
  const t = useTranslations('pages.admin.apiConfig.instanceSaveHandlers');
  setIsProcessing(true);

  try {
    await updateInstance(selectedInstance.id, data, data.apiKey);
    toast.success(t('success.instanceUpdated'));
    handleClearSelection();
  } catch (error) {
    console.error('Update instance failed:', error);
    toast.error(t('errors.updateFailed'));
  } finally {
    setIsProcessing(false);
  }
};
