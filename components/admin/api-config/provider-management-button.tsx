'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Settings } from 'lucide-react';

import { useTranslations } from 'next-intl';

interface ProviderManagementButtonProps {
  onClick: () => void;
}

export const ProviderManagementButton = ({
  onClick,
}: ProviderManagementButtonProps) => {
  const { isDark } = useTheme();
  const t = useTranslations('pages.admin.apiConfig.providerManagement');

  return (
    <div className="flex justify-end px-6 pt-6 pb-3">
      <button
        onClick={onClick}
        className={cn(
          'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
          'focus:ring-2 focus:ring-offset-2 focus:outline-none',
          'border shadow-sm',
          isDark
            ? 'border-stone-500 bg-stone-600 text-stone-100 shadow-stone-900/20 hover:bg-stone-500 hover:text-white focus:ring-stone-400'
            : 'border-stone-300 bg-stone-200 text-stone-800 shadow-stone-200/50 hover:bg-stone-300 hover:text-stone-900 focus:ring-stone-500'
        )}
      >
        <Settings className="h-4 w-4" />
        <span className="font-serif">{t('buttonText')}</span>
      </button>
    </div>
  );
};
