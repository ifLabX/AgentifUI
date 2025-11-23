'use client';

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
import type { Notification } from '@lib/types/notification-center';
import { cn } from '@lib/utils';
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type AdminNotification = Notification;

export default function AdminNotificationsPage() {
  const router = useRouter();
  const t = useTranslations('pages.admin.notifications');
  const tFilters = useTranslations('pages.admin.notifications.filters');
  const tTable = useTranslations('pages.admin.notifications.table');
  const tActions = useTranslations('pages.admin.notifications.actions');
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [includeDrafts, setIncludeDrafts] = useState(true);
  const [sortBy, setSortBy] = useState<'created_at' | 'priority'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  const filteredNotifications = useMemo(() => {
    const term = search.trim().toLowerCase();
    return notifications.filter(n => {
      if (!includeDrafts && !n.published) return false;
      if (!term) return true;
      return (
        n.title.toLowerCase().includes(term) ||
        n.content.toLowerCase().includes(term) ||
        (n.category || '').toLowerCase().includes(term)
      );
    });
  }, [notifications, includeDrafts, search]);

  const sortedNotifications = useMemo(() => {
    const list = [...filteredNotifications];
    list.sort((a, b) => {
      if (sortBy === 'priority') {
        const order = ['low', 'medium', 'high', 'critical'] as const;
        const aIdx = order.indexOf(a.priority);
        const bIdx = order.indexOf(b.priority);
        return sortOrder === 'asc' ? aIdx - bIdx : bIdx - aIdx;
      }
      // created_at
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
    });
    return list;
  }, [filteredNotifications, sortBy, sortOrder]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        limit: '200',
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      const res = await fetch(`/api/admin/notifications?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedNotifications.map(n => n.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/notifications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          notification_ids: Array.from(selectedIds),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete notifications');
      }
      await fetchData();
      setSelectedIds(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchData()}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            {tActions('refresh')}
          </Button>
          <Link href="/admin/notifications/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {tActions('new')}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <Input
              placeholder={tFilters('searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="md:max-w-sm"
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
              <SelectTrigger className="w-44">
                <SelectValue placeholder={tFilters('sort.label')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at:desc">
                  {tFilters('sort.newest')}
                </SelectItem>
                <SelectItem value="created_at:asc">
                  {tFilters('sort.oldest')}
                </SelectItem>
                <SelectItem value="priority:desc">
                  {tFilters('sort.priorityHigh')}
                </SelectItem>
                <SelectItem value="priority:asc">
                  {tFilters('sort.priorityLow')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
            <span>{tFilters('showDrafts')}</span>
            <Switch
              checked={includeDrafts}
              onCheckedChange={setIncludeDrafts}
            />
          </div>
        </div>

        {error && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs text-stone-500 uppercase dark:border-stone-700">
                <th className="px-2 py-2">
                  <input
                    type="checkbox"
                    className="text-primary focus:ring-primary h-4 w-4 rounded border-stone-300 shadow-sm focus:ring-1"
                    checked={
                      selectedIds.size === sortedNotifications.length &&
                      sortedNotifications.length > 0
                    }
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-2 py-2">{tTable('title')}</th>
                <th className="px-2 py-2">{tTable('type')}</th>
                <th className="px-2 py-2">{tTable('category')}</th>
                <th className="px-2 py-2">{tTable('priority')}</th>
                <th className="px-2 py-2">{tTable('published')}</th>
                <th className="px-2 py-2">{tTable('created')}</th>
                <th className="px-2 py-2 text-right">{tTable('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedNotifications.map(notification => {
                const isSelected = selectedIds.has(notification.id);
                return (
                  <tr
                    key={notification.id}
                    className="border-b border-stone-100 text-sm dark:border-stone-700/60"
                  >
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        className="text-primary focus:ring-primary h-4 w-4 rounded border-stone-300 shadow-sm focus:ring-1"
                        checked={isSelected}
                        onChange={() => toggleSelect(notification.id)}
                        aria-label="Select row"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div className="font-medium">{notification.title}</div>
                      <div className="line-clamp-1 text-xs text-stone-500">
                        {notification.content}
                      </div>
                    </td>
                    <td className="px-2 py-2 capitalize">
                      {notification.type}
                    </td>
                    <td className="px-2 py-2">
                      {notification.category || '-'}
                    </td>
                    <td className="px-2 py-2 capitalize">
                      {notification.priority}
                    </td>
                    <td className="px-2 py-2">
                      {notification.published ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          {tTable('publishedBadge')}
                        </span>
                      ) : (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">
                          {tTable('draftBadge')}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-xs text-stone-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/admin/notifications/${notification.id}/edit`
                            )
                          }
                        >
                          {tActions('edit')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedNotifications.length === 0 && !isLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-stone-500"
                  >
                    {tTable('empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-stone-500">
            {t('count', { count: sortedNotifications.length })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0 || isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {tActions('deleteSelected')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
