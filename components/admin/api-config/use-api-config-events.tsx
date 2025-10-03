'use client';

import { ServiceInstance } from '@lib/stores/api-config-store';
import { toast } from 'sonner';

import { useEffect } from 'react';

import { useTranslations } from 'next-intl';

interface UseApiConfigEventsProps {
  showAddForm: boolean;
  selectedInstance: ServiceInstance | null;
  setSelectedInstance: (instance: ServiceInstance | null) => void;
  setShowAddForm: (show: boolean) => void;
  setCurrentFilterProviderId: (id: string | null) => void;
}

export const useApiConfigEvents = ({
  showAddForm,
  selectedInstance,
  setSelectedInstance,
  setShowAddForm,
  setCurrentFilterProviderId,
}: UseApiConfigEventsProps) => {
  const t = useTranslations('pages.admin.apiConfig.useApiConfigEvents');
  useEffect(() => {
    const handleSelectInstance = (event: CustomEvent) => {
      const instance = event.detail as ServiceInstance;
      setSelectedInstance(instance);
      setShowAddForm(false);
    };

    const handleToggleAddForm = () => {
      if (showAddForm) {
        setShowAddForm(false);
        setSelectedInstance(null);
      } else {
        setSelectedInstance(null);
        setShowAddForm(true);
      }
    };

    const handleInstanceDeleted = (event: CustomEvent) => {
      const { instanceId } = event.detail;
      if (selectedInstance?.instance_id === instanceId) {
        setSelectedInstance(null);
        setShowAddForm(false);
      }
    };

    const handleDefaultInstanceChanged = () => {
      toast.success(t('defaultInstanceSetSuccess'));

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('reloadInstances'));
      }, 100);
    };

    const handleFilterChanged = (event: CustomEvent) => {
      const { providerId } = event.detail;
      setCurrentFilterProviderId(providerId);
    };

    window.addEventListener(
      'selectInstance',
      handleSelectInstance as EventListener
    );
    window.addEventListener('toggleAddForm', handleToggleAddForm);
    window.addEventListener(
      'instanceDeleted',
      handleInstanceDeleted as EventListener
    );
    window.addEventListener(
      'defaultInstanceChanged',
      handleDefaultInstanceChanged as EventListener
    );
    window.addEventListener(
      'filterChanged',
      handleFilterChanged as EventListener
    );

    return () => {
      window.removeEventListener(
        'selectInstance',
        handleSelectInstance as EventListener
      );
      window.removeEventListener('toggleAddForm', handleToggleAddForm);
      window.removeEventListener(
        'instanceDeleted',
        handleInstanceDeleted as EventListener
      );
      window.removeEventListener(
        'defaultInstanceChanged',
        handleDefaultInstanceChanged as EventListener
      );
      window.removeEventListener(
        'filterChanged',
        handleFilterChanged as EventListener
      );
    };
  }, [
    showAddForm,
    selectedInstance,
    setSelectedInstance,
    setShowAddForm,
    setCurrentFilterProviderId,
    t,
  ]);
};
