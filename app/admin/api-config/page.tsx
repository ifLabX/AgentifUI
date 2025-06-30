'use client';

import { CustomProviderSelector } from '@components/admin/api-config/custom-provider-selector';
import { DifyAppTypeSelector } from '@components/admin/api-config/dify-app-type-selector';
import DifyParametersPanel from '@components/admin/api-config/dify-parameters-panel';
import { ProviderManagementModal } from '@components/admin/api-config/provider-management-modal';
import { KeyCombination } from '@components/ui/adaptive-key-badge';
import { useFormattedShortcut } from '@lib/hooks/use-platform-keys';
import { useTheme } from '@lib/hooks/use-theme';
// import { getDifyAppParameters } from '@lib/services/dify/app-service'; // 移除直接导入，改为动态导入保持一致性
import type { DifyAppParametersResponse } from '@lib/services/dify/types';
import { validateDifyFormData } from '@lib/services/dify/validation';
import {
  ServiceInstance,
  useApiConfigStore,
} from '@lib/stores/api-config-store';
import type { DifyAppType } from '@lib/types/dify-app-types';
import type { DifyParametersSimplifiedConfig } from '@lib/types/dify-parameters';
import { cn } from '@lib/utils';
import {
  AlertCircle,
  CheckCircle,
  Database,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Key,
  Lightbulb,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Sliders,
  Star,
  Trash2,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

import React, { useEffect, useState } from 'react';

interface ApiConfigPageProps {
  selectedInstance?: ServiceInstance | null;
  showAddForm?: boolean;
  onClearSelection?: () => void;
  instances?: ServiceInstance[];
}

const InstanceForm = ({
  instance,
  isEditing,
  onSave,
  onCancel,
  isProcessing,
  defaultProviderId,
}: {
  instance: Partial<ServiceInstance> | null;
  isEditing: boolean;
  onSave: (data: any) => void;
  onCancel: () => void;
  isProcessing: boolean;
  defaultProviderId?: string | null;
}) => {
  const { isDark } = useTheme();
  const { serviceInstances, apiKeys, providers } = useApiConfigStore();

  // --- BEGIN COMMENT ---
  // 新建模式下的提供商选择状态
  // --- END COMMENT ---
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');

  // --- BEGIN COMMENT ---
  // 监听提供商选择变化，自动更新API URL
  // --- END COMMENT ---
  useEffect(() => {
    if (!isEditing && selectedProviderId) {
      const selectedProvider = providers.find(p => p.id === selectedProviderId);
      if (selectedProvider && selectedProvider.base_url) {
        setFormData(prev => ({
          ...prev,
          config: {
            ...prev.config,
            api_url: selectedProvider.base_url,
          },
        }));
      }
    }
  }, [selectedProviderId, providers, isEditing]);

  // --- 获取当前实例的最新状态 ---
  const currentInstance = instance
    ? serviceInstances.find(inst => inst.id === instance.id)
    : null;
  const isCurrentDefault = currentInstance?.is_default || false;

  // --- 检查当前实例是否已配置API密钥 ---
  const hasApiKey = instance
    ? apiKeys.some(key => key.service_instance_id === instance.id)
    : false;

  const [formData, setFormData] = useState({
    instance_id: instance?.instance_id || '',
    display_name: instance?.display_name || '',
    description: instance?.description || '',
    api_path: instance?.api_path || '',
    apiKey: '',
    config: {
      api_url: instance?.config?.api_url || '',
      app_metadata: {
        app_type:
          (instance?.config?.app_metadata?.app_type as
            | 'model'
            | 'marketplace') || 'model',
        dify_apptype:
          (instance?.config?.app_metadata?.dify_apptype as
            | 'chatbot'
            | 'agent'
            | 'chatflow'
            | 'workflow'
            | 'text-generation') || 'chatbot',
        tags: instance?.config?.app_metadata?.tags || [],
      },
      dify_parameters: instance?.config?.dify_parameters || {},
    },
  });

  // --- BEGIN COMMENT ---
  // 🎯 新增：基准数据状态，用于正确判断是否有未保存的更改
  // 当同步参数或重置表单时，需要更新这个基准数据
  // --- END COMMENT ---
  const [baselineData, setBaselineData] = useState({
    instance_id: instance?.instance_id || '',
    display_name: instance?.display_name || '',
    description: instance?.description || '',
    api_path: instance?.api_path || '',
    apiKey: '',
    config: {
      api_url: instance?.config?.api_url || '',
      app_metadata: {
        app_type:
          (instance?.config?.app_metadata?.app_type as
            | 'model'
            | 'marketplace') || 'model',
        dify_apptype:
          (instance?.config?.app_metadata?.dify_apptype as
            | 'chatbot'
            | 'agent'
            | 'chatflow'
            | 'workflow'
            | 'text-generation') || 'chatbot',
        tags: instance?.config?.app_metadata?.tags || [],
      },
      dify_parameters: instance?.config?.dify_parameters || {},
    },
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [showDifyPanel, setShowDifyPanel] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- BEGIN COMMENT ---
  // 🎯 新增：实时验证instance_id格式
  // --- END COMMENT ---
  const [instanceIdError, setInstanceIdError] = useState<string>('');

  // --- BEGIN COMMENT ---
  // 🎯 实时验证instance_id格式的函数
  // --- END COMMENT ---
  const validateInstanceId = (value: string) => {
    if (!value.trim()) {
      setInstanceIdError('');
      return;
    }

    const instanceId = value.trim();

    // 检查是否包含空格
    if (instanceId.includes(' ')) {
      setInstanceIdError('不能包含空格（会影响URL路由）');
      return;
    }

    // 检查是否包含其他需要URL编码的特殊字符
    const urlUnsafeChars = /[^a-zA-Z0-9\-_\.]/;
    if (urlUnsafeChars.test(instanceId)) {
      setInstanceIdError('只能包含字母、数字、连字符(-)、下划线(_)和点(.)');
      return;
    }

    // 检查长度限制
    if (instanceId.length > 50) {
      setInstanceIdError('长度不能超过50个字符');
      return;
    }

    // 检查是否以字母或数字开头
    if (!/^[a-zA-Z0-9]/.test(instanceId)) {
      setInstanceIdError('必须以字母或数字开头');
      return;
    }

    // 所有验证通过
    setInstanceIdError('');
  };

  // --- BEGIN COMMENT ---
  // 🎯 获取保存快捷键信息
  // --- END COMMENT ---
  const saveShortcut = useFormattedShortcut('SAVE_SUBMIT');

  useEffect(() => {
    const newData = {
      instance_id: instance?.instance_id || '',
      display_name: instance?.display_name || '',
      description: instance?.description || '',
      api_path: instance?.api_path || '',
      apiKey: '',
      config: {
        api_url: instance?.config?.api_url || '',
        app_metadata: {
          app_type:
            (instance?.config?.app_metadata?.app_type as
              | 'model'
              | 'marketplace') || 'model',
          dify_apptype:
            (instance?.config?.app_metadata?.dify_apptype as
              | 'chatbot'
              | 'agent'
              | 'chatflow'
              | 'workflow'
              | 'text-generation') || 'chatbot',
          tags: instance?.config?.app_metadata?.tags || [],
        },
        dify_parameters: instance?.config?.dify_parameters || {},
      },
    };

    if (instance) {
      // --- BEGIN COMMENT ---
      // 编辑模式：如果API URL为空，使用提供商的base_url
      // --- END COMMENT ---
      if (!newData.config.api_url && instance.provider_id) {
        const currentProvider = providers.find(
          p => p.id === instance.provider_id
        );
        if (currentProvider && currentProvider.base_url) {
          newData.config.api_url = currentProvider.base_url;
        }
      }

      setFormData(newData);
      setBaselineData(newData);
      // --- BEGIN COMMENT ---
      // 🎯 初始化时也验证instance_id格式
      // --- END COMMENT ---
      validateInstanceId(newData.instance_id);
    } else {
      // --- BEGIN COMMENT ---
      // 新建模式：初始化默认提供商选择
      // 优先使用筛选的提供商，其次是Dify，最后是第一个活跃的提供商
      // --- END COMMENT ---
      const getInitialProviderId = () => {
        const activeProviders = providers.filter(p => p.is_active);
        if (activeProviders.length === 0) return '';

        // 如果有筛选的提供商且该提供商是活跃的，优先使用
        if (defaultProviderId) {
          const filteredProvider = activeProviders.find(
            p => p.id === defaultProviderId
          );
          if (filteredProvider) return filteredProvider.id;
        }

        if (activeProviders.length === 1) return activeProviders[0].id;
        const difyProvider = activeProviders.find(
          p => p.name.toLowerCase() === 'dify'
        );
        return difyProvider ? difyProvider.id : activeProviders[0].id;
      };

      const initialProviderId = getInitialProviderId();
      setSelectedProviderId(initialProviderId);

      const emptyData = {
        instance_id: '',
        display_name: '',
        description: '',
        api_path: '',
        apiKey: '',
        config: {
          api_url: '',
          app_metadata: {
            app_type: 'model' as const,
            dify_apptype: 'chatbot' as const,
            tags: [],
          },
          dify_parameters: {},
        },
      };
      setFormData(emptyData);
      setBaselineData(emptyData);
      // --- BEGIN COMMENT ---
      // 🎯 新建时清空错误状态
      // --- END COMMENT ---
      setInstanceIdError('');
    }
  }, [instance, providers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // --- BEGIN COMMENT ---
    // 🎯 检查实时验证错误
    // --- END COMMENT ---
    if (instanceIdError) {
      toast.error(`应用ID格式错误: ${instanceIdError}`);
      return;
    }

    // --- BEGIN COMMENT ---
    // 🎯 新增：表单验证，确保Dify应用类型必填
    // --- END COMMENT ---
    const validationErrors = validateDifyFormData(formData);
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join(', '));
      return;
    }

    // --- 自动设置 is_marketplace_app 字段与 app_type 保持一致 ---
    const dataToSave = {
      ...formData,
      // --- BEGIN COMMENT ---
      // 🎯 确保instance_id去除首尾空格
      // --- END COMMENT ---
      instance_id: formData.instance_id.trim(),
      config: {
        ...formData.config,
        app_metadata: {
          ...formData.config.app_metadata,
          // --- BEGIN COMMENT ---
          // 🎯 确保dify_apptype字段被保存
          // --- END COMMENT ---
          dify_apptype: formData.config.app_metadata.dify_apptype,
          is_marketplace_app:
            formData.config.app_metadata.app_type === 'marketplace',
        },
      },
      setAsDefault,
      // --- BEGIN COMMENT ---
      // 新建模式下传递选择的提供商ID
      // --- END COMMENT ---
      selectedProviderId: isEditing ? undefined : selectedProviderId,
    };

    onSave(dataToSave);
  };

  const handleDifyParametersSave = (difyConfig: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        dify_parameters: difyConfig,
      },
    }));

    // --- BEGIN COMMENT ---
    // 🎯 修复：Dify参数保存后也更新基准数据
    // --- END COMMENT ---
    setBaselineData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        dify_parameters: difyConfig,
      },
    }));

    setShowDifyPanel(false);
  };

  // --- BEGIN COMMENT ---
  // 🎯 修复：智能同步参数逻辑
  // 编辑模式：优先使用数据库配置，失败时fallback到表单配置
  // 添加模式：直接使用表单配置
  // --- END COMMENT ---
  const handleSyncFromDify = async () => {
    // --- BEGIN COMMENT ---
    // 🎯 新建模式下需要API URL和API Key，编辑模式下需要instance_id
    // --- END COMMENT ---
    if (!isEditing && (!formData.config.api_url || !formData.apiKey)) {
      toast('请先填写API URL和API Key');
      return;
    }

    if (isEditing && !formData.instance_id) {
      toast('请先填写应用ID');
      return;
    }

    setIsSyncing(true);
    try {
      // --- BEGIN COMMENT ---
      // 🎯 新增：同步基本配置信息（name、description、tags）
      // --- END COMMENT ---
      let appInfo: any = null;
      let difyParams: DifyAppParametersResponse | null = null;
      let actualInstanceId = formData.instance_id;
      let isAutoGenerated = false;

      if (isEditing) {
        // 编辑模式：优先使用数据库配置
        try {
          console.log('[同步配置] 编辑模式：尝试使用数据库配置');

          // 同时获取基本信息和参数
          const { getDifyAppInfo, getDifyAppParameters } = await import(
            '@lib/services/dify'
          );
          appInfo = await getDifyAppInfo(formData.instance_id);
          difyParams = await getDifyAppParameters(formData.instance_id);
        } catch (dbError) {
          console.log('[同步配置] 数据库配置失败，尝试使用表单配置:', dbError);

          // --- BEGIN COMMENT ---
          // 🎯 改进：编辑模式下支持使用表单配置进行同步
          // 这样用户可以修改API Key后立即测试，无需先保存
          // --- END COMMENT ---
          if (!formData.config.api_url) {
            throw new Error(
              'API URL为空，无法同步配置。请填写API URL或检查数据库配置。'
            );
          }

          if (!formData.apiKey) {
            throw new Error(
              'API Key为空，无法同步配置。请在API密钥字段中输入新的密钥进行测试。'
            );
          }

          // 使用表单配置作为fallback
          const { getDifyAppInfoWithConfig, getDifyAppParametersWithConfig } =
            await import('@lib/services/dify');

          // 同时获取基本信息和参数
          appInfo = await getDifyAppInfoWithConfig(formData.instance_id, {
            apiUrl: formData.config.api_url,
            apiKey: formData.apiKey,
          });
          difyParams = await getDifyAppParametersWithConfig(
            formData.instance_id,
            {
              apiUrl: formData.config.api_url,
              apiKey: formData.apiKey,
            }
          );
        }
      } else {
        // 添加模式：直接使用表单配置
        console.log('[同步配置] 添加模式：使用表单配置');

        // 检查表单配置是否完整
        if (!formData.config.api_url || !formData.apiKey) {
          toast('请先填写API URL和API Key');
          return;
        }

        // --- BEGIN COMMENT ---
        // 🎯 改进：如果应用ID为空，自动生成临时UUID进行测试
        // 这样用户可以先测试API配置，无需预先想应用ID
        // --- END COMMENT ---
        if (!actualInstanceId) {
          actualInstanceId = uuidv4();
          isAutoGenerated = true;
          console.log(
            '[同步配置] 应用ID为空，自动生成临时ID:',
            actualInstanceId
          );
        }

        // 直接使用表单配置
        const { getDifyAppInfoWithConfig, getDifyAppParametersWithConfig } =
          await import('@lib/services/dify');

        // 同时获取基本信息和参数
        appInfo = await getDifyAppInfoWithConfig(actualInstanceId, {
          apiUrl: formData.config.api_url,
          apiKey: formData.apiKey,
        });
        difyParams = await getDifyAppParametersWithConfig(actualInstanceId, {
          apiUrl: formData.config.api_url,
          apiKey: formData.apiKey,
        });
      }

      // --- BEGIN COMMENT ---
      // 🎯 处理基本信息同步 - 去掉确认对话框，直接同步
      // --- END COMMENT ---
      const updatedFormData = { ...formData };

      if (appInfo) {
        // --- BEGIN COMMENT ---
        // 🎯 改进：总是同步基本信息，但给用户选择权
        // 不再限制只有空字段才同步，提高同步功能的实用性
        // --- END COMMENT ---

        // 同步display_name（如果有变化则询问用户）
        if (appInfo.name && appInfo.name !== formData.display_name) {
          if (
            !formData.display_name ||
            confirm(`是否将显示名称更新为："${appInfo.name}"？`)
          ) {
            updatedFormData.display_name = appInfo.name;
          }
        }

        // 同步description（如果有变化则询问用户）
        if (
          appInfo.description &&
          appInfo.description !== formData.description
        ) {
          if (
            !formData.description ||
            confirm(`是否将描述更新为："${appInfo.description}"？`)
          ) {
            updatedFormData.description = appInfo.description;
          }
        }

        // --- BEGIN COMMENT ---
        // 🎯 同步tags（append模式，不替换现有tags）
        // --- END COMMENT ---
        if (appInfo.tags && appInfo.tags.length > 0) {
          const currentTags = formData.config.app_metadata.tags || [];
          const newTags = appInfo.tags.filter(
            (tag: string) => !currentTags.includes(tag)
          );

          if (newTags.length > 0) {
            updatedFormData.config.app_metadata.tags = [
              ...currentTags,
              ...newTags,
            ];
          }
        }
      }

      // --- BEGIN COMMENT ---
      // 🎯 处理参数同步（保持原有逻辑）
      // --- END COMMENT ---
      if (difyParams) {
        const simplifiedParams: DifyParametersSimplifiedConfig = {
          opening_statement: difyParams.opening_statement || '',
          suggested_questions: difyParams.suggested_questions || [],
          suggested_questions_after_answer:
            difyParams.suggested_questions_after_answer || { enabled: false },
          speech_to_text: difyParams.speech_to_text || { enabled: false },
          text_to_speech: difyParams.text_to_speech || { enabled: false },
          retriever_resource: difyParams.retriever_resource || {
            enabled: false,
          },
          annotation_reply: difyParams.annotation_reply || { enabled: false },
          user_input_form: difyParams.user_input_form || [],
          file_upload: difyParams.file_upload || undefined,
          system_parameters: difyParams.system_parameters || {
            file_size_limit: 15,
            image_file_size_limit: 10,
            audio_file_size_limit: 50,
            video_file_size_limit: 100,
          },
        };

        updatedFormData.config.dify_parameters = simplifiedParams;
      }

      // --- BEGIN COMMENT ---
      // 🎯 新增：如果是自动生成的ID，同步成功后自动填充到表单
      // --- END COMMENT ---
      if (!isEditing && isAutoGenerated && actualInstanceId) {
        updatedFormData.instance_id = actualInstanceId;
        // 验证自动生成的ID
        validateInstanceId(actualInstanceId);
      }

      // 更新表单数据
      setFormData(updatedFormData);

      // --- BEGIN COMMENT ---
      // 🎯 同步成功后更新基准数据
      // --- END COMMENT ---
      setBaselineData(updatedFormData);

      // --- BEGIN COMMENT ---
      // 🎯 添加数据验证，确保真正获取到数据才显示成功
      // --- END COMMENT ---
      const syncedItems = [];
      if (appInfo) {
        syncedItems.push('基本信息');
      }
      if (difyParams) {
        syncedItems.push('参数配置');
      }

      if (syncedItems.length === 0) {
        throw new Error(
          '未能从 Dify API 获取到任何配置数据，请检查应用ID和API配置是否正确'
        );
      }

      // --- BEGIN COMMENT ---
      // 🎯 改进：根据是否自动生成ID提供不同的成功提示
      // --- END COMMENT ---
      let successMessage = `成功从 Dify API 同步${syncedItems.join('和')}！`;
      if (!isEditing && isAutoGenerated) {
        successMessage += ` 已自动生成应用ID：${actualInstanceId}`;
      }

      toast.success(successMessage);
    } catch (error) {
      console.error('[同步配置] 同步失败:', error);
      const errorMessage =
        error instanceof Error ? error.message : '同步配置失败';
      toast.error(`同步失败: ${errorMessage}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'mb-6 rounded-xl border p-6',
          isDark ? 'border-stone-600 bg-stone-800' : 'border-stone-200 bg-white'
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3
              className={cn(
                'font-serif text-lg font-bold',
                isDark ? 'text-stone-100' : 'text-stone-900'
              )}
            >
              {isEditing ? '编辑应用实例' : '添加应用实例'}
            </h3>

            {/* --- BEGIN COMMENT --- */}
            {/* 🎯 新增：未保存更改提示 */}
            {/* --- END COMMENT --- */}
            {(JSON.stringify(formData) !== JSON.stringify(baselineData) ||
              formData.apiKey) && (
              <div
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 font-serif text-xs font-medium',
                  'animate-pulse border border-dashed',
                  isDark
                    ? 'border-amber-700/40 bg-amber-900/20 text-amber-300'
                    : 'border-amber-300/60 bg-amber-50 text-amber-700'
                )}
              >
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    isDark ? 'bg-amber-400' : 'bg-amber-500'
                  )}
                />
                有未保存的更改
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* 设为默认应用按钮 */}
            {isEditing ? (
              /* 编辑模式：显示当前状态并允许修改 */
              instance && (
                <button
                  type="button"
                  onClick={() => {
                    // --- 简化逻辑：直接使用实时状态 ---
                    if (isCurrentDefault) {
                      return; // 已经是默认应用，无需操作
                    }

                    if (
                      confirm(
                        `确定要将"${formData.display_name || '此应用'}"设置为默认应用吗？`
                      )
                    ) {
                      // 直接调用store的方法
                      if (instance.id) {
                        useApiConfigStore
                          .getState()
                          .setDefaultInstance(instance.id)
                          .then(() => {
                            toast.success('默认应用设置成功');
                          })
                          .catch(error => {
                            console.error('设置默认应用失败:', error);
                            toast.error('设置默认应用失败');
                          });
                      } else {
                        toast.error('实例ID不存在，无法设置为默认应用');
                      }
                    }
                  }}
                  disabled={isCurrentDefault}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 transition-all',
                    'border',
                    isCurrentDefault
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer hover:scale-105',
                    isCurrentDefault
                      ? isDark
                        ? 'border-stone-600/50 bg-stone-700/30 text-stone-400'
                        : 'border-stone-300/50 bg-stone-100/50 text-stone-500'
                      : isDark
                        ? 'border-stone-600 bg-stone-700 text-stone-300 hover:bg-stone-600'
                        : 'border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200'
                  )}
                >
                  <Star
                    className={cn(
                      'h-4 w-4',
                      isCurrentDefault && 'fill-current'
                    )}
                  />
                  <span className="font-serif text-sm font-medium">
                    {isCurrentDefault ? '默认应用' : '设为默认'}
                  </span>
                </button>
              )
            ) : (
              /* 添加模式：允许选择是否设为默认 */
              <button
                type="button"
                onClick={() => setSetAsDefault(!setAsDefault)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-all',
                  'border hover:scale-105',
                  setAsDefault
                    ? isDark
                      ? 'border-stone-500 bg-stone-600 text-stone-200'
                      : 'border-stone-400 bg-stone-200 text-stone-800'
                    : isDark
                      ? 'border-stone-600 bg-stone-700 text-stone-300 hover:bg-stone-600'
                      : 'border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200'
                )}
              >
                <Star
                  className={cn('h-4 w-4', setAsDefault && 'fill-current')}
                />
                <span className="font-serif text-sm font-medium">
                  {setAsDefault ? '将设为默认' : '设为默认'}
                </span>
              </button>
            )}

            {/* Dify参数配置按钮组 */}
            <div
              className={cn(
                'flex gap-2 rounded-lg p-2',
                isDark ? 'bg-stone-800/50' : 'bg-stone-100/50'
              )}
            >
              <button
                type="button"
                onClick={() => setShowDifyPanel(true)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 transition-all',
                  isDark
                    ? 'bg-stone-700/50 text-stone-300 hover:bg-stone-700 hover:text-stone-200'
                    : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-800'
                )}
              >
                <Sliders className="h-4 w-4" />
                <span className="font-serif text-sm font-medium">
                  Dify 参数配置
                </span>
              </button>

              {/* --- BEGIN COMMENT --- */}
              {/* 🎯 新增：从 Dify API 同步参数按钮 */}
              {/* --- END COMMENT --- */}
              <button
                type="button"
                onClick={handleSyncFromDify}
                disabled={
                  isSyncing ||
                  (!isEditing && (!formData.config.api_url || !formData.apiKey))
                }
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 transition-all',
                  isSyncing ||
                    (!isEditing &&
                      (!formData.config.api_url || !formData.apiKey))
                    ? isDark
                      ? 'cursor-not-allowed bg-stone-800/50 text-stone-500'
                      : 'cursor-not-allowed border border-stone-200 bg-stone-200/50 text-stone-400'
                    : isDark
                      ? 'bg-stone-700/50 text-stone-300 hover:bg-stone-700 hover:text-stone-200'
                      : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-800'
                )}
                title={
                  isEditing
                    ? '从 Dify API 同步配置'
                    : !formData.config.api_url || !formData.apiKey
                      ? '请先填写API URL和API Key'
                      : '从 Dify API 同步配置（应用ID为空时将自动生成）'
                }
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="font-serif text-sm font-medium">
                  {isSyncing ? '同步中...' : '同步配置'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* --- BEGIN COMMENT ---
        服务提供商选择/显示区域
        --- END COMMENT --- */}
        <div
          className={cn(
            'mb-6 rounded-lg border p-4',
            isDark
              ? 'border-stone-600 bg-stone-700/50'
              : 'border-stone-200 bg-stone-50'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3
                className={cn(
                  'font-serif text-sm font-medium',
                  isDark ? 'text-stone-200' : 'text-stone-800'
                )}
              >
                服务提供商
              </h3>
              <p
                className={cn(
                  'mt-1 font-serif text-xs',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                {isEditing
                  ? '当前应用的服务提供商（不可修改）'
                  : '选择服务提供商'}
              </p>
            </div>

            {isEditing ? (
              // 编辑模式：只显示，不可修改
              <div
                className={cn(
                  'rounded-md px-3 py-1.5 font-serif text-sm',
                  isDark
                    ? 'bg-stone-600 text-stone-200'
                    : 'bg-stone-200 text-stone-700'
                )}
              >
                {(() => {
                  const currentProvider = providers.find(
                    p => p.id === instance?.provider_id
                  );
                  return currentProvider ? currentProvider.name : '未知提供商';
                })()}
              </div>
            ) : (
              // 新建模式：可选择
              <div className="w-48">
                <CustomProviderSelector
                  providers={providers}
                  selectedProviderId={selectedProviderId}
                  onProviderChange={setSelectedProviderId}
                  placeholder="请选择提供商"
                />
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <label
                className={cn(
                  'mb-2 block font-serif text-sm font-medium',
                  isDark ? 'text-stone-300' : 'text-stone-700'
                )}
              >
                应用 ID (instance_id) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.instance_id}
                  onChange={e => {
                    setFormData(prev => ({
                      ...prev,
                      instance_id: e.target.value,
                    }));
                    validateInstanceId(e.target.value);
                  }}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 font-serif',
                    !isEditing && 'pr-20', // 新建模式下为按钮留空间
                    isDark
                      ? 'border-stone-600 bg-stone-700 text-stone-100 placeholder-stone-400'
                      : 'border-stone-300 bg-white text-stone-900 placeholder-stone-500',
                    isEditing &&
                      (isDark
                        ? 'cursor-not-allowed bg-stone-800'
                        : 'cursor-not-allowed bg-stone-100'),
                    instanceIdError && 'border-red-500'
                  )}
                  placeholder="输入应用 ID"
                  required
                  disabled={isEditing}
                />

                {/* --- BEGIN COMMENT --- */}
                {/* 🎯 新增：UUID生成按钮（仅在新建模式下显示） */}
                {/* --- END COMMENT --- */}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      const uuid = uuidv4();
                      setFormData(prev => ({ ...prev, instance_id: uuid }));
                      validateInstanceId(uuid);
                    }}
                    className={cn(
                      'absolute top-1/2 right-2 -translate-y-1/2 transform',
                      'flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-all',
                      'border shadow-sm hover:scale-105 hover:shadow-md',
                      'font-serif font-medium',
                      isDark
                        ? 'border-stone-500 bg-gradient-to-r from-stone-600 to-stone-700 text-stone-200 hover:from-stone-500 hover:to-stone-600 hover:text-white'
                        : 'border-stone-300 bg-gradient-to-r from-stone-100 to-stone-200 text-stone-700 hover:from-stone-200 hover:to-stone-300 hover:text-stone-800'
                    )}
                    title="点击生成随机UUID作为应用ID"
                  >
                    <Lightbulb className="h-3 w-3" />
                    <span>生成ID</span>
                  </button>
                )}
              </div>
              {isEditing && (
                <p
                  className={cn(
                    'mt-1 font-serif text-xs',
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  )}
                >
                  应用 ID 创建后不可修改
                </p>
              )}

              {!isEditing && (
                <p
                  className={cn(
                    'mt-1 font-serif text-xs',
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  )}
                >
                  只能包含字母、数字、连字符(-)、下划线(_)和点(.)，不能包含空格。可先同步配置自动生成。
                </p>
              )}

              {/* --- BEGIN COMMENT --- */}
              {/* 🎯 新增：实时错误提示 */}
              {/* --- END COMMENT --- */}
              {instanceIdError && (
                <p
                  className={cn(
                    'mt-1 flex items-center gap-1 font-serif text-xs text-red-500'
                  )}
                >
                  <AlertCircle className="h-3 w-3" />
                  {instanceIdError}
                </p>
              )}
            </div>

            <div>
              <label
                className={cn(
                  'mb-2 block font-serif text-sm font-medium',
                  isDark ? 'text-stone-300' : 'text-stone-700'
                )}
              >
                显示名称 (display_name) *
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    display_name: e.target.value,
                  }))
                }
                className={cn(
                  'w-full rounded-lg border px-3 py-2 font-serif',
                  isDark
                    ? 'border-stone-600 bg-stone-700 text-stone-100 placeholder-stone-400'
                    : 'border-stone-300 bg-white text-stone-900 placeholder-stone-500'
                )}
                placeholder="输入显示名称"
                required
              />
            </div>
          </div>

          {/* --- BEGIN COMMENT --- */}
          {/* 🎯 API配置字段 - 移动到描述字段之前 */}
          {/* --- END COMMENT --- */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* --- BEGIN COMMENT ---
            API URL 输入框 - 禁用修改，显示供应商绑定逻辑
            --- END COMMENT --- */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  className={cn(
                    'font-serif text-sm font-medium',
                    isDark ? 'text-stone-300' : 'text-stone-700'
                  )}
                >
                  API URL (config.api_url)
                </label>

                {/* 供应商绑定提示标签 */}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-1 font-serif text-xs font-medium',
                    isDark
                      ? 'border border-blue-700/30 bg-blue-900/20 text-blue-300'
                      : 'border border-blue-200 bg-blue-50 text-blue-700'
                  )}
                >
                  <Globe className="h-3 w-3" />
                  供应商绑定
                </span>
              </div>

              <input
                type="url"
                value={
                  formData.config.api_url ||
                  (() => {
                    if (isEditing && instance) {
                      const currentProvider = providers.find(
                        p => p.id === instance.provider_id
                      );
                      return (
                        currentProvider?.base_url || 'https://api.dify.ai/v1'
                      );
                    } else {
                      const selectedProvider = providers.find(
                        p => p.id === selectedProviderId
                      );
                      return (
                        selectedProvider?.base_url || 'https://api.dify.ai/v1'
                      );
                    }
                  })()
                }
                disabled={true} // 禁用 URL 修改
                className={cn(
                  'w-full rounded-lg border px-3 py-2 font-serif',
                  // 禁用状态样式
                  'cursor-not-allowed opacity-75',
                  isDark
                    ? 'border-stone-600 bg-stone-800/50 text-stone-300'
                    : 'border-stone-300 bg-stone-100/50 text-stone-600'
                )}
                placeholder="URL 将自动使用所选供应商的配置"
              />

              <div
                className={cn(
                  'mt-2 rounded-md p-2 font-serif text-xs',
                  isDark
                    ? 'bg-stone-800/50 text-stone-400'
                    : 'bg-stone-50 text-stone-600'
                )}
              >
                <div className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  <div>
                    <ul className="space-y-1 text-xs">
                      <li>
                        • URL 与服务供应商绑定，修改请在"管理提供商"中操作
                      </li>
                      {isEditing && instance && (
                        <li>
                          • 当前供应商:{' '}
                          {(() => {
                            const currentProvider = providers.find(
                              p => p.id === instance.provider_id
                            );
                            return currentProvider
                              ? currentProvider.name
                              : '未知供应商';
                          })()}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-start justify-between">
                <label
                  className={cn(
                    'font-serif text-sm font-medium',
                    isDark ? 'text-stone-300' : 'text-stone-700'
                  )}
                >
                  API 密钥 (key_value) {!isEditing && '*'}
                </label>

                {/* --- API密钥配置状态标签 - 靠上对齐，避免挤压输入框 --- */}
                {isEditing && (
                  <span
                    className={cn(
                      '-mt-0.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-serif text-xs font-medium',
                      hasApiKey
                        ? isDark
                          ? 'border border-green-700/30 bg-green-900/20 text-green-300'
                          : 'border border-green-200 bg-green-50 text-green-700'
                        : isDark
                          ? 'border border-orange-700/30 bg-orange-900/20 text-orange-300'
                          : 'border border-orange-200 bg-orange-50 text-orange-700'
                    )}
                  >
                    <Key className="h-3 w-3" />
                    {hasApiKey ? '已配置' : '未配置'}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, apiKey: e.target.value }))
                  }
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 pr-10 font-serif',
                    isDark
                      ? 'border-stone-600 bg-stone-700 text-stone-100 placeholder-stone-400'
                      : 'border-stone-300 bg-white text-stone-900 placeholder-stone-500'
                  )}
                  placeholder={
                    isEditing ? '留空则不更新 API 密钥' : '输入 API 密钥'
                  }
                  required={!isEditing}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 transform"
                >
                  {showApiKey ? (
                    <Eye className="h-4 w-4 text-stone-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-stone-500" />
                  )}
                </button>
              </div>

              {/* --- 提示信息（仅在编辑模式且已配置时显示） --- */}
              {isEditing && hasApiKey && (
                <p
                  className={cn(
                    'mt-1 font-serif text-xs',
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  )}
                >
                  留空输入框将保持现有密钥不变
                </p>
              )}
            </div>
          </div>

          {/* --- BEGIN COMMENT --- */}
          {/* 🎯 同步配置按钮 - 仅在新建模式下显示 */}
          {/* --- END COMMENT --- */}
          {!isEditing && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSyncFromDify}
                disabled={
                  isSyncing || !formData.config.api_url || !formData.apiKey
                }
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 font-serif font-medium transition-colors',
                  isSyncing || !formData.config.api_url || !formData.apiKey
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer',
                  isDark
                    ? 'bg-stone-600 text-white hover:bg-stone-500'
                    : 'bg-stone-600 text-white hover:bg-stone-700'
                )}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isSyncing ? '同步中...' : '从Dify同步配置'}
              </button>
            </div>
          )}

          <div>
            <label
              className={cn(
                'mb-2 block font-serif text-sm font-medium',
                isDark ? 'text-stone-300' : 'text-stone-700'
              )}
            >
              描述 (description)
            </label>
            <textarea
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              className={cn(
                'w-full rounded-lg border px-3 py-2 font-serif',
                isDark
                  ? 'border-stone-600 bg-stone-700 text-stone-100 placeholder-stone-400'
                  : 'border-stone-300 bg-white text-stone-900 placeholder-stone-500'
              )}
              placeholder="输入应用描述"
              rows={3}
            />
          </div>

          <div>
            <label
              className={cn(
                'mb-3 block font-serif text-sm font-medium',
                isDark ? 'text-stone-300' : 'text-stone-700'
              )}
            >
              应用类型 (app_type) *
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() =>
                  setFormData(prev => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      app_metadata: {
                        ...prev.config.app_metadata,
                        app_type: 'model',
                      },
                    },
                  }))
                }
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                  formData.config.app_metadata.app_type === 'model'
                    ? isDark
                      ? 'border-stone-500 bg-stone-700/50'
                      : 'border-stone-400 bg-stone-100'
                    : isDark
                      ? 'border-stone-600 hover:border-stone-500'
                      : 'border-stone-300 hover:border-stone-400'
                )}
              >
                <div
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full border-2',
                    formData.config.app_metadata.app_type === 'model'
                      ? isDark
                        ? 'border-stone-400 bg-stone-400'
                        : 'border-stone-600 bg-stone-600'
                      : isDark
                        ? 'border-stone-500'
                        : 'border-stone-400'
                  )}
                >
                  {formData.config.app_metadata.app_type === 'model' && (
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        isDark ? 'bg-stone-800' : 'bg-white'
                      )}
                    />
                  )}
                </div>
                <div>
                  <div
                    className={cn(
                      'font-serif text-sm font-medium',
                      isDark ? 'text-stone-100' : 'text-stone-900'
                    )}
                  >
                    模型 (Model)
                  </div>
                  <div
                    className={cn(
                      'font-serif text-xs',
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    )}
                  >
                    用于模型切换
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData(prev => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      app_metadata: {
                        ...prev.config.app_metadata,
                        app_type: 'marketplace',
                      },
                    },
                  }))
                }
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                  formData.config.app_metadata.app_type === 'marketplace'
                    ? isDark
                      ? 'border-stone-500 bg-stone-700/50'
                      : 'border-stone-400 bg-stone-100'
                    : isDark
                      ? 'border-stone-600 hover:border-stone-500'
                      : 'border-stone-300 hover:border-stone-400'
                )}
              >
                <div
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full border-2',
                    formData.config.app_metadata.app_type === 'marketplace'
                      ? isDark
                        ? 'border-stone-400 bg-stone-400'
                        : 'border-stone-600 bg-stone-600'
                      : isDark
                        ? 'border-stone-500'
                        : 'border-stone-400'
                  )}
                >
                  {formData.config.app_metadata.app_type === 'marketplace' && (
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        isDark ? 'bg-stone-800' : 'bg-white'
                      )}
                    />
                  )}
                </div>
                <div>
                  <div
                    className={cn(
                      'font-serif text-sm font-medium',
                      isDark ? 'text-stone-100' : 'text-stone-900'
                    )}
                  >
                    应用市场 (Marketplace)
                  </div>
                  <div
                    className={cn(
                      'font-serif text-xs',
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    )}
                  >
                    用于应用市场
                  </div>
                </div>
              </button>
            </div>
            <p
              className={cn(
                'mt-2 font-serif text-xs',
                isDark ? 'text-stone-400' : 'text-stone-500'
              )}
            >
              选择"模型"类型的应用会出现在聊天界面的模型选择器中
            </p>
          </div>

          {/* --- BEGIN COMMENT --- */}
          {/* 🎯 新增：Dify应用类型选择器 */}
          {/* 在现有app_type选择器下方添加，保持一致的设计风格 */}
          {/* --- END COMMENT --- */}
          <DifyAppTypeSelector
            value={formData.config.app_metadata.dify_apptype}
            onChange={(type: DifyAppType) => {
              setFormData(prev => ({
                ...prev,
                config: {
                  ...prev.config,
                  app_metadata: {
                    ...prev.config.app_metadata,
                    dify_apptype: type,
                  },
                },
              }));
            }}
          />

          {/* 应用标签配置 - 紧凑设计 */}
          <div>
            <label
              className={cn(
                'mb-3 block font-serif text-sm font-medium',
                isDark ? 'text-stone-300' : 'text-stone-700'
              )}
            >
              应用标签 (tags)
            </label>
            <div className="space-y-3">
              {/* 预定义标签选择 - 按类别分组 */}
              <div className="space-y-3">
                {/* 模型类型 */}
                <div>
                  <div
                    className={cn(
                      'mb-2 font-serif text-xs font-medium',
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    )}
                  >
                    模型类型
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['对话模型', '推理模型', '文档模型', '多模态'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const isSelected =
                            formData.config.app_metadata.tags.includes(tag);
                          setFormData(prev => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              app_metadata: {
                                ...prev.config.app_metadata,
                                tags: isSelected
                                  ? prev.config.app_metadata.tags.filter(
                                      t => t !== tag
                                    )
                                  : [...prev.config.app_metadata.tags, tag],
                              },
                            },
                          }));
                        }}
                        className={cn(
                          'cursor-pointer rounded px-2 py-1.5 font-serif text-xs font-medium transition-colors',
                          formData.config.app_metadata.tags.includes(tag)
                            ? isDark
                              ? 'border border-stone-500 bg-stone-600 text-stone-200'
                              : 'border border-stone-300 bg-stone-200 text-stone-800'
                            : isDark
                              ? 'border border-stone-600 bg-stone-700/50 text-stone-400 hover:bg-stone-700'
                              : 'border border-stone-300 bg-stone-50 text-stone-600 hover:bg-stone-100'
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 应用场景 */}
                <div>
                  <div
                    className={cn(
                      'mb-2 font-serif text-xs font-medium',
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    )}
                  >
                    应用场景
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['文本生成', '代码生成', '数据分析', '翻译'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const isSelected =
                            formData.config.app_metadata.tags.includes(tag);
                          setFormData(prev => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              app_metadata: {
                                ...prev.config.app_metadata,
                                tags: isSelected
                                  ? prev.config.app_metadata.tags.filter(
                                      t => t !== tag
                                    )
                                  : [...prev.config.app_metadata.tags, tag],
                              },
                            },
                          }));
                        }}
                        className={cn(
                          'cursor-pointer rounded px-2 py-1.5 font-serif text-xs font-medium transition-colors',
                          formData.config.app_metadata.tags.includes(tag)
                            ? isDark
                              ? 'border border-stone-500 bg-stone-600 text-stone-200'
                              : 'border border-stone-300 bg-stone-200 text-stone-800'
                            : isDark
                              ? 'border border-stone-600 bg-stone-700/50 text-stone-400 hover:bg-stone-700'
                              : 'border border-stone-300 bg-stone-50 text-stone-600 hover:bg-stone-100'
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 技术特性 */}
                <div>
                  <div
                    className={cn(
                      'mb-2 font-serif text-xs font-medium',
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    )}
                  >
                    技术特性
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['高精度', '快速响应', '本地部署', '企业级'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const isSelected =
                            formData.config.app_metadata.tags.includes(tag);
                          setFormData(prev => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              app_metadata: {
                                ...prev.config.app_metadata,
                                tags: isSelected
                                  ? prev.config.app_metadata.tags.filter(
                                      t => t !== tag
                                    )
                                  : [...prev.config.app_metadata.tags, tag],
                              },
                            },
                          }));
                        }}
                        className={cn(
                          'cursor-pointer rounded px-2 py-1.5 font-serif text-xs font-medium transition-colors',
                          formData.config.app_metadata.tags.includes(tag)
                            ? isDark
                              ? 'border border-stone-500 bg-stone-600 text-stone-200'
                              : 'border border-stone-300 bg-stone-200 text-stone-800'
                            : isDark
                              ? 'border border-stone-600 bg-stone-700/50 text-stone-400 hover:bg-stone-700'
                              : 'border border-stone-300 bg-stone-50 text-stone-600 hover:bg-stone-100'
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 自定义标签输入 - 更小的输入框 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="自定义标签（回车添加）"
                  className={cn(
                    'flex-1 rounded border px-2 py-1.5 font-serif text-xs',
                    isDark
                      ? 'border-stone-600 bg-stone-700 text-stone-100 placeholder-stone-400'
                      : 'border-stone-300 bg-white text-stone-900 placeholder-stone-500'
                  )}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      const tag = input.value.trim();
                      if (
                        tag &&
                        !formData.config.app_metadata.tags.includes(tag)
                      ) {
                        setFormData(prev => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            app_metadata: {
                              ...prev.config.app_metadata,
                              tags: [...prev.config.app_metadata.tags, tag],
                            },
                          },
                        }));
                        input.value = '';
                      }
                    }
                  }}
                />
              </div>

              {/* 已选标签显示 - 更小的标签 */}
              {formData.config.app_metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.config.app_metadata.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={cn(
                        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-serif text-xs font-medium',
                        isDark
                          ? 'border border-stone-600 bg-stone-700 text-stone-300'
                          : 'border border-stone-300 bg-stone-100 text-stone-700'
                      )}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              app_metadata: {
                                ...prev.config.app_metadata,
                                tags: prev.config.app_metadata.tags.filter(
                                  (_, i) => i !== index
                                ),
                              },
                            },
                          }));
                        }}
                        className={cn(
                          'rounded-full p-0.5 transition-colors hover:bg-red-500 hover:text-white',
                          isDark ? 'text-stone-400' : 'text-stone-500'
                        )}
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <p
                className={cn(
                  'font-serif text-xs',
                  isDark ? 'text-stone-400' : 'text-stone-500'
                )}
              >
                标签用于应用分类和搜索
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isProcessing}
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 font-serif font-medium transition-colors disabled:opacity-50',
                isDark
                  ? 'bg-stone-600 text-stone-100 hover:bg-stone-500'
                  : 'bg-stone-800 text-white hover:bg-stone-700'
              )}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isProcessing ? '保存中...' : '保存'}</span>
              {!isProcessing && (
                <KeyCombination
                  keys={saveShortcut.symbols}
                  size="md"
                  isDark={isDark}
                  className="ml-3"
                />
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                'flex-1 cursor-pointer rounded-lg px-4 py-2 font-serif font-medium transition-colors',
                isDark
                  ? 'bg-stone-700 text-stone-200 hover:bg-stone-600'
                  : 'bg-stone-200 text-stone-800 hover:bg-stone-300'
              )}
            >
              取消
            </button>
          </div>
        </form>
      </div>

      {/* Dify参数配置面板 */}
      <DifyParametersPanel
        isOpen={showDifyPanel}
        onClose={() => setShowDifyPanel(false)}
        config={formData.config.dify_parameters || {}}
        onSave={handleDifyParametersSave}
        instanceName={formData.display_name || '应用实例'}
      />
    </>
  );
};

export default function ApiConfigPage() {
  const { isDark } = useTheme();

  const {
    serviceInstances: instances,
    providers,
    createAppInstance: addInstance,
    updateAppInstance: updateInstance,
  } = useApiConfigStore();

  const [selectedInstance, setSelectedInstance] =
    useState<ServiceInstance | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [currentFilterProviderId, setCurrentFilterProviderId] = useState<
    string | null
  >(null);

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

    const handleDefaultInstanceChanged = (event: CustomEvent) => {
      const { instanceId } = event.detail;
      // --- 始终显示成功提示，不管是否是当前选中的实例 ---
      toast.success('默认应用设置成功');

      // --- 重新加载服务实例数据以更新UI状态 ---
      setTimeout(() => {
        // 给数据库操作一点时间完成
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
  }, [showAddForm, selectedInstance]);

  const handleClearSelection = () => {
    setSelectedInstance(null);
    setShowAddForm(false);
    window.dispatchEvent(
      new CustomEvent('addFormToggled', {
        detail: {
          showAddForm: false,
          selectedInstance: null,
        },
      })
    );
  };

  // --- BEGIN COMMENT ---
  // Provider管理相关处理函数
  // --- END COMMENT ---
  const handleProviderChange = () => {
    // 重新加载providers数据
    window.dispatchEvent(new CustomEvent('reloadProviders'));
    toast.success('提供商配置已更新');
  };

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('addFormToggled', {
        detail: {
          showAddForm,
          selectedInstance,
        },
      })
    );
  }, [showAddForm, selectedInstance]);

  return (
    <div className="flex h-full flex-col">
      {/* --- 管理提供商按钮 --- */}
      <div className="flex justify-end px-6 pt-6 pb-3">
        <button
          onClick={() => setShowProviderModal(true)}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
            'focus:ring-2 focus:ring-offset-2 focus:outline-none',
            'border shadow-sm',
            isDark
              ? 'border-stone-500 bg-stone-600 text-stone-100 shadow-stone-900/20 hover:bg-stone-500 hover:text-white focus:ring-stone-400'
              : 'border-stone-300 bg-stone-200 text-stone-800 shadow-stone-200/50 hover:bg-stone-300 hover:text-stone-900 focus:ring-stone-500'
          )}
        >
          <Settings className="h-4 w-4" />
          <span className="font-serif">管理提供商</span>
        </button>
      </div>

      {showAddForm ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <InstanceForm
            instance={null}
            isEditing={false}
            defaultProviderId={currentFilterProviderId}
            onSave={data => {
              setIsProcessing(true);
              // --- 提取setAsDefault状态和其他数据 ---
              const { setAsDefault, ...instanceData } = data;

              // --- 使用用户选择的提供商 ---
              const providerId = data.selectedProviderId;
              if (!providerId) {
                toast.error('请选择服务提供商');
                setIsProcessing(false);
                return;
              }

              // 验证选择的提供商是否有效
              const selectedProvider = providers.find(p => p.id === providerId);
              if (!selectedProvider) {
                toast.error('选择的服务提供商无效');
                setIsProcessing(false);
                return;
              }

              if (!selectedProvider.is_active) {
                toast.error('选择的服务提供商未激活');
                setIsProcessing(false);
                return;
              }

              addInstance(
                {
                  ...instanceData,
                  provider_id: providerId,
                },
                data.apiKey
              )
                .then(newInstance => {
                  toast.success('应用实例创建成功');

                  // --- 如果选择了设为默认，则在创建成功后设置为默认应用 ---
                  if (setAsDefault && newInstance?.id) {
                    return useApiConfigStore
                      .getState()
                      .setDefaultInstance(newInstance.id)
                      .then(() => {
                        toast.success('应用实例已设为默认应用');
                      })
                      .catch(error => {
                        console.error('设置默认应用失败:', error);
                        toast('应用创建成功，但设置默认应用失败');
                      });
                  }
                })
                .then(() => {
                  handleClearSelection();
                })
                .catch(error => {
                  console.error('创建失败:', error);
                  toast.error('创建应用实例失败');
                })
                .finally(() => {
                  setIsProcessing(false);
                });
            }}
            onCancel={handleClearSelection}
            isProcessing={isProcessing}
          />
        </div>
      ) : selectedInstance ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2
                  className={cn(
                    'font-serif text-xl font-bold',
                    isDark ? 'text-stone-100' : 'text-stone-900'
                  )}
                >
                  {selectedInstance.display_name}
                </h2>
                <p
                  className={cn(
                    'mt-1 font-serif text-sm',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                >
                  {selectedInstance.description || selectedInstance.instance_id}
                </p>
              </div>
              <button
                onClick={handleClearSelection}
                className={cn(
                  'cursor-pointer rounded-lg p-2 transition-colors',
                  'focus:ring-2 focus:ring-offset-2 focus:outline-none',
                  isDark
                    ? 'bg-stone-600 text-stone-200 hover:bg-stone-500 hover:text-stone-100 focus:ring-stone-500'
                    : 'bg-stone-200 text-stone-700 hover:bg-stone-300 hover:text-stone-900 focus:ring-stone-400'
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <InstanceForm
            instance={selectedInstance}
            isEditing={true}
            onSave={data => {
              setIsProcessing(true);
              updateInstance(selectedInstance.id, data, data.apiKey)
                .then(() => {
                  toast.success('应用实例更新成功');
                  handleClearSelection();
                })
                .catch(error => {
                  console.error('更新失败:', error);
                  toast.error('更新应用实例失败');
                })
                .finally(() => {
                  setIsProcessing(false);
                });
            }}
            onCancel={handleClearSelection}
            isProcessing={isProcessing}
          />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <Settings className="mx-auto mb-4 h-16 w-16 text-stone-400" />
            <h3
              className={cn(
                'mb-2 font-serif text-lg font-medium',
                isDark ? 'text-stone-300' : 'text-stone-700'
              )}
            >
              选择应用实例
            </h3>
            <p
              className={cn(
                'font-serif text-sm',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              从左侧列表中选择一个应用实例来查看和编辑其配置，或点击添加按钮创建新的应用实例
            </p>
          </div>
        </div>
      )}

      {/* --- Provider管理模态框 --- */}
      <ProviderManagementModal
        open={showProviderModal}
        onOpenChange={setShowProviderModal}
        onProviderChange={handleProviderChange}
      />
    </div>
  );
}
