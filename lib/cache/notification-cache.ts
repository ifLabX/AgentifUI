'use client';

import type {
  NotificationWithReadStatus,
  UnreadCount,
} from '../types/notification-center';

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PaginationInfo {
  page: number;
  hasMore: boolean;
  total?: number;
}

interface CachedNotificationList {
  notifications: NotificationWithReadStatus[];
  pagination: PaginationInfo;
}

/**
 * High-performance cache system for notifications with TTL support
 *
 * Features:
 * - TTL-based expiration with configurable timeouts
 * - Pattern-based cache invalidation
 * - Pagination-aware caching
 * - Memory usage optimization
 * - Type-safe cache operations
 */
export class NotificationCache {
  private static cache = new Map<string, CacheEntry>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 100; // Prevent memory bloat

  /**
   * Cache configuration constants
   */
  static readonly TTL = {
    NOTIFICATIONS: 5 * 60 * 1000, // 5 minutes for notification lists
    UNREAD_COUNT: 30 * 1000, // 30 seconds for unread counts
    USER_PREFERENCES: 10 * 60 * 1000, // 10 minutes for user preferences
    METADATA: 15 * 60 * 1000, // 15 minutes for metadata
  };

  /**
   * Generate cache key for notification queries
   */
  static generateKey(
    type: 'notifications' | 'unread-count' | 'user-preferences',
    params: Record<string, unknown> = {}
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = params[key];
          return result;
        },
        {} as Record<string, unknown>
      );

    return `${type}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Get cached data if not expired
   */
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry with TTL
   */
  static set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Check if cache entry exists and is valid
   */
  static has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalidate cache entries by pattern
   */
  static invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Specialized methods for notification caching
   */

  /**
   * Cache notification list with pagination info
   */
  static setNotifications(
    type: 'all' | 'changelog' | 'message' | undefined,
    page: number,
    notifications: NotificationWithReadStatus[],
    hasMore: boolean,
    total?: number
  ): void {
    const key = this.generateKey('notifications', { type, page });
    const data: CachedNotificationList = {
      notifications,
      pagination: { page, hasMore, total },
    };

    this.set(key, data, this.TTL.NOTIFICATIONS);
  }

  /**
   * Get cached notification list
   */
  static getNotifications(
    type: 'all' | 'changelog' | 'message' | undefined,
    page: number
  ): CachedNotificationList | null {
    const key = this.generateKey('notifications', { type, page });
    return this.get<CachedNotificationList>(key);
  }

  /**
   * Cache unread count
   */
  static setUnreadCount(userId: string, unreadCount: UnreadCount): void {
    const key = this.generateKey('unread-count', { userId });
    this.set(key, unreadCount, this.TTL.UNREAD_COUNT);
  }

  /**
   * Get cached unread count
   */
  static getUnreadCount(userId: string): UnreadCount | null {
    const key = this.generateKey('unread-count', { userId });
    return this.get<UnreadCount>(key);
  }

  /**
   * Update cached notification (mark as read, etc.)
   */
  static updateNotification(
    notificationId: string,
    updates: Partial<NotificationWithReadStatus>
  ): void {
    // Update all cached notification lists that contain this notification
    this.cache.forEach((entry, key) => {
      if (key.startsWith('notifications:')) {
        const cachedData = entry.data as CachedNotificationList;
        const notificationIndex = cachedData.notifications.findIndex(
          n => n.id === notificationId
        );

        if (notificationIndex !== -1) {
          // Create updated cache entry
          const updatedNotifications = [...cachedData.notifications];
          updatedNotifications[notificationIndex] = {
            ...updatedNotifications[notificationIndex],
            ...updates,
          };

          const updatedData: CachedNotificationList = {
            ...cachedData,
            notifications: updatedNotifications,
          };

          // Update the cache entry
          this.cache.set(key, {
            ...entry,
            data: updatedData,
          });
        }
      }
    });
  }

  /**
   * Add new notification to relevant cached lists
   */
  static addNotification(notification: NotificationWithReadStatus): void {
    this.cache.forEach((entry, key) => {
      if (key.startsWith('notifications:')) {
        const cachedData = entry.data as CachedNotificationList;
        const keyParams = this.parseKey(key);

        // Check if notification should be in this cached list
        if (
          keyParams.type === 'all' ||
          keyParams.type === undefined ||
          keyParams.type === notification.type
        ) {
          // Only add to first page to maintain pagination integrity
          if (keyParams.page === 1) {
            const updatedNotifications = [
              notification,
              ...cachedData.notifications,
            ];

            const updatedData: CachedNotificationList = {
              ...cachedData,
              notifications: updatedNotifications,
            };

            this.cache.set(key, {
              ...entry,
              data: updatedData,
            });
          }
        }
      }
    });
  }

  /**
   * Remove notification from all cached lists
   */
  static removeNotification(notificationId: string): void {
    this.cache.forEach((entry, key) => {
      if (key.startsWith('notifications:')) {
        const cachedData = entry.data as CachedNotificationList;
        const updatedNotifications = cachedData.notifications.filter(
          n => n.id !== notificationId
        );

        if (updatedNotifications.length !== cachedData.notifications.length) {
          const updatedData: CachedNotificationList = {
            ...cachedData,
            notifications: updatedNotifications,
          };

          this.cache.set(key, {
            ...entry,
            data: updatedData,
          });
        }
      }
    });
  }

  /**
   * Cache statistics for monitoring
   */
  static getStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
    memoryUsage: string;
  } {
    let totalMemory = 0;

    this.cache.forEach(entry => {
      // Rough memory usage estimation
      totalMemory += JSON.stringify(entry).length * 2; // Approximate bytes
    });

    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      memoryUsage: `${(totalMemory / 1024).toFixed(2)} KB`,
    };
  }

  /**
   * Private helper methods
   */

  private static evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private static parseKey(key: string): Record<string, unknown> {
    const [, paramsJson] = key.split(':', 2);
    try {
      return JSON.parse(paramsJson);
    } catch {
      return {};
    }
  }

  /**
   * Development/debugging methods
   */

  /**
   * Clear all cache (useful for testing)
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Get all cache keys (useful for debugging)
   */
  static keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Force expire a cache entry
   */
  static expire(key: string): boolean {
    return this.cache.delete(key);
  }
}

export default NotificationCache;
