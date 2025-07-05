'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Eye, EyeOff, Globe, Key } from 'lucide-react';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

interface Provider {
  id: string;
  name: string;
  base_url: string;
}

interface Instance {
  provider_id?: string;
}

interface ApiConfigFieldsProps {
  formData: {
    config: {
      api_url: string;
    };
    apiKey: string;
  };
  setFormData: (updater: (prev: any) => any) => void;
  isEditing: boolean;
  hasApiKey: boolean;
  instance?: Instance | null;
  providers: Provider[];
  selectedProviderId: string;
}

export const ApiConfigFields = ({
  formData,
  setFormData,
  isEditing,
  hasApiKey,
  instance,
  providers,
  selectedProviderId,
}: ApiConfigFieldsProps) => {
  const { isDark } = useTheme();
  const [showApiKey, setShowApiKey] = useState(false);
  const t = useTranslations('pages.admin.apiConfig.fields');

  const getApiUrl = () => {
    if (formData.config.api_url) return formData.config.api_url;

    if (isEditing && instance && instance.provider_id) {
      const currentProvider = providers.find(
        p => p.id === instance.provider_id
      );
      return currentProvider?.base_url || 'https://api.dify.ai/v1';
    } else {
      const selectedProvider = providers.find(p => p.id === selectedProviderId);
      return selectedProvider?.base_url || 'https://api.dify.ai/v1';
    }
  };

  const getCurrentProviderName = () => {
    if (isEditing && instance && instance.provider_id) {
      const currentProvider = providers.find(
        p => p.id === instance.provider_id
      );
      return currentProvider ? currentProvider.name : t('unknownProvider');
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* --- API URL 输入框 - 禁用修改，显示供应商绑定逻辑 --- */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            className={cn(
              'font-serif text-sm font-medium',
              isDark ? 'text-stone-300' : 'text-stone-700'
            )}
          >
            {t('apiUrl')}
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
            {t('providerBinding')}
          </span>
        </div>

        <input
          type="url"
          value={getApiUrl()}
          disabled={true} // 禁用 URL 修改
          className={cn(
            'w-full rounded-lg border px-3 py-2 font-serif',
            // 禁用状态样式
            'cursor-not-allowed opacity-75',
            isDark
              ? 'border-stone-600 bg-stone-800/50 text-stone-300'
              : 'border-stone-300 bg-stone-100/50 text-stone-600'
          )}
          placeholder={t('urlPlaceholder')}
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
                <li>• {t('urlBindingInfo')}</li>
                {isEditing && instance && instance.provider_id && (
                  <li>
                    •{' '}
                    {t('currentProvider', {
                      name: getCurrentProviderName() || '',
                    })}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* --- API 密钥字段 --- */}
      <div>
        <div className="mb-2 flex items-start justify-between">
          <label
            className={cn(
              'font-serif text-sm font-medium',
              isDark ? 'text-stone-300' : 'text-stone-700'
            )}
          >
            {t('apiKey')} {!isEditing && '*'}
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
              {hasApiKey ? t('keyConfigured') : t('keyNotConfigured')}
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
              isEditing ? t('keyPlaceholderEdit') : t('keyPlaceholderNew')
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
            {t('keyEditHint')}
          </p>
        )}
      </div>
    </div>
  );
};
