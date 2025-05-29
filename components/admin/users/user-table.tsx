"use client"

import React from 'react'
import { 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Shield, 
  Crown, 
  UserIcon, 
  UserCheck, 
  UserX, 
  Clock,
  Eye,
  CheckSquare,
  Square
} from 'lucide-react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { Dropdown } from '@components/ui/dropdown'
import type { EnhancedUser } from '@lib/db/users'

interface UserTableProps {
  users: EnhancedUser[]
  selectedUserIds: string[]
  isLoading: boolean
  onSelectUser: (userId: string) => void
  onSelectAll: (selected: boolean) => void
  onEditUser: (user: EnhancedUser) => void
  onViewUser: (user: EnhancedUser) => void
  onDeleteUser: (user: EnhancedUser) => void
  onChangeRole: (user: EnhancedUser, role: 'admin' | 'manager' | 'user') => void
  onChangeStatus: (user: EnhancedUser, status: 'active' | 'suspended' | 'pending') => void
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedUserIds,
  isLoading,
  onSelectUser,
  onSelectAll,
  onEditUser,
  onViewUser,
  onDeleteUser,
  onChangeRole,
  onChangeStatus
}) => {
  const { isDark } = useTheme()

  // --- BEGIN COMMENT ---
  // 获取角色显示信息
  // --- END COMMENT ---
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return { 
          label: '管理员', 
          icon: <Shield className="h-4 w-4" />, 
          color: 'purple' as const
        }
      case 'manager':
        return { 
          label: '经理', 
          icon: <Crown className="h-4 w-4" />, 
          color: 'indigo' as const
        }
      default:
        return { 
          label: '普通用户', 
          icon: <UserIcon className="h-4 w-4" />, 
          color: 'gray' as const
        }
    }
  }

  // --- BEGIN COMMENT ---
  // 获取状态显示信息
  // --- END COMMENT ---
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { 
          label: '活跃', 
          icon: <UserCheck className="h-4 w-4" />, 
          color: 'green' as const
        }
      case 'suspended':
        return { 
          label: '已暂停', 
          icon: <UserX className="h-4 w-4" />, 
          color: 'red' as const
        }
      case 'pending':
        return { 
          label: '待激活', 
          icon: <Clock className="h-4 w-4" />, 
          color: 'yellow' as const
        }
      default:
        return { 
          label: '未知', 
          icon: <Clock className="h-4 w-4" />, 
          color: 'gray' as const
        }
    }
  }

  // --- BEGIN COMMENT ---
  // 获取标签样式
  // --- END COMMENT ---
  const getBadgeClasses = (color: 'purple' | 'indigo' | 'gray' | 'green' | 'red' | 'yellow') => {
    const colorMap = {
      purple: isDark 
        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
        : 'bg-purple-100 text-purple-700 border-purple-200',
      indigo: isDark 
        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' 
        : 'bg-indigo-100 text-indigo-700 border-indigo-200',
      gray: isDark 
        ? 'bg-stone-500/20 text-stone-400 border-stone-500/30' 
        : 'bg-stone-100 text-stone-700 border-stone-200',
      green: isDark 
        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
        : 'bg-green-100 text-green-700 border-green-200',
      red: isDark 
        ? 'bg-red-500/20 text-red-400 border-red-500/30' 
        : 'bg-red-100 text-red-700 border-red-200',
      yellow: isDark 
        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
    return colorMap[color]
  }

  // --- BEGIN COMMENT ---
  // 格式化日期
  // --- END COMMENT ---
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '从未'
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // --- BEGIN COMMENT ---
  // 检查是否全选
  // --- END COMMENT ---
  const isAllSelected = users.length > 0 && selectedUserIds.length === users.length
  const isPartiallySelected = selectedUserIds.length > 0 && !isAllSelected

  if (isLoading) {
    return (
      <div className={cn(
        "rounded-xl border overflow-hidden",
        isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
      )}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400 mx-auto mb-4"></div>
          <p className={cn(
            "font-serif",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            加载用户数据中...
          </p>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className={cn(
        "rounded-xl border p-8 text-center",
        isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
      )}>
        <UserIcon className={cn(
          "h-12 w-12 mx-auto mb-4",
          isDark ? "text-stone-600" : "text-stone-400"
        )} />
        <h3 className={cn(
          "text-lg font-semibold mb-2 font-serif",
          isDark ? "text-stone-300" : "text-stone-700"
        )}>
          暂无用户数据
        </h3>
        <p className={cn(
          "font-serif",
          isDark ? "text-stone-500" : "text-stone-500"
        )}>
          没有找到符合条件的用户，请尝试调整筛选条件
        </p>
      </div>
    )
  }

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden",
      isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
    )}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* --- BEGIN COMMENT ---
          表头
          --- END COMMENT --- */}
          <thead className={cn(
            "border-b",
            isDark ? "border-stone-700 bg-stone-900/50" : "border-stone-200 bg-stone-50"
          )}>
            <tr>
              <th className="p-4 text-left">
                <button
                  onClick={() => onSelectAll(!isAllSelected)}
                  className={cn(
                    "flex items-center justify-center transition-colors",
                    isDark ? "text-stone-400 hover:text-stone-300" : "text-stone-600 hover:text-stone-700"
                  )}
                >
                  {isAllSelected ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : isPartiallySelected ? (
                    <div className="h-4 w-4 border-2 border-current bg-current/20 rounded-sm" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className={cn(
                "p-4 text-left text-sm font-medium font-serif",
                isDark ? "text-stone-300" : "text-stone-700"
              )}>
                用户信息
              </th>
              <th className={cn(
                "p-4 text-left text-sm font-medium font-serif",
                isDark ? "text-stone-300" : "text-stone-700"
              )}>
                角色
              </th>
              <th className={cn(
                "p-4 text-left text-sm font-medium font-serif",
                isDark ? "text-stone-300" : "text-stone-700"
              )}>
                状态
              </th>
              <th className={cn(
                "p-4 text-left text-sm font-medium font-serif",
                isDark ? "text-stone-300" : "text-stone-700"
              )}>
                注册时间
              </th>
              <th className={cn(
                "p-4 text-left text-sm font-medium font-serif",
                isDark ? "text-stone-300" : "text-stone-700"
              )}>
                最后登录
              </th>
              <th className={cn(
                "p-4 text-center text-sm font-medium font-serif",
                isDark ? "text-stone-300" : "text-stone-700"
              )}>
                操作
              </th>
            </tr>
          </thead>

          {/* --- BEGIN COMMENT ---
          表格内容
          --- END COMMENT --- */}
          <tbody>
            {users.map((user, index) => {
              const isSelected = selectedUserIds.includes(user.id)
              const roleInfo = getRoleInfo(user.role)
              const statusInfo = getStatusInfo(user.status)

              return (
                <tr
                  key={user.id}
                  className={cn(
                    "border-b transition-colors",
                    isDark ? "border-stone-700" : "border-stone-200",
                    isSelected && (isDark ? "bg-blue-500/10" : "bg-blue-50"),
                    !isSelected && (isDark ? "hover:bg-stone-700/50" : "hover:bg-stone-50")
                  )}
                >
                  {/* --- BEGIN COMMENT ---
                  选择列
                  --- END COMMENT --- */}
                  <td className="p-4">
                    <button
                      onClick={() => onSelectUser(user.id)}
                      className={cn(
                        "flex items-center justify-center transition-colors",
                        isDark ? "text-stone-400 hover:text-stone-300" : "text-stone-600 hover:text-stone-700"
                      )}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>

                  {/* --- BEGIN COMMENT ---
                  用户信息列
                  --- END COMMENT --- */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {/* --- BEGIN COMMENT ---
                      用户头像
                      --- END COMMENT --- */}
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        isDark ? "bg-stone-700" : "bg-stone-100"
                      )}>
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name || user.email || '用户'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <UserIcon className={cn(
                            "h-5 w-5",
                            isDark ? "text-stone-400" : "text-stone-500"
                          )} />
                        )}
                      </div>

                      {/* --- BEGIN COMMENT ---
                      用户基本信息
                      --- END COMMENT --- */}
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          "font-medium font-serif truncate",
                          isDark ? "text-stone-100" : "text-stone-900"
                        )}>
                          {user.full_name || '未设置姓名'}
                        </p>
                        <p className={cn(
                          "text-sm font-serif truncate",
                          isDark ? "text-stone-400" : "text-stone-600"
                        )}>
                          {user.email || '无邮箱'}
                        </p>
                        {user.username && (
                          <p className={cn(
                            "text-xs font-serif truncate",
                            isDark ? "text-stone-500" : "text-stone-500"
                          )}>
                            @{user.username}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* --- BEGIN COMMENT ---
                  角色列
                  --- END COMMENT --- */}
                  <td className="p-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border font-serif",
                      getBadgeClasses(roleInfo.color)
                    )}>
                      {roleInfo.icon}
                      {roleInfo.label}
                    </span>
                  </td>

                  {/* --- BEGIN COMMENT ---
                  状态列
                  --- END COMMENT --- */}
                  <td className="p-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border font-serif",
                      getBadgeClasses(statusInfo.color)
                    )}>
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                  </td>

                  {/* --- BEGIN COMMENT ---
                  注册时间列
                  --- END COMMENT --- */}
                  <td className="p-4">
                    <span className={cn(
                      "text-sm font-serif",
                      isDark ? "text-stone-300" : "text-stone-700"
                    )}>
                      {formatDate(user.created_at)}
                    </span>
                  </td>

                  {/* --- BEGIN COMMENT ---
                  最后登录列
                  --- END COMMENT --- */}
                  <td className="p-4">
                    <span className={cn(
                      "text-sm font-serif",
                      isDark ? "text-stone-300" : "text-stone-700"
                    )}>
                      {formatDate(user.last_sign_in_at)}
                    </span>
                  </td>

                  {/* --- BEGIN COMMENT ---
                  操作列
                  --- END COMMENT --- */}
                  <td className="p-4">
                    <div className="flex items-center justify-center">
                      <Dropdown
                        trigger={
                          <button className={cn(
                            "p-2 rounded-lg transition-colors",
                            isDark 
                              ? "text-stone-400 hover:text-stone-300 hover:bg-stone-700" 
                              : "text-stone-600 hover:text-stone-700 hover:bg-stone-100"
                          )}>
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        }
                        items={[
                          {
                            icon: <Eye className="h-4 w-4" />,
                            label: '查看详情',
                            onClick: () => onViewUser(user)
                          },
                          {
                            icon: <Edit2 className="h-4 w-4" />,
                            label: '编辑用户',
                            onClick: () => onEditUser(user)
                          },
                          { type: 'separator' },
                          {
                            icon: <Shield className="h-4 w-4" />,
                            label: '设为管理员',
                            onClick: () => onChangeRole(user, 'admin'),
                            disabled: user.role === 'admin'
                          },
                          {
                            icon: <Crown className="h-4 w-4" />,
                            label: '设为经理',
                            onClick: () => onChangeRole(user, 'manager'),
                            disabled: user.role === 'manager'
                          },
                          {
                            icon: <UserIcon className="h-4 w-4" />,
                            label: '设为普通用户',
                            onClick: () => onChangeRole(user, 'user'),
                            disabled: user.role === 'user'
                          },
                          { type: 'separator' },
                          {
                            icon: <UserCheck className="h-4 w-4" />,
                            label: '激活用户',
                            onClick: () => onChangeStatus(user, 'active'),
                            disabled: user.status === 'active'
                          },
                          {
                            icon: <UserX className="h-4 w-4" />,
                            label: '暂停用户',
                            onClick: () => onChangeStatus(user, 'suspended'),
                            disabled: user.status === 'suspended',
                            className: 'text-red-600'
                          },
                          { type: 'separator' },
                          {
                            icon: <Trash2 className="h-4 w-4" />,
                            label: '删除用户',
                            onClick: () => onDeleteUser(user),
                            className: 'text-red-600'
                          }
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
} 