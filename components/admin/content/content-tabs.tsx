'use client';

import { useDynamicPages } from '@lib/hooks/use-dynamic-pages';
import { cn } from '@lib/utils';
import { Plus } from 'lucide-react';

import { useTranslations } from 'next-intl';

interface ContentTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreatePage?: () => void;
}

export function ContentTabs({
  activeTab,
  onTabChange,
  onCreatePage,
}: ContentTabsProps) {
  const t = useTranslations('pages.admin.content.tabs');
  const { pages } = useDynamicPages();

  const staticTabs = [
    { id: 'about', label: t('about') },
    { id: 'home', label: t('home') },
  ];

  const dynamicTabs = pages.map(page => ({
    id: `dynamic:${page.slug}`,
    label: page.slug,
  }));

  const tabs = [...staticTabs, ...dynamicTabs];

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
          onClick={() => onTabChange(tab.id)}
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

      {/* Add Page Button */}
      {onCreatePage && (
        <button
          onClick={onCreatePage}
          className={cn(
            'ml-1 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            'bg-stone-900 text-white hover:bg-stone-800',
            'dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white'
          )}
          title="Create new page"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Page</span>
        </button>
      )}
    </div>
  );
}
