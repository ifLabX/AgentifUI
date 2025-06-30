'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { useGroupManagementStore } from '@lib/stores/group-management-store';
import { cn } from '@lib/utils';
import { Building2, Plus, RefreshCw } from 'lucide-react';

interface GroupsHeaderProps {
  onCreateGroup: () => void;
}

export function GroupsHeader({ onCreateGroup }: GroupsHeaderProps) {
  const { isDark } = useTheme();
  const { loading, loadGroups, loadStats } = useGroupManagementStore();

  const handleRefresh = () => {
    loadGroups();
    loadStats();
  };

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1
          className={cn(
            'mb-2 bg-gradient-to-r bg-clip-text font-serif text-3xl font-bold text-transparent',
            isDark
              ? 'from-stone-100 to-stone-300'
              : 'from-stone-800 to-stone-600'
          )}
        >
          群组管理
        </h1>
        <p
          className={cn(
            'flex items-center gap-2 font-serif text-sm',
            isDark ? 'text-stone-400' : 'text-stone-600'
          )}
        >
          <Building2 className="h-4 w-4" />
          管理用户群组和应用权限分配
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* 刷新按钮 */}
        <button
          onClick={handleRefresh}
          disabled={loading.groups || loading.stats}
          className={cn(
            'flex items-center gap-2 rounded-xl border px-4 py-2.5 font-serif shadow-sm transition-all duration-200',
            loading.groups || loading.stats
              ? 'cursor-not-allowed opacity-50'
              : isDark
                ? 'border-stone-600/50 text-stone-300 hover:border-stone-500 hover:bg-stone-700/50 hover:shadow-md'
                : 'border-stone-300/50 text-stone-700 backdrop-blur-sm hover:border-stone-400 hover:bg-stone-50/80 hover:shadow-md'
          )}
        >
          <RefreshCw
            className={cn(
              'h-4 w-4',
              (loading.groups || loading.stats) && 'animate-spin'
            )}
          />
          <span className="hidden sm:inline">刷新数据</span>
        </button>

        {/* 创建群组按钮 */}
        <button
          onClick={onCreateGroup}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2.5 font-serif shadow-sm transition-all duration-200 hover:shadow-md',
            isDark
              ? 'bg-gradient-to-r from-stone-600 to-stone-700 text-white hover:from-stone-500 hover:to-stone-600'
              : 'bg-gradient-to-r from-stone-700 to-stone-800 text-white hover:from-stone-600 hover:to-stone-700'
          )}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">创建群组</span>
        </button>
      </div>
    </div>
  );
}
