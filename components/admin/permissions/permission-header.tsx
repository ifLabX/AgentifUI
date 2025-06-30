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
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1
          className={cn(
            'mb-3 bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent',
            isDark
              ? 'from-stone-100 to-stone-300'
              : 'from-stone-800 to-stone-600'
          )}
        >
          应用权限管理
        </h1>
        <p
          className={cn(
            'text-base',
            isDark ? 'text-stone-400' : 'text-stone-600'
          )}
        >
          统一管理应用可见性和群组权限分配
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* 刷新按钮 */}
        <button
          onClick={handleRefresh}
          disabled={loading.apps || loading.groups}
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-2.5 font-serif text-sm transition-all duration-200',
            loading.apps || loading.groups
              ? 'cursor-not-allowed opacity-50'
              : isDark
                ? 'border-stone-600 bg-stone-800 text-stone-300 hover:border-stone-500 hover:bg-stone-700'
                : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50'
          )}
        >
          <RefreshCw
            className={cn(
              'h-4 w-4',
              (loading.apps || loading.groups) && 'animate-spin'
            )}
          />
          <span>刷新数据</span>
        </button>
      </div>
    </div>
  );
}
