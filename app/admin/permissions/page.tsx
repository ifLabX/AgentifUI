'use client';

import { PermissionHeader } from '@components/admin/permissions/permission-header';
import { PermissionLayout } from '@components/admin/permissions/permission-layout';
import { useTheme } from '@lib/hooks/use-theme';
import { usePermissionManagementStore } from '@lib/stores/permission-management-store';
import { cn } from '@lib/utils';

import { useEffect } from 'react';

export default function PermissionsPage() {
  const { isDark } = useTheme();
  const { loadApps, loadGroups, loading, error } =
    usePermissionManagementStore();

  // 初始化数据
  useEffect(() => {
    loadApps();
    loadGroups();
  }, [loadApps, loadGroups]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 页面头部 */}
      <PermissionHeader />

      {/* 错误提示 */}
      {error && (
        <div
          className={cn(
            'mb-6 rounded-lg border p-4',
            isDark
              ? 'border-red-800 bg-red-900/20 text-red-400'
              : 'border-red-200 bg-red-50 text-red-600'
          )}
        >
          <p className="font-serif text-sm">{error}</p>
        </div>
      )}

      {/* 主要内容 */}
      <PermissionLayout />
    </div>
  );
}
