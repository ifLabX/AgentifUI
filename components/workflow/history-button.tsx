'use client';

import { cn } from '@lib/utils';
import { History } from 'lucide-react';

import React from 'react';

import { useTranslations } from 'next-intl';

interface HistoryButtonProps {
  onClick: () => void;
  isActive: boolean;
  className?: string;
}

/**
 * History button component
 *
 * Fixed floating button at the top right corner, used to open/close the history sidebar
 */
export function HistoryButton({
  onClick,
  isActive,
  className,
}: HistoryButtonProps) {
  const t = useTranslations('pages.workflow.history');

  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full p-3 shadow-lg transition-all duration-200',
        'hover:scale-105 hover:shadow-xl',
        isActive
          ? 'bg-stone-700 text-white dark:bg-stone-600 dark:text-stone-100'
          : 'bg-white text-stone-600 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700',
        className
      )}
      title={isActive ? t('hideHistory') : t('showHistory')}
    >
      <History className="h-5 w-5" />
    </button>
  );
}
