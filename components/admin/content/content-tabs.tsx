'use client';

import { cn } from '@lib/utils';

import { useTranslations } from 'next-intl';

interface ContentTabsProps {
  activeTab: 'about' | 'home';
  onTabChange: (tab: 'about' | 'home') => void;
}

export function ContentTabs({ activeTab, onTabChange }: ContentTabsProps) {
  const t = useTranslations('pages.admin.content.tabs');

  const tabs = [
    { id: 'about', label: t('about') },
    { id: 'home', label: t('home') },
  ];

  return (
    <div
      className={cn(
        'flex items-center space-x-2 rounded-lg p-1',
        'bg-stone-200 dark:bg-stone-700'
      )}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id as 'about' | 'home')}
          className={cn(
            'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-500 dark:text-white'
              : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-600'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
