'use client';

import { useCurrentApp } from '@lib/hooks/use-current-app';
import { useTheme } from '@lib/hooks/use-theme';
import type { DifyUserInputFormItem } from '@lib/services/dify/types';
import type { DifyParametersSimplifiedConfig } from '@lib/types/dify-parameters';
import { cn } from '@lib/utils';
import { AlertCircle, Loader2, Play } from 'lucide-react';

import React, { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { FileUploadField } from './file-upload-field';
import { FormField } from './form-field';
import { validateFormData } from './validation';

interface WorkflowInputFormProps {
  instanceId: string;
  onExecute: (formData: Record<string, any>) => Promise<void>;
  isExecuting: boolean;
}

export interface WorkflowInputFormRef {
  resetForm: () => void;
}

/**
 * 工作流动态输入表单组件
 *
 * 功能特点：
 * - 基于 user_input_form 配置动态渲染表单字段
 * - 支持文本、段落、下拉选择、文件上传等字段类型
 * - 完整的表单验证和错误提示
 * - 统一的 stone 色系主题
 * - 支持表单重置功能
 */
export const WorkflowInputForm = React.forwardRef<
  WorkflowInputFormRef,
  WorkflowInputFormProps
>(({ instanceId, onExecute, isExecuting }, ref) => {
  const { isDark } = useTheme();
  const { currentAppInstance, ensureAppReady } = useCurrentApp();
  const t = useTranslations('pages.workflow.form');

  // --- 状态管理 ---
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [initialFormData, setInitialFormData] = useState<Record<string, any>>(
    {}
  );

  // --- 初始化应用配置 ---
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        console.log('[表单初始化] 开始加载应用配置，instanceId:', instanceId);

        // 直接从数据库获取指定 instanceId 的配置
        try {
          // 导入数据库查询函数
          const { createClient } = await import('@lib/supabase/client');
          const supabase = createClient();

          // 查询指定的服务实例
          const { data: serviceInstance, error } = await supabase
            .from('service_instances')
            .select('*')
            .eq('instance_id', instanceId)
            .single();

          if (error || !serviceInstance) {
            throw new Error(`未找到 instanceId 为 ${instanceId} 的服务实例`);
          }

          console.log('[表单初始化] 找到服务实例:', serviceInstance);
          setAppConfig(serviceInstance.config);

          // 初始化表单默认值
          const difyParams = serviceInstance.config
            ?.dify_parameters as DifyParametersSimplifiedConfig;
          const userInputForm = difyParams?.user_input_form || [];
          const initialData: Record<string, any> = {};

          console.log('[表单初始化] 解析到的 user_input_form:', userInputForm);

          userInputForm.forEach((formItem: DifyUserInputFormItem) => {
            const fieldType = Object.keys(formItem)[0];
            const fieldConfig = formItem[fieldType as keyof typeof formItem];

            if (fieldConfig) {
              // 根据字段类型设置默认值
              if (fieldType === 'file' || fieldType === 'file-list') {
                initialData[fieldConfig.variable] = fieldConfig.default || [];
              } else if (fieldType === 'number') {
                // number类型的默认值处理
                const numberConfig = fieldConfig as any;
                initialData[fieldConfig.variable] =
                  numberConfig.default !== undefined
                    ? numberConfig.default
                    : '';
              } else {
                initialData[fieldConfig.variable] = fieldConfig.default || '';
              }
            }
          });

          setFormData(initialData);
          setInitialFormData(initialData);
        } catch (configError) {
          console.warn(
            '[表单初始化] 无法获取应用配置，使用默认配置:',
            configError
          );

          // 设置默认配置，允许用户继续使用
          const defaultConfig = {
            dify_parameters: {
              user_input_form: [
                {
                  paragraph: {
                    type: 'paragraph',
                    label: t('defaultLabel'),
                    variable: 'input_text',
                    required: true,
                    default: '',
                  },
                },
              ],
            },
          };

          setAppConfig(defaultConfig);

          const defaultFormData = { input_text: '' };
          setFormData(defaultFormData);
          setInitialFormData(defaultFormData);
        }
      } catch (error) {
        console.error('[表单初始化] 初始化失败:', error);

        // 即使完全失败，也提供基本的表单
        const fallbackConfig = {
          dify_parameters: {
            user_input_form: [
              {
                paragraph: {
                  type: 'paragraph',
                  label: t('defaultLabel'),
                  variable: 'input_text',
                  required: true,
                  default: '',
                },
              },
            ],
          },
        };
        setAppConfig(fallbackConfig);

        const fallbackFormData = { input_text: '' };
        setFormData(fallbackFormData);
        setInitialFormData(fallbackFormData);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [instanceId]);

  // --- 表单字段更新 ---
  const handleFieldChange = (variable: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [variable]: value,
    }));

    // 清除该字段的错误
    if (errors[variable]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[variable];
        return newErrors;
      });
    }
  };

  // --- 表单重置 ---
  const handleReset = () => {
    setFormData({ ...initialFormData });
    setErrors({});
  };

  // --- 表单提交 ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isExecuting) return;

    // 验证表单
    const userInputForm = appConfig?.dify_parameters?.user_input_form || [];
    const validationErrors = validateFormData(formData, userInputForm);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // 清除错误并执行
    setErrors({});
    await onExecute(formData);
  };

  // --- 暴露重置方法给父组件 ---
  React.useImperativeHandle(
    ref,
    () => ({
      resetForm: handleReset,
    }),
    [handleReset]
  );

  // --- 加载状态 ---
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2
            className={cn(
              'mx-auto h-8 w-8 animate-spin',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          />
          <p
            className={cn(
              'font-serif text-sm',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          >
            {t('loading')}
          </p>
        </div>
      </div>
    );
  }

  // --- 获取表单配置 ---
  const userInputForm = appConfig?.dify_parameters?.user_input_form || [];

  if (userInputForm.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-4 text-center">
          <AlertCircle
            className={cn(
              'mx-auto h-8 w-8',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          />
          <p
            className={cn(
              'font-serif text-sm',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          >
            {t('noFormConfig')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* --- 表单内容 --- */}
      <form
        onSubmit={handleSubmit}
        className="hide-all-scrollbars flex min-h-0 flex-1 flex-col"
      >
        <div className="no-scrollbar flex-1 space-y-6 overflow-x-visible overflow-y-auto px-2">
          {userInputForm.map(
            (formItem: DifyUserInputFormItem, index: number) => {
              const fieldType = Object.keys(formItem)[0];
              const fieldConfig = formItem[fieldType as keyof typeof formItem];

              if (!fieldConfig) return null;

              // 文件上传字段特殊处理
              if (fieldType === 'file' || fieldType === 'file-list') {
                return (
                  <FileUploadField
                    key={`${fieldConfig.variable}-${index}`}
                    config={fieldConfig}
                    value={formData[fieldConfig.variable]}
                    onChange={value =>
                      handleFieldChange(fieldConfig.variable, value)
                    }
                    error={errors[fieldConfig.variable]}
                    label={fieldConfig.label}
                    instanceId={instanceId}
                    isSingleFileMode={fieldType === 'file'}
                  />
                );
              }

              // 其他字段类型
              return (
                <FormField
                  key={`${fieldConfig.variable}-${index}`}
                  type={
                    fieldType as
                      | 'text-input'
                      | 'number'
                      | 'paragraph'
                      | 'select'
                  }
                  config={fieldConfig}
                  value={formData[fieldConfig.variable]}
                  onChange={value =>
                    handleFieldChange(fieldConfig.variable, value)
                  }
                  error={errors[fieldConfig.variable]}
                />
              );
            }
          )}
        </div>

        {/* --- 表单操作按钮 --- */}
        <div
          className={cn(
            'mt-4 flex-shrink-0 border-t bg-gradient-to-t pt-6',
            isDark ? 'border-stone-700' : 'border-stone-200'
          )}
        >
          <div className="flex gap-3">
            {/* 重置按钮 */}
            <button
              type="button"
              onClick={handleReset}
              disabled={isExecuting}
              className={cn(
                'rounded-lg px-4 py-2 font-serif text-sm transition-colors',
                'border',
                isExecuting ? 'cursor-not-allowed opacity-50' : '',
                isDark
                  ? 'border-stone-600 text-stone-300 hover:bg-stone-700 hover:text-stone-200'
                  : 'border-stone-300 text-stone-700 hover:bg-stone-100 hover:text-stone-800'
              )}
            >
              {t('reset')}
            </button>

            {/* 执行按钮 */}
            <button
              type="submit"
              disabled={isExecuting}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-2',
                'font-serif text-sm font-medium transition-colors',
                isExecuting
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:shadow-lg',
                isDark
                  ? 'bg-stone-700 text-stone-100 hover:bg-stone-600'
                  : 'bg-stone-800 text-white hover:bg-stone-700'
              )}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('executing')}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  {t('startExecution')}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
});

WorkflowInputForm.displayName = 'WorkflowInputForm';
