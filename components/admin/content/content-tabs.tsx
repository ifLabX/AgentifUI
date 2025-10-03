'use client';

import { getCurrentLocaleFromCookie } from '@lib/config/language-config';
import { useDynamicPages } from '@lib/hooks/use-dynamic-pages';
import { cn } from '@lib/utils';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

import { useTranslations } from 'next-intl';

interface ContentTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreatePage?: () => void;
  onDeletePage?: (slug: string) => void;
}

export function ContentTabs({
  activeTab,
  onTabChange,
  onCreatePage,
  onDeletePage,
}: ContentTabsProps) {
  const t = useTranslations('pages.admin.content.tabs');
  const { pages } = useDynamicPages();
  const currentLocale = getCurrentLocaleFromCookie();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const staticTabs = [
    { id: 'about', label: t('about') },
    { id: 'home', label: t('home') },
  ];

  const dynamicTabs = pages.map(page => ({
    id: `dynamic:${page.slug}`,
    label: page.titles?.[currentLocale] || page.titles?.['en-US'] || page.slug,
  }));

  const tabs = [...staticTabs, ...dynamicTabs];

  return (
    <div
      className={cn(
        'flex items-center space-x-2 rounded-lg p-1',
        'bg-stone-200 dark:bg-stone-700'
      )}
    >
      {tabs.map(tab => {
        const isDynamic = tab.id.startsWith('dynamic:');
        const slug = isDynamic ? tab.id.replace('dynamic:', '') : null;

        return (
          <div
            key={tab.id}
            className="relative"
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <button
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-500 dark:text-white'
                  : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-600',
                isDynamic && 'pr-8'
              )}
            >
              {tab.label}
            </button>

            {/* Delete button for dynamic pages */}
            {isDynamic && onDeletePage && slug && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDeletePage(slug);
                }}
                className={cn(
                  'absolute top-1/2 right-1 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded transition-all',
                  'text-stone-400 hover:bg-red-100 hover:text-red-600',
                  'dark:text-stone-500 dark:hover:bg-red-900/50 dark:hover:text-red-400',
                  hoveredTab === tab.id ? 'opacity-100' : 'opacity-0'
                )}
                title="Delete page"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}

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
