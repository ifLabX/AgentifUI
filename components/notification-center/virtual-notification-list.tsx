'use client';

import { cn } from '@lib/utils';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import type { NotificationWithReadStatus } from '../../lib/types/notification-center';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { NotificationItem } from './notification-item';

interface VirtualNotificationListProps {
  notifications: NotificationWithReadStatus[];
  loading: boolean;
  hasMore: boolean;
  onMarkAsRead: (id: string) => void;
  onLoadMore: () => void;
  emptyMessage: string;
  className?: string;
  itemHeight?: number; // Height of each notification item
  overscan?: number; // Number of items to render outside visible area
  threshold?: number; // Distance from bottom to trigger load more
}

interface VirtualItem {
  index: number;
  offset: number;
  height: number;
}

/**
 * High-performance virtual scrolling notification list
 *
 * Features:
 * - Virtual scrolling for large notification lists
 * - Automatic load more when approaching bottom
 * - Configurable item height and overscan
 * - Smooth scrolling performance
 * - Memory efficient rendering
 */
export function VirtualNotificationList({
  notifications,
  loading,
  hasMore,
  onMarkAsRead,
  onLoadMore,
  emptyMessage,
  className,
  itemHeight = 80, // Default height per notification item
  overscan = 5, // Render 5 extra items above/below viewport
  threshold = 200, // Load more when 200px from bottom
}: VirtualNotificationListProps) {
  const t = useTranslations('components.notificationCenter');

  // Refs for scroll container and measurements
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Resize observer to track container height
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      const [entry] = entries;
      setContainerHeight(entry.contentRect.height);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate virtual scrolling parameters
  const virtualItems = useMemo(() => {
    if (containerHeight === 0) return [];

    const visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight));
    const visibleEnd = Math.min(
      notifications.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(notifications.length - 1, visibleEnd + overscan);

    const items: VirtualItem[] = [];

    for (let i = start; i <= end; i++) {
      items.push({
        index: i,
        offset: i * itemHeight,
        height: itemHeight,
      });
    }

    return items;
  }, [scrollTop, containerHeight, notifications.length, itemHeight, overscan]);

  // Total height of all items
  const totalHeight = notifications.length * itemHeight;

  // Handle scroll events
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const newScrollTop = target.scrollTop;
      setScrollTop(newScrollTop);

      // Check if we need to load more
      const scrollBottom = newScrollTop + target.clientHeight;
      const isNearBottom = totalHeight - scrollBottom < threshold;

      if (isNearBottom && hasMore && !loading && !isLoadingMore) {
        setIsLoadingMore(true);
        onLoadMore();
      }
    },
    [totalHeight, threshold, hasMore, loading, isLoadingMore, onLoadMore]
  );

  // Reset loading state when loading prop changes
  useEffect(() => {
    if (!loading) {
      setIsLoadingMore(false);
    }
  }, [loading]);

  // Loading skeleton for initial load
  if (loading && notifications.length === 0) {
    return (
      <div className={cn('space-y-3 p-4', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center px-4 py-12',
          className
        )}
      >
        <div className="text-center">
          <div className="text-muted-foreground mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-5 5-5-5h5V3h0z"
              />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      onScroll={handleScroll}
      style={{
        height: '100%',
        maxHeight: '100%',
      }}
    >
      {/* Virtual container with total height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Rendered virtual items */}
        {virtualItems.map(virtualItem => {
          const notification = notifications[virtualItem.index];

          return (
            <div
              key={notification.id}
              style={{
                position: 'absolute',
                top: virtualItem.offset,
                left: 0,
                right: 0,
                height: virtualItem.height,
              }}
              className="px-4 py-2"
            >
              <NotificationItem
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                compact
                style={{ height: '100%' }}
              />
            </div>
          );
        })}

        {/* Loading indicator for load more */}
        {(loading || isLoadingMore) && notifications.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: totalHeight,
              left: 0,
              right: 0,
              height: 60,
            }}
            className="flex items-center justify-center p-4"
          >
            <div className="flex items-center gap-2">
              <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2" />
              <span className="text-muted-foreground text-sm">
                {t('loading.more')}
              </span>
            </div>
          </div>
        )}

        {/* Manual load more button (fallback) */}
        {hasMore && !loading && !isLoadingMore && notifications.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: totalHeight,
              left: 0,
              right: 0,
              height: 60,
            }}
            className="flex items-center justify-center p-4"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              {t('actions.loadMore')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simpler virtual list for when you need basic virtualization
 */
interface SimpleVirtualListProps {
  notifications: NotificationWithReadStatus[];
  onMarkAsRead: (id: string) => void;
  itemHeight?: number;
  maxHeight?: number;
}

export function SimpleVirtualNotificationList({
  notifications,
  onMarkAsRead,
  itemHeight = 80,
  maxHeight = 400,
}: SimpleVirtualListProps) {
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(maxHeight / itemHeight);
    const end = Math.min(notifications.length, start + visibleCount + 2); // +2 for buffer

    return { start, end };
  }, [scrollTop, itemHeight, maxHeight, notifications.length]);

  return (
    <div
      className="overflow-auto"
      style={{ maxHeight }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: notifications.length * itemHeight,
          position: 'relative',
        }}
      >
        {notifications
          .slice(visibleRange.start, visibleRange.end)
          .map((notification, index) => (
            <div
              key={notification.id}
              style={{
                position: 'absolute',
                top: (visibleRange.start + index) * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
              className="px-4 py-2"
            >
              <NotificationItem
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                compact
              />
            </div>
          ))}
      </div>
    </div>
  );
}

export type { VirtualNotificationListProps, SimpleVirtualListProps };
