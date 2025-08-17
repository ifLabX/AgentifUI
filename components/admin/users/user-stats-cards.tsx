'use client';

import type { UserStats } from '@lib/db/users';
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

// Statistics card data
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
  const t = useTranslations('pages.admin.users.stats');

  // Generate statistics card data
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

  // Get color styles
  const getColorClasses = (color: StatCard['color']) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        border: 'border-blue-200 dark:border-blue-500/20',
        icon: 'text-blue-600 dark:text-blue-400',
        iconBg: 'bg-blue-100 dark:bg-blue-500/20',
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-500/10',
        border: 'border-green-200 dark:border-green-500/20',
        icon: 'text-green-600 dark:text-green-400',
        iconBg: 'bg-green-100 dark:bg-green-500/20',
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-500/10',
        border: 'border-red-200 dark:border-red-500/20',
        icon: 'text-red-600 dark:text-red-400',
        iconBg: 'bg-red-100 dark:bg-red-500/20',
      },
      yellow: {
        bg: 'bg-yellow-50 dark:bg-yellow-500/10',
        border: 'border-yellow-200 dark:border-yellow-500/20',
        icon: 'text-yellow-600 dark:text-yellow-400',
        iconBg: 'bg-yellow-100 dark:bg-yellow-500/20',
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-500/10',
        border: 'border-purple-200 dark:border-purple-500/20',
        icon: 'text-purple-600 dark:text-purple-400',
        iconBg: 'bg-purple-100 dark:bg-purple-500/20',
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-500/10',
        border: 'border-indigo-200 dark:border-indigo-500/20',
        icon: 'text-indigo-600 dark:text-indigo-400',
        iconBg: 'bg-indigo-100 dark:bg-indigo-500/20',
      },
      gray: {
        bg: 'bg-stone-50 dark:bg-stone-500/10',
        border: 'border-stone-200 dark:border-stone-500/20',
        icon: 'text-stone-600 dark:text-stone-400',
        iconBg: 'bg-stone-100 dark:bg-stone-500/20',
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
              'border-stone-200/50 bg-white/50 dark:border-stone-700/50 dark:bg-stone-800/50'
            )}
          >
            <div className="flex flex-col space-y-3">
              <div
                className={cn(
                  'h-8 w-8 rounded-lg',
                  'bg-stone-100 dark:bg-stone-700/50'
                )}
              />
              <div>
                <div
                  className={cn(
                    'mb-2 h-3 w-16 rounded',
                    'bg-stone-200 dark:bg-stone-700/50'
                  )}
                />
                <div
                  className={cn(
                    'h-5 w-12 rounded',
                    'bg-stone-200 dark:bg-stone-700/50'
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
              'backdrop-blur-sm',
              'animate-fade-in'
            )}
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'both',
            }}
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
                    'text-stone-600 dark:text-stone-400'
                  )}
                >
                  {card.title}
                </p>
                <p
                  className={cn(
                    'font-serif text-lg font-bold',
                    'text-stone-900 dark:text-stone-100'
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
