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
import { toast } from 'react-hot-toast';

import React, { useEffect, useState } from 'react';

export default function UsersManagementPage() {
  const { isDark } = useTheme();
  const { profile: currentUserProfile } = useProfile(); // 获取当前用户信息

  // --- BEGIN COMMENT ---
  // 从用户管理store获取状态和操作
  // --- END COMMENT ---
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

  // --- BEGIN COMMENT ---
  // 检查是否可以更改用户角色（防止管理员降级其他管理员）
  // --- END COMMENT ---
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
      toast.error('不能修改自己的角色');
      return false;
    }

    // 防止非超级管理员降级其他管理员
    if (targetUser.role === 'admin' && newRole !== 'admin') {
      toast.error('不能降级其他管理员的权限');
      return false;
    }

    return true;
  };

  // --- BEGIN COMMENT ---
  // 检查是否可以删除用户（防止删除管理员账号）
  // --- END COMMENT ---
  const canDeleteUser = (targetUser: any) => {
    // 如果当前用户不是管理员，不允许删除
    if (currentUserProfile?.role !== 'admin') {
      return false;
    }

    // 防止删除自己
    if (targetUser.id === currentUserProfile?.id) {
      toast.error('不能删除自己的账号');
      return false;
    }

    // 防止删除其他管理员
    if (targetUser.role === 'admin') {
      toast.error('不能删除其他管理员账号');
      return false;
    }

    return true;
  };

  // --- BEGIN COMMENT ---
  // 检查批量操作是否包含受保护的用户
  // --- END COMMENT ---
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
      toast.error('不能在批量操作中包含自己');
      return false;
    }

    // 检查是否试图降级其他管理员
    const hasAdminBeingDowngraded = selectedUsers.some(
      user => user.role === 'admin' && newRole !== 'admin'
    );
    if (hasAdminBeingDowngraded) {
      toast.error('不能在批量操作中降级其他管理员');
      return false;
    }

    return true;
  };

  // --- BEGIN COMMENT ---
  // 页面初始化时加载数据
  // --- END COMMENT ---
  useEffect(() => {
    loadUsers();
    loadStats();
    loadFilterOptions();
  }, [loadUsers, loadStats, loadFilterOptions]);

  // --- BEGIN COMMENT ---
  // 处理错误提示
  // --- END COMMENT ---
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // --- BEGIN COMMENT ---
  // 处理筛选重置
  // --- END COMMENT ---
  const handleResetFilters = () => {
    updateFilters({
      role: undefined,
      status: undefined,
      auth_source: undefined,
      search: undefined,
    });
  };

  // --- BEGIN COMMENT ---
  // 处理用户选择
  // --- END COMMENT ---
  const handleSelectUser = (userId: string) => {
    toggleUserSelection(userId);
  };

  // --- BEGIN COMMENT ---
  // 处理全选/取消全选
  // --- END COMMENT ---
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      selectUsers(users.map(user => user.id));
    } else {
      clearSelection();
    }
  };

  // --- BEGIN COMMENT ---
  // 处理用户角色更改（带安全检查）
  // --- END COMMENT ---
  const handleChangeRole = async (
    user: any,
    role: 'admin' | 'manager' | 'user'
  ) => {
    if (!canChangeUserRole(user, role)) {
      return;
    }

    const success = await changeUserRole(user.id, role);
    if (success) {
      toast.success(
        `已将 ${user.full_name || user.email} 的角色更改为${
          role === 'admin' ? '管理员' : role === 'manager' ? '经理' : '普通用户'
        }`
      );
    }
  };

  // --- BEGIN COMMENT ---
  // 处理用户状态更改
  // --- END COMMENT ---
  const handleChangeStatus = async (
    user: any,
    status: 'active' | 'suspended' | 'pending'
  ) => {
    const success = await changeUserStatus(user.id, status);
    if (success) {
      toast.success(
        `已将 ${user.full_name || user.email} 的状态更改为${
          status === 'active'
            ? '活跃'
            : status === 'suspended'
              ? '已暂停'
              : '待激活'
        }`
      );
    }
  };

  // --- BEGIN COMMENT ---
  // 处理用户删除（带安全检查）
  // --- END COMMENT ---
  const handleDeleteUser = async (user: any) => {
    if (!canDeleteUser(user)) {
      return;
    }

    if (
      window.confirm(
        `确定要删除用户 ${user.full_name || user.email} 吗？此操作不可撤销。`
      )
    ) {
      const success = await removeUser(user.id);
      if (success) {
        toast.success(`已删除用户 ${user.full_name || user.email}`);
      }
    }
  };

  // --- BEGIN COMMENT ---
  // 处理批量角色更改（带安全检查）
  // --- END COMMENT ---
  const handleBatchChangeRole = async (role: 'admin' | 'manager' | 'user') => {
    if (!canBatchChangeRole(role)) {
      return;
    }

    const success = await batchChangeRole(role);
    if (success) {
      toast.success(`已批量更改 ${selectedUserIds.length} 个用户的角色`);
    }
  };

  // --- BEGIN COMMENT ---
  // 处理批量状态更改
  // --- END COMMENT ---
  const handleBatchChangeStatus = async (
    status: 'active' | 'suspended' | 'pending'
  ) => {
    const success = await batchChangeStatus(status);
    if (success) {
      toast.success(`已批量更改 ${selectedUserIds.length} 个用户的状态`);
    }
  };

  // --- BEGIN COMMENT ---
  // 处理查看用户（暂时用toast代替）
  // --- END COMMENT ---
  const handleViewUser = (user: any) => {
    toast.success(`查看用户：${user.full_name || user.email}`);
  };

  // --- BEGIN COMMENT ---
  // 处理编辑用户（暂时用toast代替）
  // --- END COMMENT ---
  const handleEditUser = (user: any) => {
    toast.success(`编辑用户：${user.full_name || user.email}`);
  };

  // --- BEGIN COMMENT ---
  // 分页控制
  // --- END COMMENT ---
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
          显示第 {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
          {Math.min(pagination.page * pagination.pageSize, pagination.total)}{' '}
          条， 共 {pagination.total} 条记录
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
            上一页
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
            下一页
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
        {/* --- BEGIN COMMENT ---
        页面标题和操作栏 - 优化视觉层次和间距
        --- END COMMENT --- */}
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
              用户管理
            </h1>
            <p
              className={cn(
                'flex items-center gap-2 font-serif text-base',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              <Users className="h-4 w-4" />
              管理系统用户账户、权限和访问控制
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* --- BEGIN COMMENT ---
            刷新按钮 - 优化样式和交互
            --- END COMMENT --- */}
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
              <span className="hidden sm:inline">刷新数据</span>
            </button>

            {/* --- BEGIN COMMENT ---
            添加用户按钮 - 优化样式和视觉效果
            --- END COMMENT --- */}
            <button
              onClick={() => toast.success('添加用户功能开发中')}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 font-serif shadow-sm transition-all duration-200 hover:shadow-md',
                isDark
                  ? 'bg-gradient-to-r from-stone-600 to-stone-700 text-white hover:from-stone-500 hover:to-stone-600'
                  : 'bg-gradient-to-r from-stone-700 to-stone-800 text-white hover:from-stone-600 hover:to-stone-700'
              )}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">添加用户</span>
            </button>
          </div>
        </div>

        {/* --- BEGIN COMMENT ---
      统计卡片
      --- END COMMENT --- */}
        <UserStatsCards stats={stats} isLoading={loading.stats} />

        {/* --- BEGIN COMMENT ---
      筛选组件
      --- END COMMENT --- */}
        <UserFiltersComponent
          filters={filters}
          onFiltersChange={updateFilters}
          onReset={handleResetFilters}
        />

        {/* --- BEGIN COMMENT ---
        批量操作栏 - 优化设计和交互体验
        --- END COMMENT --- */}
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
                    已选择 {selectedUserIds.length} 个用户
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
                    取消选择
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* --- BEGIN COMMENT ---
              批量角色操作
              --- END COMMENT --- */}
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
                  设为管理员
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
                  设为经理
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
                  设为普通用户
                </button>

                {/* --- BEGIN COMMENT ---
              批量状态操作
              --- END COMMENT --- */}
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
                  激活
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
                  暂停
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- BEGIN COMMENT ---
        用户表格
        --- END COMMENT --- */}
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

        {/* --- BEGIN COMMENT ---
        分页控制
        --- END COMMENT --- */}
        <PaginationControls />
      </div>
    </div>
  );
}
