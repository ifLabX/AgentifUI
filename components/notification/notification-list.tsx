/**
 * NotificationList Component
 *
 * Container for displaying a list of notifications with optional date grouping,
 * infinite scroll support, and loading states.
 */
'use client';

import { Button } from '@components/ui/button';
import type { NotificationWithReadStatus } from '@lib/types/notification-center';
import {
  format,
  isThisMonth,
  isThisWeek,
  isToday,
  isYesterday,
} from 'date-fns';
import { Loader2 } from 'lucide-react';

import { useCallback, useEffect, useRef } from 'react';

import { useTranslations } from 'next-intl';

import { NotificationItem } from './notification-item';

/**
 * NotificationList Component
 *
 * Container for displaying a list of notifications with optional date grouping,
 * infinite scroll support, and loading states.
 */

/**
 * NotificationList Component
 *
 * Container for displaying a list of notifications with optional date grouping,
 * infinite scroll support, and loading states.
 */

/**
 * NotificationList Component
 *
 * Container for displaying a list of notifications with optional date grouping,
 * infinite scroll support, and loading states.
 */

/**
 * NotificationList Component
 *
 * Container for displaying a list of notifications with optional date grouping,
 * infinite scroll support, and loading states.
 */

/**
 * NotificationList Component
 *
 * Container for displaying a list of notifications with optional date grouping,
 * infinite scroll support, and loading states.
 */

/**
 * NotificationList Component
 *
 * Container for displaying a list of notifications with optional date grouping,
 * infinite scroll support, and loading states.
 */

/**
 * NotificationList Component
 *
 * Container for displaying a list of notifications with optional date grouping,
 * infinite scroll support, and loading states.
 */

/**
 * NotificationList Component
 *
 * Container for displaying a list of notifications with optional date grouping,
 * infinite scroll support, and loading states.
 */

// ============================================================================
// Types
// ============================================================================

export interface NotificationListProps {
  notifications: NotificationWithReadStatus[];
  /** Callback to mark notification as read. Should be memoized with useCallback to prevent observer re-initialization. */
  onMarkAsRead?: (id: string) => void;
  /** Callback when notification is clicked. Should be memoized with useCallback to prevent observer re-initialization. */
  onAction?: (notification: NotificationWithReadStatus) => void;
  compact?: boolean;
  groupByDate?: boolean;
  isLoading?: boolean;
  hasMore?: boolean;
  /** Callback to load more notifications. Should be memoized with useCallback to prevent observer re-initialization. */
  onLoadMore?: () => void;
}

export interface DateGroup {
  label: string;
  notifications: NotificationWithReadStatus[];
}

// ============================================================================
// Utils
// ============================================================================

/**
 * Get date group label for a notification
 */
export function getDateGroupLabel(date: Date): string {
  if (isToday(date)) return 'today';
  if (isYesterday(date)) return 'yesterday';
  if (isThisWeek(date)) return 'thisWeek';
  if (isThisMonth(date)) return 'thisMonth';
  return format(date, 'MMMM yyyy'); // e.g., "January 2025"
}

/**
 * Group notifications by date
 */
export function groupNotificationsByDate(
  notifications: NotificationWithReadStatus[]
): DateGroup[] {
  // Sort notifications by date (newest first) to ensure correct grouping order
  const sortedNotifications = [...notifications].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const groups = new Map<string, NotificationWithReadStatus[]>();

  // Group notifications
  sortedNotifications.forEach(notification => {
    const date = new Date(notification.created_at);
    const label = getDateGroupLabel(date);

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(notification);
  });

  // Convert to array and sort by date priority
  const groupOrder = ['today', 'yesterday', 'thisWeek', 'thisMonth'];
  const result: DateGroup[] = [];

  // Add predefined groups first
  groupOrder.forEach(label => {
    if (groups.has(label)) {
      result.push({
        label,
        notifications: groups.get(label)!,
      });
      groups.delete(label);
    }
  });

  // Add remaining groups (month/year labels)
  Array.from(groups.entries()).forEach(([label, notifications]) => {
    result.push({ label, notifications });
  });

  return result;
}

// ============================================================================
// Component
// ============================================================================

export function NotificationList({
  notifications,
  onMarkAsRead,
  onAction,
  compact = false,
  groupByDate = true,
  isLoading = false,
  hasMore = false,
  onLoadMore,
}: NotificationListProps) {
  const t = useTranslations('components.notificationList');
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || !onLoadMore || isLoading) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, onLoadMore, isLoading]);

  const renderEmptyState = useCallback(() => {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted mb-4 rounded-full p-4">
          <svg
            className="text-muted-foreground h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <h3 className="mb-1 text-lg font-medium">{t('empty.title')}</h3>
        <p className="text-muted-foreground text-sm">
          {t('empty.description')}
        </p>
      </div>
    );
  }, [t]);

  const renderLoadingSkeleton = useCallback(() => {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex gap-3 rounded-lg border border-transparent p-3"
          >
            <div className="bg-muted mt-1 h-2 w-2 animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted h-5 w-3/4 animate-pulse rounded" />
              <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
              <div className="bg-muted h-4 w-full animate-pulse rounded" />
              <div className="bg-muted h-3 w-1/4 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }, []);

  // Show loading skeleton on initial load
  if (isLoading && notifications.length === 0) {
    return renderLoadingSkeleton();
  }

  // Show empty state if no notifications
  if (!isLoading && notifications.length === 0) {
    return renderEmptyState();
  }

  // Group notifications by date if enabled
  if (groupByDate) {
    const groups = groupNotificationsByDate(notifications);

    return (
      <div className="space-y-6">
        {groups.map(group => (
          <div key={group.label} className="space-y-3">
            {/* Date group header */}
            <h3 className="text-muted-foreground px-1 text-xs font-semibold tracking-wide uppercase">
              {t(`dateGroup.${group.label}`, {
                defaultValue: group.label,
              })}
            </h3>

            {/* Notifications in group */}
            <div className="space-y-2">
              {group.notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onAction={onAction}
                  compact={compact}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div ref={observerTarget} className="flex justify-center py-4">
            {isLoading ? (
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLoadMore}
                className="text-muted-foreground"
              >
                {t('loadMore')}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Flat list without grouping
  return (
    <div className="space-y-2">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onAction={onAction}
          compact={compact}
        />
      ))}

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-4">
          {isLoading ? (
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              className="text-muted-foreground"
            >
              {t('loadMore')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
