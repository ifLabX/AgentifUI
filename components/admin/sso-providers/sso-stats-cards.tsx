'use client';

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
  const t = useTranslations('pages.admin.ssoProviders.stats');
  const { stats, loading } = useSsoProvidersStore();

  // Use provided isLoading prop or store loading state
  const shouldShowLoading = isLoading || loading.stats;

  // Static color classes for stat cards
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      border: 'border-blue-200 dark:border-blue-500/20',
      text: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      border: 'border-emerald-200 dark:border-emerald-500/20',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-500/10',
      border: 'border-red-200 dark:border-red-500/20',
      text: 'text-red-600 dark:text-red-400',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-500/10',
      border: 'border-purple-200 dark:border-purple-500/20',
      text: 'text-purple-600 dark:text-purple-400',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      border: 'border-amber-200 dark:border-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400',
    },
    stone: {
      bg: 'bg-stone-50 dark:bg-stone-500/10',
      border: 'border-stone-200 dark:border-stone-500/20',
      text: 'text-stone-600 dark:text-stone-400',
    },
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
              className="animate-pulse rounded-xl border border-stone-200/50 bg-white/50 p-6 backdrop-blur-sm dark:border-stone-700/50 dark:bg-stone-800/50"
              style={{
                animationDelay: `${index * 150}ms`,
                animationFillMode: 'both',
              }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-16 rounded bg-stone-200 dark:bg-stone-700/50" />
                  <div className="h-2 w-2 rounded-full bg-stone-200 dark:bg-stone-700/50" />
                </div>
                <div>
                  <div className="mb-2 h-8 w-12 rounded bg-stone-200 dark:bg-stone-700/50" />
                  <div className="h-3 w-20 rounded bg-stone-200 dark:bg-stone-700/50" />
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
          const colors = colorClasses[card.color];

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
                  <p className="font-serif text-sm font-medium text-stone-600 dark:text-stone-300">
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
                  <p className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
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
                      <span className="font-serif text-xs text-stone-500 dark:text-stone-400">
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
