/**
 * Notification Archiving Service
 *
 * Handles automatic archiving of important instant notifications
 * to the persistent notification center
 */
import type { NotificationType } from '../stores/ui/notification-store';
import type { NotificationCategory } from '../types/notification-center';
import { NotificationBridgeService } from './notification-bridge-service';

export interface ArchiveRule {
  /** Notification type that should be archived */
  type: NotificationType;
  /** Minimum duration the notification should be shown before archiving */
  minDuration: number;
  /** Whether to archive this type automatically */
  autoArchive: boolean;
  /** Category to assign when archiving */
  defaultCategory: NotificationCategory;
  /** Priority to assign when archiving */
  defaultPriority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ArchiveQueue {
  /** Original notification message */
  message: string;
  /** Notification type */
  type: NotificationType;
  /** Timestamp when notification was shown */
  timestamp: number;
  /** Category for archiving */
  category?: NotificationCategory;
  /** Custom priority override */
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Service for automatically archiving notifications
 */
export class NotificationArchivingService {
  private static archiveQueue: ArchiveQueue[] = [];
  private static archiveTimer: NodeJS.Timeout | null = null;
  private static isInitialized = false;

  /**
   * Default archiving rules for different notification types
   */
  private static readonly DEFAULT_RULES: Record<NotificationType, ArchiveRule> =
    {
      error: {
        type: 'error',
        minDuration: 5000, // 5 seconds
        autoArchive: true,
        defaultCategory: 'security_alert',
        defaultPriority: 'high',
      },
      warning: {
        type: 'warning',
        minDuration: 3000, // 3 seconds
        autoArchive: true,
        defaultCategory: 'system_maintenance',
        defaultPriority: 'medium',
      },
      info: {
        type: 'info',
        minDuration: 0, // Archive immediately if requested
        autoArchive: false, // Don't auto-archive info messages
        defaultCategory: 'feature_tip',
        defaultPriority: 'low',
      },
      success: {
        type: 'success',
        minDuration: 0,
        autoArchive: false, // Don't auto-archive success messages
        defaultCategory: 'feature_tip',
        defaultPriority: 'low',
      },
    };

  /**
   * Initialize the archiving service
   */
  static initialize() {
    if (this.isInitialized) return;

    // Set up periodic processing of archive queue
    this.archiveTimer = setInterval(() => {
      this.processArchiveQueue();
    }, 10000); // Process every 10 seconds

    this.isInitialized = true;
    console.log('Notification archiving service initialized');
  }

  /**
   * Cleanup the archiving service
   */
  static cleanup() {
    if (this.archiveTimer) {
      clearInterval(this.archiveTimer);
      this.archiveTimer = null;
    }
    this.archiveQueue = [];
    this.isInitialized = false;
  }

  /**
   * Queue a notification for potential archiving
   */
  static queueForArchiving(
    message: string,
    type: NotificationType,
    category?: NotificationCategory,
    priority?: 'low' | 'medium' | 'high' | 'critical'
  ) {
    const rule = this.DEFAULT_RULES[type];

    // Only queue if auto-archiving is enabled for this type
    if (!rule.autoArchive) return;

    const archiveItem: ArchiveQueue = {
      message,
      type,
      timestamp: Date.now(),
      category: category || rule.defaultCategory,
      priority: priority || rule.defaultPriority,
    };

    this.archiveQueue.push(archiveItem);
    console.log(`Queued notification for archiving: ${message}`);
  }

  /**
   * Manually archive a specific notification
   */
  static async manualArchive(
    message: string,
    type: NotificationType,
    category?: NotificationCategory,
    priority?: 'low' | 'medium' | 'high' | 'critical'
  ) {
    const rule = this.DEFAULT_RULES[type];

    try {
      await NotificationBridgeService.createNotificationWithAlert(
        {
          type: 'message',
          category: category || rule.defaultCategory,
          title: this.generateArchiveTitle(type),
          content: message,
          priority: priority || rule.defaultPriority,
        },
        undefined, // No instant message for manual archive
        type
      );

      console.log(`Manually archived notification: ${message}`);
    } catch (error) {
      console.error('Failed to manually archive notification:', error);
    }
  }

  /**
   * Process the archive queue
   */
  private static async processArchiveQueue() {
    if (this.archiveQueue.length === 0) return;

    const now = Date.now();
    const itemsToArchive: ArchiveQueue[] = [];
    const remainingItems: ArchiveQueue[] = [];

    // Separate items that are ready for archiving
    for (const item of this.archiveQueue) {
      const rule = this.DEFAULT_RULES[item.type];
      const elapsed = now - item.timestamp;

      if (elapsed >= rule.minDuration) {
        itemsToArchive.push(item);
      } else {
        remainingItems.push(item);
      }
    }

    // Update the queue with remaining items
    this.archiveQueue = remainingItems;

    // Archive the ready items
    for (const item of itemsToArchive) {
      try {
        await this.archiveNotification(item);
      } catch (error) {
        console.error('Failed to archive notification:', error);
      }
    }

    if (itemsToArchive.length > 0) {
      console.log(
        `Processed ${itemsToArchive.length} notifications for archiving`
      );
    }
  }

  /**
   * Archive a single notification
   */
  private static async archiveNotification(item: ArchiveQueue) {
    try {
      // Create persistent notification without showing instant alert
      const { createNotification } = await import(
        '../stores/notification-center-store'
      ).then(module => ({
        createNotification:
          module.useNotificationCenter.getState().createNotification,
      }));

      await createNotification({
        type: 'message',
        category: item.category,
        title: this.generateArchiveTitle(item.type),
        content: item.message,
        priority: item.priority,
        published: true,
        target_roles: [],
        target_users: [],
        metadata: {
          archived: true,
          original_type: item.type,
          archived_at: new Date().toISOString(),
        },
      });

      console.log(`Archived notification: ${item.message}`);
    } catch (error) {
      console.error('Failed to archive notification:', item.message, error);
    }
  }

  /**
   * Generate appropriate title for archived notification
   */
  private static generateArchiveTitle(type: NotificationType): string {
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    switch (type) {
      case 'error':
        return `System Error Record - ${timestamp}`;
      case 'warning':
        return `System Warning Record - ${timestamp}`;
      case 'info':
        return `System Information Record - ${timestamp}`;
      case 'success':
        return `Operation Success Record - ${timestamp}`;
      default:
        return `System Notification Record - ${timestamp}`;
    }
  }

  /**
   * Get current queue status
   */
  static getQueueStatus() {
    return {
      queueLength: this.archiveQueue.length,
      isInitialized: this.isInitialized,
      nextProcessTime: this.archiveTimer ? 10000 : null,
    };
  }

  /**
   * Clear the archive queue
   */
  static clearQueue() {
    this.archiveQueue = [];
    console.log('Archive queue cleared');
  }

  /**
   * Update archiving rules (for future extensibility)
   */
  static updateArchiveRule(
    type: NotificationType,
    updates: Partial<ArchiveRule>
  ) {
    if (this.DEFAULT_RULES[type]) {
      this.DEFAULT_RULES[type] = {
        ...this.DEFAULT_RULES[type],
        ...updates,
      };
      console.log(`Updated archive rule for ${type}:`, updates);
    }
  }
}

// Auto-initialize when imported (can be disabled if needed)
if (typeof window !== 'undefined') {
  // Only initialize in browser environment
  NotificationArchivingService.initialize();
}

export default NotificationArchivingService;
