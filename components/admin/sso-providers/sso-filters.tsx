'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { useSsoProvidersStore } from '@lib/stores/sso-providers-store';
import { cn } from '@lib/utils';
import { RotateCcw, Search, X } from 'lucide-react';

import { useCallback, useState } from 'react';

import { useTranslations } from 'next-intl';

export function SsoFilters() {
  const { isDark } = useTheme();
  const t = useTranslations('pages.admin.ssoProviders.filters');
  const [searchInput, setSearchInput] = useState('');

  const { filters, updateFilters } = useSsoProvidersStore();

  // Handle search input change with debouncing
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);

      // Simple debouncing - update filters after user stops typing
      const timeoutId = setTimeout(() => {
        updateFilters({ search: value || undefined });
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [updateFilters]
  );

  // Filter change handlers removed - simplified interface

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchInput('');
    updateFilters({
      search: undefined,
      protocol: undefined,
      enabled: undefined,
    });
  };

  // Check if any filters are active
  const hasActiveFilters = !!filters.search;

  return (
    <div
      className={cn(
        'mb-6 rounded-xl border backdrop-blur-sm',
        isDark
          ? 'border-stone-700/50 bg-stone-900/80'
          : 'border-stone-200/50 bg-white/90'
      )}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search
              className={cn(
                'absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2',
                isDark ? 'text-stone-400' : 'text-stone-500'
              )}
            />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchInput}
              onChange={handleSearchChange}
              className={cn(
                'placeholder:text-opacity-60 w-full rounded-lg border py-2.5 pr-4 pl-10 font-serif text-sm transition-all duration-200',
                'focus:ring-2 focus:ring-offset-2 focus:outline-none',
                isDark
                  ? 'border-stone-600 bg-stone-800/50 text-stone-100 placeholder:text-stone-400 focus:border-stone-500 focus:ring-stone-500/30 focus:ring-offset-stone-900'
                  : 'border-stone-300 bg-stone-50/50 text-stone-900 placeholder:text-stone-500 focus:border-stone-400 focus:ring-stone-400/30 focus:ring-offset-white'
              )}
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  updateFilters({ search: undefined });
                }}
                className={cn(
                  'absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 transition-colors',
                  isDark
                    ? 'text-stone-400 hover:bg-stone-700/50 hover:text-stone-300'
                    : 'text-stone-500 hover:bg-stone-200/50 hover:text-stone-700'
                )}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2.5 font-serif text-sm font-medium transition-all duration-200',
                isDark
                  ? 'border-stone-600/50 text-stone-300 hover:border-stone-500 hover:bg-stone-700/50'
                  : 'border-stone-300/50 text-stone-600 hover:border-stone-400 hover:bg-stone-50/80'
              )}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">{t('reset')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
