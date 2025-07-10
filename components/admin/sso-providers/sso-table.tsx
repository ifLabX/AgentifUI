'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { useSsoProvidersStore } from '@lib/stores/sso-providers-store';
import { type SsoProvider } from '@lib/types/database';
import { cn } from '@lib/utils';
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  ExternalLink,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';

import { useTranslations } from 'next-intl';

import { TableDropdown } from './table-dropdown';

interface SsoTableProps {
  onEdit: (provider: SsoProvider) => void;
  onDelete: (provider: SsoProvider) => void;
  isLoading?: boolean;
}

// Protocol colors mapping
const protocolColors = {
  SAML: {
    light: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    dark: 'text-emerald-400 bg-emerald-900/30 border-emerald-700',
  },
  OAuth2: {
    light: 'text-purple-600 bg-purple-50 border-purple-200',
    dark: 'text-purple-400 bg-purple-900/30 border-purple-700',
  },
  OIDC: {
    light: 'text-amber-600 bg-amber-50 border-amber-200',
    dark: 'text-amber-400 bg-amber-900/30 border-amber-700',
  },
  CAS: {
    light: 'text-blue-600 bg-blue-50 border-blue-200',
    dark: 'text-blue-400 bg-blue-900/30 border-blue-700',
  },
} as const;

export function SsoTable({
  onEdit,
  onDelete,
  isLoading = false,
}: SsoTableProps) {
  const { isDark } = useTheme();
  const t = useTranslations('pages.admin.ssoProviders.table');

  const {
    providers,
    loading,
    pagination,
    filters,
    updateFilters,
    setPage,
    toggleProviderStatus,
  } = useSsoProvidersStore();

  // Use provided isLoading prop or store loading state
  const shouldShowLoading = isLoading || loading.providers;

  // Handle status toggle
  const handleStatusToggle = async (provider: SsoProvider) => {
    const success = await toggleProviderStatus(provider.id, !provider.enabled);
    if (success) {
      // Status updated successfully
    }
  };

  // Sorting logic removed

  // Get protocol badge classes
  const getProtocolBadgeClasses = (protocol: string) => {
    const colors = protocolColors[protocol as keyof typeof protocolColors];
    if (!colors)
      return isDark
        ? 'text-stone-400 bg-stone-700 border-stone-600'
        : 'text-stone-600 bg-stone-100 border-stone-300';
    return isDark ? colors.dark : colors.light;
  };

  // Protocol icon function removed

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Pagination component
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
          {t('pagination.showing', {
            start: (pagination.page - 1) * pagination.pageSize + 1,
            end: Math.min(
              pagination.page * pagination.pageSize,
              pagination.total
            ),
            total: pagination.total,
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className={cn(
              'flex items-center gap-1 rounded-lg border px-3 py-2 font-serif text-sm transition-colors',
              pagination.page <= 1
                ? 'cursor-not-allowed opacity-50'
                : isDark
                  ? 'border-stone-600 text-stone-300 hover:bg-stone-700'
                  : 'border-stone-300 text-stone-700 hover:bg-stone-50'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            {t('pagination.previous')}
          </button>

          <div className="flex items-center gap-1">
            <span
              className={cn(
                'px-3 py-2 font-serif text-sm',
                isDark ? 'text-stone-300' : 'text-stone-700'
              )}
            >
              {t('pagination.pageInfo', {
                current: pagination.page,
                total: pagination.totalPages,
              })}
            </span>
          </div>

          <button
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className={cn(
              'flex items-center gap-1 rounded-lg border px-3 py-2 font-serif text-sm transition-colors',
              pagination.page >= pagination.totalPages
                ? 'cursor-not-allowed opacity-50'
                : isDark
                  ? 'border-stone-600 text-stone-300 hover:bg-stone-700'
                  : 'border-stone-300 text-stone-700 hover:bg-stone-50'
            )}
          >
            {t('pagination.next')}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  if (providers.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border backdrop-blur-sm',
          isDark
            ? 'border-stone-700/50 bg-stone-800/50'
            : 'border-stone-200/50 bg-white/50'
        )}
      >
        <div className="p-12 text-center">
          <div
            className={cn(
              'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full',
              isDark ? 'bg-stone-700/50' : 'bg-stone-100'
            )}
          >
            <Shield
              className={cn(
                'h-8 w-8',
                isDark ? 'text-stone-400' : 'text-stone-500'
              )}
            />
          </div>
          <h3
            className={cn(
              'mb-2 font-serif text-lg font-semibold',
              isDark ? 'text-stone-200' : 'text-stone-800'
            )}
          >
            {t('noProviders')}
          </h3>
          <p
            className={cn(
              'font-serif text-sm',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          >
            {t('createFirst')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border backdrop-blur-sm',
        isDark
          ? 'border-stone-700/50 bg-stone-800/50'
          : 'border-stone-200/50 bg-white/50'
      )}
    >
      {/* Table Header */}
      <div
        className={cn(
          'border-b px-6 py-4',
          isDark ? 'border-stone-700/50' : 'border-stone-200/50'
        )}
      >
        <div className="grid grid-cols-12 gap-4 font-serif text-sm font-medium">
          <div className="col-span-4">
            <span className={cn(isDark ? 'text-stone-300' : 'text-stone-700')}>
              {t('headers.name')}
            </span>
          </div>
          <div className="col-span-2">
            <span className={cn(isDark ? 'text-stone-300' : 'text-stone-700')}>
              {t('headers.protocol')}
            </span>
          </div>
          <div className="col-span-2">
            <span className={cn(isDark ? 'text-stone-300' : 'text-stone-700')}>
              {t('headers.status')}
            </span>
          </div>
          <div className="col-span-2">
            <span className={cn(isDark ? 'text-stone-300' : 'text-stone-700')}>
              {t('headers.created')}
            </span>
          </div>
          <div className="col-span-1">
            <span className={cn(isDark ? 'text-stone-300' : 'text-stone-700')}>
              {t('headers.order')}
            </span>
          </div>
          <div className="col-span-1">
            {/* Actions column - no header text */}
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-stone-200/50 dark:divide-stone-700/50">
        {shouldShowLoading ? (
          <div className="p-12 text-center">
            <div
              className={cn(
                'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full',
                isDark ? 'bg-stone-700/50' : 'bg-stone-100'
              )}
            >
              <Clock
                className={cn(
                  'h-8 w-8',
                  isDark ? 'text-stone-400' : 'text-stone-500'
                )}
              />
            </div>
            <p
              className={cn(
                'font-serif text-sm',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              {t('loadingProviders')}
            </p>
          </div>
        ) : (
          providers.map((provider, index) => {
            return (
              <div
                key={provider.id}
                className={cn(
                  'group grid grid-cols-12 gap-4 px-6 py-4 transition-colors',
                  isDark ? 'hover:bg-stone-700/20' : 'hover:bg-stone-50/50'
                )}
              >
                {/* Name */}
                <div className="col-span-4 flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      isDark ? 'bg-stone-700/50' : 'bg-stone-100'
                    )}
                  >
                    {provider.settings?.ui?.icon ? (
                      <span className="text-lg">
                        {provider.settings.ui.icon}
                      </span>
                    ) : (
                      <Shield
                        className={cn(
                          'h-5 w-5',
                          isDark ? 'text-stone-400' : 'text-stone-600'
                        )}
                      />
                    )}
                  </div>
                  <div>
                    <h3
                      className={cn(
                        'font-serif text-sm font-medium',
                        isDark ? 'text-stone-200' : 'text-stone-800'
                      )}
                    >
                      {provider.name}
                    </h3>
                    <p
                      className={cn(
                        'font-serif text-xs',
                        isDark ? 'text-stone-400' : 'text-stone-600'
                      )}
                    >
                      {provider.button_text || provider.name}
                    </p>
                  </div>
                </div>

                {/* Protocol */}
                <div className="col-span-2 flex items-center">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2.5 py-1 font-serif text-xs font-medium',
                      getProtocolBadgeClasses(provider.protocol)
                    )}
                  >
                    {provider.protocol}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center">
                  <button
                    onClick={() => handleStatusToggle(provider)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-serif text-xs font-medium transition-colors',
                      provider.enabled
                        ? isDark
                          ? 'border-emerald-700 bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : isDark
                          ? 'border-red-700 bg-red-900/30 text-red-400 hover:bg-red-900/50'
                          : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                    )}
                  >
                    {provider.enabled ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {provider.enabled ? t('enabled') : t('disabled')}
                  </button>
                </div>

                {/* Created Date */}
                <div className="col-span-2 flex items-center">
                  <div className="flex items-center gap-1.5">
                    <Calendar
                      className={cn(
                        'h-3 w-3',
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      )}
                    />
                    <span
                      className={cn(
                        'font-serif text-xs',
                        isDark ? 'text-stone-400' : 'text-stone-600'
                      )}
                    >
                      {formatDate(provider.created_at)}
                    </span>
                  </div>
                </div>

                {/* Display Order */}
                <div className="col-span-1 flex items-center">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center rounded-md border px-2 py-1 font-serif text-xs font-medium',
                      isDark
                        ? 'border-stone-600 bg-stone-700/30 text-stone-300'
                        : 'border-stone-300 bg-stone-50 text-stone-700'
                    )}
                  >
                    {provider.display_order || 0}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-center">
                  <TableDropdown>
                    <div className="py-1">
                      <button
                        onClick={() => onEdit(provider)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-3 py-2 font-serif text-sm transition-colors',
                          isDark
                            ? 'text-stone-300 hover:bg-stone-700/50'
                            : 'text-stone-700 hover:bg-stone-100'
                        )}
                      >
                        <Edit2 className="h-4 w-4" />
                        {t('actions.edit')}
                      </button>
                      <button
                        onClick={() => onDelete(provider)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-3 py-2 font-serif text-sm transition-colors',
                          isDark
                            ? 'text-red-400 hover:bg-red-900/20'
                            : 'text-red-600 hover:bg-red-50'
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('actions.delete')}
                      </button>
                    </div>
                  </TableDropdown>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <PaginationControls />
    </div>
  );
}
