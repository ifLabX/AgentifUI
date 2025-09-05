/**
 * Individual Notification API Routes
 *
 * GET /api/notifications/[id] - Get a specific notification
 * PUT /api/notifications/[id] - Update a notification (admin only)
 * DELETE /api/notifications/[id] - Delete a notification (admin only)
 */
import {
  canUserAccessNotification,
  deleteNotification,
  getNotificationById,
  updateNotification,
} from '@lib/db/notification-center';
import { getUserProfileByIdLegacy as getProfile } from '@lib/db/profiles';
import { createAPIClient } from '@lib/supabase/api-client';
import type { UpdateNotificationData } from '@lib/types/notification-center';

import { NextRequest, NextResponse } from 'next/server';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/notifications/[id]
 * Get a specific notification if user has access
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createAPIClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid notification ID format' },
        { status: 400 }
      );
    }

    // Get user profile for role information
    const profile = await getProfile(user.id);
    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user can access this notification
    const hasAccess = await canUserAccessNotification(
      user.id,
      profile.role,
      id
    );
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch the notification
    const notification = await getNotificationById(id);
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/[id]
 * Update a notification (admin/manager only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createAPIClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid notification ID format' },
        { status: 400 }
      );
    }

    // Get user profile to check permissions
    const profile = await getProfile(user.id);
    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin or manager role required.' },
        { status: 403 }
      );
    }

    // Check if notification exists
    const existingNotification = await getNotificationById(id);
    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate type if provided
    if (body.type && !['changelog', 'message'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "changelog" or "message"' },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (
      body.priority &&
      !['low', 'medium', 'high', 'critical'].includes(body.priority)
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid priority. Must be one of: low, medium, high, critical',
        },
        { status: 400 }
      );
    }

    // Validate target_roles if provided
    if (body.target_roles && Array.isArray(body.target_roles)) {
      const validRoles = ['admin', 'manager', 'user'];
      const invalidRoles = body.target_roles.filter(
        (role: string) => !validRoles.includes(role)
      );
      if (invalidRoles.length > 0) {
        return NextResponse.json(
          {
            error: `Invalid roles: ${invalidRoles.join(', ')}. Must be one of: ${validRoles.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    const updateData: UpdateNotificationData = {
      id,
      ...body,
    };

    // Update the notification
    const updatedNotification = await updateNotification(updateData);

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createAPIClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid notification ID format' },
        { status: 400 }
      );
    }

    // Get user profile to check permissions (only admins can delete)
    const profile = await getProfile(user.id);
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin role required.' },
        { status: 403 }
      );
    }

    // Check if notification exists
    const existingNotification = await getNotificationById(id);
    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Delete the notification
    await deleteNotification(id);

    return NextResponse.json(
      { message: 'Notification deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
