'use client';

import { SsoFilters } from '@components/admin/sso-providers/sso-filters';
import { SsoProviderForm } from '@components/admin/sso-providers/sso-provider-form';
import { SsoStatsCards } from '@components/admin/sso-providers/sso-stats-cards';
import { SsoTable } from '@components/admin/sso-providers/sso-table';
import { useTheme } from '@lib/hooks/use-theme';
import { useSsoProvidersStore } from '@lib/stores/sso-providers-store';
import { type SsoProvider } from '@lib/types/database';
import { cn } from '@lib/utils';
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { useEffect } from 'react';

import { useTranslations } from 'next-intl';

export default function SsoProvidersPage() {
  const { isDark } = useTheme();
  const t = useTranslations('pages.admin.ssoProviders');
  const {
    providers,
    loading,
    error,
    showCreateForm,
    showEditForm,
    showDeleteConfirm,
    selectedProvider,
    loadProviders,
    loadStats,
    showCreateProviderForm,
    showEditProviderForm,
    showDeleteProviderConfirm,
    hideCreateForm,
    hideEditForm,
    hideDeleteConfirm,
    removeProvider,
    clearError,
  } = useSsoProvidersStore();

  // Provider details modal removed

  // Load data on mount
  useEffect(() => {
    loadProviders();
    loadStats();
  }, [loadProviders, loadStats]);

  // View details function removed

  // Handle provider edit
  const handleEditProvider = (provider: SsoProvider) => {
    showEditProviderForm(provider);
  };

  // Handle provider delete
  const handleDeleteProvider = (provider: SsoProvider) => {
    showDeleteProviderConfirm(provider);
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!selectedProvider) return;

    const success = await removeProvider(selectedProvider.id);
    if (success) {
      toast.success(t('deleteDialog.success', { name: selectedProvider.name }));
    }
  };

  // Handle error dismissal
  const handleDismissError = () => {
    clearError();
  };

  // Protocol icon function removed

  return (
    <div
      className={cn(
        'min-h-screen',
        isDark
          ? 'bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800'
          : 'bg-gradient-to-br from-stone-50 via-white to-stone-100'
      )}
    >
      <div className="mx-auto max-w-7xl p-6">
        {/* Page title and action bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className={cn(
                'mb-3 bg-gradient-to-r bg-clip-text font-serif text-4xl leading-relaxed font-bold text-transparent',
                isDark
                  ? 'from-stone-100 to-stone-300'
                  : 'from-stone-800 to-stone-600'
              )}
            >
              {t('title')}
            </h1>
            <p
              className={cn(
                'flex items-center gap-2 font-serif text-base',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              <Shield className="h-4 w-4" />
              {t('subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh button */}
            <button
              onClick={() => {
                loadProviders();
                loadStats();
              }}
              disabled={loading.providers || loading.stats}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-4 py-2.5 font-serif shadow-sm transition-all duration-200',
                loading.providers || loading.stats
                  ? 'cursor-not-allowed opacity-50'
                  : isDark
                    ? 'border-stone-600/50 text-stone-300 hover:border-stone-500 hover:bg-stone-700/50 hover:shadow-md'
                    : 'border-stone-300/50 text-stone-700 backdrop-blur-sm hover:border-stone-400 hover:bg-stone-50/80 hover:shadow-md'
              )}
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  (loading.providers || loading.stats) && 'animate-spin'
                )}
              />
              <span className="hidden sm:inline">{t('refresh')}</span>
            </button>

            {/* Add provider button */}
            <button
              onClick={showCreateProviderForm}
              disabled={loading.providers}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 font-serif shadow-sm transition-all duration-200 hover:shadow-md',
                isDark
                  ? 'bg-gradient-to-r from-stone-600 to-stone-700 text-white hover:from-stone-500 hover:to-stone-600'
                  : 'bg-gradient-to-r from-stone-700 to-stone-800 text-white hover:from-stone-600 hover:to-stone-700'
              )}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('addProvider')}</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className={cn(
              'mb-6 rounded-xl border p-4 shadow-sm',
              isDark
                ? 'border-red-800/50 bg-red-900/20 text-red-200'
                : 'border-red-200 bg-red-50 text-red-800'
            )}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <div className="flex-1">
                <h3 className="font-serif text-sm font-semibold">
                  {t('error')}
                </h3>
                <p className="mt-1 font-serif text-sm">{error}</p>
              </div>
              <button
                onClick={handleDismissError}
                className={cn(
                  'rounded-lg p-1 transition-colors',
                  isDark
                    ? 'text-red-400 hover:bg-red-800/30'
                    : 'text-red-600 hover:bg-red-100'
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <SsoStatsCards isLoading={loading.stats} />

        {/* Filter component */}
        <SsoFilters />

        {/* SSO Providers Table */}
        <SsoTable onEdit={handleEditProvider} onDelete={handleDeleteProvider} />

        {/* Create/Edit Provider Form */}
        <SsoProviderForm
          isOpen={showCreateForm || showEditForm}
          mode={showCreateForm ? 'create' : 'edit'}
          provider={selectedProvider}
          onClose={() => {
            if (showCreateForm) hideCreateForm();
            if (showEditForm) hideEditForm();
          }}
        />

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={hideDeleteConfirm}
            />
            <div
              className={cn(
                'relative rounded-xl border p-6 shadow-xl',
                isDark
                  ? 'border-stone-700 bg-stone-800'
                  : 'border-stone-200 bg-white'
              )}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full',
                    isDark
                      ? 'bg-red-900/30 text-red-400'
                      : 'bg-red-100 text-red-600'
                  )}
                >
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3
                    className={cn(
                      'font-serif text-lg font-semibold',
                      isDark ? 'text-stone-100' : 'text-stone-900'
                    )}
                  >
                    {t('deleteDialog.title')}
                  </h3>
                  <p
                    className={cn(
                      'font-serif text-sm',
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    )}
                  >
                    {t('deleteDialog.message', {
                      name: selectedProvider?.name || '',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={hideDeleteConfirm}
                  className={cn(
                    'rounded-lg border px-4 py-2 font-serif text-sm transition-colors',
                    isDark
                      ? 'border-stone-600 text-stone-300 hover:bg-stone-700/50'
                      : 'border-stone-300 text-stone-700 hover:bg-stone-50'
                  )}
                >
                  {t('deleteDialog.cancel')}
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={loading.deleting}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2 font-serif text-sm text-white transition-colors',
                    loading.deleting
                      ? 'cursor-not-allowed bg-red-400'
                      : 'bg-red-600 hover:bg-red-700'
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                  {loading.deleting
                    ? t('deleteDialog.deleting')
                    : t('deleteDialog.delete')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Provider Details Modal removed */}
      </div>
    </div>
  );
}
