'use client';

import { UserFiltersComponent } from '@components/admin/users/user-filters';
import { UserStatsCards } from '@components/admin/users/user-stats-cards';
import { UserTable } from '@components/admin/users/user-table';
import { useProfile } from '@lib/hooks/use-profile';
import { useTheme } from '@lib/hooks/use-theme';
import { useUserManagementStore } from '@lib/stores/user-management-store';
import { cn } from '@lib/utils';
import {
  CheckSquare,
  Clock,
  Crown,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserCheck,
  UserIcon,
  UserX,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import React, { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

export default function UsersManagementPage() {
  const { isDark } = useTheme();
  const { profile: currentUserProfile } = useProfile(); // 获取当前用户信息
  const t = useTranslations('pages.admin.users');

  // 从用户管理store获取状态和操作
  const {
    users,
    stats,
    filters,
    filterOptions,
    pagination,
    loading,
    error,
    selectedUserIds,
    loadUsers,
    loadStats,
    loadFilterOptions,

    updateFilters,
    setPage,
    toggleUserSelection,
    selectUsers,
    clearSelection,
    changeUserRole,
    changeUserStatus,
    removeUser,
    batchChangeRole,
    batchChangeStatus,
    clearError,
  } = useUserManagementStore();

  // 检查是否可以更改用户角色（防止管理员降级其他管理员）
  const canChangeUserRole = (
    targetUser: any,
    newRole: 'admin' | 'manager' | 'user'
  ) => {
    // 如果当前用户不是管理员，不允许任何角色更改
    if (currentUserProfile?.role !== 'admin') {
      return false;
    }

    // 防止管理员修改自己的角色
    if (targetUser.id === currentUserProfile?.id) {
      toast.error(t('messages.cannotChangeOwnRole'));
      return false;
    }

    // 防止非超级管理员降级其他管理员
    if (targetUser.role === 'admin' && newRole !== 'admin') {
      toast.error(t('messages.cannotDowngradeOtherAdmin'));
      return false;
    }

    return true;
  };

  // 检查是否可以删除用户（防止删除管理员账号）
  const canDeleteUser = (targetUser: any) => {
    // 如果当前用户不是管理员，不允许删除
    if (currentUserProfile?.role !== 'admin') {
      return false;
    }

    // 防止删除自己
    if (targetUser.id === currentUserProfile?.id) {
      toast.error(t('messages.cannotDeleteSelf'));
      return false;
    }

    // 防止删除其他管理员
    if (targetUser.role === 'admin') {
      toast.error(t('messages.cannotDeleteOtherAdmin'));
      return false;
    }

    return true;
  };

  // 检查批量操作是否包含受保护的用户
  const canBatchChangeRole = (newRole: 'admin' | 'manager' | 'user') => {
    if (currentUserProfile?.role !== 'admin') {
      return false;
    }

    const selectedUsers = users.filter(user =>
      selectedUserIds.includes(user.id)
    );

    // 检查是否包含当前用户
    const includesSelf = selectedUsers.some(
      user => user.id === currentUserProfile?.id
    );
    if (includesSelf) {
      toast.error(t('messages.cannotIncludeSelf'));
      return false;
    }

    // 检查是否试图降级其他管理员
    const hasAdminBeingDowngraded = selectedUsers.some(
      user => user.role === 'admin' && newRole !== 'admin'
    );
    if (hasAdminBeingDowngraded) {
      toast.error(t('messages.cannotDowngradeAdmin'));
      return false;
    }

    return true;
  };

  // 页面初始化时加载数据
  useEffect(() => {
    loadUsers();
    loadStats();
    loadFilterOptions();
  }, [loadUsers, loadStats, loadFilterOptions]);

  // 处理错误提示
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // 处理筛选重置
  const handleResetFilters = () => {
    updateFilters({
      role: undefined,
      status: undefined,
      auth_source: undefined,
      search: undefined,
    });
  };

  // 处理用户选择
  const handleSelectUser = (userId: string) => {
    toggleUserSelection(userId);
  };

  // 处理全选/取消全选
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      selectUsers(users.map(user => user.id));
    } else {
      clearSelection();
    }
  };

  // 处理用户角色更改（带安全检查）
  const handleChangeRole = async (
    user: any,
    role: 'admin' | 'manager' | 'user'
  ) => {
    if (!canChangeUserRole(user, role)) {
      return;
    }

    const success = await changeUserRole(user.id, role);
    if (success) {
      const roleText = t(`messages.roles.${role}`);
      toast.success(
        t('messages.roleChangeSuccess', {
          name: user.full_name || user.email,
          role: roleText,
        })
      );
    }
  };

  // 处理用户状态更改
  const handleChangeStatus = async (
    user: any,
    status: 'active' | 'suspended' | 'pending'
  ) => {
    const success = await changeUserStatus(user.id, status);
    if (success) {
      const statusText = t(`messages.statuses.${status}`);
      toast.success(
        t('messages.statusChangeSuccess', {
          name: user.full_name || user.email,
          status: statusText,
        })
      );
    }
  };

  // 处理用户删除（带安全检查）
  const handleDeleteUser = async (user: any) => {
    if (!canDeleteUser(user)) {
      return;
    }

    if (
      window.confirm(
        t('messages.deleteConfirm', { name: user.full_name || user.email })
      )
    ) {
      const success = await removeUser(user.id);
      if (success) {
        toast.success(
          t('messages.deleteSuccess', { name: user.full_name || user.email })
        );
      }
    }
  };

  // 处理批量角色更改（带安全检查）
  const handleBatchChangeRole = async (role: 'admin' | 'manager' | 'user') => {
    if (!canBatchChangeRole(role)) {
      return;
    }

    const success = await batchChangeRole(role);
    if (success) {
      toast.success(
        t('messages.batchRoleChangeSuccess', { count: selectedUserIds.length })
      );
    }
  };

  // 处理批量状态更改
  const handleBatchChangeStatus = async (
    status: 'active' | 'suspended' | 'pending'
  ) => {
    const success = await batchChangeStatus(status);
    if (success) {
      toast.success(
        t('messages.batchStatusChangeSuccess', {
          count: selectedUserIds.length,
        })
      );
    }
  };

  // 处理查看用户（暂时用toast代替）
  const handleViewUser = (user: any) => {
    toast.success(
      t('actions.viewUser', { name: user.full_name || user.email })
    );
  };

  // 处理编辑用户（暂时用toast代替）
  const handleEditUser = (user: any) => {
    toast.success(
      t('actions.editUser', { name: user.full_name || user.email })
    );
  };

  // 分页控制
  const PaginationControls = () => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="mt-6 flex items-center justify-between">
        <div
          className={cn(
            'font-serif text-sm',
            isDark ? 'text-stone-400' : 'text-stone-600'
          )}
        >
          {t('pagination.showing', {
            start: (pagination.page - 1) * pagination.pageSize + 1,
            end: Math.min(
              pagination.page * pagination.pageSize,
              pagination.total
            ),
            total: pagination.total,
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className={cn(
              'rounded-lg border px-3 py-1.5 font-serif text-sm transition-colors',
              pagination.page <= 1
                ? 'cursor-not-allowed opacity-50'
                : isDark
                  ? 'border-stone-600 text-stone-300 hover:bg-stone-700'
                  : 'border-stone-300 text-stone-700 hover:bg-stone-50'
            )}
          >
            {t('pagination.previous')}
          </button>

          <span
            className={cn(
              'px-3 py-1.5 font-serif text-sm',
              isDark ? 'text-stone-300' : 'text-stone-700'
            )}
          >
            {pagination.page} / {pagination.totalPages}
          </span>

          <button
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className={cn(
              'rounded-lg border px-3 py-1.5 font-serif text-sm transition-colors',
              pagination.page >= pagination.totalPages
                ? 'cursor-not-allowed opacity-50'
                : isDark
                  ? 'border-stone-600 text-stone-300 hover:bg-stone-700'
                  : 'border-stone-300 text-stone-700 hover:bg-stone-50'
            )}
          >
            {t('pagination.next')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        'min-h-screen',
        isDark
          ? 'bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800'
          : 'bg-gradient-to-br from-stone-50 via-white to-stone-100'
      )}
    >
      <div className="mx-auto max-w-7xl p-6">
        {/* Page title and action bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className={cn(
                'mb-3 bg-gradient-to-r bg-clip-text font-serif text-4xl font-bold text-transparent',
                isDark
                  ? 'from-stone-100 to-stone-300'
                  : 'from-stone-800 to-stone-600'
              )}
            >
              {t('title')}
            </h1>
            <p
              className={cn(
                'flex items-center gap-2 font-serif text-base',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              <Users className="h-4 w-4" />
              {t('subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh button */}
            <button
              onClick={() => {
                loadUsers();
                loadStats();
              }}
              disabled={loading.users || loading.stats}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-4 py-2.5 font-serif shadow-sm transition-all duration-200',
                loading.users || loading.stats
                  ? 'cursor-not-allowed opacity-50'
                  : isDark
                    ? 'border-stone-600/50 text-stone-300 hover:border-stone-500 hover:bg-stone-700/50 hover:shadow-md'
                    : 'border-stone-300/50 text-stone-700 backdrop-blur-sm hover:border-stone-400 hover:bg-stone-50/80 hover:shadow-md'
              )}
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  (loading.users || loading.stats) && 'animate-spin'
                )}
              />
              <span className="hidden sm:inline">
                {t('actions.refreshData')}
              </span>
            </button>

            {/* Add user button */}
            <button
              onClick={() => toast.success(t('actions.addUserInDevelopment'))}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 font-serif shadow-sm transition-all duration-200 hover:shadow-md',
                isDark
                  ? 'bg-gradient-to-r from-stone-600 to-stone-700 text-white hover:from-stone-500 hover:to-stone-600'
                  : 'bg-gradient-to-r from-stone-700 to-stone-800 text-white hover:from-stone-600 hover:to-stone-700'
              )}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('actions.addUser')}</span>
            </button>
          </div>
        </div>

        {/* Statistics cards */}
        <UserStatsCards stats={stats} isLoading={loading.stats} />

        {/* Filter component */}
        <UserFiltersComponent
          filters={filters}
          onFiltersChange={updateFilters}
          onReset={handleResetFilters}
        />

        {/* Batch operation bar */}
        {selectedUserIds.length > 0 && (
          <div
            className={cn(
              'mb-6 rounded-xl border p-5 shadow-lg backdrop-blur-sm',
              isDark
                ? 'border-stone-700/50 bg-stone-800/60 shadow-stone-900/20'
                : 'border-stone-200/50 bg-white/80 shadow-stone-200/50'
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    isDark
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-blue-100 text-blue-600'
                  )}
                >
                  <CheckSquare className="h-4 w-4" />
                </div>
                <div>
                  <span
                    className={cn(
                      'font-serif text-sm font-semibold',
                      isDark ? 'text-stone-200' : 'text-stone-800'
                    )}
                  >
                    {t('batchOperations.selected', {
                      count: selectedUserIds.length,
                    })}
                  </span>
                  <button
                    onClick={clearSelection}
                    className={cn(
                      'ml-3 rounded-lg px-2 py-1 font-serif text-xs transition-colors',
                      isDark
                        ? 'text-stone-400 hover:bg-stone-700/50 hover:text-stone-300'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-700'
                    )}
                  >
                    {t('batchOperations.cancelSelection')}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Batch role operations */}
                <button
                  onClick={() => handleBatchChangeRole('admin')}
                  disabled={loading.batchOperating}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-serif text-sm transition-colors',
                    isDark
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  )}
                >
                  <Shield className="h-3 w-3" />
                  {t('batchOperations.setAsAdmin')}
                </button>

                <button
                  onClick={() => handleBatchChangeRole('manager')}
                  disabled={loading.batchOperating}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-serif text-sm transition-colors',
                    isDark
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  )}
                >
                  <Crown className="h-3 w-3" />
                  {t('batchOperations.setAsManager')}
                </button>

                <button
                  onClick={() => handleBatchChangeRole('user')}
                  disabled={loading.batchOperating}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-serif text-sm transition-colors',
                    isDark
                      ? 'bg-stone-600 text-white hover:bg-stone-700'
                      : 'bg-stone-600 text-white hover:bg-stone-700'
                  )}
                >
                  <UserIcon className="h-3 w-3" />
                  {t('batchOperations.setAsUser')}
                </button>

                {/* Batch status operations */}
                <button
                  onClick={() => handleBatchChangeStatus('active')}
                  disabled={loading.batchOperating}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-serif text-sm transition-colors',
                    isDark
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  )}
                >
                  <UserCheck className="h-3 w-3" />
                  {t('batchOperations.activate')}
                </button>

                <button
                  onClick={() => handleBatchChangeStatus('suspended')}
                  disabled={loading.batchOperating}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-serif text-sm transition-colors',
                    isDark
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  )}
                >
                  <UserX className="h-3 w-3" />
                  {t('batchOperations.suspend')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User table */}
        <UserTable
          users={users}
          selectedUserIds={selectedUserIds}
          isLoading={loading.users}
          onSelectUser={handleSelectUser}
          onSelectAll={handleSelectAll}
          onEditUser={handleEditUser}
          onViewUser={handleViewUser}
          onDeleteUser={handleDeleteUser}
          onChangeRole={handleChangeRole}
          onChangeStatus={handleChangeStatus}
        />

        {/* Pagination controls */}
        <PaginationControls />
      </div>
    </div>
  );
}
