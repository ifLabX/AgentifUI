/**
 * Notification Center Type Definitions
 *
 * TypeScript types for the unified notification system including
 * both changelog and message notifications with read status tracking.
 */
import type { UserRole } from '@lib/types/database';

// Re-export UserRole for convenience
export type { UserRole };

// ============================================================================
// Base Notification Types
// ============================================================================

/**
 * Main notification types supported by the system
 */
export type NotificationType = 'changelog' | 'message';

/**
 * Priority levels for notifications affecting display and push behavior
 */
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * User roles for notification targeting - imported from database types to avoid duplication
 */

// ============================================================================
// Category Definitions
// ============================================================================

/**
 * Message notification categories for different types of system messages
 */
export type MessageCategory =
  | 'admin_announcement' // Administrator announcements
  | 'agent_result' // Agent execution results
  | 'token_usage' // Token usage warnings/alerts
  | 'system_maintenance' // System maintenance notices
  | 'security_alert' // Security-related alerts
  | 'feature_tip'; // Feature tips and hints

/**
 * Changelog notification categories for product updates
 */
export type ChangelogCategory =
  | 'feature' // New features
  | 'improvement' // Enhancements to existing features
  | 'bugfix' // Bug fixes
  | 'security' // Security updates
  | 'api_change'; // API changes

/**
 * Union type for all notification categories
 */
export type NotificationCategory = MessageCategory | ChangelogCategory;

// ============================================================================
// Database Entity Types
// ============================================================================

/**
 * Main notification entity representing a single notification in the database
 */
export interface Notification {
  id: string;
  type: NotificationType;
  category?: NotificationCategory;
  title: string;
  content: string;
  priority: NotificationPriority;
  target_roles: UserRole[];
  target_users: string[];
  published: boolean;
  published_at: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  metadata: Record<string, unknown>;
}

/**
 * Notification read status entity tracking which users have read which notifications
 */
export interface NotificationRead {
  id: string;
  notification_id: string;
  user_id: string;
  read_at: string;
}

/**
 * Extended notification with read status information
 */
export interface NotificationWithReadStatus extends Notification {
  is_read: boolean;
  read_at: string | null;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Parameters for fetching notifications list
 */
export interface GetNotificationsParams {
  type?: NotificationType;
  category?: NotificationCategory;
  limit?: number;
  offset?: number;
  include_read?: boolean;
  priority?: NotificationPriority;
  sort_by?: 'created_at' | 'published_at' | 'priority';
  sort_order?: 'asc' | 'desc';
  search?: string;
}

/**
 * Response structure for notifications list API
 */
export interface NotificationListResponse {
  notifications: NotificationWithReadStatus[];
  total_count: number;
  has_more: boolean;
  unread_count: UnreadCount;
}

/**
 * Unread count structure for different notification types
 */
export interface UnreadCount {
  changelog: number;
  message: number;
  total: number;
}

/**
 * Data required to create a new notification
 */
export interface CreateNotificationData {
  type: NotificationType;
  category?: NotificationCategory;
  title: string;
  content: string;
  priority?: NotificationPriority;
  target_roles?: UserRole[];
  target_users?: string[];
  published?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Data for updating an existing notification
 */
export interface UpdateNotificationData
  extends Partial<CreateNotificationData> {
  id: string;
}

/**
 * Request structure for marking notifications as read
 */
export interface MarkAsReadRequest {
  notification_ids: string[];
}

/**
 * Response structure for mark as read operation
 */
export interface MarkAsReadResponse {
  marked_count: number;
  success: boolean;
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Tab options for the notification center interface
 */
export type NotificationTab = 'all' | 'changelog' | 'message';

/**
 * Filter options for notification display
 */
export interface NotificationFilters {
  type?: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  read_status?: 'all' | 'read' | 'unread';
  date_range?: {
    start: string;
    end: string;
  };
}

/**
 * Sorting options for notifications
 */
export interface NotificationSort {
  field: 'created_at' | 'published_at' | 'priority' | 'title';
  direction: 'asc' | 'desc';
}

/**
 * Pagination state for notification lists
 */
export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for notification bell component
 */
export interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Props for individual notification item component
 */
export interface NotificationItemProps {
  notification: NotificationWithReadStatus;
  onMarkAsRead?: (id: string) => void;
  onAction?: (notification: NotificationWithReadStatus) => void;
  compact?: boolean;
}

/**
 * Props for notification center modal/popup component
 */
export interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: NotificationTab;
  onTabChange?: (tab: NotificationTab) => void;
  maxHeight?: number;
}

/**
 * Props for notification page component
 */
export interface NotificationPageProps {
  initialFilters?: NotificationFilters;
  initialSort?: NotificationSort;
  enableBulkActions?: boolean;
  showFilters?: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Notification with action handler for linking from NotificationBar
 */
export interface NotificationWithAction {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  action?: {
    text: string;
    handler: () => void;
  };
}

/**
 * Template structure for creating common notification types
 */
export interface NotificationTemplate {
  title: string;
  content: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  metadata?: Record<string, unknown>;
}

/**
 * Real-time notification event payload
 */
export interface NotificationRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Notification;
  old?: Notification;
}

/**
 * Notification statistics for admin dashboard
 */
export interface NotificationStats {
  total_notifications: number;
  published_notifications: number;
  draft_notifications: number;
  notifications_by_type: Record<NotificationType, number>;
  notifications_by_priority: Record<NotificationPriority, number>;
  recent_activity: {
    date: string;
    count: number;
  }[];
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error types specific to notification operations
 */
export interface NotificationError {
  code:
    | 'NOTIFICATION_NOT_FOUND'
    | 'INSUFFICIENT_PERMISSIONS'
    | 'INVALID_TARGET'
    | 'VALIDATION_ERROR';
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a category is a message category
 */
export function isMessageCategory(
  category: string
): category is MessageCategory {
  return [
    'admin_announcement',
    'agent_result',
    'token_usage',
    'system_maintenance',
    'security_alert',
    'feature_tip',
  ].includes(category);
}

/**
 * Type guard to check if a category is a changelog category
 */
export function isChangelogCategory(
  category: string
): category is ChangelogCategory {
  return [
    'feature',
    'improvement',
    'bugfix',
    'security',
    'api_change',
  ].includes(category);
}
