'use client';

import { cn } from '@lib/utils';
import { Search, X } from 'lucide-react';

import { useTranslations } from 'next-intl';

interface GroupsSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function GroupsSearch({
  searchTerm,
  onSearchChange,
}: GroupsSearchProps) {
  const t = useTranslations('pages.admin.groups.search');

  const handleClear = () => {
    onSearchChange('');
  };

  return (
    <div className="mb-6">
      <div
        className={cn(
          'rounded-xl border p-4 shadow-lg backdrop-blur-sm',
          'border-stone-200/50 bg-white/80 shadow-stone-200/50 dark:border-stone-700/50 dark:bg-stone-800/60 dark:shadow-stone-900/20'
        )}
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search
              className={cn('h-4 w-4', 'text-stone-500 dark:text-stone-400')}
            />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={t('placeholder')}
            className={cn(
              'w-full rounded-lg border py-3 pr-10 pl-10 font-serif text-sm transition-all duration-200',
              'focus:ring-2 focus:ring-offset-2 focus:outline-none',
              'border-stone-300/50 bg-stone-50/50 text-stone-900 placeholder-stone-500 focus:border-stone-400 focus:bg-white focus:ring-stone-400 focus:ring-offset-white',
              'dark:border-stone-600/50 dark:bg-stone-700/50 dark:text-stone-200 dark:placeholder-stone-400 dark:focus:border-stone-500 dark:focus:bg-stone-700 dark:focus:ring-stone-500 dark:focus:ring-offset-stone-800'
            )}
          />
          {searchTerm && (
            <button
              onClick={handleClear}
              className={cn(
                'absolute inset-y-0 right-0 flex items-center pr-3 transition-colors',
                'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300'
              )}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {searchTerm && (
          <div className="mt-3 flex items-center gap-2">
            <span
              className={cn(
                'font-serif text-xs',
                'text-stone-600 dark:text-stone-400'
              )}
            >
              {t('searchResults')}
            </span>
            <div
              className={cn(
                'rounded-full px-2 py-1 font-serif text-xs',
                'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
              )}
            >
              {t('keyword')}: {searchTerm}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
