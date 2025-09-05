'use client';

import { debounce, throttle } from 'lodash';

import { useNotificationBridge } from '../stores/notification-bridge-store';
import { useNotificationCenter } from '../stores/notification-center-store';
import { useNotificationStore } from '../stores/ui/notification-store';
import type {
  Notification,
  NotificationPriority,
  NotificationWithReadStatus,
} from '../types/notification-center';

/**
 * Priority-based notification push strategies
 *
 * Implements intelligent routing based on notification priority
 * and user preferences with performance optimizations
 */
export class NotificationPushService {
  private static instance: NotificationPushService;
  private unreadCountThrottle: ReturnType<typeof throttle>;
  private badgeUpdateDebounce: ReturnType<typeof debounce>;

  private constructor() {
    // Throttle unread count updates to avoid excessive API calls
    this.unreadCountThrottle = throttle(this.updateUnreadCount.bind(this), 500);

    // Debounce badge updates for smooth UI performance
    this.badgeUpdateDebounce = debounce(
      this.updateBadgeDisplay.bind(this),
      200
    );
  }

  static getInstance(): NotificationPushService {
    if (!NotificationPushService.instance) {
      NotificationPushService.instance = new NotificationPushService();
    }
    return NotificationPushService.instance;
  }

  /**
   * Main push notification handler with priority-based routing
   */
  static async pushNotification(
    notification: Notification | NotificationWithReadStatus,
    options: {
      showInBar?: boolean;
      enableSound?: boolean;
      enableDesktopNotification?: boolean;
    } = {}
  ): Promise<void> {
    const service = NotificationPushService.getInstance();
    const { priority } = notification;
    const {
      showInBar = true,
      enableSound = false,
      enableDesktopNotification = false,
    } = options;

    // Convert to NotificationWithReadStatus if needed
    const notificationWithStatus: NotificationWithReadStatus = {
      ...notification,
      is_read: (notification as NotificationWithReadStatus).is_read ?? false,
      read_at: (notification as NotificationWithReadStatus).read_at ?? null,
    };

    try {
      // Route through bridge for intelligent handling
      const bridge = useNotificationBridge.getState();
      bridge.routeNotification(notificationWithStatus, showInBar);

      // Priority-specific handling
      switch (priority) {
        case 'critical':
          await service.handleCriticalPriority(
            notificationWithStatus,
            enableSound,
            enableDesktopNotification
          );
          break;

        case 'high':
          await service.handleHighPriority(
            notificationWithStatus,
            enableDesktopNotification
          );
          break;

        case 'medium':
          service.handleMediumPriority(notificationWithStatus);
          break;

        case 'low':
          service.handleLowPriority(notificationWithStatus);
          break;

        default:
          console.warn('Unknown notification priority:', priority);
          service.handleMediumPriority(notificationWithStatus);
      }

      // Update UI indicators
      service.badgeUpdateDebounce();
      service.unreadCountThrottle();
    } catch (error) {
      console.error('Failed to push notification:', error);
    }
  }

  /**
   * Critical priority: Immediate attention required
   * - Show prominent NotificationBar with action
   * - Desktop notification (if permitted)
   * - Sound alert (if enabled)
   * - Force open notification center
   */
  private async handleCriticalPriority(
    notification: NotificationWithReadStatus,
    enableSound: boolean,
    enableDesktopNotification: boolean
  ): Promise<void> {
    const bridge = useNotificationBridge.getState();

    // Show persistent bar notification with action
    bridge.showNotificationWithAction(
      notification.title,
      'error',
      8000, // 8 seconds
      {
        text: 'View Now',
        handler: () =>
          bridge.openCenterToNotification(notification.id, notification.type),
      }
    );

    // Desktop notification for maximum visibility
    if (enableDesktopNotification) {
      await this.showDesktopNotification(notification, {
        requireInteraction: true,
        badge: '/icons/notification-critical.png',
      });
    }

    // Sound alert for critical items
    if (enableSound) {
      this.playNotificationSound('critical');
    }

    // Auto-open notification center for immediate attention
    setTimeout(() => {
      bridge.openCenterToNotification(notification.id, notification.type);
    }, 1000);
  }

  /**
   * High priority: Important but not urgent
   * - Show NotificationBar with action
   * - Optional desktop notification
   * - Update badge immediately
   */
  private async handleHighPriority(
    notification: NotificationWithReadStatus,
    enableDesktopNotification: boolean
  ): Promise<void> {
    const bridge = useNotificationBridge.getState();

    // Show bar notification with view action
    bridge.showNotificationWithAction(
      notification.title,
      'warning',
      5000, // 5 seconds
      {
        text: 'View Details',
        handler: () =>
          bridge.openCenterToNotification(notification.id, notification.type),
      }
    );

    // Optional desktop notification
    if (enableDesktopNotification) {
      await this.showDesktopNotification(notification);
    }
  }

  /**
   * Medium priority: Standard notification
   * - Brief NotificationBar message
   * - Update badge count
   */
  private handleMediumPriority(notification: NotificationWithReadStatus): void {
    const notificationStore = useNotificationStore.getState();

    // Show brief bar notification
    notificationStore.showNotification(notification.title, 'info', 3000);
  }

  /**
   * Low priority: Silent update
   * - Badge update only
   * - No immediate user interruption
   */
  private handleLowPriority(notification: NotificationWithReadStatus): void {
    // Silent update - only badge count changes
    // No immediate notification bar or popups
    console.info('Low priority notification received:', notification.title);
  }

  /**
   * Show desktop notification if supported and permitted
   */
  private async showDesktopNotification(
    notification: NotificationWithReadStatus,
    options: NotificationOptions = {}
  ): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Desktop notifications not supported');
      return;
    }

    if (window.Notification.permission !== 'granted') {
      console.warn('Desktop notification permission not granted');
      return;
    }

    try {
      const desktopNotification = new window.Notification(notification.title, {
        body:
          notification.content.slice(0, 100) +
          (notification.content.length > 100 ? '...' : ''),
        icon: '/favicon.ico',
        tag: notification.id,
        ...options,
      });

      // Handle notification click
      desktopNotification.onclick = () => {
        const bridge = useNotificationBridge.getState();
        bridge.openCenterToNotification(notification.id, notification.type);
        desktopNotification.close();

        // Focus window if notification was clicked
        if (window) {
          window.focus();
        }
      };

      // Auto-close after delay for non-critical notifications
      if (notification.priority !== 'critical') {
        setTimeout(() => {
          desktopNotification.close();
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to show desktop notification:', error);
    }
  }

  /**
   * Play notification sound based on priority
   */
  private playNotificationSound(priority: NotificationPriority): void {
    // Future implementation: play different sounds for different priorities
    // For now, just log the action
    console.info(`Would play ${priority} priority notification sound`);

    // Example implementation:
    // const audio = new Audio(`/sounds/notification-${priority}.mp3`);
    // audio.volume = 0.5;
    // audio.play().catch(console.error);
  }

  /**
   * Throttled unread count update
   */
  private updateUnreadCount(): void {
    const notificationCenter = useNotificationCenter.getState();
    notificationCenter.refreshUnreadCount();
  }

  /**
   * Debounced badge display update
   */
  private updateBadgeDisplay(): void {
    // This would trigger badge UI updates
    console.debug('Updating notification badge display');
  }

  /**
   * Batch notification processing for performance
   */
  static async pushMultipleNotifications(
    notifications: (Notification | NotificationWithReadStatus)[],
    options: {
      maxConcurrent?: number;
      showInBar?: boolean;
      enableSound?: boolean;
      enableDesktopNotification?: boolean;
    } = {}
  ): Promise<void> {
    const { maxConcurrent = 3, ...pushOptions } = options;

    // Process notifications in batches to avoid overwhelming the user
    const batches = [];
    for (let i = 0; i < notifications.length; i += maxConcurrent) {
      batches.push(notifications.slice(i, i + maxConcurrent));
    }

    for (const batch of batches) {
      const promises = batch.map(notification =>
        NotificationPushService.pushNotification(notification, pushOptions)
      );

      await Promise.all(promises);

      // Brief pause between batches to prevent UI spam
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  /**
   * Emergency notification for system-wide alerts
   */
  static async pushEmergencyNotification(
    title: string,
    content: string,
    options: {
      forceDesktop?: boolean;
      requireAcknowledgment?: boolean;
    } = {}
  ): Promise<void> {
    const { forceDesktop = true, requireAcknowledgment = false } = options;

    const emergencyNotification: NotificationWithReadStatus = {
      id: crypto.randomUUID(),
      type: 'message',
      category: 'security_alert',
      title,
      content,
      priority: 'critical',
      published: true,
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      target_roles: [],
      target_users: [],
      metadata: { emergency: true, requireAcknowledgment },
      is_read: false,
      read_at: null,
    };

    await NotificationPushService.pushNotification(emergencyNotification, {
      showInBar: true,
      enableSound: true,
      enableDesktopNotification: forceDesktop,
    });
  }
}

/**
 * Utility functions for common notification patterns
 */

export const pushAgentNotification = (
  agentName: string,
  success: boolean,
  duration: string,
  details?: string
) => {
  const notification: NotificationWithReadStatus = {
    id: crypto.randomUUID(),
    type: 'message',
    category: 'agent_result',
    title: `Agent "${agentName}" ${success ? 'Execution Completed' : 'Execution Failed'}`,
    content: `Agent "${agentName}" ${success ? 'has been successfully executed' : 'encountered an error during execution'}, took ${duration}.${details ? `\n\nDetails: ${details}` : ''}`,
    priority: success ? 'low' : 'medium',
    published: true,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    target_roles: [],
    target_users: [],
    metadata: { agentName, success, duration },
    is_read: false,
    read_at: null,
  };

  return NotificationPushService.pushNotification(notification);
};

export const pushTokenWarning = (
  currentUsage: number,
  limit: number,
  percentage: number
) => {
  const priority: NotificationPriority =
    percentage >= 90 ? 'high' : percentage >= 75 ? 'medium' : 'low';

  const notification: NotificationWithReadStatus = {
    id: crypto.randomUUID(),
    type: 'message',
    category: 'token_usage',
    title: 'Token Usage Warning',
    content: `Your token usage has reached ${percentage}%, currently using ${currentUsage}/${limit}. Please control your usage to avoid service interruption.`,
    priority,
    published: true,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    target_roles: [],
    target_users: [],
    metadata: { currentUsage, limit, percentage },
    is_read: false,
    read_at: null,
  };

  return NotificationPushService.pushNotification(notification);
};

export const pushMaintenanceNotice = (
  startTime: string,
  endTime: string,
  maintenanceType: string
) => {
  const notification: NotificationWithReadStatus = {
    id: crypto.randomUUID(),
    type: 'message',
    category: 'system_maintenance',
    title: 'System Maintenance Notice',
    content: `System will undergo ${maintenanceType} at ${startTime}, expected to end at ${endTime}. Service interruption may occur during maintenance, please save your work progress in advance.`,
    priority: 'high',
    published: true,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    target_roles: [],
    target_users: [],
    metadata: { startTime, endTime, maintenanceType },
    is_read: false,
    read_at: null,
  };

  return NotificationPushService.pushNotification(notification);
};

export default NotificationPushService;
