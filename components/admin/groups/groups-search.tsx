'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Search, X } from 'lucide-react';

interface GroupsSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function GroupsSearch({
  searchTerm,
  onSearchChange,
}: GroupsSearchProps) {
  const { isDark } = useTheme();

  const handleClear = () => {
    onSearchChange('');
  };

  return (
    <div className="mb-6">
      <div
        className={cn(
          'rounded-xl border p-4 shadow-lg backdrop-blur-sm',
          isDark
            ? 'border-stone-700/50 bg-stone-800/60 shadow-stone-900/20'
            : 'border-stone-200/50 bg-white/80 shadow-stone-200/50'
        )}
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search
              className={cn(
                'h-4 w-4',
                isDark ? 'text-stone-400' : 'text-stone-500'
              )}
            />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="搜索群组名称或描述..."
            className={cn(
              'w-full rounded-lg border py-3 pr-10 pl-10 font-serif text-sm transition-all duration-200',
              'focus:ring-2 focus:ring-offset-2 focus:outline-none',
              isDark
                ? 'border-stone-600/50 bg-stone-700/50 text-stone-200 placeholder-stone-400 focus:border-stone-500 focus:bg-stone-700 focus:ring-stone-500 focus:ring-offset-stone-800'
                : 'border-stone-300/50 bg-stone-50/50 text-stone-900 placeholder-stone-500 focus:border-stone-400 focus:bg-white focus:ring-stone-400 focus:ring-offset-white'
            )}
          />
          {searchTerm && (
            <button
              onClick={handleClear}
              className={cn(
                'absolute inset-y-0 right-0 flex items-center pr-3 transition-colors',
                isDark
                  ? 'text-stone-400 hover:text-stone-300'
                  : 'text-stone-500 hover:text-stone-700'
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
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              搜索结果
            </span>
            <div
              className={cn(
                'rounded-full px-2 py-1 font-serif text-xs',
                isDark
                  ? 'bg-stone-700 text-stone-300'
                  : 'bg-stone-100 text-stone-700'
              )}
            >
              关键词: {searchTerm}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
