/**
 * NotificationCenter Component
 *
 * Modal popup displaying notifications with tab navigation and actions.
 * Provides filtering by type (All/Changelog/Messages) and batch operations.
 */
'use client';

import { Button } from '@components/ui/button';
import { Popover } from '@components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import type { NotificationWithReadStatus } from '@lib/types/notification-center';
import { Check, Settings } from 'lucide-react';

import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { NotificationList } from './notification-list';

/**
 * NotificationCenter Component
 *
 * Modal popup displaying notifications with tab navigation and actions.
 * Provides filtering by type (All/Changelog/Messages) and batch operations.
 */

/**
 * NotificationCenter Component
 *
 * Modal popup displaying notifications with tab navigation and actions.
 * Provides filtering by type (All/Changelog/Messages) and batch operations.
 */

/**
 * NotificationCenter Component
 *
 * Modal popup displaying notifications with tab navigation and actions.
 * Provides filtering by type (All/Changelog/Messages) and batch operations.
 */

/**
 * NotificationCenter Component
 *
 * Modal popup displaying notifications with tab navigation and actions.
 * Provides filtering by type (All/Changelog/Messages) and batch operations.
 */

/**
 * NotificationCenter Component
 *
 * Modal popup displaying notifications with tab navigation and actions.
 * Provides filtering by type (All/Changelog/Messages) and batch operations.
 */

/**
 * NotificationCenter Component
 *
 * Modal popup displaying notifications with tab navigation and actions.
 * Provides filtering by type (All/Changelog/Messages) and batch operations.
 */

/**
 * NotificationCenter Component
 *
 * Modal popup displaying notifications with tab navigation and actions.
 * Provides filtering by type (All/Changelog/Messages) and batch operations.
 */

/**
 * NotificationCenter Component
 *
 * Modal popup displaying notifications with tab navigation and actions.
 * Provides filtering by type (All/Changelog/Messages) and batch operations.
 */

/**
 * NotificationCenter Component
 *
 * Modal popup displaying notifications with tab navigation and actions.
 * Provides filtering by type (All/Changelog/Messages) and batch operations.
 */

/**
 * NotificationCenter Component
 *
 * Modal popup displaying notifications with tab navigation and actions.
 * Provides filtering by type (All/Changelog/Messages) and batch operations.
 */

// ============================================================================
// Types
// ============================================================================

export interface NotificationCenterProps {
  /** All notifications */
  notifications: NotificationWithReadStatus[];
  /** Callback to mark single notification as read */
  onMarkAsRead?: (id: string) => void;
  /** Callback to mark all notifications as read */
  onMarkAllAsRead?: () => void;
  /** Callback when notification is clicked */
  onAction?: (notification: NotificationWithReadStatus) => void;
  /** Callback to navigate to settings */
  onSettingsClick?: () => void;
  /** Whether the popup is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Trigger element (typically NotificationBell) */
  children: React.ReactNode;
  /** Loading state for initial fetch */
  isLoading?: boolean;
  /** Whether there are more notifications to load */
  hasMore?: boolean;
  /** Callback to load more notifications */
  onLoadMore?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onAction,
  onSettingsClick,
  open,
  onOpenChange,
  children,
  isLoading = false,
  hasMore = false,
  onLoadMore,
}: NotificationCenterProps) {
  const t = useTranslations('components.notificationCenter');

  // Memoize notification filtering and counting in a single pass for performance
  const {
    unreadCount,
    changelogUnreadCount,
    messageUnreadCount,
    changelogNotifications,
    messageNotifications,
  } = useMemo(() => {
    return notifications.reduce(
      (acc, notification) => {
        const isUnread = !notification.is_read;

        if (isUnread) {
          acc.unreadCount++;
        }

        if (notification.type === 'changelog') {
          acc.changelogNotifications.push(notification);
          if (isUnread) {
            acc.changelogUnreadCount++;
          }
        } else if (notification.type === 'message') {
          acc.messageNotifications.push(notification);
          if (isUnread) {
            acc.messageUnreadCount++;
          }
        }

        return acc;
      },
      {
        unreadCount: 0,
        changelogUnreadCount: 0,
        messageUnreadCount: 0,
        changelogNotifications: [] as NotificationWithReadStatus[],
        messageNotifications: [] as NotificationWithReadStatus[],
      }
    );
  }, [notifications]);

  // Tab configuration for data-driven rendering
  const tabs = [
    {
      value: 'all',
      labelKey: 'tabs.all' as const,
      count: unreadCount,
      notifications: notifications,
    },
    {
      value: 'changelog',
      labelKey: 'tabs.changelog' as const,
      count: changelogUnreadCount,
      notifications: changelogNotifications,
    },
    {
      value: 'message',
      labelKey: 'tabs.messages' as const,
      count: messageUnreadCount,
      notifications: messageNotifications,
    },
  ];

  return (
    <Popover
      trigger={children}
      isOpen={open}
      onOpenChange={onOpenChange}
      minWidth={420}
      placement="bottom"
      offsetX={-12}
      offsetY={4}
      contentClassName="rounded-xl border border-stone-200 bg-stone-50 p-2 shadow-xl dark:border-stone-600 dark:bg-stone-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between rounded-lg bg-stone-200/80 px-4 py-3 dark:bg-stone-700/50">
        <h2 className="text-lg font-semibold">{t('title')}</h2>

        <div className="flex items-center gap-1">
          {/* Mark all as read */}
          {unreadCount > 0 && onMarkAllAsRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="h-8 text-xs"
            >
              <Check className="mr-1 h-3 w-3" />
              {t('markAllAsRead')}
            </Button>
          )}

          {/* Settings button */}
          {onSettingsClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
              className="h-8 w-8"
              aria-label={t('settings')}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-stone-200 bg-transparent p-0 dark:border-stone-600">
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:border-primary relative rounded-none border-b-2 border-transparent text-stone-700 data-[state=active]:bg-transparent data-[state=active]:text-stone-900 dark:text-stone-300 dark:data-[state=active]:text-stone-100"
            >
              {t(tab.labelKey)}
              {tab.count > 0 && (
                <span className="ml-2 rounded-full bg-stone-300 px-2 py-0.5 text-xs font-semibold text-stone-800 dark:bg-stone-600 dark:text-stone-50">
                  {tab.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab content */}
        <div className="max-h-[600px] overflow-y-auto">
          {tabs.map(tab => (
            <TabsContent key={tab.value} value={tab.value} className="m-0 p-4">
              <NotificationList
                notifications={tab.notifications}
                onMarkAsRead={onMarkAsRead}
                onAction={onAction}
                groupByDate
                isLoading={isLoading}
                hasMore={hasMore}
                onLoadMore={onLoadMore}
              />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </Popover>
  );
}
