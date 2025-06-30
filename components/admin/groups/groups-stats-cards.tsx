'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Activity, Building2, Users } from 'lucide-react';

interface GroupStats {
  totalGroups: number;
  totalMembers: number;
  activeGroups: number;
}

interface GroupsStatsCardsProps {
  stats: GroupStats;
  isLoading: boolean;
}

export function GroupsStatsCards({ stats, isLoading }: GroupsStatsCardsProps) {
  const { isDark } = useTheme();

  const statsData = [
    {
      title: '群组总数',
      value: stats.totalGroups,
      icon: Building2,
      color: 'blue',
    },
    {
      title: '成员总数',
      value: stats.totalMembers,
      icon: Users,
      color: 'green',
    },
    {
      title: '平均成员数',
      value:
        stats.totalGroups > 0
          ? Math.round(stats.totalMembers / stats.totalGroups)
          : 0,
      icon: Activity,
      color: 'purple',
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        icon: isDark ? 'text-blue-400' : 'text-blue-600',
        bg: isDark ? 'bg-blue-500/20' : 'bg-blue-100',
      },
      green: {
        icon: isDark ? 'text-green-400' : 'text-green-600',
        bg: isDark ? 'bg-green-500/20' : 'bg-green-100',
      },
      purple: {
        icon: isDark ? 'text-purple-400' : 'text-purple-600',
        bg: isDark ? 'bg-purple-500/20' : 'bg-purple-100',
      },
    };
    return (
      colorMap[color as keyof typeof colorMap] || {
        icon: isDark ? 'text-stone-300' : 'text-stone-600',
        bg: isDark ? 'bg-stone-700' : 'bg-stone-100',
      }
    );
  };

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {statsData.map(stat => {
        const colorClasses = getColorClasses(stat.color);
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className={cn(
              'rounded-xl border p-4 shadow-sm backdrop-blur-sm transition-all duration-200',
              isDark
                ? 'border-stone-700/50 bg-stone-800/50'
                : 'border-stone-200/50 bg-white/80'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p
                  className={cn(
                    'mb-1 font-serif text-xs font-medium',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                >
                  {stat.title}
                </p>
                <div
                  className={cn(
                    'font-serif text-xl font-bold',
                    isDark ? 'text-stone-100' : 'text-stone-900'
                  )}
                >
                  {isLoading ? (
                    <div
                      className={cn(
                        'h-6 w-10 animate-pulse rounded',
                        isDark ? 'bg-stone-700' : 'bg-stone-200'
                      )}
                    />
                  ) : (
                    stat.value
                  )}
                </div>
              </div>
              <div
                className={cn(
                  'ml-3 flex h-8 w-8 items-center justify-center rounded-lg',
                  colorClasses.bg
                )}
              >
                <Icon className={cn('h-4 w-4', colorClasses.icon)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
