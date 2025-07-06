'use client';

import type { UserStats } from '@lib/db/users';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import {
  Calendar,
  Clock,
  Crown,
  Shield,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserIcon,
  UserX,
  Users,
} from 'lucide-react';

import React from 'react';

import { useTranslations } from 'next-intl';

interface UserStatsCardsProps {
  stats: UserStats | null;
  isLoading: boolean;
}

// 统计卡片数据
interface StatCard {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo' | 'gray';
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

export const UserStatsCards: React.FC<UserStatsCardsProps> = ({
  stats,
  isLoading,
}) => {
  const { isDark } = useTheme();
  const t = useTranslations('pages.admin.users.stats');

  // 生成统计卡片数据
  const statCards: StatCard[] = React.useMemo(() => {
    if (!stats) return [];

    return [
      {
        title: t('totalUsers'),
        value: stats.totalUsers.toLocaleString(),
        icon: <Users className="h-5 w-5" />,
        color: 'blue',
      },
      {
        title: t('activeUsers'),
        value: stats.activeUsers.toLocaleString(),
        icon: <UserCheck className="h-5 w-5" />,
        color: 'green',
        trend: {
          value: Math.round((stats.activeUsers / stats.totalUsers) * 100),
          label: t('activeUsersRatio'),
          isPositive: true,
        },
      },
      {
        title: t('suspendedUsers'),
        value: stats.suspendedUsers.toLocaleString(),
        icon: <UserX className="h-5 w-5" />,
        color: 'red',
        trend: {
          value: Math.round((stats.suspendedUsers / stats.totalUsers) * 100),
          label: t('activeUsersRatio'),
          isPositive: false,
        },
      },
      {
        title: t('pendingUsers'),
        value: stats.pendingUsers.toLocaleString(),
        icon: <Clock className="h-5 w-5" />,
        color: 'yellow',
      },
      {
        title: t('adminUsers'),
        value: stats.adminUsers.toLocaleString(),
        icon: <Shield className="h-5 w-5" />,
        color: 'purple',
      },
      {
        title: t('managerUsers'),
        value: stats.managerUsers.toLocaleString(),
        icon: <Crown className="h-5 w-5" />,
        color: 'indigo',
      },
      {
        title: t('regularUsers'),
        value: stats.regularUsers.toLocaleString(),
        icon: <UserIcon className="h-5 w-5" />,
        color: 'gray',
      },
      {
        title: t('newUsersToday'),
        value: stats.newUsersToday.toLocaleString(),
        icon: <Calendar className="h-5 w-5" />,
        color: 'green',
        trend: {
          value: stats.newUsersThisWeek - stats.newUsersToday,
          label: t('newUsersThisWeek'),
          isPositive: stats.newUsersToday > 0,
        },
      },
    ];
  }, [stats, t]);

  // 获取颜色样式
  const getColorClasses = (color: StatCard['color']) => {
    const colorMap = {
      blue: {
        bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
        border: isDark ? 'border-blue-500/20' : 'border-blue-200',
        icon: isDark ? 'text-blue-400' : 'text-blue-600',
        iconBg: isDark ? 'bg-blue-500/20' : 'bg-blue-100',
      },
      green: {
        bg: isDark ? 'bg-green-500/10' : 'bg-green-50',
        border: isDark ? 'border-green-500/20' : 'border-green-200',
        icon: isDark ? 'text-green-400' : 'text-green-600',
        iconBg: isDark ? 'bg-green-500/20' : 'bg-green-100',
      },
      red: {
        bg: isDark ? 'bg-red-500/10' : 'bg-red-50',
        border: isDark ? 'border-red-500/20' : 'border-red-200',
        icon: isDark ? 'text-red-400' : 'text-red-600',
        iconBg: isDark ? 'bg-red-500/20' : 'bg-red-100',
      },
      yellow: {
        bg: isDark ? 'bg-yellow-500/10' : 'bg-yellow-50',
        border: isDark ? 'border-yellow-500/20' : 'border-yellow-200',
        icon: isDark ? 'text-yellow-400' : 'text-yellow-600',
        iconBg: isDark ? 'bg-yellow-500/20' : 'bg-yellow-100',
      },
      purple: {
        bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50',
        border: isDark ? 'border-purple-500/20' : 'border-purple-200',
        icon: isDark ? 'text-purple-400' : 'text-purple-600',
        iconBg: isDark ? 'bg-purple-500/20' : 'bg-purple-100',
      },
      indigo: {
        bg: isDark ? 'bg-indigo-500/10' : 'bg-indigo-50',
        border: isDark ? 'border-indigo-500/20' : 'border-indigo-200',
        icon: isDark ? 'text-indigo-400' : 'text-indigo-600',
        iconBg: isDark ? 'bg-indigo-500/20' : 'bg-indigo-100',
      },
      gray: {
        bg: isDark ? 'bg-stone-500/10' : 'bg-stone-50',
        border: isDark ? 'border-stone-500/20' : 'border-stone-200',
        icon: isDark ? 'text-stone-400' : 'text-stone-600',
        iconBg: isDark ? 'bg-stone-500/20' : 'bg-stone-100',
      },
    };
    return colorMap[color];
  };

  if (isLoading) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className={cn(
              'animate-pulse rounded-xl border p-4 backdrop-blur-sm',
              isDark
                ? 'border-stone-700/50 bg-stone-800/50'
                : 'border-stone-200/50 bg-white/50'
            )}
          >
            <div className="flex flex-col space-y-3">
              <div
                className={cn(
                  'h-8 w-8 rounded-lg',
                  isDark ? 'bg-stone-700/50' : 'bg-stone-100'
                )}
              />
              <div>
                <div
                  className={cn(
                    'mb-2 h-3 w-16 rounded',
                    isDark ? 'bg-stone-700/50' : 'bg-stone-200'
                  )}
                />
                <div
                  className={cn(
                    'h-5 w-12 rounded',
                    isDark ? 'bg-stone-700/50' : 'bg-stone-200'
                  )}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      {statCards.map((card, index) => {
        const colors = getColorClasses(card.color);

        return (
          <div
            key={index}
            className={cn(
              'rounded-xl border p-4 transition-all duration-200 hover:scale-105 hover:shadow-lg',
              colors.bg,
              colors.border,
              'backdrop-blur-sm'
            )}
          >
            <div className="flex flex-col space-y-2">
              {/* Icon */}
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  colors.iconBg
                )}
              >
                <div className={cn('scale-75', colors.icon)}>{card.icon}</div>
              </div>

              {/* Data content */}
              <div className="min-w-0">
                <p
                  className={cn(
                    'mb-1 truncate font-serif text-xs font-medium',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                >
                  {card.title}
                </p>
                <p
                  className={cn(
                    'font-serif text-lg font-bold',
                    isDark ? 'text-stone-100' : 'text-stone-900'
                  )}
                >
                  {card.value}
                </p>

                {/* Trend information (if available) */}
                {card.trend && (
                  <div className="mt-1 flex items-center gap-1">
                    {card.trend.isPositive ? (
                      <TrendingUp className="h-2.5 w-2.5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5 text-red-500" />
                    )}
                    <span
                      className={cn(
                        'truncate font-serif text-xs',
                        card.trend.isPositive
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}
                    >
                      {card.trend.value}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
