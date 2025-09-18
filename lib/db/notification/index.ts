/**
 * Notification Database Access Layer - Unified Exports
 *
 * This module provides a centralized export point for all notification database operations.
 * Import from this file to access any notification database functionality.
 */

// CRUD Operations
export {
  createNotification,
  getNotificationById,
  updateNotification,
  deleteNotification,
} from './crud';

// Query Operations
export {
  getNotificationsWithReadStatus,
  getAllNotificationsForAdmin,
} from './queries';

// Read Status Operations
export {
  markNotificationAsRead,
  markNotificationsAsRead,
  getNotificationReadStatus,
} from './read-status';

// Unread Count Operations
export {
  getUserUnreadCount,
  getUserUnreadCountByCategory,
} from './unread-count';

// Permission & Targeting Operations
export {
  getTargetedNotifications,
  canUserAccessNotification,
} from './permissions';

// Real-time Subscription Operations
export {
  subscribeToNotifications,
  subscribeToReadStatus,
} from './subscriptions';
