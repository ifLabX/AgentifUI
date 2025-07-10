'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { useSsoProvidersStore } from '@lib/stores/sso-providers-store';
import { cn } from '@lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';

import React from 'react';

import { useTranslations } from 'next-intl';

interface StatCard {
  title: string;
  value: number | string;
  color: 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'stone';
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

interface SsoStatsCardsProps {
  isLoading?: boolean;
}

export function SsoStatsCards({ isLoading = false }: SsoStatsCardsProps) {
  const { isDark } = useTheme();
  const t = useTranslations('pages.admin.ssoProviders.stats');
  const { stats, loading } = useSsoProvidersStore();

  // Use provided isLoading prop or store loading state
  const shouldShowLoading = isLoading || loading.stats;

  // Get color classes for stat cards
  const getColorClasses = (color: StatCard['color']) => {
    const colorMap = {
      blue: {
        bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
        border: isDark ? 'border-blue-500/20' : 'border-blue-200',
        text: isDark ? 'text-blue-400' : 'text-blue-600',
      },
      green: {
        bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
        border: isDark ? 'border-emerald-500/20' : 'border-emerald-200',
        text: isDark ? 'text-emerald-400' : 'text-emerald-600',
      },
      red: {
        bg: isDark ? 'bg-red-500/10' : 'bg-red-50',
        border: isDark ? 'border-red-500/20' : 'border-red-200',
        text: isDark ? 'text-red-400' : 'text-red-600',
      },
      purple: {
        bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50',
        border: isDark ? 'border-purple-500/20' : 'border-purple-200',
        text: isDark ? 'text-purple-400' : 'text-purple-600',
      },
      amber: {
        bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
        border: isDark ? 'border-amber-500/20' : 'border-amber-200',
        text: isDark ? 'text-amber-400' : 'text-amber-600',
      },
      stone: {
        bg: isDark ? 'bg-stone-500/10' : 'bg-stone-50',
        border: isDark ? 'border-stone-500/20' : 'border-stone-200',
        text: isDark ? 'text-stone-400' : 'text-stone-600',
      },
    };
    return colorMap[color];
  };

  // Generate protocol-based stat cards data
  const statCards: StatCard[] = React.useMemo(() => {
    if (!stats) return [];

    const protocols = ['CAS', 'SAML', 'OAuth2', 'OIDC'] as const;
    const colors: StatCard['color'][] = ['blue', 'green', 'purple', 'amber'];

    return protocols.map((protocol, index) => {
      const count = stats.byProtocol[protocol] || 0;
      const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

      return {
        title: protocol,
        value: count.toLocaleString(),
        color: colors[index],
        trend: {
          value: Math.round(percentage),
          label: t('percentOfTotal'),
          isPositive: count > 0,
        },
      };
    });
  }, [stats, t]);

  if (shouldShowLoading || !stats) {
    return (
      <div className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className={cn(
                'animate-pulse rounded-xl border p-6 backdrop-blur-sm',
                isDark
                  ? 'border-stone-700/50 bg-stone-800/50'
                  : 'border-stone-200/50 bg-white/50'
              )}
              style={{
                animationDelay: `${index * 150}ms`,
                animationFillMode: 'both',
              }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      'h-4 w-16 rounded',
                      isDark ? 'bg-stone-700/50' : 'bg-stone-200'
                    )}
                  />
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      isDark ? 'bg-stone-700/50' : 'bg-stone-200'
                    )}
                  />
                </div>
                <div>
                  <div
                    className={cn(
                      'mb-2 h-8 w-12 rounded',
                      isDark ? 'bg-stone-700/50' : 'bg-stone-200'
                    )}
                  />
                  <div
                    className={cn(
                      'h-3 w-20 rounded',
                      isDark ? 'bg-stone-700/50' : 'bg-stone-200'
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Protocol Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const colors = getColorClasses(card.color);

          return (
            <div
              key={card.title}
              className={cn(
                'group relative overflow-hidden rounded-xl border p-6 transition-all duration-300 hover:shadow-lg',
                colors.bg,
                colors.border,
                'backdrop-blur-sm',
                'animate-fade-in'
              )}
              style={{
                animationDelay: `${index * 150}ms`,
                animationFillMode: 'both',
              }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      'font-serif text-sm font-medium',
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    )}
                  >
                    {card.title}
                  </p>
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      colors.text.replace('text-', 'bg-')
                    )}
                  />
                </div>

                <div>
                  <p
                    className={cn(
                      'font-serif text-2xl font-bold',
                      isDark ? 'text-stone-100' : 'text-stone-900'
                    )}
                  >
                    {card.value}
                  </p>
                  {card.trend && (
                    <div className="mt-1 flex items-center gap-1">
                      {card.trend.isPositive ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span
                        className={cn(
                          'font-serif text-xs',
                          card.trend.isPositive
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        )}
                      >
                        {card.trend.value}%
                      </span>
                      <span
                        className={cn(
                          'font-serif text-xs',
                          isDark ? 'text-stone-400' : 'text-stone-500'
                        )}
                      >
                        {card.trend.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
