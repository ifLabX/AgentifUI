'use client';

import { useApiConfigStore } from '@lib/stores/api-config-store';
import { toast } from 'sonner';

export const handleCreateInstance = async (
  data: any,
  providers: any[],
  addInstance: Function,
  setIsProcessing: (value: boolean) => void,
  handleClearSelection: () => void,
  t: (key: string) => string
) => {
  setIsProcessing(true);

  // Extract setAsDefault state and other data
  const { setAsDefault, ...instanceData } = data;

  // Use the user-selected provider
  const providerId = data.selectedProviderId;
  if (!providerId) {
    toast.error(t('errors.selectProvider'));
    setIsProcessing(false);
    return;
  }

  // Verify if the selected provider is valid
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

    // If setAsDefault is true, set the new instance as the default application after creation
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

// Update instance save processing logic
export const handleUpdateInstance = async (
  selectedInstance: any,
  data: any,
  updateInstance: Function,
  setIsProcessing: (value: boolean) => void,
  handleClearSelection: () => void,
  t: (key: string) => string
) => {
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
