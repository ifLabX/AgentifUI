/**
 * Notification Query Operations
 *
 * Complex query operations for retrieving notifications with various filters and joins.
 */
import { createClient } from '@lib/supabase/client';
import type {
  GetNotificationsParams,
  Notification,
  NotificationWithReadStatus,
} from '@lib/types/notification-center';

const supabase = createClient();

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
      notification_reads!left(user_id,read_at)
    `,
      { count: 'estimated' }
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

  // Filter notification_reads by user_id
  query = query.eq('notification_reads.user_id', userId);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get notifications: ${error.message}`);
  }

  // Transform data to include read status
  const notifications: NotificationWithReadStatus[] =
    data?.map(notification => {
      const readRecord =
        notification.notification_reads &&
        notification.notification_reads.length > 0
          ? notification.notification_reads[0]
          : null;

      return {
        ...notification,
        is_read: !!readRecord,
        read_at: readRecord?.read_at || null,
      };
    }) || [];

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
    .select('*', { count: 'estimated' })
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
