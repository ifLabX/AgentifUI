"use client"

import React from 'react'
import { Users, UserCheck, UserX, Clock, Shield, Crown, UserIcon, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import type { UserStats } from '@lib/db/users'

interface UserStatsCardsProps {
  stats: UserStats | null
  isLoading: boolean
}

// 统计卡片数据
interface StatCard {
  title: string
  value: number | string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo' | 'gray'
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
}

export const UserStatsCards: React.FC<UserStatsCardsProps> = ({ stats, isLoading }) => {
  const { isDark } = useTheme()

  // --- BEGIN COMMENT ---
  // 生成统计卡片数据
  // --- END COMMENT ---
  const statCards: StatCard[] = React.useMemo(() => {
    if (!stats) return []

    return [
      {
        title: '总用户数',
        value: stats.totalUsers.toLocaleString(),
        icon: <Users className="h-5 w-5" />,
        color: 'blue'
      },
      {
        title: '活跃用户',
        value: stats.activeUsers.toLocaleString(),
        icon: <UserCheck className="h-5 w-5" />,
        color: 'green',
        trend: {
          value: Math.round((stats.activeUsers / stats.totalUsers) * 100),
          label: '占总用户比例',
          isPositive: true
        }
      },
      {
        title: '已暂停',
        value: stats.suspendedUsers.toLocaleString(),
        icon: <UserX className="h-5 w-5" />,
        color: 'red',
        trend: {
          value: Math.round((stats.suspendedUsers / stats.totalUsers) * 100),
          label: '占总用户比例',
          isPositive: false
        }
      },
      {
        title: '待激活',
        value: stats.pendingUsers.toLocaleString(),
        icon: <Clock className="h-5 w-5" />,
        color: 'yellow'
      },
      {
        title: '管理员',
        value: stats.adminUsers.toLocaleString(),
        icon: <Shield className="h-5 w-5" />,
        color: 'purple'
      },
      {
        title: '经理',
        value: stats.managerUsers.toLocaleString(),
        icon: <Crown className="h-5 w-5" />,
        color: 'indigo'
      },
      {
        title: '普通用户',
        value: stats.regularUsers.toLocaleString(),
        icon: <UserIcon className="h-5 w-5" />,
        color: 'gray'
      },
      {
        title: '今日新增',
        value: stats.newUsersToday.toLocaleString(),
        icon: <Calendar className="h-5 w-5" />,
        color: 'green',
        trend: {
          value: stats.newUsersThisWeek - stats.newUsersToday,
          label: '本周其他天数',
          isPositive: stats.newUsersToday > 0
        }
      }
    ]
  }, [stats])

  // --- BEGIN COMMENT ---
  // 获取颜色样式
  // --- END COMMENT ---
  const getColorClasses = (color: StatCard['color']) => {
    const colorMap = {
      blue: {
        bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
        border: isDark ? 'border-blue-500/20' : 'border-blue-200',
        icon: isDark ? 'text-blue-400' : 'text-blue-600',
        iconBg: isDark ? 'bg-blue-500/20' : 'bg-blue-100'
      },
      green: {
        bg: isDark ? 'bg-green-500/10' : 'bg-green-50',
        border: isDark ? 'border-green-500/20' : 'border-green-200',
        icon: isDark ? 'text-green-400' : 'text-green-600',
        iconBg: isDark ? 'bg-green-500/20' : 'bg-green-100'
      },
      red: {
        bg: isDark ? 'bg-red-500/10' : 'bg-red-50',
        border: isDark ? 'border-red-500/20' : 'border-red-200',
        icon: isDark ? 'text-red-400' : 'text-red-600',
        iconBg: isDark ? 'bg-red-500/20' : 'bg-red-100'
      },
      yellow: {
        bg: isDark ? 'bg-yellow-500/10' : 'bg-yellow-50',
        border: isDark ? 'border-yellow-500/20' : 'border-yellow-200',
        icon: isDark ? 'text-yellow-400' : 'text-yellow-600',
        iconBg: isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'
      },
      purple: {
        bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50',
        border: isDark ? 'border-purple-500/20' : 'border-purple-200',
        icon: isDark ? 'text-purple-400' : 'text-purple-600',
        iconBg: isDark ? 'bg-purple-500/20' : 'bg-purple-100'
      },
      indigo: {
        bg: isDark ? 'bg-indigo-500/10' : 'bg-indigo-50',
        border: isDark ? 'border-indigo-500/20' : 'border-indigo-200',
        icon: isDark ? 'text-indigo-400' : 'text-indigo-600',
        iconBg: isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
      },
      gray: {
        bg: isDark ? 'bg-stone-500/10' : 'bg-stone-50',
        border: isDark ? 'border-stone-500/20' : 'border-stone-200',
        icon: isDark ? 'text-stone-400' : 'text-stone-600',
        iconBg: isDark ? 'bg-stone-500/20' : 'bg-stone-100'
      }
    }
    return colorMap[color]
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mb-4">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className={cn(
              "p-3 rounded-lg border animate-pulse",
              isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
            )}
          >
            <div className="flex flex-col space-y-2">
              <div className={cn(
                "w-8 h-8 rounded-lg",
                isDark ? "bg-stone-700" : "bg-stone-100"
              )} />
              <div>
                <div className={cn(
                  "h-3 w-12 rounded mb-1",
                  isDark ? "bg-stone-700" : "bg-stone-200"
                )} />
                <div className={cn(
                  "h-4 w-8 rounded",
                  isDark ? "bg-stone-700" : "bg-stone-200"
                )} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mb-4">
      {statCards.map((card, index) => {
        const colors = getColorClasses(card.color)
        
        return (
          <div
            key={index}
            className={cn(
              "p-3 rounded-lg border transition-all duration-200 hover:shadow-md",
              colors.bg,
              colors.border
            )}
          >
            <div className="flex flex-col space-y-2">
              {/* --- BEGIN COMMENT ---
              图标
              --- END COMMENT --- */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                colors.iconBg
              )}>
                <div className={cn("scale-75", colors.icon)}>
                  {card.icon}
                </div>
              </div>
              
              {/* --- BEGIN COMMENT ---
              数据内容
              --- END COMMENT --- */}
              <div className="min-w-0">
                <p className={cn(
                  "text-xs font-serif font-medium mb-1 truncate",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  {card.title}
                </p>
                <p className={cn(
                  "text-lg font-bold font-serif",
                  isDark ? "text-stone-100" : "text-stone-900"
                )}>
                  {card.value}
                </p>
                
                {/* --- BEGIN COMMENT ---
                趋势信息（如果有）
                --- END COMMENT --- */}
                {card.trend && (
                  <div className="flex items-center gap-1 mt-1">
                    {card.trend.isPositive ? (
                      <TrendingUp className="h-2.5 w-2.5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5 text-red-500" />
                    )}
                    <span className={cn(
                      "text-xs font-serif truncate",
                      card.trend.isPositive 
                        ? "text-green-600" 
                        : "text-red-600"
                    )}>
                      {card.trend.value}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
} 