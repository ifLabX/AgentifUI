import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import {
  NotificationAdminService,
  NotificationCenterService,
} from '../services/notification-center-service';
import { createClient } from '../supabase/client';
import type {
  CreateNotificationData,
  Notification,
  NotificationType,
  NotificationWithReadStatus,
  UnreadCount,
} from '../types/notification-center';

export type ActiveTab = 'all' | 'changelog' | 'message';

interface NotificationCenterState {
  // UI State
  isOpen: boolean;
  isOverlayOpen: boolean;
  activeTab: ActiveTab;

  // Data State
  notifications: NotificationWithReadStatus[];
  unreadCount: UnreadCount;
  loading: boolean;
  hasMore: boolean;
  currentPage: number;

  // Cache State
  lastFetchTime: number;
  cacheValidTime: number; // 5 minutes

  // Timeout State for hover behavior
  hoverTimeouts: {
    show?: ReturnType<typeof setTimeout>;
    hide?: ReturnType<typeof setTimeout>;
  };

  // Actions
  openCenter: () => void;
  closeCenter: () => void;
  openCenterWithDelay: (delay?: number) => void;
  closeCenterWithDelay: (delay?: number) => void;
  cancelTimeouts: () => void;
  openOverlay: () => void;
  closeOverlay: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  fetchNotifications: (
    type?: NotificationType,
    reset?: boolean
  ) => Promise<void>;
  markAsRead: (ids: string[]) => Promise<void>;
  markAllAsRead: (type?: NotificationType) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  loadMore: () => Promise<void>;
  createNotification: (
    data: Partial<CreateNotificationData>
  ) => Promise<Notification | null>;

  // Internal methods
  _updateNotification: (
    id: string,
    updates: Partial<NotificationWithReadStatus>
  ) => void;
  _addNotification: (notification: NotificationWithReadStatus) => void;
  _removeNotification: (id: string) => void;
  _resetState: () => void;
}

const initialState = {
  isOpen: false,
  isOverlayOpen: false,
  activeTab: 'all' as ActiveTab,
  notifications: [],
  unreadCount: { changelog: 0, message: 0, total: 0 },
  loading: false,
  hasMore: true,
  currentPage: 1,
  lastFetchTime: 0,
  cacheValidTime: 5 * 60 * 1000, // 5 minutes
  hoverTimeouts: {},
};

export const useNotificationCenter = create<NotificationCenterState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      openCenter: () => set({ isOpen: true }, false, 'openCenter'),

      closeCenter: () => set({ isOpen: false }, false, 'closeCenter'),

      openOverlay: () => set({ isOverlayOpen: true }, false, 'openOverlay'),

      closeOverlay: () => set({ isOverlayOpen: false }, false, 'closeOverlay'),

      openCenterWithDelay: (delay = 500) => {
        const state = get();

        // Clear existing timeouts
        if (state.hoverTimeouts.show) clearTimeout(state.hoverTimeouts.show);
        if (state.hoverTimeouts.hide) clearTimeout(state.hoverTimeouts.hide);

        const showTimeout = setTimeout(() => {
          set({ isOpen: true }, false, 'openCenterWithDelay');
        }, delay);

        set(
          {
            hoverTimeouts: {
              ...state.hoverTimeouts,
              show: showTimeout,
              hide: undefined,
            },
          },
          false,
          'openCenterWithDelay:setTimeout'
        );
      },

      closeCenterWithDelay: (delay = 150) => {
        const state = get();

        // Clear show timeout if pending
        if (state.hoverTimeouts.show) {
          clearTimeout(state.hoverTimeouts.show);
        }

        const hideTimeout = setTimeout(() => {
          set({ isOpen: false }, false, 'closeCenterWithDelay');
        }, delay);

        set(
          {
            hoverTimeouts: {
              ...state.hoverTimeouts,
              show: undefined,
              hide: hideTimeout,
            },
          },
          false,
          'closeCenterWithDelay:setTimeout'
        );
      },

      cancelTimeouts: () => {
        const state = get();
        if (state.hoverTimeouts.show) clearTimeout(state.hoverTimeouts.show);
        if (state.hoverTimeouts.hide) clearTimeout(state.hoverTimeouts.hide);

        set(
          {
            hoverTimeouts: {},
          },
          false,
          'cancelTimeouts'
        );
      },

      setActiveTab: (tab: ActiveTab) => {
        set({ activeTab: tab }, false, 'setActiveTab');

        // Auto-fetch if switching tabs and cache is stale
        const state = get();
        const now = Date.now();
        const shouldRefresh = now - state.lastFetchTime > state.cacheValidTime;

        if (shouldRefresh || state.notifications.length === 0) {
          const type = tab === 'all' ? undefined : (tab as NotificationType);
          state.fetchNotifications(type, true);
        }
      },

      fetchNotifications: async (type?: NotificationType, reset = false) => {
        const state = get();

        // Prevent concurrent requests
        if (state.loading && !reset) return;

        set({ loading: true }, false, 'fetchNotifications:start');

        try {
          const supabase = createClient();
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser();

          if (authError || !user?.id) {
            throw new Error('User not authenticated');
          }

          const params = {
            type,
            offset: reset ? 0 : (state.currentPage - 1) * 20,
            limit: 20,
          };

          const result = await NotificationCenterService.getNotifications(
            user.id,
            params
          );

          set(
            state => ({
              notifications: reset
                ? result.notifications
                : [...state.notifications, ...result.notifications],
              hasMore: result.has_more,
              unreadCount: result.unread_count,
              currentPage: reset ? 2 : state.currentPage + 1,
              loading: false,
              lastFetchTime: Date.now(),
            }),
            false,
            'fetchNotifications:success'
          );
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
          set({ loading: false }, false, 'fetchNotifications:error');
        }
      },

      markAsRead: async (ids: string[]) => {
        // Optimistic update
        const currentState = get();
        set(
          {
            notifications: currentState.notifications.map(notification =>
              ids.includes(notification.id)
                ? {
                    ...notification,
                    is_read: true,
                    read_at: new Date().toISOString(),
                  }
                : notification
            ),
            unreadCount: {
              changelog:
                currentState.unreadCount.changelog -
                ids.filter(id =>
                  currentState.notifications.find(
                    n => n.id === id && n.type === 'changelog' && !n.is_read
                  )
                ).length,
              message:
                currentState.unreadCount.message -
                ids.filter(id =>
                  currentState.notifications.find(
                    n => n.id === id && n.type === 'message' && !n.is_read
                  )
                ).length,
              total: currentState.unreadCount.total - ids.length,
            },
          },
          false,
          'markAsRead:optimistic'
        );

        try {
          const supabase = createClient();
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser();

          if (authError || !user?.id) {
            throw new Error('User not authenticated');
          }

          await NotificationCenterService.markMultipleAsRead(ids, user.id);
        } catch (error) {
          console.error('Failed to mark notifications as read:', error);
          // Revert optimistic update on error
          get().refreshUnreadCount();
        }
      },

      markAllAsRead: async (type?: NotificationType) => {
        const state = get();
        const unreadNotifications = state.notifications.filter(
          n => !n.is_read && (type ? n.type === type : true)
        );

        if (unreadNotifications.length === 0) return;

        const ids = unreadNotifications.map(n => n.id);
        await get().markAsRead(ids);
      },

      refreshUnreadCount: async () => {
        try {
          const supabase = createClient();
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser();

          if (authError || !user?.id) {
            throw new Error('User not authenticated');
          }

          const unreadCount = await NotificationCenterService.getUnreadCount(
            user.id
          );
          set({ unreadCount }, false, 'refreshUnreadCount');
        } catch (error) {
          console.error('Failed to refresh unread count:', error);
        }
      },

      loadMore: async () => {
        const state = get();
        if (!state.hasMore || state.loading) return;

        const type =
          state.activeTab === 'all'
            ? undefined
            : (state.activeTab as NotificationType);
        await state.fetchNotifications(type, false);
      },

      createNotification: async (data: Partial<CreateNotificationData>) => {
        try {
          const supabase = createClient();
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser();
          if (error || !user?.id) {
            throw new Error('User not authenticated');
          }

          // Convert partial data to CreateNotificationData format
          const createData: CreateNotificationData = {
            type: (data.type || 'message') as NotificationType,
            category: data.category,
            title: data.title || '',
            content: data.content || '',
            priority: data.priority || 'medium',
            target_roles: data.target_roles || [],
            target_users: data.target_users || [],
            published: data.published ?? true,
            metadata: data.metadata || {},
          };

          const newNotification =
            await NotificationAdminService.createNotification(
              createData,
              user.id
            );

          // Add to local state if successful
          if (newNotification) {
            const notificationWithReadStatus: NotificationWithReadStatus = {
              ...newNotification,
              is_read: false, // New notifications are unread by default
              read_at: null, // New notifications don't have a read timestamp yet
            };
            get()._addNotification(notificationWithReadStatus);
          }

          return newNotification;
        } catch (error) {
          console.error('Failed to create notification:', error);
          return null;
        }
      },

      // Internal methods
      _updateNotification: (id: string, updates: Partial<Notification>) => {
        set(
          state => ({
            notifications: state.notifications.map(notification =>
              notification.id === id
                ? { ...notification, ...updates }
                : notification
            ),
          }),
          false,
          '_updateNotification'
        );
      },

      _addNotification: (notification: NotificationWithReadStatus) => {
        set(
          state => ({
            notifications: [notification, ...state.notifications],
            unreadCount: notification.is_read
              ? state.unreadCount
              : {
                  changelog:
                    state.unreadCount.changelog +
                    (notification.type === 'changelog' ? 1 : 0),
                  message:
                    state.unreadCount.message +
                    (notification.type === 'message' ? 1 : 0),
                  total: state.unreadCount.total + 1,
                },
          }),
          false,
          '_addNotification'
        );
      },

      _removeNotification: (id: string) => {
        set(
          state => {
            const notification = state.notifications.find(n => n.id === id);
            const wasUnread = notification && !notification.is_read;

            return {
              notifications: state.notifications.filter(n => n.id !== id),
              unreadCount: wasUnread
                ? {
                    changelog:
                      state.unreadCount.changelog -
                      (notification.type === 'changelog' ? 1 : 0),
                    message:
                      state.unreadCount.message -
                      (notification.type === 'message' ? 1 : 0),
                    total: state.unreadCount.total - 1,
                  }
                : state.unreadCount,
            };
          },
          false,
          '_removeNotification'
        );
      },

      _resetState: () => {
        set({ ...initialState }, false, '_resetState');
      },
    }),
    {
      name: 'notification-center-store',
      version: 1,
    }
  )
);

// Selector hooks for performance optimization
export const useNotificationCenterOpen = () =>
  useNotificationCenter(state => state.isOpen);
export const useNotificationCenterTab = () =>
  useNotificationCenter(state => state.activeTab);
export const useNotificationList = () =>
  useNotificationCenter(state => state.notifications);
export const useUnreadCount = () =>
  useNotificationCenter(state => state.unreadCount);
export const useNotificationLoading = () =>
  useNotificationCenter(state => state.loading);
export const useNotificationOverlayOpen = () =>
  useNotificationCenter(state => state.isOverlayOpen);

// Export types for components
export type { NotificationWithReadStatus };

// Export realtime hook (alias to the notification center hook for compatibility)
export const useNotificationRealtime = useNotificationCenter;
