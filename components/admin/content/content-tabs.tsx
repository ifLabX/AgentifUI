'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';

import { useTranslations } from 'next-intl';

interface ContentTabsProps {
  activeTab: 'about' | 'home';
  onTabChange: (tab: 'about' | 'home') => void;
}

export function ContentTabs({ activeTab, onTabChange }: ContentTabsProps) {
  const { isDark } = useTheme();
  const t = useTranslations('pages.admin.content.tabs');

  const tabs = [
    { id: 'about', label: t('about') },
    { id: 'home', label: t('home') },
  ];

  return (
    <div
      className={cn(
        'flex items-center space-x-2 rounded-lg p-1',
        isDark ? 'bg-stone-700' : 'bg-stone-200'
      )}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id as 'about' | 'home')}
          className={cn(
            'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? isDark
                ? 'bg-stone-500 text-white shadow-sm'
                : 'bg-white text-stone-900 shadow-sm'
              : isDark
                ? 'text-stone-300 hover:bg-stone-600'
                : 'text-stone-600 hover:bg-stone-100'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
