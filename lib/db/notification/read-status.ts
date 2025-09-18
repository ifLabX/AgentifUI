/**
 * Notification Read Status Operations
 *
 * Operations for managing notification read status tracking.
 */
import { createClient } from '@lib/supabase/client';
import type { NotificationRead } from '@lib/types/notification-center';

const supabase = createClient();

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
