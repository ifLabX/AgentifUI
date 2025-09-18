/**
 * Notification Unread Count Operations
 *
 * Operations for retrieving unread notification counts and statistics.
 */
import { createClient } from '@lib/supabase/client';
import type {
  NotificationType,
  UnreadCount,
} from '@lib/types/notification-center';

const supabase = createClient();

/**
 * Get unread count for a user using the database function
 */
export async function getUserUnreadCount(
  userId: string,
  type?: NotificationType
): Promise<UnreadCount> {
  // Use the existing get_user_unread_count_by_category function
  const { data, error } = await supabase.rpc(
    'get_user_unread_count_by_category',
    {
      user_uuid: userId,
    }
  );

  if (error) {
    throw new Error(`Failed to get unread count: ${error.message}`);
  }

  // Transform the category-based result to match the UnreadCount shape
  let changelog = 0;
  let message = 0;
  let total = 0;

  if (Array.isArray(data)) {
    data.forEach((row: { category: string; count: number }) => {
      const count = Number(row.count) || 0;

      // Map categories to notification types
      if (
        row.category === 'changelog' ||
        row.category === 'feature' ||
        row.category === 'improvement' ||
        row.category === 'bugfix' ||
        row.category === 'security' ||
        row.category === 'api_change'
      ) {
        changelog += count;
      } else {
        // All other categories are considered message type
        message += count;
      }

      total += count;
    });
  }

  // If a specific type is requested, filter the results
  if (type === 'changelog') {
    return { changelog, message: 0, total: changelog };
  } else if (type === 'message') {
    return { changelog: 0, message, total: message };
  }

  return {
    changelog,
    message,
    total,
  };
}

/**
 * Get detailed unread counts by category for a user using efficient database query
 */
export async function getUserUnreadCountByCategory(userId: string): Promise<{
  [category: string]: number;
}> {
  // Use database function for better performance with large datasets
  const { data, error } = await supabase.rpc(
    'get_user_unread_count_by_category',
    {
      user_uuid: userId,
    }
  );

  if (error) {
    throw new Error(`Failed to get unread count by category: ${error.message}`);
  }

  const categoryCounts: { [category: string]: number } = {};

  // Transform the database result to object format
  data?.forEach((row: { category: string; count: number }) => {
    categoryCounts[row.category || 'uncategorized'] = Number(row.count) || 0;
  });

  return categoryCounts;
}
