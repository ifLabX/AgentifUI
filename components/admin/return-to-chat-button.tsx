'use client';

import { cn } from '@lib/utils';
import { Edit } from 'lucide-react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function ReturnToChatButton() {
  const t = useTranslations('pages.admin.layout.actions.returnToChatButton');

  return (
    <Link
      href="/chat"
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-200',
        'border',
        'border-stone-200 bg-stone-100/80 text-stone-600 hover:border-stone-300 hover:bg-stone-200 hover:text-stone-900',
        'dark:border-stone-600/50 dark:bg-stone-700/50 dark:text-stone-300 dark:hover:border-stone-500 dark:hover:bg-stone-600 dark:hover:text-stone-100'
      )}
    >
      <Edit className="h-4 w-4" />
      <span className="hidden text-sm sm:inline">{t('text')}</span>
    </Link>
  );
}
