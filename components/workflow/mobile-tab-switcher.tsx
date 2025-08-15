'use client';

import { cn } from '@lib/utils';
import { Activity, FileText, History } from 'lucide-react';

import React from 'react';

import { useTranslations } from 'next-intl';

type MobileTab = 'form' | 'tracker' | 'history';

interface MobileTabSwitcherProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

/**
 * Mobile tab switcher component
 *
 * Provides switching between form, tracker, and history on mobile devices
 */
export function MobileTabSwitcher({
  activeTab,
  onTabChange,
}: MobileTabSwitcherProps) {
  const t = useTranslations('pages.workflow.tabs');

  const tabs = [
    {
      id: 'form' as const,
      label: t('inputForm'),
      icon: FileText,
    },
    {
      id: 'tracker' as const,
      label: t('executionStatus'),
      icon: Activity,
    },
    {
      id: 'history' as const,
      label: t('history'),
      icon: History,
    },
  ];

  return (
    <div
      className={cn(
        'flex border-b',
        'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900'
      )}
    >
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 px-4 py-3 font-serif text-sm transition-colors',
              isActive
                ? 'border-b-2 border-stone-600 text-stone-900 dark:border-stone-400 dark:text-stone-100'
                : 'text-stone-600 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
