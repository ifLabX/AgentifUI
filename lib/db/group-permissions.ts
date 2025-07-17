import { createClient } from '@lib/supabase/client';
import { Result, failure, success } from '@lib/types/result';

// Group permission management service
// Only administrators can manage groups and permissions
export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
  user?: {
    id: string;
    username: string | null;
    full_name: string | null;
    email: string | null;
  };
}

export interface GroupAppPermission {
  id: string;
  group_id: string;
  service_instance_id: string;
  is_enabled: boolean;
  usage_quota: number | null;
  used_count: number;
  created_at: string;
  app?: {
    id: string;
    display_name: string | null;
    instance_id: string;
    visibility: string;
  };
}

export interface UserAccessibleApp {
  service_instance_id: string;
  display_name: string | null;
  description: string | null;
  instance_id: string;
  api_path: string;
  visibility: 'public' | 'group_only' | 'private';
  config: any;
  usage_quota: number | null;
  used_count: number;
  quota_remaining: number | null;
  group_name: string | null;
}

export interface AppPermissionCheck {
  has_access: boolean;
  quota_remaining: number | null;
  error_message: string | null;
}

// Group management functions (admin only)
/**
 * Get all group list (admin only)
 */
export async function getGroups(): Promise<Result<Group[]>> {
  try {
    const supabase = createClient();

    // First, get basic group info
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (groupsError) {
      console.error('Failed to get group list:', groupsError);
      return failure(new Error(groupsError.message));
    }

    // Then, get member count for each group
    const groups = await Promise.all(
      (groupsData || []).map(async group => {
        const { count, error: countError } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        if (countError) {
          console.warn(
            `Failed to get member count for group ${group.id}:`,
            countError
          );
          return { ...group, member_count: 0 };
        }

        return { ...group, member_count: count || 0 };
      })
    );

    return success(groups);
  } catch (error) {
    console.error('Exception while getting group list:', error);
    return failure(new Error('Failed to get group list'));
  }
}

/**
 * Create group (admin only)
 */
export async function createGroup(data: {
  name: string;
  description?: string;
}): Promise<Result<Group>> {
  try {
    const supabase = createClient();

    const { data: group, error } = await supabase
      .from('groups')
      .insert([
        {
          name: data.name,
          description: data.description || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed to create group:', error);
      return failure(new Error(error.message));
    }

    return success(group);
  } catch (error) {
    console.error('Exception while creating group:', error);
    return failure(new Error('Failed to create group'));
  }
}

/**
 * Update group (admin only)
 */
export async function updateGroup(
  groupId: string,
  data: { name?: string; description?: string }
): Promise<Result<Group>> {
  try {
    const supabase = createClient();

    const { data: group, error } = await supabase
      .from('groups')
      .update(data)
      .eq('id', groupId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update group:', error);
      return failure(new Error(error.message));
    }

    return success(group);
  } catch (error) {
    console.error('Exception while updating group:', error);
    return failure(new Error('Failed to update group'));
  }
}

/**
 * Delete group (admin only)
 */
export async function deleteGroup(groupId: string): Promise<Result<void>> {
  try {
    const supabase = createClient();

    const { error } = await supabase.from('groups').delete().eq('id', groupId);

    if (error) {
      console.error('Failed to delete group:', error);
      return failure(new Error(error.message));
    }

    return success(undefined);
  } catch (error) {
    console.error('Exception while deleting group:', error);
    return failure(new Error('Failed to delete group'));
  }
}

// Group member management functions (admin only)
/**
 * Get group member list
 */
export async function getGroupMembers(
  groupId: string
): Promise<Result<GroupMember[]>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('group_members')
      .select(
        `
        *,
        user:profiles(id, username, full_name, email)
      `
      )
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get group members:', error);
      return failure(new Error(error.message));
    }

    return success(data || []);
  } catch (error) {
    console.error('Exception while getting group members:', error);
    return failure(new Error('Failed to get group members'));
  }
}

/**
 * Add group member (admin only)
 */
export async function addGroupMember(
  groupId: string,
  userId: string
): Promise<Result<GroupMember>> {
  try {
    const supabase = createClient();

    const { data: member, error } = await supabase
      .from('group_members')
      .insert([
        {
          group_id: groupId,
          user_id: userId,
        },
      ])
      .select(
        `
        *,
        user:profiles(id, username, full_name, email)
      `
      )
      .single();

    if (error) {
      console.error('Failed to add group member:', error);
      return failure(new Error(error.message));
    }

    return success(member);
  } catch (error) {
    console.error('Exception while adding group member:', error);
    return failure(new Error('Failed to add group member'));
  }
}

/**
 * Remove group member (admin only)
 */
export async function removeGroupMember(
  groupId: string,
  userId: string
): Promise<Result<void>> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to remove group member:', error);
      return failure(new Error(error.message));
    }

    return success(undefined);
  } catch (error) {
    console.error('Exception while removing group member:', error);
    return failure(new Error('Failed to remove group member'));
  }
}

// Group app permission management functions (admin only)
/**
 * Get group app permission list
 */
export async function getGroupAppPermissions(
  groupId: string
): Promise<Result<GroupAppPermission[]>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('group_app_permissions')
      .select(
        `
        *,
        app:service_instances(id, display_name, instance_id, visibility)
      `
      )
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get group app permissions:', error);
      return failure(new Error(error.message));
    }

    return success(data || []);
  } catch (error) {
    console.error('Exception while getting group app permissions:', error);
    return failure(new Error('Failed to get group app permissions'));
  }
}

/**
 * Set group app permission (admin only)
 */
export async function setGroupAppPermission(
  groupId: string,
  serviceInstanceId: string,
  data: {
    is_enabled: boolean;
    usage_quota?: number | null;
  }
): Promise<Result<GroupAppPermission>> {
  try {
    const supabase = createClient();

    // Permission logic:
    // enabled=true: insert/update record
    // enabled=false: delete record (to avoid unique constraint conflict)
    if (data.is_enabled) {
      // Enable permission: insert or update record
      const { data: permission, error } = await supabase
        .from('group_app_permissions')
        .upsert([
          {
            group_id: groupId,
            service_instance_id: serviceInstanceId,
            is_enabled: true,
            usage_quota: data.usage_quota || null,
          },
        ])
        .select(
          `
          *,
          app:service_instances(id, display_name, instance_id, visibility)
        `
        )
        .single();

      if (error) {
        console.error('Failed to set group app permission:', error);
        return failure(new Error(error.message));
      }

      return success(permission);
    } else {
      // Disable permission: delete record
      const { error } = await supabase
        .from('group_app_permissions')
        .delete()
        .eq('group_id', groupId)
        .eq('service_instance_id', serviceInstanceId);

      if (error) {
        console.error('Failed to delete group app permission:', error);
        return failure(new Error(error.message));
      }

      // Return a virtual disabled state record to keep API consistent
      return success({
        id: '',
        group_id: groupId,
        service_instance_id: serviceInstanceId,
        is_enabled: false,
        usage_quota: null,
        used_count: 0,
        created_at: new Date().toISOString(),
        app: undefined,
      } as GroupAppPermission);
    }
  } catch (error) {
    console.error('Exception while setting group app permission:', error);
    return failure(new Error('Failed to set group app permission'));
  }
}

/**
 * Remove group app permission (admin only)
 */
export async function removeGroupAppPermission(
  groupId: string,
  serviceInstanceId: string
): Promise<Result<void>> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('group_app_permissions')
      .delete()
      .eq('group_id', groupId)
      .eq('service_instance_id', serviceInstanceId);

    if (error) {
      console.error('Failed to delete group app permission:', error);
      return failure(new Error(error.message));
    }

    return success(undefined);
  } catch (error) {
    console.error('Exception while deleting group app permission:', error);
    return failure(new Error('Failed to delete group app permission'));
  }
}

/**
 * Remove all group app permissions for a specific app (admin only)
 * Used to clean up orphan records when switching permissions
 */
export async function removeAllGroupAppPermissions(
  serviceInstanceId: string
): Promise<Result<void>> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('group_app_permissions')
      .delete()
      .eq('service_instance_id', serviceInstanceId);

    if (error) {
      console.error(
        'Failed to delete all group app permissions for app:',
        error
      );
      return failure(new Error(error.message));
    }

    return success(undefined);
  } catch (error) {
    console.error(
      'Exception while deleting all group app permissions for app:',
      error
    );
    return failure(
      new Error('Failed to delete all group app permissions for app')
    );
  }
}

// User permission query functions (available to all users)
/**
 * Get list of apps accessible to user
 */
export async function getUserAccessibleApps(
  userId: string
): Promise<Result<UserAccessibleApp[]>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('get_user_accessible_apps', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Failed to get user accessible apps:', error);
      return failure(new Error(error.message));
    }

    return success(data || []);
  } catch (error) {
    console.error('Exception while getting user accessible apps:', error);
    return failure(new Error('Failed to get accessible apps'));
  }
}

/**
 * Check if user has access to a specific app
 */
export async function checkUserAppPermission(
  userId: string,
  serviceInstanceId: string
): Promise<Result<AppPermissionCheck>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('check_user_app_permission', {
      p_user_id: userId,
      p_service_instance_id: serviceInstanceId,
    });

    if (error) {
      console.error('Failed to check user app permission:', error);
      return failure(new Error(error.message));
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result) {
      return success({
        has_access: false,
        quota_remaining: null,
        error_message: 'Permission check failed',
      });
    }

    return success(result);
  } catch (error) {
    console.error('Exception while checking user app permission:', error);
    return failure(new Error('Permission check failed'));
  }
}

/**
 * Increment app usage count
 */
export async function incrementAppUsage(
  userId: string,
  serviceInstanceId: string,
  increment: number = 1
): Promise<
  Result<{
    success: boolean;
    new_used_count: number;
    quota_remaining: number | null;
    error_message: string | null;
  }>
> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('increment_app_usage', {
      p_user_id: userId,
      p_service_instance_id: serviceInstanceId,
      p_increment: increment,
    });

    if (error) {
      console.error('Failed to increment app usage:', error);
      return failure(new Error(error.message));
    }

    const result = Array.isArray(data) ? data[0] : data;
    return success(result);
  } catch (error) {
    console.error('Exception while incrementing app usage:', error);
    return failure(new Error('Failed to update usage count'));
  }
}

// User search functionality (for group member management)
export interface SearchableUser {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  status: string;
}

/**
 * Search users (for adding to group)
 */
export async function searchUsersForGroup(
  searchTerm: string,
  excludeUserIds: string[] = []
): Promise<Result<SearchableUser[]>> {
  try {
    const supabase = createClient();

    let query = supabase
      .from('profiles')
      .select('id, username, full_name, email, avatar_url, role, status')
      .eq('status', 'active')
      .limit(20);

    // Exclude specified user IDs (e.g., users already in the group)
    if (excludeUserIds.length > 0) {
      query = query.not('id', 'in', `(${excludeUserIds.join(',')})`);
    }

    // Search condition: username, full name, or email contains search term
    if (searchTerm.trim()) {
      query = query.or(
        `username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
      );
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Failed to search users:', error);
      return failure(new Error(error.message));
    }

    return success(data || []);
  } catch (error) {
    console.error('Exception while searching users:', error);
    return failure(new Error('Failed to search users'));
  }
}
