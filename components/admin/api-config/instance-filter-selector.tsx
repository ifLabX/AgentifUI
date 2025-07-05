'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { Provider } from '@lib/types/database';
import { cn } from '@lib/utils';
import { Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

import React, { memo, useState } from 'react';

import { useTranslations } from 'next-intl';

interface InstanceFilterSelectorProps {
  providers: Provider[];
  selectedProviderId: string | null; // null表示"全部"
  onFilterChange: (providerId: string | null) => void;
  instanceCount: number;
  className?: string;
  isLoading?: boolean; // 新增loading状态
}

export const InstanceFilterSelector = memo(function InstanceFilterSelector({
  providers,
  selectedProviderId,
  onFilterChange,
  instanceCount,
  className,
  isLoading = false,
}: InstanceFilterSelectorProps) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('pages.admin.apiConfig.instanceFilter');

  // 获取当前选中的提供商信息
  const selectedProvider = selectedProviderId
    ? providers.find(p => p.id === selectedProviderId)
    : null;

  // 处理筛选选择
  const handleFilterSelect = (providerId: string | null) => {
    onFilterChange(providerId);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      {/* Main title button: mimic conversation-title-button style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 transition-all duration-200 ease-in-out',
          'group cursor-pointer'
        )}
      >
        <div className="flex items-center gap-2">
          <h2
            className={cn(
              'font-serif text-sm font-bold',
              isDark ? 'text-stone-100' : 'text-stone-900'
            )}
          >
            {selectedProvider
              ? t('providerApps', { name: selectedProvider.name })
              : t('allApps')}
          </h2>
          {selectedProvider?.is_default && (
            <span
              className={cn(
                'rounded px-1.5 py-0.5 font-serif text-xs',
                isDark
                  ? 'bg-stone-500/50 text-stone-200'
                  : 'bg-stone-200 text-stone-800'
              )}
            >
              {t('defaultLabel')}
            </span>
          )}
        </div>

        <div
          className={cn(
            'flex h-3 w-3 flex-shrink-0 items-center justify-center transition-transform duration-200',
            !isLoading && 'group-hover:scale-110',
            isDark ? 'text-stone-400' : 'text-stone-500'
          )}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : isOpen ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </div>
      </button>

      {/* Instance count display */}
      <div
        className={cn(
          'mt-1 font-serif text-xs',
          isDark ? 'text-stone-400' : 'text-stone-600'
        )}
      >
        {t('totalCount', { count: instanceCount })}
      </div>

      {/* Dropdown menu: fully mimic conversation-title-button style */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setIsOpen(false)}
          />

          {/* 下拉选项 */}
          <div
            className={cn(
              'absolute top-full left-0 z-[95] mt-1 min-w-[10rem]',
              'overflow-hidden rounded-md border shadow-lg',
              isDark
                ? 'border-stone-600/80 bg-stone-700/95 backdrop-blur-sm'
                : 'border-stone-300/80 bg-stone-50/95 backdrop-blur-sm'
            )}
          >
            {/* 全部选项 */}
            <button
              onClick={() => handleFilterSelect(null)}
              className={cn(
                'w-full px-4 py-3 text-left font-serif text-sm',
                'transition-colors duration-150',
                'flex items-center justify-between gap-2',
                'cursor-pointer',
                !selectedProviderId
                  ? isDark
                    ? 'bg-stone-600/60 text-stone-200'
                    : 'bg-stone-200/60 text-stone-800'
                  : isDark
                    ? 'text-stone-300 hover:bg-stone-600/40'
                    : 'text-stone-700 hover:bg-stone-200/40'
              )}
            >
              <span>{t('allApps')}</span>

              {!selectedProviderId && (
                <Check className="h-4 w-4 flex-shrink-0" />
              )}
            </button>

            {/* 分隔线 */}
            <div
              className={cn(
                'mx-2 h-px',
                isDark ? 'bg-stone-600/50' : 'bg-stone-300/50'
              )}
            />

            {/* 提供商选项 */}
            {providers
              .filter(p => p.is_active)
              .map(provider => (
                <button
                  key={provider.id}
                  onClick={() => handleFilterSelect(provider.id)}
                  className={cn(
                    'w-full px-4 py-3 text-left font-serif text-sm',
                    'transition-colors duration-150',
                    'flex items-center justify-between gap-2',
                    'cursor-pointer',
                    selectedProviderId === provider.id
                      ? isDark
                        ? 'bg-stone-600/60 text-stone-200'
                        : 'bg-stone-200/60 text-stone-800'
                      : isDark
                        ? 'text-stone-300 hover:bg-stone-600/40'
                        : 'text-stone-700 hover:bg-stone-200/40'
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate">{provider.name}</span>
                    {provider.is_default && (
                      <span
                        className={cn(
                          'flex-shrink-0 rounded px-1.5 py-0.5 font-serif text-xs',
                          isDark
                            ? 'bg-stone-500/50 text-stone-200'
                            : 'bg-stone-200 text-stone-800'
                        )}
                      >
                        {t('defaultLabel')}
                      </span>
                    )}
                  </div>

                  {selectedProviderId === provider.id && (
                    <Check className="h-4 w-4 flex-shrink-0" />
                  )}
                </button>
              ))}

            {/* Show hint message if no active providers available */}
            {providers.filter(p => p.is_active).length === 0 && (
              <div
                className={cn(
                  'px-4 py-3 text-center font-serif text-sm',
                  isDark ? 'text-stone-400' : 'text-stone-500'
                )}
              >
                {t('noProviders')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});
