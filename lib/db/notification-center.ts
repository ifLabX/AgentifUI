/**
 * Notification Center Database Access Layer
 *
 * Low-level database operations for the notification center system.
 * Handles direct interactions with Supabase for notifications and notification reads.
 */
import { createClient } from '@lib/supabase/client';
import type {
  CreateNotificationData,
  GetNotificationsParams,
  Notification,
  NotificationRead,
  NotificationType,
  NotificationWithReadStatus,
  UnreadCount,
  UpdateNotificationData,
  UserRole,
} from '@lib/types/notification-center';

const supabase = createClient();

// ============================================================================
// Notification CRUD Operations
// ============================================================================

/**
 * Create a new notification in the database
 */
export async function createNotification(
  data: CreateNotificationData
): Promise<Notification> {
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      type: data.type,
      category: data.category,
      title: data.title,
      content: data.content,
      priority: data.priority || 'medium',
      target_roles: data.target_roles || [],
      target_users: data.target_users || [],
      published: data.published || false,
      metadata: data.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }

  return notification;
}

/**
 * Get a single notification by ID
 */
export async function getNotificationById(
  id: string
): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get notification: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing notification
 */
export async function updateNotification(
  data: UpdateNotificationData
): Promise<Notification> {
  const { id, ...updates } = data;

  const { data: notification, error } = await supabase
    .from('notifications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update notification: ${error.message}`);
  }

  return notification;
}

/**
 * Delete a notification by ID
 */
export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete notification: ${error.message}`);
  }
}

// ============================================================================
// Notification Query Operations
// ============================================================================

/**
 * Get notifications with read status for a specific user
 */
export async function getNotificationsWithReadStatus(
  userId: string,
  params: GetNotificationsParams = {}
): Promise<{
  notifications: NotificationWithReadStatus[];
  total_count: number;
}> {
  let query = supabase
    .from('notifications')
    .select(
      `
      *,
      notification_reads!left(read_at)
    `,
      { count: 'exact' }
    )
    .eq('published', true)
    .order(params.sort_by || 'created_at', {
      ascending: params.sort_order === 'asc',
    });

  // Apply filters
  if (params.type) {
    query = query.eq('type', params.type);
  }

  if (params.category) {
    query = query.eq('category', params.category);
  }

  if (params.priority) {
    query = query.eq('priority', params.priority);
  }

  // Apply pagination
  if (params.limit) {
    query = query.limit(params.limit);
  }

  if (params.offset) {
    query = query.range(
      params.offset,
      params.offset + (params.limit || 10) - 1
    );
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get notifications: ${error.message}`);
  }

  // Transform data to include read status
  const notifications: NotificationWithReadStatus[] =
    data?.map(notification => ({
      ...notification,
      is_read:
        notification.notification_reads?.some(
          (read: { read_at: string | null }) => read.read_at !== null
        ) || false,
      read_at:
        notification.notification_reads?.find(
          (read: { read_at: string | null }) => read.read_at !== null
        )?.read_at || null,
    })) || [];

  // Filter by read status if specified
  let filteredNotifications = notifications;
  if (params.include_read === false) {
    filteredNotifications = notifications.filter(n => !n.is_read);
  }

  return {
    notifications: filteredNotifications,
    total_count: count || 0,
  };
}

/**
 * Get all notifications for admin management (without RLS filtering)
 */
export async function getAllNotificationsForAdmin(
  params: GetNotificationsParams = {}
): Promise<{
  notifications: Notification[];
  total_count: number;
}> {
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .order(params.sort_by || 'created_at', {
      ascending: params.sort_order === 'asc',
    });

  // Apply filters
  if (params.type) {
    query = query.eq('type', params.type);
  }

  if (params.category) {
    query = query.eq('category', params.category);
  }

  if (params.priority) {
    query = query.eq('priority', params.priority);
  }

  // Apply pagination
  if (params.limit) {
    query = query.limit(params.limit);
  }

  if (params.offset) {
    query = query.range(
      params.offset,
      params.offset + (params.limit || 10) - 1
    );
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get notifications for admin: ${error.message}`);
  }

  return {
    notifications: data || [],
    total_count: count || 0,
  };
}

// ============================================================================
// Read Status Operations
// ============================================================================

/**
 * Mark a single notification as read for a user
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<NotificationRead> {
  const { data, error } = await supabase
    .from('notification_reads')
    .upsert({
      notification_id: notificationId,
      user_id: userId,
      read_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }

  return data;
}

/**
 * Mark multiple notifications as read for a user
 */
export async function markNotificationsAsRead(
  notificationIds: string[],
  userId: string
): Promise<number> {
  const { data, error } = await supabase.rpc('mark_notifications_read', {
    notification_ids: notificationIds,
    user_uuid: userId,
  });

  if (error) {
    throw new Error(`Failed to mark notifications as read: ${error.message}`);
  }

  return data as number;
}

/**
 * Get read status for a specific notification and user
 */
export async function getNotificationReadStatus(
  notificationId: string,
  userId: string
): Promise<NotificationRead | null> {
  const { data, error } = await supabase
    .from('notification_reads')
    .select('*')
    .eq('notification_id', notificationId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get read status: ${error.message}`);
  }

  return data;
}

// ============================================================================
// Unread Count Operations
// ============================================================================

/**
 * Get unread count for a user using the database function
 */
export async function getUserUnreadCount(
  userId: string,
  type?: NotificationType
): Promise<UnreadCount> {
  const { data, error } = await supabase.rpc('get_user_unread_count', {
    user_uuid: userId,
    notification_type: type || null,
  });

  if (error) {
    throw new Error(`Failed to get unread count: ${error.message}`);
  }

  // The function returns an array with one object
  const result = data?.[0] || {
    changelog_count: 0,
    message_count: 0,
    total_count: 0,
  };

  return {
    changelog: Number(result.changelog_count) || 0,
    message: Number(result.message_count) || 0,
    total: Number(result.total_count) || 0,
  };
}

/**
 * Get detailed unread counts by category for a user
 */
export async function getUserUnreadCountByCategory(userId: string): Promise<{
  [category: string]: number;
}> {
  const { data, error } = await supabase
    .from('notifications')
    .select('category')
    .eq('published', true)
    .not(
      'id',
      'in',
      `(
      SELECT notification_id 
      FROM notification_reads 
      WHERE user_id = '${userId}'
    )`
    );

  if (error) {
    throw new Error(`Failed to get unread count by category: ${error.message}`);
  }

  const categoryCounts: { [category: string]: number } = {};

  data?.forEach(notification => {
    const category = notification.category || 'uncategorized';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  return categoryCounts;
}

// ============================================================================
// Targeting and Permissions
// ============================================================================

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

// ============================================================================
// Real-time Subscriptions
// ============================================================================

/**
 * Subscribe to real-time notification changes
 */
export function subscribeToNotifications(
  userId: string,
  onInsert?: (notification: Notification) => void,
  onUpdate?: (notification: Notification) => void,
  onDelete?: (notification: Notification) => void
) {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `published=eq.true`,
      },
      payload => {
        if (onInsert && payload.new) {
          onInsert(payload.new as Notification);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
      },
      payload => {
        if (onUpdate && payload.new) {
          onUpdate(payload.new as Notification);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications',
      },
      payload => {
        if (onDelete && payload.old) {
          onDelete(payload.old as Notification);
        }
      }
    );

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to real-time read status changes for a user
 */
export function subscribeToReadStatus(
  userId: string,
  onRead?: (read: NotificationRead) => void
) {
  const channel = supabase.channel('notification_reads').on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notification_reads',
      filter: `user_id=eq.${userId}`,
    },
    payload => {
      if (onRead && payload.new) {
        onRead(payload.new as NotificationRead);
      }
    }
  );

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
