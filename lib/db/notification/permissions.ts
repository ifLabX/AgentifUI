/**
 * Notification Permissions and Targeting Operations
 *
 * Operations for handling notification access permissions and user targeting.
 */
import type {
  GetNotificationsParams,
  NotificationWithReadStatus,
  UserRole,
} from '@lib/types/notification-center';

import { getNotificationById } from './crud';
import { getNotificationsWithReadStatus } from './queries';

/**
 * Get notifications targeted to a specific user based on roles and direct targeting
 */
export async function getTargetedNotifications(
  userId: string,
  userRole: UserRole,
  params: GetNotificationsParams = {}
): Promise<NotificationWithReadStatus[]> {
  const { notifications } = await getNotificationsWithReadStatus(
    userId,
    params
  );

  return notifications.filter(notification => {
    // Public notifications (no specific targeting)
    if (
      notification.target_roles.length === 0 &&
      notification.target_users.length === 0
    ) {
      return true;
    }

    // Role-based targeting
    if (notification.target_roles.includes(userRole)) {
      return true;
    }

    // User-specific targeting
    if (notification.target_users.includes(userId)) {
      return true;
    }

    return false;
  });
}

/**
 * Check if a user can access a specific notification
 */
export async function canUserAccessNotification(
  userId: string,
  userRole: UserRole,
  notificationId: string
): Promise<boolean> {
  const notification = await getNotificationById(notificationId);

  if (!notification || !notification.published) {
    return false;
  }

  // Public notifications (no specific targeting)
  if (
    notification.target_roles.length === 0 &&
    notification.target_users.length === 0
  ) {
    return true;
  }

  // Role-based targeting
  if (notification.target_roles.includes(userRole)) {
    return true;
  }

  // User-specific targeting
  if (notification.target_users.includes(userId)) {
    return true;
  }

  return false;
}
