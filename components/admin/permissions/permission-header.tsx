'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { usePermissionManagementStore } from '@lib/stores/permission-management-store';
import { cn } from '@lib/utils';
import { RefreshCw, Shield } from 'lucide-react';

export function PermissionHeader() {
  const { isDark } = useTheme();
  const { loadApps, loadGroups, loading } = usePermissionManagementStore();

  const handleRefresh = () => {
    loadApps();
    loadGroups();
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
          应用权限管理
        </h1>
        <p
          className={cn(
            'flex items-center gap-2 font-serif text-sm',
            isDark ? 'text-stone-400' : 'text-stone-600'
          )}
        >
          <Shield className="h-4 w-4" />
          统一管理应用可见性和群组权限分配
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* 刷新按钮 */}
        <button
          onClick={handleRefresh}
          disabled={loading.apps || loading.groups}
          className={cn(
            'flex items-center gap-2 rounded-xl border px-4 py-2.5 font-serif shadow-sm transition-all duration-200',
            loading.apps || loading.groups
              ? 'cursor-not-allowed opacity-50'
              : isDark
                ? 'border-stone-600/50 text-stone-300 hover:border-stone-500 hover:bg-stone-700/50 hover:shadow-md'
                : 'border-stone-300/50 text-stone-700 backdrop-blur-sm hover:border-stone-400 hover:bg-stone-50/80 hover:shadow-md'
          )}
        >
          <RefreshCw
            className={cn(
              'h-4 w-4',
              (loading.apps || loading.groups) && 'animate-spin'
            )}
          />
          <span className="hidden sm:inline">刷新数据</span>
        </button>
      </div>
    </div>
  );
}
