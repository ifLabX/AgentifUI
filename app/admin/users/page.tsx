"use client"

import React, { useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { useUserManagementStore } from '@lib/stores/user-management-store'
import { cn } from '@lib/utils'
import { UserStatsCards } from '@components/admin/users/user-stats-cards'
import { UserFiltersComponent } from '@components/admin/users/user-filters'
import { UserTable } from '@components/admin/users/user-table'
import { toast } from 'react-hot-toast'
import { 
  Users, 
  Plus, 
  Trash2, 
  Shield, 
  Crown, 
  UserIcon,
  UserCheck,
  UserX,
  Clock,
  RefreshCw
} from 'lucide-react'

export default function UsersManagementPage() {
  const { isDark } = useTheme()
  
  // --- BEGIN COMMENT ---
  // 从用户管理store获取状态和操作
  // --- END COMMENT ---
  const {
    users,
    stats,
    filters,
    pagination,
    loading,
    error,
    selectedUserIds,
    loadUsers,
    loadStats,
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
    clearError
  } = useUserManagementStore()

  // --- BEGIN COMMENT ---
  // 页面初始化时加载数据
  // --- END COMMENT ---
  useEffect(() => {
    loadUsers()
    loadStats()
  }, [loadUsers, loadStats])

  // --- BEGIN COMMENT ---
  // 处理错误提示
  // --- END COMMENT ---
  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error, clearError])

  // --- BEGIN COMMENT ---
  // 处理筛选重置
  // --- END COMMENT ---
  const handleResetFilters = () => {
    updateFilters({
      role: undefined,
      status: undefined,
      auth_source: undefined,
      search: undefined,
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
  }

  // --- BEGIN COMMENT ---
  // 处理用户选择
  // --- END COMMENT ---
  const handleSelectUser = (userId: string) => {
    toggleUserSelection(userId)
  }

  // --- BEGIN COMMENT ---
  // 处理全选/取消全选
  // --- END COMMENT ---
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      selectUsers(users.map(user => user.id))
    } else {
      clearSelection()
    }
  }

  // --- BEGIN COMMENT ---
  // 处理用户角色更改
  // --- END COMMENT ---
  const handleChangeRole = async (user: any, role: 'admin' | 'manager' | 'user') => {
    const success = await changeUserRole(user.id, role)
    if (success) {
      toast.success(`已将 ${user.full_name || user.email} 的角色更改为${
        role === 'admin' ? '管理员' : role === 'manager' ? '经理' : '普通用户'
      }`)
    }
  }

  // --- BEGIN COMMENT ---
  // 处理用户状态更改
  // --- END COMMENT ---
  const handleChangeStatus = async (user: any, status: 'active' | 'suspended' | 'pending') => {
    const success = await changeUserStatus(user.id, status)
    if (success) {
      toast.success(`已将 ${user.full_name || user.email} 的状态更改为${
        status === 'active' ? '活跃' : status === 'suspended' ? '已暂停' : '待激活'
      }`)
    }
  }

  // --- BEGIN COMMENT ---
  // 处理用户删除
  // --- END COMMENT ---
  const handleDeleteUser = async (user: any) => {
    if (window.confirm(`确定要删除用户 ${user.full_name || user.email} 吗？此操作不可撤销。`)) {
      const success = await removeUser(user.id)
      if (success) {
        toast.success(`已删除用户 ${user.full_name || user.email}`)
      }
    }
  }

  // --- BEGIN COMMENT ---
  // 处理批量角色更改
  // --- END COMMENT ---
  const handleBatchChangeRole = async (role: 'admin' | 'manager' | 'user') => {
    const success = await batchChangeRole(role)
    if (success) {
      toast.success(`已批量更改 ${selectedUserIds.length} 个用户的角色`)
    }
  }

  // --- BEGIN COMMENT ---
  // 处理批量状态更改
  // --- END COMMENT ---
  const handleBatchChangeStatus = async (status: 'active' | 'suspended' | 'pending') => {
    const success = await batchChangeStatus(status)
    if (success) {
      toast.success(`已批量更改 ${selectedUserIds.length} 个用户的状态`)
    }
  }

  // --- BEGIN COMMENT ---
  // 处理查看用户（暂时用toast代替）
  // --- END COMMENT ---
  const handleViewUser = (user: any) => {
    toast.success(`查看用户：${user.full_name || user.email}`)
  }

  // --- BEGIN COMMENT ---
  // 处理编辑用户（暂时用toast代替）
  // --- END COMMENT ---
  const handleEditUser = (user: any) => {
    toast.success(`编辑用户：${user.full_name || user.email}`)
  }

  // --- BEGIN COMMENT ---
  // 分页控制
  // --- END COMMENT ---
  const PaginationControls = () => {
    if (pagination.totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between mt-6">
        <div className={cn(
          "text-sm font-serif",
          isDark ? "text-stone-400" : "text-stone-600"
        )}>
          显示第 {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} 条，
          共 {pagination.total} 条记录
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg border transition-colors font-serif",
              pagination.page <= 1
                ? "opacity-50 cursor-not-allowed"
                : isDark 
                  ? "border-stone-600 text-stone-300 hover:bg-stone-700" 
                  : "border-stone-300 text-stone-700 hover:bg-stone-50"
            )}
          >
            上一页
          </button>
          
          <span className={cn(
            "px-3 py-1.5 text-sm font-serif",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            {pagination.page} / {pagination.totalPages}
          </span>
          
          <button
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg border transition-colors font-serif",
              pagination.page >= pagination.totalPages
                ? "opacity-50 cursor-not-allowed"
                : isDark 
                  ? "border-stone-600 text-stone-300 hover:bg-stone-700" 
                  : "border-stone-300 text-stone-700 hover:bg-stone-50"
            )}
          >
            下一页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* --- BEGIN COMMENT ---
      页面标题和操作栏
      --- END COMMENT --- */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={cn(
            "text-3xl font-bold font-serif mb-2",
            isDark ? "text-stone-100" : "text-stone-900"
          )}>
            用户管理
          </h1>
          <p className={cn(
            "text-sm font-serif",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            管理系统用户账户、权限和访问控制
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* --- BEGIN COMMENT ---
          刷新按钮
          --- END COMMENT --- */}
          <button
            onClick={() => {
              loadUsers()
              loadStats()
            }}
            disabled={loading.users || loading.stats}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors font-serif",
              loading.users || loading.stats
                ? "opacity-50 cursor-not-allowed"
                : isDark
                  ? "border-stone-600 text-stone-300 hover:bg-stone-700"
                  : "border-stone-300 text-stone-700 hover:bg-stone-50"
            )}
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              (loading.users || loading.stats) && "animate-spin"
            )} />
            刷新
          </button>
          
          {/* --- BEGIN COMMENT ---
          添加用户按钮（暂时禁用）
          --- END COMMENT --- */}
          <button
            onClick={() => toast.success('添加用户功能开发中')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-serif",
              isDark
                ? "bg-stone-600 text-white hover:bg-stone-700"
                : "bg-stone-700 text-white hover:bg-stone-800"
            )}
          >
            <Plus className="h-4 w-4" />
            添加用户
          </button>
        </div>
      </div>

      {/* --- BEGIN COMMENT ---
      统计卡片
      --- END COMMENT --- */}
      <UserStatsCards 
        stats={stats} 
        isLoading={loading.stats} 
      />

      {/* --- BEGIN COMMENT ---
      筛选组件
      --- END COMMENT --- */}
      <UserFiltersComponent
        filters={filters}
        onFiltersChange={updateFilters}
        onReset={handleResetFilters}
      />

      {/* --- BEGIN COMMENT ---
      批量操作栏（当有选中项时显示）
      --- END COMMENT --- */}
      {selectedUserIds.length > 0 && (
        <div className={cn(
          "p-4 rounded-xl border mb-4",
          isDark ? "bg-stone-500/10 border-stone-500/20" : "bg-stone-50 border-stone-200"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-medium font-serif",
                isDark ? "text-stone-300" : "text-stone-700"
              )}>
                已选择 {selectedUserIds.length} 个用户
              </span>
              <button
                onClick={clearSelection}
                className={cn(
                  "text-xs px-2 py-1 rounded transition-colors font-serif",
                  isDark 
                    ? "text-stone-400 hover:bg-stone-500/20" 
                    : "text-stone-600 hover:bg-stone-100"
                )}
              >
                取消选择
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {/* --- BEGIN COMMENT ---
              批量角色操作
              --- END COMMENT --- */}
              <button
                onClick={() => handleBatchChangeRole('admin')}
                disabled={loading.batchOperating}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors font-serif",
                  isDark
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                )}
              >
                <Shield className="h-3 w-3" />
                设为管理员
              </button>
              
              <button
                onClick={() => handleBatchChangeRole('user')}
                disabled={loading.batchOperating}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors font-serif",
                  isDark
                    ? "bg-stone-600 text-white hover:bg-stone-700"
                    : "bg-stone-600 text-white hover:bg-stone-700"
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
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors font-serif",
                  isDark
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                )}
              >
                <UserCheck className="h-3 w-3" />
                激活
              </button>
              
              <button
                onClick={() => handleBatchChangeStatus('suspended')}
                disabled={loading.batchOperating}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors font-serif",
                  isDark
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-red-600 text-white hover:bg-red-700"
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
  )
} 