'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { usePermissionManagementStore } from '@lib/stores/permission-management-store';
import type { AppVisibility } from '@lib/types/database';
import { cn } from '@lib/utils';
import { Search } from 'lucide-react';

export function SearchAndFilter() {
  const { isDark } = useTheme();
  const { searchTerm, visibilityFilter, setSearchTerm, setVisibilityFilter } =
    usePermissionManagementStore();

  const visibilityOptions: Array<{
    value: AppVisibility | 'all';
    label: string;
    color: string;
  }> = [
    { value: 'all', label: '全部应用', color: 'text-stone-600' },
    { value: 'public', label: '公开应用', color: 'text-green-600' },
    { value: 'group_only', label: '群组应用', color: 'text-blue-600' },
    { value: 'private', label: '私有应用', color: 'text-purple-600' },
  ];

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        isDark ? 'border-stone-700 bg-stone-800' : 'border-stone-200 bg-white'
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* 搜索框 */}
        <div className="relative max-w-md flex-1">
          <Search
            className={cn(
              'absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2',
              isDark ? 'text-stone-400' : 'text-stone-500'
            )}
          />
          <input
            type="text"
            placeholder="搜索应用名称或描述..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={cn(
              'w-full rounded-lg border py-2.5 pr-4 pl-10 font-serif text-sm transition-all duration-200',
              'focus:ring-2 focus:ring-offset-2 focus:outline-none',
              isDark
                ? 'border-stone-600 bg-stone-700 text-stone-200 placeholder-stone-400 focus:border-stone-500 focus:ring-stone-500 focus:ring-offset-stone-800'
                : 'border-stone-300 bg-stone-50 text-stone-900 placeholder-stone-500 focus:border-stone-400 focus:ring-stone-400 focus:ring-offset-white'
            )}
          />
        </div>

        {/* 可见性筛选 */}
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'font-serif text-sm font-medium whitespace-nowrap',
              isDark ? 'text-stone-300' : 'text-stone-700'
            )}
          >
            应用类型：
          </span>
          <div className="flex items-center gap-1">
            {visibilityOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setVisibilityFilter(option.value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 font-serif text-sm font-medium transition-all duration-200',
                  visibilityFilter === option.value
                    ? isDark
                      ? 'bg-stone-600 text-stone-100 shadow-sm'
                      : 'bg-stone-800 text-white shadow-sm'
                    : isDark
                      ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-800'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
