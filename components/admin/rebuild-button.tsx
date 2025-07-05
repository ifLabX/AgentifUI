'use client';

import { Button } from '@components/ui/button';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Loader2, Rocket } from 'lucide-react';
import { toast } from 'sonner';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

export function RebuildButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { isDark } = useTheme();
  const t = useTranslations('pages.admin.layout.actions.rebuildButton');

  const handleRebuild = async () => {
    setIsLoading(true);
    toast.info(t('messages.startRebuild'), {
      description: t('messages.startRebuildDescription'),
    });

    try {
      const response = await fetch('/api/admin/rebuild', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.warning(t('messages.buildInProgress'), {
            description: t('messages.buildInProgressDescription'),
          });
        } else if (response.status === 401) {
          toast.error(t('messages.authFailed'), {
            description: t('messages.authFailedDescription'),
          });
        } else if (response.status === 403) {
          toast.error(t('messages.permissionDenied'), {
            description: t('messages.permissionDeniedDescription'),
          });
        } else {
          throw new Error(result.error || t('messages.unknownError'));
        }
        return;
      }

      toast.success(t('messages.buildComplete'), {
        description: t('messages.buildCompleteDescription'),
      });

      setTimeout(() => {
        toast.info(t('messages.appRestarting'), {
          description: t('messages.appRestartingDescription'),
        });
      }, 3000);

      setTimeout(() => {
        window.location.reload();
      }, 8000);
    } catch (error: any) {
      console.error('Rebuild error:', error);
      toast.error(t('messages.deployFailed'), {
        description: error.message || t('messages.networkError'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleRebuild}
      disabled={isLoading}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-200',
        'border',
        isDark
          ? 'border-stone-600/50 bg-stone-700/50 text-stone-300 hover:border-stone-500 hover:bg-stone-600 hover:text-stone-100'
          : 'border-stone-200 bg-stone-100/80 text-stone-600 hover:border-stone-300 hover:bg-stone-200 hover:text-stone-900',
        'disabled:cursor-not-allowed disabled:opacity-50'
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Rocket className="h-4 w-4" />
      )}
      <span className="hidden text-sm sm:inline">{t('text')}</span>
    </button>
  );
}
