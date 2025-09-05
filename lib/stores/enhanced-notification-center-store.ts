import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import NotificationCache from '../cache/notification-cache';
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

type EnhancedActiveTab = 'all' | 'changelog' | 'message';

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  hasMore: boolean;
  total?: number;
}

interface PerformanceMetrics {
  lastFetchTime: number;
  cacheHits: number;
  cacheMisses: number;
  totalRequests: number;
}

interface EnhancedNotificationCenterState {
  // UI State
  isOpen: boolean;
  activeTab: EnhancedActiveTab;

  // Data State
  notifications: NotificationWithReadStatus[];
  unreadCount: UnreadCount;
  loading: boolean;

  // Enhanced pagination
  pagination: PaginationState;

  // Performance metrics
  metrics: PerformanceMetrics;

  // Cache configuration
  cacheEnabled: boolean;
  prefetchThreshold: number; // Items from bottom to start prefetching

  // Actions
  openCenter: () => void;
  closeCenter: () => void;
  setActiveTab: (tab: EnhancedActiveTab) => void;

  // Enhanced data fetching with caching
  fetchNotifications: (
    type?: NotificationType,
    reset?: boolean,
    useCache?: boolean
  ) => Promise<void>;

  // Smart prefetching
  prefetchNextPage: () => Promise<void>;

  // Optimized read operations
  markAsRead: (ids: string[]) => Promise<void>;
  markAllAsRead: (type?: NotificationType) => Promise<void>;
  refreshUnreadCount: (useCache?: boolean) => Promise<void>;

  // Pagination
  loadMore: () => Promise<void>;

  // Performance utilities
  getCacheStats: () => ReturnType<typeof NotificationCache.getStats>;
  clearCache: () => void;
  toggleCache: () => void;

  // Admin operations
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
  _updateMetrics: (type: 'hit' | 'miss') => void;
}

const initialState = {
  isOpen: false,
  activeTab: 'all' as EnhancedActiveTab,
  notifications: [],
  unreadCount: { changelog: 0, message: 0, total: 0 },
  loading: false,
  pagination: {
    currentPage: 1,
    itemsPerPage: 20,
    hasMore: true,
    total: undefined,
  },
  metrics: {
    lastFetchTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
  },
  cacheEnabled: true,
  prefetchThreshold: 5, // Start prefetching when 5 items from bottom
};

export const useEnhancedNotificationCenter =
  create<EnhancedNotificationCenterState>()(
    devtools(
      (set, get) => ({
        ...initialState,

        openCenter: () => {
          set({ isOpen: true }, false, 'openCenter');

          // Auto-refresh unread count when opening
          get().refreshUnreadCount(true);
        },

        closeCenter: () => set({ isOpen: false }, false, 'closeCenter'),

        setActiveTab: (tab: EnhancedActiveTab) => {
          set(
            {
              activeTab: tab,
              pagination: { ...initialState.pagination }, // Reset pagination
            },
            false,
            'setActiveTab'
          );

          // Auto-fetch with cache when switching tabs
          const type = tab === 'all' ? undefined : (tab as NotificationType);
          get().fetchNotifications(type, true, true);
        },

        fetchNotifications: async (
          type?: NotificationType,
          reset = false,
          useCache = true
        ) => {
          const state = get();

          // Prevent concurrent requests for same data
          if (state.loading && !reset) return;

          // Try cache first if enabled
          if (useCache && state.cacheEnabled && reset) {
            const cachedData = NotificationCache.getNotifications(type, 1);

            if (cachedData) {
              set(
                {
                  notifications: cachedData.notifications,
                  pagination: {
                    ...state.pagination,
                    currentPage: 2, // Next page to load
                    hasMore: cachedData.pagination.hasMore,
                    total: cachedData.pagination.total,
                  },
                },
                false,
                'fetchNotifications:cached'
              );

              get()._updateMetrics('hit');
              return;
            }
          }

          set(
            {
              loading: true,
              metrics: {
                ...state.metrics,
                totalRequests: state.metrics.totalRequests + 1,
              },
            },
            false,
            'fetchNotifications:start'
          );

          try {
            // Get current user
            const supabase = createClient();
            const {
              data: { user },
              error,
            } = await supabase.auth.getUser();

            if (error || !user?.id) {
              throw new Error('User not authenticated');
            }

            const page = reset ? 1 : state.pagination.currentPage;
            const params = {
              type,
              offset: (page - 1) * state.pagination.itemsPerPage,
              limit: state.pagination.itemsPerPage,
            };

            const result = await NotificationCenterService.getNotifications(
              user.id,
              params
            );

            const newNotifications = reset
              ? result.notifications
              : [...state.notifications, ...result.notifications];

            // Cache the result for future use
            if (state.cacheEnabled) {
              NotificationCache.setNotifications(
                type,
                page,
                result.notifications,
                result.has_more,
                result.total_count
              );
            }

            set(
              {
                notifications: newNotifications,
                pagination: {
                  ...state.pagination,
                  currentPage: reset ? 2 : state.pagination.currentPage + 1,
                  hasMore: result.has_more,
                  total: result.total_count,
                },
                loading: false,
                metrics: {
                  ...state.metrics,
                  lastFetchTime: Date.now(),
                },
              },
              false,
              'fetchNotifications:success'
            );

            get()._updateMetrics('miss');

            // Auto-prefetch next page if we're near the end
            if (
              result.has_more &&
              newNotifications.length < state.prefetchThreshold * 2
            ) {
              setTimeout(() => get().prefetchNextPage(), 1000);
            }
          } catch (error) {
            console.error('Failed to fetch notifications:', error);
            set({ loading: false }, false, 'fetchNotifications:error');
          }
        },

        prefetchNextPage: async () => {
          const state = get();

          if (!state.pagination.hasMore || state.loading) return;

          // Prefetch in background without updating UI
          try {
            const supabase = createClient();
            const {
              data: { user },
              error,
            } = await supabase.auth.getUser();

            if (error || !user?.id) return;

            const type =
              state.activeTab === 'all'
                ? undefined
                : (state.activeTab as NotificationType);

            const params = {
              type,
              offset:
                (state.pagination.currentPage - 1) *
                state.pagination.itemsPerPage,
              limit: state.pagination.itemsPerPage,
            };

            const result = await NotificationCenterService.getNotifications(
              user.id,
              params
            );

            // Cache prefetched data
            if (state.cacheEnabled) {
              NotificationCache.setNotifications(
                type,
                state.pagination.currentPage,
                result.notifications,
                result.has_more,
                result.total_count
              );
            }

            console.debug(
              'Prefetched page',
              state.pagination.currentPage,
              'with',
              result.notifications.length,
              'items'
            );
          } catch (error) {
            console.error('Prefetch failed:', error);
          }
        },

        loadMore: async () => {
          const state = get();
          if (!state.pagination.hasMore || state.loading) return;

          // Check cache first for next page
          const type =
            state.activeTab === 'all'
              ? undefined
              : (state.activeTab as NotificationType);

          const cachedData = NotificationCache.getNotifications(
            type,
            state.pagination.currentPage
          );

          if (cachedData && state.cacheEnabled) {
            // Load from cache
            set(
              {
                notifications: [
                  ...state.notifications,
                  ...cachedData.notifications,
                ],
                pagination: {
                  ...state.pagination,
                  currentPage: state.pagination.currentPage + 1,
                  hasMore: cachedData.pagination.hasMore,
                  total: cachedData.pagination.total,
                },
              },
              false,
              'loadMore:cached'
            );

            get()._updateMetrics('hit');

            // Start prefetching next page
            setTimeout(() => get().prefetchNextPage(), 500);
          } else {
            // Fetch from server
            await get().fetchNotifications(type, false, false);
          }
        },

        markAsRead: async (ids: string[]) => {
          const currentState = get();

          // Optimistic update
          const updatedNotifications = currentState.notifications.map(
            notification =>
              ids.includes(notification.id)
                ? {
                    ...notification,
                    is_read: true,
                    read_at: new Date().toISOString(),
                  }
                : notification
          );

          // Calculate unread count changes
          const unreadChanges = ids.reduce(
            (acc, id) => {
              const notification = currentState.notifications.find(
                n => n.id === id
              );
              if (notification && !notification.is_read) {
                acc.total += 1;
                if (notification.type === 'changelog') acc.changelog += 1;
                if (notification.type === 'message') acc.message += 1;
              }
              return acc;
            },
            { total: 0, changelog: 0, message: 0 }
          );

          set(
            {
              notifications: updatedNotifications,
              unreadCount: {
                total: Math.max(
                  0,
                  currentState.unreadCount.total - unreadChanges.total
                ),
                changelog: Math.max(
                  0,
                  currentState.unreadCount.changelog - unreadChanges.changelog
                ),
                message: Math.max(
                  0,
                  currentState.unreadCount.message - unreadChanges.message
                ),
              },
            },
            false,
            'markAsRead:optimistic'
          );

          // Update cache with optimistic changes
          if (currentState.cacheEnabled) {
            ids.forEach(id => {
              const updates = {
                is_read: true,
                read_at: new Date().toISOString(),
              };
              NotificationCache.updateNotification(id, updates);
            });
          }

          try {
            const supabase = createClient();
            const {
              data: { user },
              error,
            } = await supabase.auth.getUser();

            if (error || !user?.id) {
              throw new Error('User not authenticated');
            }

            await NotificationCenterService.markMultipleAsRead(ids, user.id);

            // Update cached unread count
            const newUnreadCount =
              await NotificationCenterService.getUnreadCount(user.id);
            if (currentState.cacheEnabled) {
              NotificationCache.setUnreadCount(user.id, newUnreadCount);
            }
          } catch (error) {
            console.error('Failed to mark notifications as read:', error);
            // Revert optimistic update and refresh from server
            get().refreshUnreadCount(false);
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

        refreshUnreadCount: async (useCache = true) => {
          try {
            const supabase = createClient();
            const {
              data: { user },
              error,
            } = await supabase.auth.getUser();

            if (error || !user?.id) {
              throw new Error('User not authenticated');
            }

            // Try cache first
            if (useCache && get().cacheEnabled) {
              const cachedCount = NotificationCache.getUnreadCount(user.id);
              if (cachedCount) {
                set(
                  { unreadCount: cachedCount },
                  false,
                  'refreshUnreadCount:cached'
                );
                get()._updateMetrics('hit');
                return;
              }
            }

            const unreadCount = await NotificationCenterService.getUnreadCount(
              user.id
            );

            set({ unreadCount }, false, 'refreshUnreadCount:server');

            // Cache the result
            if (get().cacheEnabled) {
              NotificationCache.setUnreadCount(user.id, unreadCount);
            }

            get()._updateMetrics('miss');
          } catch (error) {
            console.error('Failed to refresh unread count:', error);
          }
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

            if (newNotification) {
              const notificationWithReadStatus: NotificationWithReadStatus = {
                ...newNotification,
                is_read: false,
                read_at: null,
              };

              get()._addNotification(notificationWithReadStatus);

              // Update cache
              if (get().cacheEnabled) {
                NotificationCache.addNotification(notificationWithReadStatus);
                // Invalidate unread count cache
                NotificationCache.invalidate('unread-count');
              }
            }

            return newNotification;
          } catch (error) {
            console.error('Failed to create notification:', error);
            return null;
          }
        },

        // Performance utilities
        getCacheStats: () => NotificationCache.getStats(),

        clearCache: () => {
          NotificationCache.clear();
          console.info('Notification cache cleared');
        },

        toggleCache: () => {
          set(
            state => ({
              cacheEnabled: !state.cacheEnabled,
            }),
            false,
            'toggleCache'
          );

          console.info('Cache', get().cacheEnabled ? 'enabled' : 'disabled');
        },

        // Internal methods
        _updateNotification: (
          id: string,
          updates: Partial<NotificationWithReadStatus>
        ) => {
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

          // Update cache
          if (get().cacheEnabled) {
            NotificationCache.updateNotification(id, updates);
          }
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

          // Update cache
          if (get().cacheEnabled) {
            NotificationCache.removeNotification(id);
          }
        },

        _resetState: () => {
          set({ ...initialState }, false, '_resetState');
        },

        _updateMetrics: (type: 'hit' | 'miss') => {
          set(
            state => ({
              metrics: {
                ...state.metrics,
                cacheHits:
                  type === 'hit'
                    ? state.metrics.cacheHits + 1
                    : state.metrics.cacheHits,
                cacheMisses:
                  type === 'miss'
                    ? state.metrics.cacheMisses + 1
                    : state.metrics.cacheMisses,
              },
            }),
            false,
            '_updateMetrics'
          );
        },
      }),
      {
        name: 'enhanced-notification-center-store',
        version: 1,
      }
    )
  );

// Optimized selector hooks
export const useEnhancedNotificationCenterOpen = () =>
  useEnhancedNotificationCenter(state => state.isOpen);

export const useEnhancedNotificationCenterTab = () =>
  useEnhancedNotificationCenter(state => state.activeTab);

export const useEnhancedNotificationList = () =>
  useEnhancedNotificationCenter(state => state.notifications);

export const useEnhancedUnreadCount = () =>
  useEnhancedNotificationCenter(state => state.unreadCount);

export const useEnhancedNotificationLoading = () =>
  useEnhancedNotificationCenter(state => state.loading);

export const useEnhancedNotificationPagination = () =>
  useEnhancedNotificationCenter(state => state.pagination);

export const useEnhancedNotificationMetrics = () =>
  useEnhancedNotificationCenter(state => state.metrics);

// Performance monitoring hook
export const useNotificationPerformance = () => {
  const metrics = useEnhancedNotificationMetrics();
  const cacheStats = useEnhancedNotificationCenter(state =>
    state.getCacheStats()
  );

  return {
    ...metrics,
    cache: cacheStats,
    hitRate:
      metrics.totalRequests > 0
        ? ((metrics.cacheHits / metrics.totalRequests) * 100).toFixed(1) + '%'
        : '0%',
  };
};

export type {
  EnhancedActiveTab,
  PaginationState,
  PerformanceMetrics,
  EnhancedNotificationCenterState,
};
