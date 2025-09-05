'use client';

import { cn } from '@lib/utils';
import { ExternalLink, X } from 'lucide-react';

import { useEffect } from 'react';

import { useTranslations } from 'next-intl';

import {
  type ActiveTab,
  type NotificationWithReadStatus,
  useNotificationCenter,
  useNotificationCenterOpen,
  useNotificationCenterTab,
  useNotificationList,
  useNotificationLoading,
  useNotificationRealtime,
  useUnreadCount,
} from '../../lib/stores/notification-center-store';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { NotificationItem } from './notification-item';

interface NotificationCenterProps {
  className?: string;
  maxHeight?: number;
}

export function NotificationCenter({
  className,
  maxHeight = 600,
}: NotificationCenterProps) {
  const t = useTranslations('components.notificationCenter');

  // Store hooks
  const isOpen = useNotificationCenterOpen();
  const activeTab = useNotificationCenterTab();
  const notifications = useNotificationList();
  const unreadCount = useUnreadCount();
  const loading = useNotificationLoading();

  // Get store actions
  const {
    closeCenter,
    setActiveTab,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    loadMore,
    cancelTimeouts,
    openOverlay,
  } = useNotificationCenter();

  // Handle mouse events to keep popup open when hovering
  const handleMouseEnter = () => {
    // Cancel any pending timeouts when entering the modal
    cancelTimeouts();
  };

  const handleMouseLeave = () => {
    // Close immediately when leaving the modal area
    closeCenter();
  };

  // Set up real-time updates
  useNotificationRealtime();

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    return notification.type === activeTab;
  });

  // Load notifications when opening or changing tabs
  useEffect(() => {
    if (isOpen) {
      const type = activeTab === 'all' ? undefined : activeTab;
      fetchNotifications(type, true);
    }
  }, [isOpen, activeTab, fetchNotifications]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as ActiveTab);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead([id]);
  };

  const handleMarkAllRead = () => {
    const type = activeTab === 'all' ? undefined : activeTab;
    markAllAsRead(type);
  };

  const handleLoadMore = () => {
    loadMore();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={closeCenter}
        aria-hidden="true"
      />

      {/* Combined hover area: includes bridge + modal */}
      <div
        className="fixed top-0 right-4 w-96"
        style={{ height: `${maxHeight + 64}px`, zIndex: 45 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-hidden="true"
      >
        {/* Modal positioned within the hover area */}
        <div
          className={cn(
            'bg-background absolute top-16 z-50 w-96 rounded-lg border shadow-xl',
            'animate-in slide-in-from-right-2 duration-200',
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-center-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2
              id="notification-center-title"
              className="text-lg font-semibold"
            >
              {t('title')}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeCenter}
              className="h-8 w-8"
              aria-label={t('close')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <div className="border-b px-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="relative">
                  {t('tabs.all')}
                  {unreadCount.total > 0 && (
                    <span className="bg-destructive text-destructive-foreground ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                      {unreadCount.total > 99 ? '99+' : unreadCount.total}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="changelog" className="relative">
                  {t('tabs.changelog')}
                  {unreadCount.changelog > 0 && (
                    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-semibold text-white">
                      {unreadCount.changelog > 99
                        ? '99+'
                        : unreadCount.changelog}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="message" className="relative">
                  {t('tabs.messages')}
                  {unreadCount.message > 0 && (
                    <span className="bg-destructive text-destructive-foreground ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                      {unreadCount.message > 99 ? '99+' : unreadCount.message}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Contents */}
            <div style={{ maxHeight: maxHeight - 120 }}>
              <TabsContent value="all" className="m-0">
                <NotificationTabContent
                  notifications={filteredNotifications}
                  loading={loading}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllRead={handleMarkAllRead}
                  onLoadMore={handleLoadMore}
                  emptyMessage={t('empty.all')}
                />
              </TabsContent>

              <TabsContent value="changelog" className="m-0">
                <NotificationTabContent
                  notifications={filteredNotifications}
                  loading={loading}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllRead={handleMarkAllRead}
                  onLoadMore={handleLoadMore}
                  emptyMessage={t('empty.changelog')}
                />
              </TabsContent>

              <TabsContent value="message" className="m-0">
                <NotificationTabContent
                  notifications={filteredNotifications}
                  loading={loading}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllRead={handleMarkAllRead}
                  onLoadMore={handleLoadMore}
                  emptyMessage={t('empty.messages')}
                />
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <div className="border-t p-3">
            <div className="flex items-center justify-between">
              {filteredNotifications.some(n => !n.is_read) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="text-xs"
                >
                  {t('actions.markAllRead')}
                </Button>
              )}
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  closeCenter();
                  openOverlay();
                }}
              >
                {t('actions.viewAll')}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Tab content component
interface NotificationTabContentProps {
  notifications: NotificationWithReadStatus[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
  onLoadMore: () => void;
  emptyMessage: string;
}

function NotificationTabContent({
  notifications,
  loading,
  onMarkAsRead,
  onLoadMore,
  emptyMessage,
}: NotificationTabContentProps) {
  if (loading && notifications.length === 0) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-full overflow-y-auto">
      <div className="space-y-2 p-4">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            compact
          />
        ))}

        {/* Load more trigger */}
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            className="text-muted-foreground hover:text-foreground w-full text-xs"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { NotificationCenterProps };
