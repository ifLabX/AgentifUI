'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { Provider } from '@lib/types/database';
import { cn } from '@lib/utils';
import { Check, ChevronDown } from 'lucide-react';

import React, { useState } from 'react';

import { useTranslations } from 'next-intl';

interface CustomProviderSelectorProps {
  providers: Provider[];
  selectedProviderId: string;
  onProviderChange: (providerId: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function CustomProviderSelector({
  providers,
  selectedProviderId,
  onProviderChange,
  placeholder,
  className,
  error,
}: CustomProviderSelectorProps) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('pages.admin.apiConfig.customProviderSelector');

  const defaultPlaceholder = placeholder || t('placeholder');

  const selectedProvider = selectedProviderId
    ? providers.find(p => p.id === selectedProviderId)
    : null;

  const handleProviderSelect = (providerId: string) => {
    onProviderChange(providerId);
    setIsOpen(false);
  };

  const activeProviders = providers.filter(p => p.is_active);

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center justify-between px-3 py-2 font-serif text-sm',
          'rounded-md border transition-all duration-200 ease-in-out',
          'focus:ring-2 focus:ring-offset-1 focus:outline-none',
          // Base style
          isDark
            ? 'border-stone-600 bg-stone-700 text-stone-200'
            : 'border-stone-300 bg-white text-stone-700',
          // Hover style
          isDark
            ? 'hover:border-stone-500 hover:bg-stone-600'
            : 'hover:border-stone-400 hover:bg-stone-50',
          // Focus style
          isDark
            ? 'focus:border-stone-500 focus:ring-stone-500'
            : 'focus:border-stone-400 focus:ring-stone-400',
          // Error style
          error && 'border-red-500 focus:ring-red-500',
          // Responsive spacing
          'sm:px-4 sm:py-2.5'
        )}
      >
        <span
          className={cn(
            'truncate',
            !selectedProvider && (isDark ? 'text-stone-400' : 'text-stone-500')
          )}
        >
          {selectedProvider ? selectedProvider.name : defaultPlaceholder}
        </span>

        <div
          className={cn(
            'ml-2 flex-shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180',
            isDark ? 'text-stone-400' : 'text-stone-500'
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </div>
      </button>

      {error && <p className="mt-1 font-serif text-sm text-red-600">{error}</p>}

      {/* Dropdown options menu: responsive design */}
      {isOpen && (
        <>
          {/* Background mask */}
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown options */}
          <div
            className={cn(
              'absolute top-full right-0 left-0 z-[95] mt-1',
              'overflow-hidden rounded-md border shadow-lg',
              'max-h-60 overflow-y-auto', // Limit height and allow scrolling
              // Theme style
              isDark
                ? 'border-stone-600/80 bg-stone-700/95 backdrop-blur-sm'
                : 'border-stone-300/80 bg-white/95 backdrop-blur-sm',
              // Responsive width
              'min-w-full'
            )}
          >
            {/* Empty option (if needed) */}
            {!selectedProviderId && (
              <button
                onClick={() => handleProviderSelect('')}
                className={cn(
                  'w-full px-3 py-2 text-left font-serif text-sm',
                  'transition-colors duration-150',
                  'flex items-center justify-between gap-2',
                  'cursor-pointer',
                  // Responsive spacing
                  'sm:px-4 sm:py-3',
                  isDark
                    ? 'text-stone-400 hover:bg-stone-600/40'
                    : 'text-stone-500 hover:bg-stone-100/60'
                )}
              >
                <span>{defaultPlaceholder}</span>
              </button>
            )}

            {/* Provider options */}
            {activeProviders.length > 0 ? (
              activeProviders.map(provider => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderSelect(provider.id)}
                  className={cn(
                    'w-full px-3 py-2 text-left font-serif text-sm',
                    'transition-colors duration-150',
                    'flex items-center justify-between gap-2',
                    'cursor-pointer',
                    // Responsive spacing
                    'sm:px-4 sm:py-3',
                    // Selected state
                    selectedProviderId === provider.id
                      ? isDark
                        ? 'bg-stone-600/60 text-stone-200'
                        : 'bg-stone-100/80 text-stone-800'
                      : isDark
                        ? 'text-stone-300 hover:bg-stone-600/40'
                        : 'text-stone-700 hover:bg-stone-100/60'
                  )}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {provider.name}
                      </span>
                      {provider.is_default && (
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
                    <span
                      className={cn(
                        'truncate text-xs',
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      )}
                    >
                      {provider.base_url}
                    </span>
                  </div>

                  {selectedProviderId === provider.id && (
                    <Check className="h-4 w-4 flex-shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div
                className={cn(
                  'px-3 py-2 text-center font-serif text-sm',
                  'sm:px-4 sm:py-3',
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
}
