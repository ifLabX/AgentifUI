'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Edit } from 'lucide-react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function ReturnToChatButton() {
  const { isDark } = useTheme();
  const t = useTranslations('pages.admin.layout.actions.returnToChatButton');

  return (
    <Link
      href="/chat"
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-200',
        'border',
        isDark
          ? 'border-stone-600/50 bg-stone-700/50 text-stone-300 hover:border-stone-500 hover:bg-stone-600 hover:text-stone-100'
          : 'border-stone-200 bg-stone-100/80 text-stone-600 hover:border-stone-300 hover:bg-stone-200 hover:text-stone-900'
      )}
    >
      <Edit className="h-4 w-4" />
      <span className="hidden text-sm sm:inline">{t('text')}</span>
    </Link>
  );
}
