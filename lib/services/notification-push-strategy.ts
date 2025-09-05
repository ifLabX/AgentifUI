/**
 * Notification Push Strategy Service
 *
 * Implements intelligent push strategies based on notification priority,
 * user preferences, and system context
 */
import { useNotificationCenter } from '../stores/notification-center-store';
import type {
  NotificationAction,
  NotificationType,
} from '../stores/ui/notification-store';
import { useNotificationStore } from '../stores/ui/notification-store';
import type { NotificationCategory } from '../types/notification-center';
import { NotificationArchivingService } from './notification-archiving-service';
import { NotificationBridgeService } from './notification-bridge-service';

export interface PushStrategy {
  /** Strategy name */
  name: string;
  /** Show instant notification bar */
  showInstant: boolean;
  /** Duration for instant notification (ms) */
  instantDuration: number;
  /** Update notification center badge */
  updateBadge: boolean;
  /** Create persistent notification */
  createPersistent: boolean;
  /** Auto-open notification center */
  autoOpenCenter: boolean;
  /** Enable desktop notifications */
  enableDesktop: boolean;
  /** Queue for archiving */
  queueArchive: boolean;
}

export interface NotificationContext {
  /** Current time */
  timestamp: number;
  /** Is user currently active */
  isUserActive: boolean;
  /** Number of unread notifications */
  unreadCount: number;
  /** Is notification center currently open */
  isCenterOpen: boolean;
  /** Time since last notification */
  timeSinceLastNotification: number;
}

export interface PushOptions {
  /** Override automatic strategy selection */
  forceStrategy?: string;
  /** Custom action button */
  action?: NotificationAction;
  /** Category for persistent notifications */
  category?: NotificationCategory;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Target specific users/roles */
  targeting?: {
    users?: string[];
    roles?: string[];
  };
}

/**
 * Service for intelligent notification push strategies
 */
export class NotificationPushStrategyService {
  private static lastNotificationTime = 0;
  private static notificationCount = 0;
  private static isUserActive = true;

  /**
   * Predefined push strategies for different priority levels
   */
  private static readonly PUSH_STRATEGIES: Record<string, PushStrategy> = {
    critical: {
      name: 'critical',
      showInstant: true,
      instantDuration: 10000, // 10 seconds
      updateBadge: true,
      createPersistent: true,
      autoOpenCenter: false, // Don't force open, let user decide
      enableDesktop: true,
      queueArchive: true,
    },
    high: {
      name: 'high',
      showInstant: true,
      instantDuration: 7000, // 7 seconds
      updateBadge: true,
      createPersistent: true,
      autoOpenCenter: false,
      enableDesktop: true,
      queueArchive: true,
    },
    medium: {
      name: 'medium',
      showInstant: true,
      instantDuration: 5000, // 5 seconds
      updateBadge: true,
      createPersistent: false, // Only create if explicitly requested
      autoOpenCenter: false,
      enableDesktop: false,
      queueArchive: false,
    },
    low: {
      name: 'low',
      showInstant: false, // Silent update only
      instantDuration: 0,
      updateBadge: true,
      createPersistent: false,
      autoOpenCenter: false,
      enableDesktop: false,
      queueArchive: false,
    },
    silent: {
      name: 'silent',
      showInstant: false,
      instantDuration: 0,
      updateBadge: true,
      createPersistent: false,
      autoOpenCenter: false,
      enableDesktop: false,
      queueArchive: false,
    },
    urgent: {
      name: 'urgent',
      showInstant: true,
      instantDuration: 15000, // 15 seconds
      updateBadge: true,
      createPersistent: true,
      autoOpenCenter: true, // Force open for urgent notifications
      enableDesktop: true,
      queueArchive: true,
    },
  };

  /**
   * Execute notification push with intelligent strategy selection
   */
  static async pushNotification(
    message: string,
    type: NotificationType = 'info',
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    options: PushOptions = {}
  ) {
    const context = this.getNotificationContext();
    const strategy = options.forceStrategy
      ? this.PUSH_STRATEGIES[options.forceStrategy]
      : this.selectStrategy(priority, type, context);

    if (!strategy) {
      console.warn(`No push strategy found for priority: ${priority}`);
      return;
    }

    console.log(
      `Using push strategy: ${strategy.name} for notification: ${message}`
    );

    try {
      // Execute the push strategy
      await this.executeStrategy(
        strategy,
        message,
        type,
        priority,
        options,
        context
      );

      // Update tracking
      this.updateNotificationTracking();
    } catch (error) {
      console.error('Failed to execute push strategy:', error);
      // Fallback to simple instant notification
      this.fallbackNotification(message, type);
    }
  }

  /**
   * Execute a specific push strategy
   */
  private static async executeStrategy(
    strategy: PushStrategy,
    message: string,
    type: NotificationType,
    priority: 'low' | 'medium' | 'high' | 'critical',
    options: PushOptions,
    context: NotificationContext
  ) {
    const tasks: Promise<void>[] = [];

    // 1. Show instant notification if required
    if (strategy.showInstant) {
      tasks.push(
        this.showInstantNotification(
          message,
          type,
          strategy.instantDuration,
          options.action
        )
      );
    }

    // 2. Create persistent notification if required
    if (strategy.createPersistent) {
      tasks.push(
        this.createPersistentNotification(message, type, priority, options)
      );
    }

    // 3. Update badge count (always execute if required)
    if (strategy.updateBadge) {
      tasks.push(this.updateBadgeCount());
    }

    // 4. Queue for archiving if required
    if (strategy.queueArchive) {
      NotificationArchivingService.queueForArchiving(
        message,
        type,
        options.category,
        priority
      );
    }

    // Execute all tasks in parallel
    await Promise.allSettled(tasks);

    // 5. Handle special actions after main tasks
    if (strategy.autoOpenCenter && !context.isCenterOpen) {
      this.openNotificationCenter();
    }

    if (strategy.enableDesktop) {
      this.requestDesktopNotificationPermission();
    }
  }

  /**
   * Select appropriate strategy based on context
   */
  private static selectStrategy(
    priority: 'low' | 'medium' | 'high' | 'critical',
    type: NotificationType,
    context: NotificationContext
  ): PushStrategy {
    // Override for critical errors - always use urgent strategy
    if (priority === 'critical' && type === 'error') {
      return this.PUSH_STRATEGIES.urgent;
    }

    // If user is inactive, reduce visibility for non-critical notifications
    if (!context.isUserActive && priority !== 'critical') {
      if (priority === 'high') {
        return this.PUSH_STRATEGIES.medium;
      }
      if (priority === 'medium') {
        return this.PUSH_STRATEGIES.low;
      }
      if (priority === 'low') {
        return this.PUSH_STRATEGIES.silent;
      }
    }

    // If center is open, reduce instant notifications to avoid noise
    if (context.isCenterOpen && priority !== 'critical') {
      return this.PUSH_STRATEGIES.silent;
    }

    // Too many recent notifications - reduce noise
    if (
      context.timeSinceLastNotification < 2000 &&
      this.notificationCount > 3
    ) {
      if (priority !== 'critical') {
        return this.PUSH_STRATEGIES.silent;
      }
    }

    // Default strategy selection
    return this.PUSH_STRATEGIES[priority] || this.PUSH_STRATEGIES.medium;
  }

  /**
   * Get current notification context
   */
  private static getNotificationContext(): NotificationContext {
    const now = Date.now();
    const { isOpen } = useNotificationCenter.getState();
    const { unreadCount } = useNotificationCenter.getState();

    return {
      timestamp: now,
      isUserActive: this.isUserActive,
      unreadCount: unreadCount.total,
      isCenterOpen: isOpen,
      timeSinceLastNotification: now - this.lastNotificationTime,
    };
  }

  /**
   * Show instant notification
   */
  private static async showInstantNotification(
    message: string,
    type: NotificationType,
    duration: number,
    action?: NotificationAction
  ): Promise<void> {
    return new Promise(resolve => {
      useNotificationStore
        .getState()
        .showNotification(message, type, duration, action);
      resolve();
    });
  }

  /**
   * Create persistent notification
   */
  private static async createPersistentNotification(
    message: string,
    type: NotificationType,
    priority: 'low' | 'medium' | 'high' | 'critical',
    options: PushOptions
  ): Promise<void> {
    try {
      await NotificationBridgeService.createNotificationWithAlert(
        {
          type: 'message',
          category:
            options.category ||
            (this.getDefaultCategory(type, priority) as NotificationCategory),
          title: message,
          content: (options.metadata?.content as string) || message,
          priority,
        },
        undefined, // No additional instant message
        type
      );
    } catch (error) {
      console.error('Failed to create persistent notification:', error);
    }
  }

  /**
   * Update badge count
   */
  private static async updateBadgeCount(): Promise<void> {
    try {
      const { refreshUnreadCount } = useNotificationCenter.getState();
      await refreshUnreadCount();
    } catch (error) {
      console.error('Failed to update badge count:', error);
    }
  }

  /**
   * Open notification center
   */
  private static openNotificationCenter() {
    const { openCenter } = useNotificationCenter.getState();
    openCenter();
  }

  /**
   * Request desktop notification permission
   */
  private static requestDesktopNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Desktop notification permission:', permission);
      });
    }
  }

  /**
   * Fallback notification for error cases
   */
  private static fallbackNotification(message: string, type: NotificationType) {
    useNotificationStore.getState().showNotification(message, type, 3000);
  }

  /**
   * Update notification tracking
   */
  private static updateNotificationTracking() {
    this.lastNotificationTime = Date.now();
    this.notificationCount++;

    // Reset count after 1 minute
    setTimeout(() => {
      this.notificationCount = Math.max(0, this.notificationCount - 1);
    }, 60000);
  }

  /**
   * Get default category based on type and priority
   */
  private static getDefaultCategory(
    type: NotificationType,
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): string {
    if (type === 'error') {
      return priority === 'critical' ? 'security_alert' : 'system_maintenance';
    }
    if (type === 'warning') {
      return 'system_maintenance';
    }
    if (type === 'success') {
      return 'feature_tip';
    }
    return 'feature_tip';
  }

  /**
   * Set user activity status
   */
  static setUserActivity(isActive: boolean) {
    this.isUserActive = isActive;
  }

  /**
   * Get current strategy statistics
   */
  static getStatistics() {
    return {
      lastNotificationTime: this.lastNotificationTime,
      notificationCount: this.notificationCount,
      isUserActive: this.isUserActive,
      availableStrategies: Object.keys(this.PUSH_STRATEGIES),
    };
  }

  /**
   * Update strategy configuration
   */
  static updateStrategy(name: string, updates: Partial<PushStrategy>) {
    if (this.PUSH_STRATEGIES[name]) {
      this.PUSH_STRATEGIES[name] = {
        ...this.PUSH_STRATEGIES[name],
        ...updates,
      };
      console.log(`Updated push strategy ${name}:`, updates);
    }
  }
}

// Track user activity for better strategy selection
if (typeof window !== 'undefined') {
  let activityTimer: NodeJS.Timeout;

  const resetActivityTimer = () => {
    NotificationPushStrategyService.setUserActivity(true);
    clearTimeout(activityTimer);
    activityTimer = setTimeout(() => {
      NotificationPushStrategyService.setUserActivity(false);
    }, 300000); // 5 minutes of inactivity
  };

  // Listen for user activity
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(
    event => {
      window.addEventListener(event, resetActivityTimer, { passive: true });
    }
  );

  // Initialize as active
  resetActivityTimer();
}

export default NotificationPushStrategyService;
