'use client';

import { NotificationList } from '@components/notification/notification-list';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Switch } from '@components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@components/ui/tabs';
import { useNotificationStore } from '@lib/stores/notification-store';
import { useSidebarStore } from '@lib/stores/sidebar-store';
import type { NotificationTab } from '@lib/types/notification-center';
import { cn } from '@lib/utils';
import { Bell, Check, Filter } from 'lucide-react';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

const TAB_ITEMS: Array<{
  value: NotificationTab;
  labelKey: 'all' | 'changelog' | 'messages';
}> = [
  { value: 'all', labelKey: 'all' },
  { value: 'changelog', labelKey: 'changelog' },
  { value: 'message', labelKey: 'messages' },
];

export default function NotificationsPage() {
  const tPage = useTranslations('pages.notifications');
  const tTabs = useTranslations('components.notificationCenter.tabs');
  const tList = useTranslations('components.notificationList');

  const { isExpanded } = useSidebarStore();
  const {
    notifications,
    fetchNotifications,
    loadMore,
    hasMore,
    markAsRead,
    isLoading,
    activeTab,
    setActiveTab,
    markAllAsRead,
  } = useNotificationStore();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'priority'>('created_at');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [includeRead, setIncludeRead] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchNotifications({
        search: search.trim() || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        include_read: includeRead,
      });
    }, 200);

    return () => clearTimeout(timeout);
  }, [fetchNotifications, search, sortBy, sortOrder, includeRead, activeTab]);

  const sidebarPaddingClass = useMemo(
    () => (isExpanded ? 'md:pl-64 xl:pl-72' : 'md:pl-16 lg:pl-20'),
    [isExpanded]
  );

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value as NotificationTab);
    },
    [setActiveTab]
  );

  const handleMarkAsRead = useCallback(
    (id: string) => {
      void markAsRead([id]);
    },
    [markAsRead]
  );

  const handleLoadMore = useCallback(() => {
    void loadMore();
  }, [loadMore]);

  const handleMarkAllAsRead = useCallback(() => {
    void markAllAsRead();
  }, [markAllAsRead]);

  const handleIncludeReadToggle = useCallback((checked: boolean) => {
    setIncludeRead(checked);
  }, []);

  const shouldShowEmpty = !isLoading && notifications.length === 0;

  return (
    <div
      className={cn(
        'min-h-screen bg-stone-100/60 px-4 pt-24 pb-16 transition-[padding] duration-200 dark:bg-stone-900/40',
        sidebarPaddingClass
      )}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">{tPage('title')}</h1>
        </header>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="inline-flex h-10 items-center space-x-2 rounded-lg bg-stone-200 p-1 dark:bg-stone-700">
            {TAB_ITEMS.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-md px-4 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 data-[state=active]:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-600 dark:data-[state=active]:bg-stone-500 dark:data-[state=active]:text-white"
              >
                {tTabs(tab.labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="w-full rounded-xl border border-stone-200 bg-white/80 p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800/60">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <Input
                placeholder={tPage('searchPlaceholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full md:max-w-xs"
              />
              <Select
                value={`${sortBy}:${sortOrder}`}
                onValueChange={value => {
                  const [by, order] = value.split(':') as [
                    'created_at' | 'priority',
                    'asc' | 'desc',
                  ];
                  setSortBy(by);
                  setSortOrder(order);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={tPage('sort.label')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at:desc">
                    {tPage('sort.newest')}
                  </SelectItem>
                  <SelectItem value="created_at:asc">
                    {tPage('sort.oldest')}
                  </SelectItem>
                  <SelectItem value="priority:desc">
                    {tPage('sort.priorityHigh')}
                  </SelectItem>
                  <SelectItem value="priority:asc">
                    {tPage('sort.priorityLow')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
                <Filter className="h-4 w-4" />
                <span>{tPage('filters.unreadOnly')}</span>
                <Switch
                  checked={!includeRead}
                  onCheckedChange={checked => handleIncludeReadToggle(!checked)}
                  aria-label={tPage('filters.unreadOnly')}
                />
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                {tPage('actions.markAllRead')}
              </Button>
            </div>
          </div>
        </div>

        {shouldShowEmpty ? (
          <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 py-24">
            <Bell className="h-12 w-12" />
            <div className="space-y-1">
              <p className="text-lg font-medium">{tPage('empty.title')}</p>
              <p className="text-sm">{tPage('empty.description')}</p>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-6 text-left">
            <NotificationList
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              isLoading={isLoading && notifications.length === 0}
            />

            {hasMore && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  isLoading={isLoading}
                >
                  {tList('loadMore')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
