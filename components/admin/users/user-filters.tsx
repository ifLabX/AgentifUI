"use client"

import React, { useState } from 'react'
import { Search, Filter, RotateCcw, Users, UserCheck, UserX, Clock, Shield, Crown, UserIcon, ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import type { UserFilters } from '@lib/db/users'

interface UserFiltersProps {
  filters: UserFilters
  onFiltersChange: (filters: Partial<UserFilters>) => void
  onReset: () => void
}

export const UserFiltersComponent: React.FC<UserFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset
}) => {
  const { isDark } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)

  // --- BEGIN COMMENT ---
  // 角色选项
  // --- END COMMENT ---
  const roleOptions = [
    { value: '', label: '所有角色', icon: <Users className="h-4 w-4" /> },
    { value: 'admin', label: '管理员', icon: <Shield className="h-4 w-4" /> },
    { value: 'manager', label: '经理', icon: <Crown className="h-4 w-4" /> },
    { value: 'user', label: '普通用户', icon: <UserIcon className="h-4 w-4" /> }
  ]

  // --- BEGIN COMMENT ---
  // 状态选项
  // --- END COMMENT ---
  const statusOptions = [
    { value: '', label: '所有状态', icon: <Users className="h-4 w-4" /> },
    { value: 'active', label: '活跃', icon: <UserCheck className="h-4 w-4" /> },
    { value: 'suspended', label: '已暂停', icon: <UserX className="h-4 w-4" /> },
    { value: 'pending', label: '待激活', icon: <Clock className="h-4 w-4" /> }
  ]

  // --- BEGIN COMMENT ---
  // 认证来源选项
  // --- END COMMENT ---
  const authSourceOptions = [
    { value: '', label: '所有来源' },
    { value: 'password', label: '密码登录' },
    { value: 'google', label: 'Google' },
    { value: 'github', label: 'GitHub' },
    { value: 'sso', label: 'SSO' }
  ]

  // --- BEGIN COMMENT ---
  // 排序选项
  // --- END COMMENT ---
  const sortOptions = [
    { value: 'created_at', label: '注册时间' },
    { value: 'last_sign_in_at', label: '最后登录' },
    { value: 'email', label: '邮箱' },
    { value: 'full_name', label: '姓名' }
  ]

  // --- BEGIN COMMENT ---
  // 处理搜索输入
  // --- END COMMENT ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ search: e.target.value })
  }

  // --- BEGIN COMMENT ---
  // 检查是否有活跃的筛选条件（除了搜索）
  // --- END COMMENT ---
  const hasActiveFilters = filters.role || filters.status || filters.auth_source
  const hasSearchFilter = filters.search

  return (
    <div className={cn(
      "rounded-xl border backdrop-blur-sm mb-4",
      isDark 
        ? "bg-stone-900/80 border-stone-700/50" 
        : "bg-white/90 border-stone-200/50"
    )}>
      {/* --- BEGIN COMMENT ---
      搜索栏 - 始终显示
      --- END COMMENT --- */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* --- 搜索框 --- */}
          <div className="flex-1 relative">
            <Search className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4",
              isDark ? "text-stone-400" : "text-stone-500"
            )} />
            <input
              type="text"
              placeholder="搜索用户邮箱、姓名或用户名..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className={cn(
                "w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm font-serif placeholder-opacity-60",
                "focus:outline-none focus:ring-2 focus:ring-offset-1",
                isDark
                  ? "bg-stone-800/50 border-stone-600 text-stone-100 placeholder-stone-500 focus:ring-stone-500/30 focus:ring-offset-stone-900"
                  : "bg-stone-50/50 border-stone-300 text-stone-900 placeholder-stone-500 focus:ring-stone-400/30 focus:ring-offset-white",
                "transition-all duration-200"
              )}
            />
          </div>

          {/* --- 展开/收起按钮 --- */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200",
              isDark
                ? "text-stone-300 hover:text-stone-100 hover:bg-stone-700/50 border-stone-600 hover:border-stone-500"
                : "text-stone-600 hover:text-stone-800 hover:bg-stone-50 border-stone-300 hover:border-stone-400"
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">高级筛选</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {(hasActiveFilters || hasSearchFilter) && (
              <div className={cn(
                "w-2 h-2 rounded-full ml-1",
                isDark ? "bg-emerald-400" : "bg-emerald-500"
              )} />
            )}
          </button>

          {/* --- 重置按钮 --- */}
          {(hasActiveFilters || hasSearchFilter) && (
            <button
              onClick={onReset}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border",
                isDark
                  ? "text-stone-300 hover:text-stone-100 hover:bg-stone-700/50 border-stone-600 hover:border-stone-500"
                  : "text-stone-600 hover:text-stone-800 hover:bg-stone-50 border-stone-300 hover:border-stone-400"
              )}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">重置</span>
            </button>
          )}
        </div>
      </div>

      {/* --- BEGIN COMMENT ---
      可折叠的高级筛选区域
      --- END COMMENT --- */}
      {isExpanded && (
        <div className={cn(
          "border-t px-4 pb-4",
          isDark ? "border-stone-700/50" : "border-stone-200/50"
        )}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {/* --- 角色筛选 --- */}
            <div>
              <label className={cn(
                "block text-xs font-semibold mb-2 font-serif uppercase tracking-wider",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                角色权限
              </label>
              <div className="relative">
                <select
                  value={filters.role || ''}
                  onChange={(e) => onFiltersChange({ role: e.target.value as any || undefined })}
                  className={cn(
                    "w-full appearance-none px-3 py-2 rounded-lg border text-sm font-serif cursor-pointer",
                    "focus:outline-none focus:ring-2 focus:ring-offset-1",
                    isDark
                      ? "bg-stone-800/50 border-stone-600 text-stone-100 focus:ring-stone-500/30 focus:ring-offset-stone-900"
                      : "bg-stone-50/50 border-stone-300 text-stone-900 focus:ring-stone-400/30 focus:ring-offset-white",
                    "transition-all duration-200"
                  )}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className={cn(
                  "absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 pointer-events-none",
                  isDark ? "text-stone-500" : "text-stone-400"
                )} />
              </div>
            </div>

            {/* --- 状态筛选 --- */}
            <div>
              <label className={cn(
                "block text-xs font-semibold mb-2 font-serif uppercase tracking-wider",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                账户状态
              </label>
              <div className="relative">
                <select
                  value={filters.status || ''}
                  onChange={(e) => onFiltersChange({ status: e.target.value as any || undefined })}
                  className={cn(
                    "w-full appearance-none px-3 py-2 rounded-lg border text-sm font-serif cursor-pointer",
                    "focus:outline-none focus:ring-2 focus:ring-offset-1",
                    isDark
                      ? "bg-stone-800/50 border-stone-600 text-stone-100 focus:ring-stone-500/30 focus:ring-offset-stone-900"
                      : "bg-stone-50/50 border-stone-300 text-stone-900 focus:ring-stone-400/30 focus:ring-offset-white",
                    "transition-all duration-200"
                  )}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className={cn(
                  "absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 pointer-events-none",
                  isDark ? "text-stone-500" : "text-stone-400"
                )} />
              </div>
            </div>

            {/* --- 认证来源筛选 --- */}
            <div>
              <label className={cn(
                "block text-xs font-semibold mb-2 font-serif uppercase tracking-wider",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                认证来源
              </label>
              <div className="relative">
                <select
                  value={filters.auth_source || ''}
                  onChange={(e) => onFiltersChange({ auth_source: e.target.value || undefined })}
                  className={cn(
                    "w-full appearance-none px-3 py-2 rounded-lg border text-sm font-serif cursor-pointer",
                    "focus:outline-none focus:ring-2 focus:ring-offset-1",
                    isDark
                      ? "bg-stone-800/50 border-stone-600 text-stone-100 focus:ring-stone-500/30 focus:ring-offset-stone-900"
                      : "bg-stone-50/50 border-stone-300 text-stone-900 focus:ring-stone-400/30 focus:ring-offset-white",
                    "transition-all duration-200"
                  )}
                >
                  {authSourceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className={cn(
                  "absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 pointer-events-none",
                  isDark ? "text-stone-500" : "text-stone-400"
                )} />
              </div>
            </div>

            {/* --- 排序选择 --- */}
            <div>
              <label className={cn(
                "block text-xs font-semibold mb-2 font-serif uppercase tracking-wider",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                排序方式
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <select
                    value={filters.sortBy || 'created_at'}
                    onChange={(e) => onFiltersChange({ sortBy: e.target.value as any })}
                    className={cn(
                      "w-full appearance-none px-3 py-1.5 rounded-lg border text-sm font-serif cursor-pointer",
                      "focus:outline-none focus:ring-2 focus:ring-offset-1",
                      isDark
                        ? "bg-stone-800/50 border-stone-600 text-stone-100 focus:ring-stone-500/30 focus:ring-offset-stone-900"
                        : "bg-stone-50/50 border-stone-300 text-stone-900 focus:ring-stone-400/30 focus:ring-offset-white",
                      "transition-all duration-200"
                    )}
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={cn(
                    "absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 pointer-events-none",
                    isDark ? "text-stone-500" : "text-stone-400"
                  )} />
                </div>
                <div className="relative">
                  <select
                    value={filters.sortOrder || 'desc'}
                    onChange={(e) => onFiltersChange({ sortOrder: e.target.value as any })}
                    className={cn(
                      "w-full appearance-none px-3 py-1.5 rounded-lg border text-sm font-serif cursor-pointer",
                      "focus:outline-none focus:ring-2 focus:ring-offset-1",
                      isDark
                        ? "bg-stone-800/50 border-stone-600 text-stone-100 focus:ring-stone-500/30 focus:ring-offset-stone-900"
                        : "bg-stone-50/50 border-stone-300 text-stone-900 focus:ring-stone-400/30 focus:ring-offset-white",
                      "transition-all duration-200"
                    )}
                  >
                    <option value="desc">最新在前</option>
                    <option value="asc">最旧在前</option>
                  </select>
                  <ChevronDown className={cn(
                    "absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 pointer-events-none",
                    isDark ? "text-stone-500" : "text-stone-400"
                  )} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 