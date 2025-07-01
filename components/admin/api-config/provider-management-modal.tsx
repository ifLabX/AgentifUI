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
import { Textarea } from '@components/ui/textarea';
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
import { toast } from 'react-hot-toast';

import React, { useEffect, useState } from 'react';

// --- BEGIN COMMENT ---
// 提供商类型枚举，基于数据库分析的建议
// --- END COMMENT ---
const PROVIDER_TYPES = [
  { value: 'llm', label: 'LLM (大语言模型)' },
  { value: 'platform', label: 'Platform (聚合平台)' },
  { value: 'embedding', label: 'Embedding (向量化)' },
  { value: 'tts', label: 'TTS (文本转语音)' },
  { value: 'stt', label: 'STT (语音转文本)' },
  { value: 'vision', label: 'Vision (图像识别)' },
  { value: 'multimodal', label: 'Multimodal (多模态)' },
] as const;

// --- BEGIN COMMENT ---
// 认证类型枚举
// --- END COMMENT ---
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

  // --- BEGIN COMMENT ---
  // 加载提供商列表
  // --- END COMMENT ---
  const loadProviders = async () => {
    setLoading(true);
    try {
      const result = await getAllProviders();
      if (result.success) {
        setProviders(result.data);
      } else {
        toast.error('加载提供商列表失败');
      }
    } catch (error) {
      console.error('加载提供商失败:', error);
      toast.error('加载提供商列表失败');
    } finally {
      setLoading(false);
    }
  };

  // --- BEGIN COMMENT ---
  // 组件挂载时加载数据
  // --- END COMMENT ---
  useEffect(() => {
    if (open) {
      loadProviders();
    }
  }, [open]);

  // --- BEGIN COMMENT ---
  // 表单验证函数
  // --- END COMMENT ---
  const validateForm = (): boolean => {
    const newErrors: Partial<ProviderFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = '提供商名称不能为空';
    }

    if (!formData.type) {
      newErrors.type = '请选择提供商类型';
    }

    if (!formData.base_url.trim()) {
      newErrors.base_url = 'API URL不能为空';
    } else {
      // 简单的URL格式验证
      try {
        new URL(formData.base_url);
      } catch {
        newErrors.base_url = '请输入有效的URL格式';
      }
    }

    if (!formData.auth_type) {
      newErrors.auth_type = '请选择认证类型';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- BEGIN COMMENT ---
  // 重置表单
  // --- END COMMENT ---
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

  // --- BEGIN COMMENT ---
  // 开始创建新提供商
  // --- END COMMENT ---
  const startCreating = () => {
    resetForm();
    setIsCreating(true);
  };

  // --- BEGIN COMMENT ---
  // 开始编辑提供商
  // --- END COMMENT ---
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

  // --- BEGIN COMMENT ---
  // 保存提供商（创建或更新）
  // --- END COMMENT ---
  const saveProvider = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isCreating) {
        // 创建新提供商
        const result = await createProvider(formData);
        if (result.success) {
          toast.success('提供商创建成功');
          await loadProviders();
          resetForm();
          onProviderChange?.();
        } else {
          toast.error('创建提供商失败');
        }
      } else if (editingProvider) {
        // 更新现有提供商
        const result = await updateProvider(editingProvider.id, formData);
        if (result.success) {
          toast.success('提供商更新成功');
          await loadProviders();
          resetForm();
          onProviderChange?.();
        } else {
          toast.error('更新提供商失败');
        }
      }
    } catch (error) {
      console.error('保存提供商失败:', error);
      toast.error('保存提供商失败');
    } finally {
      setLoading(false);
    }
  };

  // --- BEGIN COMMENT ---
  // 删除提供商
  // --- END COMMENT ---
  const handleDeleteProvider = async (provider: Provider) => {
    if (!confirm(`确定要删除提供商"${provider.name}"吗？此操作不可撤销。`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteProvider(provider.id);
      if (result.success) {
        toast.success('提供商删除成功');
        await loadProviders();
        onProviderChange?.();
      } else {
        toast.error('删除提供商失败');
      }
    } catch (error) {
      console.error('删除提供商失败:', error);
      toast.error('删除提供商失败');
    } finally {
      setLoading(false);
    }
  };

  // --- BEGIN COMMENT ---
  // 处理模态框关闭
  // --- END COMMENT ---
  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>管理服务提供商</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* --- 创建新提供商按钮 --- */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">提供商列表</h3>
            <Button
              onClick={startCreating}
              disabled={loading || isCreating || editingProvider !== null}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              添加提供商
            </Button>
          </div>

          {/* --- 提供商列表 --- */}
          <div className="space-y-3">
            {loading && providers.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                加载中...
              </div>
            ) : providers.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                暂无提供商配置
              </div>
            ) : (
              providers.map(provider => (
                <div
                  key={provider.id}
                  className={cn(
                    'space-y-3 rounded-lg border p-4 transition-colors',
                    // 基础样式
                    isDark
                      ? 'border-stone-600 bg-stone-800/50'
                      : 'border-stone-200 bg-white',
                    // 编辑状态样式
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
                        {PROVIDER_TYPES.find(t => t.value === provider.type)
                          ?.label || provider.type}
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
                        {provider.is_active ? '已启用' : '已禁用'}
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
                          默认提供商
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
                      <strong>认证方式:</strong>{' '}
                      {AUTH_TYPES.find(a => a.value === provider.auth_type)
                        ?.label || provider.auth_type}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* --- 创建/编辑表单 --- */}
          {(isCreating || editingProvider) && (
            <div className="border-t pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {isCreating ? '添加新提供商' : '编辑提供商'}
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
                {/* --- 提供商名称 --- */}
                <div className="space-y-2">
                  <Label htmlFor="name">提供商名称 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="例如：Dify、OpenAI、Claude"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* --- 提供商类型 --- */}
                <div className="space-y-2">
                  <Label htmlFor="type">提供商类型 *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger
                      className={errors.type ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="选择提供商类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDER_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-600">{errors.type}</p>
                  )}
                </div>

                {/* --- API URL --- */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="base_url">API URL *</Label>
                  <Input
                    id="base_url"
                    value={formData.base_url}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        base_url: e.target.value,
                      }))
                    }
                    placeholder="例如：https://api.dify.ai/v1"
                    className={errors.base_url ? 'border-red-500' : ''}
                  />
                  {errors.base_url && (
                    <p className="text-sm text-red-600">{errors.base_url}</p>
                  )}
                </div>

                {/* --- 认证类型 --- */}
                <div className="space-y-2">
                  <Label htmlFor="auth_type">认证类型 *</Label>
                  <Select
                    value={formData.auth_type}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, auth_type: value }))
                    }
                  >
                    <SelectTrigger
                      className={errors.auth_type ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="选择认证类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTH_TYPES.map(auth => (
                        <SelectItem key={auth.value} value={auth.value}>
                          {auth.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.auth_type && (
                    <p className="text-sm text-red-600">{errors.auth_type}</p>
                  )}
                </div>

                {/* --- 是否启用 --- */}
                <div className="space-y-2">
                  <Label htmlFor="is_active">启用状态</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={checked =>
                        setFormData(prev => ({ ...prev, is_active: checked }))
                      }
                    />
                    <span className="text-muted-foreground text-sm">
                      {formData.is_active ? '已启用' : '已禁用'}
                    </span>
                  </div>
                </div>

                {/* --- 是否设为默认 --- */}
                <div className="space-y-2">
                  <Label htmlFor="is_default">默认提供商</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default"
                      checked={formData.is_default}
                      onCheckedChange={checked =>
                        setFormData(prev => ({ ...prev, is_default: checked }))
                      }
                    />
                    <span className="text-muted-foreground text-sm">
                      {formData.is_default ? '设为默认' : '非默认'}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    系统中只能有一个默认提供商，设置后其他提供商的默认状态将被自动清除
                  </p>
                </div>
              </div>

              {/* --- 保存按钮 --- */}
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button
                  onClick={saveProvider}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
