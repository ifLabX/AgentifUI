/**
 * Notification Bridge Service
 *
 * Provides intelligent linking between NotificationBar (instant feedback)
 * and NotificationCenter (persistent notifications)
 */
import { useNotificationCenter } from '../stores/notification-center-store';
import type {
  NotificationAction,
  NotificationType,
} from '../stores/ui/notification-store';
import { useNotificationStore } from '../stores/ui/notification-store';
import type { NotificationCategory } from '../types/notification-center';

export interface NotificationWithAction {
  message: string;
  type: NotificationType;
  duration?: number;
  action?: NotificationAction;
}

export interface PersistentNotificationData {
  id?: string;
  type: 'changelog' | 'message';
  category?: NotificationCategory;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Service for coordinating between NotificationBar and NotificationCenter
 */
export class NotificationBridgeService {
  /**
   * Show instant notification with optional link to notification center
   */
  static showNotificationWithCenter(
    message: string,
    type: NotificationType = 'info',
    duration: number = 5000,
    persistentNotificationId?: string
  ) {
    const action: NotificationAction = {
      text: 'View Details',
      handler: () => {
        this.openNotificationCenter('message', persistentNotificationId);
      },
      variant: 'primary',
    };

    useNotificationStore
      .getState()
      .showNotification(message, type, duration, action);
  }

  /**
   * Create persistent notification and show instant alert
   */
  static async createNotificationWithAlert(
    persistentData: PersistentNotificationData,
    instantMessage?: string,
    instantType: NotificationType = 'info'
  ) {
    try {
      // Create persistent notification first
      const { createNotification } = useNotificationCenter.getState();
      const notification = await createNotification({
        type: persistentData.type,
        category: persistentData.category,
        title: persistentData.title,
        content: persistentData.content,
        priority: persistentData.priority,
        published: true,
        target_roles: [],
        target_users: [],
        metadata: {},
      });

      if (!notification) {
        throw new Error('Failed to create persistent notification');
      }

      // Show instant notification with link to center
      const message = instantMessage || persistentData.title;
      this.showNotificationWithCenter(
        message,
        instantType,
        this.getDurationByPriority(persistentData.priority),
        notification.id
      );

      return notification;
    } catch (error) {
      console.error('Failed to create notification with alert:', error);
      // Fallback to just instant notification
      useNotificationStore
        .getState()
        .showNotification(
          instantMessage || persistentData.title,
          'error',
          3000
        );
      throw error;
    }
  }

  /**
   * Show critical alert that requires immediate attention
   */
  static showCriticalAlert(title: string, content: string, category?: string) {
    const persistentData: PersistentNotificationData = {
      type: 'message',
      category: (category as NotificationCategory) || 'security_alert',
      title,
      content,
      priority: 'critical',
    };

    this.createNotificationWithAlert(persistentData, title, 'error');
  }

  /**
   * Show system maintenance notice
   */
  static showMaintenanceNotice(
    title: string,
    content: string,
    scheduledTime?: string
  ) {
    const persistentData: PersistentNotificationData = {
      type: 'message',
      category: 'system_maintenance',
      title,
      content,
      priority: 'high',
    };

    this.createNotificationWithAlert(
      persistentData,
      `${title}${scheduledTime ? ` - ${scheduledTime}` : ''}`,
      'warning'
    );
  }

  /**
   * Show feature announcement
   */
  static showFeatureAnnouncement(
    title: string,
    content: string,
    category: string = 'feature'
  ) {
    const persistentData: PersistentNotificationData = {
      type: 'changelog',
      category: category as NotificationCategory,
      title,
      content,
      priority: 'medium',
    };

    this.createNotificationWithAlert(
      persistentData,
      `New Feature: ${title}`,
      'info'
    );
  }

  /**
   * Show agent execution result
   */
  static showAgentResult(
    agentName: string,
    success: boolean,
    details: string,
    duration?: string
  ) {
    const title = `Agent Execution ${success ? 'Completed' : 'Failed'}`;
    const content = `Agent "${agentName}" ${success ? 'executed successfully' : 'execution failed'}${duration ? `, took ${duration}` : ''}.\n\nDetails: ${details}`;

    const persistentData: PersistentNotificationData = {
      type: 'message',
      category: 'agent_result',
      title,
      content,
      priority: success ? 'low' : 'medium',
    };

    this.createNotificationWithAlert(
      persistentData,
      title,
      success ? 'success' : 'error'
    );
  }

  /**
   * Show token usage warning
   */
  static showTokenWarning(
    currentUsage: number,
    limit: number,
    percentage: number
  ) {
    const title = 'Token Usage Warning';
    const content = `Your token usage has reached ${percentage}% (${currentUsage}/${limit}). Please control your usage to avoid service interruption.`;

    const persistentData: PersistentNotificationData = {
      type: 'message',
      category: 'token_usage',
      title,
      content,
      priority: percentage >= 90 ? 'high' : 'medium',
    };

    this.createNotificationWithAlert(
      persistentData,
      title,
      percentage >= 90 ? 'error' : 'warning'
    );
  }

  /**
   * Auto-archive important instant notifications
   * This method can be called periodically to convert important instant notifications
   * to persistent ones in the notification center
   */
  static autoArchiveNotification(
    message: string,
    type: NotificationType,
    category?: string
  ) {
    // Only archive warnings and errors, not success/info messages
    if (type !== 'warning' && type !== 'error') {
      return;
    }

    const persistentData: PersistentNotificationData = {
      type: 'message',
      category: (category as NotificationCategory) || 'system_maintenance',
      title: this.getArchiveTitle(type),
      content: message,
      priority: type === 'error' ? 'high' : 'medium',
    };

    // Create persistent notification without instant alert
    const { createNotification } = useNotificationCenter.getState();
    createNotification(persistentData).catch(error => {
      console.error('Failed to auto-archive notification:', error);
    });
  }

  /**
   * Open notification center with specific tab and notification
   */
  private static openNotificationCenter(
    tab: 'all' | 'changelog' | 'message' = 'all',
    notificationId?: string
  ) {
    const { openCenter, setActiveTab } = useNotificationCenter.getState();

    // Open the notification center
    openCenter();

    // Set the appropriate tab
    setActiveTab(tab);

    // TODO: If notificationId is provided, scroll to and highlight that notification
    // This would require additional implementation in the notification center components
    if (notificationId) {
      // Store the target notification ID for highlighting
      // This can be implemented in Phase 6 when we add search and navigation features
      console.log('Target notification for highlighting:', notificationId);
    }
  }

  /**
   * Get display duration based on priority
   */
  private static getDurationByPriority(priority: string): number {
    switch (priority) {
      case 'critical':
        return 10000; // 10 seconds for critical
      case 'high':
        return 7000; // 7 seconds for high
      case 'medium':
        return 5000; // 5 seconds for medium
      case 'low':
        return 3000; // 3 seconds for low
      default:
        return 5000;
    }
  }

  /**
   * Generate archive title based on notification type
   */
  private static getArchiveTitle(type: NotificationType): string {
    const timestamp = new Date().toLocaleString('en-US');

    switch (type) {
      case 'error':
        return `System Error - ${timestamp}`;
      case 'warning':
        return `System Warning - ${timestamp}`;
      case 'info':
        return `System Information - ${timestamp}`;
      case 'success':
        return `Operation Successful - ${timestamp}`;
      default:
        return `System Notification - ${timestamp}`;
    }
  }
}

// Export convenience functions for easy access
export const {
  showNotificationWithCenter,
  createNotificationWithAlert,
  showCriticalAlert,
  showMaintenanceNotice,
  showFeatureAnnouncement,
  showAgentResult,
  showTokenWarning,
  autoArchiveNotification,
} = NotificationBridgeService;
