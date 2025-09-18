/**
 * Notification CRUD Operations
 *
 * Basic create, read, update, delete operations for notifications.
 */
import { createClient } from '@lib/supabase/client';
import type {
  CreateNotificationData,
  Notification,
  UpdateNotificationData,
} from '@lib/types/notification-center';

const supabase = createClient();

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
