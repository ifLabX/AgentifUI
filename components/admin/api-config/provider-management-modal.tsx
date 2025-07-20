'use client';

import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Switch } from '@components/ui/switch';
import {
  createProvider,
  deleteProvider,
  getAllProviders,
  updateProvider,
} from '@lib/db/providers';
import { useTheme } from '@lib/hooks/use-theme';
import { Provider } from '@lib/types/database';
import { cn } from '@lib/utils';
import { Edit, Plus, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import React, { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

// Provider type enumeration, based on database analysis suggestions
const PROVIDER_TYPES = [
  { value: 'llm', label: 'LLM (Large Language Model)' },
  { value: 'platform', label: 'Platform (Aggregation Platform)' },
  { value: 'embedding', label: 'Embedding (Vectorization)' },
  { value: 'tts', label: 'TTS (Text-to-Speech)' },
  { value: 'stt', label: 'STT (Speech-to-Text)' },
  { value: 'vision', label: 'Vision (Image Recognition)' },
  { value: 'multimodal', label: 'Multimodal (Multimodal)' },
] as const;

// Authentication type enumeration
const AUTH_TYPES = [
  { value: 'api_key', label: 'API Key' },
  { value: 'bearer_token', label: 'Bearer Token' },
  { value: 'oauth2', label: 'OAuth 2.0' },
  { value: 'basic_auth', label: 'Basic Auth' },
] as const;

interface ProviderFormData {
  name: string;
  type: string;
  base_url: string;
  auth_type: string;
  is_active: boolean;
  is_default: boolean;
}

interface ProviderManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProviderChange?: () => void;
}

export function ProviderManagementModal({
  open,
  onOpenChange,
  onProviderChange,
}: ProviderManagementModalProps) {
  const { isDark } = useTheme();
  const t = useTranslations('pages.admin.apiConfig.providerManagement.modal');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<ProviderFormData>({
    name: '',
    type: 'llm',
    base_url: '',
    auth_type: 'api_key',
    is_active: true,
    is_default: false,
  });
  const [errors, setErrors] = useState<Partial<ProviderFormData>>({});

  const loadProviders = async () => {
    setLoading(true);
    try {
      const result = await getAllProviders();
      if (result.success) {
        setProviders(result.data);
      } else {
        toast.error(t('messages.loadFailed'));
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
      toast.error(t('messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadProviders();
    }
  }, [open, loadProviders]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ProviderFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('form.name.required');
    }

    if (!formData.type) {
      newErrors.type = t('form.type.required');
    }

    if (!formData.base_url.trim()) {
      newErrors.base_url = t('form.baseUrl.required');
    } else {
      try {
        new URL(formData.base_url);
      } catch {
        newErrors.base_url = t('form.baseUrl.invalid');
      }
    }

    if (!formData.auth_type) {
      newErrors.auth_type = t('form.authType.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'llm',
      base_url: '',
      auth_type: 'api_key',
      is_active: true,
      is_default: false,
    });
    setErrors({});
    setEditingProvider(null);
    setIsCreating(false);
  };

  const startCreating = () => {
    resetForm();
    setIsCreating(true);
  };

  const startEditing = (provider: Provider) => {
    setFormData({
      name: provider.name,
      type: provider.type,
      base_url: provider.base_url,
      auth_type: provider.auth_type,
      is_active: provider.is_active,
      is_default: provider.is_default,
    });
    setEditingProvider(provider);
    setIsCreating(false);
    setErrors({});
  };

  const saveProvider = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isCreating) {
        const result = await createProvider(formData);
        if (result.success) {
          toast.success(t('messages.createSuccess'));
          await loadProviders();
          resetForm();
          onProviderChange?.();
        } else {
          toast.error(t('messages.createFailed'));
        }
      } else if (editingProvider) {
        const result = await updateProvider(editingProvider.id, formData);
        if (result.success) {
          toast.success(t('messages.updateSuccess'));
          await loadProviders();
          resetForm();
          onProviderChange?.();
        } else {
          toast.error(t('messages.updateFailed'));
        }
      }
    } catch (error) {
      console.error('Failed to save provider:', error);
      toast.error(t('messages.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProvider = async (provider: Provider) => {
    if (!confirm(t('deleteConfirm', { name: provider.name }))) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteProvider(provider.id);
      if (result.success) {
        toast.success(t('messages.deleteSuccess'));
        await loadProviders();
        onProviderChange?.();
      } else {
        toast.error(t('messages.deleteFailed'));
      }
    } catch (error) {
      console.error('Failed to delete provider:', error);
      toast.error(t('messages.deleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{t('providerList')}</h3>
            <Button
              onClick={startCreating}
              disabled={loading || isCreating || editingProvider !== null}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('addProvider')}
            </Button>
          </div>

          <div className="space-y-3">
            {loading && providers.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                {t('loading')}
              </div>
            ) : providers.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                {t('noProviders')}
              </div>
            ) : (
              providers.map(provider => (
                <div
                  key={provider.id}
                  className={cn(
                    'space-y-3 rounded-lg border p-4 transition-colors',
                    isDark
                      ? 'border-stone-600 bg-stone-800/50'
                      : 'border-stone-200 bg-white',
                    editingProvider?.id === provider.id &&
                      (isDark
                        ? 'border-stone-400 bg-stone-700/50'
                        : 'border-stone-500 bg-stone-100/50')
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4
                        className={cn(
                          'font-serif font-medium',
                          isDark ? 'text-stone-100' : 'text-stone-900'
                        )}
                      >
                        {provider.name}
                      </h4>
                      <span
                        className={cn(
                          'rounded-full px-2 py-1 font-serif text-xs',
                          isDark
                            ? 'bg-stone-700 text-stone-300'
                            : 'bg-stone-100 text-stone-700'
                        )}
                      >
                        {t(`providerTypes.${provider.type}`)}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-1 font-serif text-xs',
                          provider.is_active
                            ? isDark
                              ? 'border border-green-700 bg-green-900/50 text-green-300'
                              : 'bg-green-100 text-green-700'
                            : isDark
                              ? 'border border-red-700 bg-red-900/50 text-red-300'
                              : 'bg-red-100 text-red-700'
                        )}
                      >
                        {provider.is_active
                          ? t('status.enabled')
                          : t('status.disabled')}
                      </span>
                      {provider.is_default && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-1 font-serif text-xs',
                            isDark
                              ? 'border border-stone-400 bg-stone-500/50 text-stone-200'
                              : 'bg-stone-200 text-stone-800'
                          )}
                        >
                          {t('status.default')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(provider)}
                        disabled={
                          loading || isCreating || editingProvider !== null
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProvider(provider)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'font-serif text-sm',
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    )}
                  >
                    <p>
                      <strong>API URL:</strong> {provider.base_url}
                    </p>
                    <p>
                      <strong>{t('form.authMethod')}:</strong>{' '}
                      {t(`authTypes.${provider.auth_type}`)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {(isCreating || editingProvider) && (
            <div className="border-t pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {isCreating ? t('addNewProvider') : t('editProvider')}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('form.name.label')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                    }
                    placeholder={t('form.name.placeholder')}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">{t('form.type.label')} *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger
                      className={errors.type ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder={t('form.type.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDER_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {t(`providerTypes.${type.value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-600">{errors.type}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="base_url">{t('form.baseUrl.label')} *</Label>
                  <Input
                    id="base_url"
                    value={formData.base_url}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        base_url: e.target.value,
                      }))
                    }
                    placeholder={t('form.baseUrl.placeholder')}
                    className={errors.base_url ? 'border-red-500' : ''}
                  />
                  {errors.base_url && (
                    <p className="text-sm text-red-600">{errors.base_url}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auth_type">
                    {t('form.authType.label')} *
                  </Label>
                  <Select
                    value={formData.auth_type}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, auth_type: value }))
                    }
                  >
                    <SelectTrigger
                      className={errors.auth_type ? 'border-red-500' : ''}
                    >
                      <SelectValue
                        placeholder={t('form.authType.placeholder')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTH_TYPES.map(auth => (
                        <SelectItem key={auth.value} value={auth.value}>
                          {t(`authTypes.${auth.value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.auth_type && (
                    <p className="text-sm text-red-600">{errors.auth_type}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_active">{t('form.isActive.label')}</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={checked =>
                        setFormData(prev => ({ ...prev, is_active: checked }))
                      }
                    />
                    <span className="text-muted-foreground text-sm">
                      {formData.is_active
                        ? t('status.enabled')
                        : t('status.disabled')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_default">
                    {t('form.isDefault.label')}
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default"
                      checked={formData.is_default}
                      onCheckedChange={checked =>
                        setFormData(prev => ({ ...prev, is_default: checked }))
                      }
                    />
                    <span className="text-muted-foreground text-sm">
                      {formData.is_default
                        ? t('form.isDefault.setAsDefault')
                        : t('form.isDefault.notDefault')}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {t('form.isDefault.description')}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={loading}
                >
                  {t('buttons.cancel')}
                </Button>
                <Button
                  onClick={saveProvider}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? t('buttons.saving') : t('buttons.save')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
