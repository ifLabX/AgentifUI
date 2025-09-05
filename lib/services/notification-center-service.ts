/**
 * Notification Center Service Layer
 *
 * Higher-level business logic for the notification center system.
 * Handles complex operations, validation, and coordination between different components.
 */
import {
  canUserAccessNotification,
  createNotification,
  deleteNotification,
  getAllNotificationsForAdmin,
  getNotificationsWithReadStatus,
  getTargetedNotifications,
  getUserUnreadCount,
  getUserUnreadCountByCategory,
  markNotificationAsRead,
  markNotificationsAsRead,
  updateNotification,
} from '@lib/db/notification-center';
import { getUserProfileByIdLegacy as getProfile } from '@lib/db/profiles';
import type {
  CreateNotificationData,
  GetNotificationsParams,
  Notification,
  NotificationListResponse,
  NotificationTemplate,
  NotificationType,
  NotificationWithReadStatus,
  UnreadCount,
  UpdateNotificationData,
  UserRole,
} from '@lib/types/notification-center';

// ============================================================================
// Public User Operations
// ============================================================================

export class NotificationCenterService {
  /**
   * Get notifications for a user with read status and filtering
   */
  static async getNotifications(
    userId: string,
    params: GetNotificationsParams = {}
  ): Promise<NotificationListResponse> {
    // Get user profile for role-based filtering
    const profile = await getProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    // Fetch notifications with read status
    const { notifications, total_count } = await getNotificationsWithReadStatus(
      userId,
      params
    );

    // Get unread count
    const unreadCount = await getUserUnreadCount(userId, params.type);

    return {
      notifications,
      total_count,
      has_more: (params.offset || 0) + notifications.length < total_count,
      unread_count: unreadCount,
    };
  }

  /**
   * Get targeted notifications for a user based on their role
   */
  static async getTargetedNotifications(
    userId: string,
    userRole: UserRole,
    params: GetNotificationsParams = {}
  ): Promise<NotificationWithReadStatus[]> {
    return await getTargetedNotifications(userId, userRole, params);
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<void> {
    // Verify user has access to this notification
    const profile = await getProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    const hasAccess = await canUserAccessNotification(
      userId,
      profile.role,
      notificationId
    );
    if (!hasAccess) {
      throw new Error('Access denied to notification');
    }

    await markNotificationAsRead(notificationId, userId);
  }

  /**
   * Mark multiple notifications as read
   */
  static async markMultipleAsRead(
    notificationIds: string[],
    userId: string
  ): Promise<number> {
    if (notificationIds.length === 0) {
      return 0;
    }

    // Verify user has access to all notifications
    const profile = await getProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    const accessChecks = await Promise.all(
      notificationIds.map(id =>
        canUserAccessNotification(userId, profile.role, id)
      )
    );

    const inaccessibleIds = notificationIds.filter(
      (_, index) => !accessChecks[index]
    );
    if (inaccessibleIds.length > 0) {
      throw new Error(
        `Access denied to notifications: ${inaccessibleIds.join(', ')}`
      );
    }

    return await markNotificationsAsRead(notificationIds, userId);
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(
    userId: string,
    type?: NotificationType
  ): Promise<UnreadCount> {
    return await getUserUnreadCount(userId, type);
  }

  /**
   * Get unread count breakdown by category
   */
  static async getUnreadCountByCategory(
    userId: string
  ): Promise<Record<string, number>> {
    return await getUserUnreadCountByCategory(userId);
  }

  /**
   * Check if user can access a specific notification
   */
  static async canUserAccess(
    userId: string,
    notificationId: string
  ): Promise<boolean> {
    const profile = await getProfile(userId);
    if (!profile) {
      return false;
    }

    return await canUserAccessNotification(
      userId,
      profile.role,
      notificationId
    );
  }
}

// ============================================================================
// Admin Management Operations
// ============================================================================

export class NotificationAdminService {
  /**
   * Verify user has admin permissions
   */
  private static async verifyAdminPermissions(userId: string): Promise<void> {
    const profile = await getProfile(userId);
    if (!profile || profile.role !== 'admin') {
      throw new Error('Insufficient permissions. Admin role required.');
    }
  }

  /**
   * Verify user has manager or admin permissions
   */
  private static async verifyManagerPermissions(userId: string): Promise<void> {
    const profile = await getProfile(userId);
    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      throw new Error(
        'Insufficient permissions. Admin or manager role required.'
      );
    }
  }

  /**
   * Get all notifications for admin management
   */
  static async getAllNotifications(
    userId: string,
    params: GetNotificationsParams = {}
  ): Promise<{
    notifications: Notification[];
    total_count: number;
    has_more: boolean;
  }> {
    await this.verifyAdminPermissions(userId);

    const { notifications, total_count } =
      await getAllNotificationsForAdmin(params);

    return {
      notifications,
      total_count,
      has_more: (params.offset || 0) + notifications.length < total_count,
    };
  }

  /**
   * Create a new notification
   */
  static async createNotification(
    data: CreateNotificationData,
    createdBy: string
  ): Promise<Notification> {
    await this.verifyManagerPermissions(createdBy);

    // Validate targeting
    if (data.target_roles && data.target_roles.length > 0) {
      const validRoles: UserRole[] = ['admin', 'manager', 'user'];
      const invalidRoles = data.target_roles.filter(
        role => !validRoles.includes(role)
      );
      if (invalidRoles.length > 0) {
        throw new Error(`Invalid target roles: ${invalidRoles.join(', ')}`);
      }
    }

    return await createNotification(data);
  }

  /**
   * Update an existing notification
   */
  static async updateNotification(
    data: UpdateNotificationData,
    updatedBy: string
  ): Promise<Notification> {
    await this.verifyManagerPermissions(updatedBy);

    // Validate targeting if provided
    if (data.target_roles && data.target_roles.length > 0) {
      const validRoles: UserRole[] = ['admin', 'manager', 'user'];
      const invalidRoles = data.target_roles.filter(
        role => !validRoles.includes(role)
      );
      if (invalidRoles.length > 0) {
        throw new Error(`Invalid target roles: ${invalidRoles.join(', ')}`);
      }
    }

    return await updateNotification(data);
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(
    notificationId: string,
    deletedBy: string
  ): Promise<void> {
    await this.verifyAdminPermissions(deletedBy);
    await deleteNotification(notificationId);
  }

  /**
   * Bulk publish notifications
   */
  static async bulkPublish(
    notificationIds: string[],
    publishedBy: string
  ): Promise<{
    success: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    await this.verifyManagerPermissions(publishedBy);

    const results = {
      success: [] as string[],
      failed: [] as Array<{ id: string; error: string }>,
    };

    for (const id of notificationIds) {
      try {
        await updateNotification({ id, published: true });
        results.success.push(id);
      } catch (error) {
        results.failed.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Bulk unpublish notifications
   */
  static async bulkUnpublish(
    notificationIds: string[],
    unpublishedBy: string
  ): Promise<{
    success: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    await this.verifyManagerPermissions(unpublishedBy);

    const results = {
      success: [] as string[],
      failed: [] as Array<{ id: string; error: string }>,
    };

    for (const id of notificationIds) {
      try {
        await updateNotification({ id, published: false });
        results.success.push(id);
      } catch (error) {
        results.failed.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Bulk delete notifications
   */
  static async bulkDelete(
    notificationIds: string[],
    deletedBy: string
  ): Promise<{
    success: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    await this.verifyAdminPermissions(deletedBy);

    const results = {
      success: [] as string[],
      failed: [] as Array<{ id: string; error: string }>,
    };

    for (const id of notificationIds) {
      try {
        await deleteNotification(id);
        results.success.push(id);
      } catch (error) {
        results.failed.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}

// ============================================================================
// Template-based Notification Creation
// ============================================================================

export class NotificationTemplateService {
  /**
   * Template configuration without hardcoded text
   */
  private static templateConfigs: Record<
    string,
    {
      category: NotificationTemplate['category'];
      priority: NotificationTemplate['priority'];
      metadata: NotificationTemplate['metadata'];
    }
  > = {
    token_warning: {
      category: 'token_usage',
      priority: 'medium',
      metadata: { template: 'token_warning' },
    },
    agent_completed: {
      category: 'agent_result',
      priority: 'low',
      metadata: { template: 'agent_completed' },
    },
    maintenance_notice: {
      category: 'system_maintenance',
      priority: 'high',
      metadata: { template: 'maintenance_notice' },
    },
    security_alert: {
      category: 'security_alert',
      priority: 'critical',
      metadata: { template: 'security_alert' },
    },
    feature_announcement: {
      category: 'feature',
      priority: 'medium',
      metadata: { template: 'feature_announcement' },
    },
  };

  /**
   * Create notification from template with i18n support
   */
  static async createFromTemplate(
    templateName: string,
    variables: Record<string, string>,
    options: {
      targetRoles?: UserRole[];
      targetUsers?: string[];
      published?: boolean;
    },
    createdBy: string,
    t: (key: string, params?: Record<string, string | number>) => string
  ): Promise<Notification> {
    const templateConfig = this.templateConfigs[templateName];
    if (!templateConfig) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Get localized template content
    const title = t(
      `services.notificationTemplates.${templateName}.title`,
      variables
    );
    const content = t(
      `services.notificationTemplates.${templateName}.content`,
      variables
    );

    const notificationData: CreateNotificationData = {
      type: 'message', // Templates are typically for messages
      category: templateConfig.category,
      title,
      content,
      priority: templateConfig.priority,
      target_roles: options.targetRoles || [],
      target_users: options.targetUsers || [],
      published: options.published !== undefined ? options.published : true,
      metadata: {
        ...templateConfig.metadata,
        template_variables: variables,
      },
    };

    return await NotificationAdminService.createNotification(
      notificationData,
      createdBy
    );
  }

  /**
   * Get available template names and configurations
   */
  static getAvailableTemplates(): Record<
    string,
    {
      category: NotificationTemplate['category'];
      priority: NotificationTemplate['priority'];
      metadata: NotificationTemplate['metadata'];
    }
  > {
    return { ...this.templateConfigs };
  }

  /**
   * Get template with localized content
   */
  static getTemplate(
    templateName: string,
    t: (key: string) => string
  ): NotificationTemplate | null {
    const config = this.templateConfigs[templateName];
    if (!config) {
      return null;
    }

    return {
      title: t(`services.notificationTemplates.${templateName}.title`),
      content: t(`services.notificationTemplates.${templateName}.content`),
      category: config.category,
      priority: config.priority,
      metadata: config.metadata,
    };
  }

  /**
   * Add custom template configuration
   */
  static addTemplateConfig(
    name: string,
    config: {
      category: NotificationTemplate['category'];
      priority: NotificationTemplate['priority'];
      metadata: NotificationTemplate['metadata'];
    }
  ): void {
    this.templateConfigs[name] = config;
  }
}
