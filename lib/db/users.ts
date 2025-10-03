/**
 * Database query functions related to user management.
 *
 * This file contains all database operations required for the user management interface,
 * including user list queries, user details, role management, status management, etc.
 */
import { createClient } from '@lib/supabase/client';
import type { Database } from '@lib/supabase/types';
import { Result, failure, success } from '@lib/types/result';

// Type definitions
type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type UserRole = Database['public']['Enums']['user_role'];
type AccountStatus = Database['public']['Enums']['account_status'];

// Extended user information, including data from auth.users table
export interface EnhancedUser {
  id: string;
  email?: string;
  phone?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  // profiles table info
  full_name?: string;
  username?: string;
  avatar_url?: string;
  role: UserRole;
  status: AccountStatus;
  auth_source?: string;
  sso_provider_id?: string;
  employee_number?: string | null; // Optional: employee/student number (only for SSO users)
  profile_created_at: string;
  profile_updated_at: string;
  last_login?: string;
  // Group info
  groups?: Array<{
    id: string;
    name: string;
    description?: string | null;
    joined_at: string;
  }>;
  // Note: Organization-related fields have been removed, replaced by group system
}

// User statistics information
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingUsers: number;
  adminUsers: number;
  managerUsers: number;
  regularUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

// User filter parameters
export interface UserFilters {
  role?: UserRole;
  status?: AccountStatus;
  auth_source?: string;
  search?: string; // Search email, username, full name
  sortBy?: 'created_at' | 'last_sign_in_at' | 'email' | 'full_name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

const supabase = createClient();

/**
 * Get user list (using secure admin function)
 */
export async function getUserList(filters: UserFilters = {}): Promise<
  Result<{
    users: EnhancedUser[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>
> {
  try {
    const {
      role,
      status,
      auth_source,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      pageSize = 20,
    } = filters;

    // Get user info, including email and phone from auth.users table
    let query = supabase.from('profiles').select('*', { count: 'exact' });

    // Apply filter conditions
    if (role) {
      query = query.eq('role', role);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (auth_source) {
      query = query.eq('auth_source', auth_source);
    }
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,username.ilike.%${search}%`
      );
    }

    // Note: Organization and department filters have been removed, replaced by group system

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: profiles, error: profilesError, count } = await query;

    if (profilesError) {
      console.error('Failed to get user list:', profilesError);
      return failure(
        new Error(`Failed to get user list: ${profilesError.message}`)
      );
    }

    // Get email and phone info from auth.users table
    // For admin, show full contact info
    const userIds = (profiles || []).map(p => p.id);
    let authUsers: any[] = [];

    if (userIds.length > 0) {
      // Get auth.users info via RPC function (requires admin privileges)
      const { data: authData, error: authError } = await supabase.rpc(
        'get_admin_users',
        { user_ids: userIds }
      );

      if (authError) {
        console.error('Failed to get auth.users info:', {
          error: authError,
          userIdsCount: userIds.length,
          errorCode: authError.code,
          errorMessage: authError.message,
          errorDetails: authError.details,
        });
        // If RPC call fails, continue processing but log the error
      } else if (authData) {
        console.log('Successfully got auth data, user count:', authData.length);
        authUsers = authData;
      } else {
        console.warn('RPC call succeeded but returned empty data');
      }
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    // Merge profiles and auth.users data, and get group info
    const enhancedUsers: EnhancedUser[] = await Promise.all(
      (profiles || []).map(async (profile: any) => {
        const authUser = authUsers.find(au => au.id === profile.id);

        // Get user's group info
        let userGroups: Array<{
          id: string;
          name: string;
          description?: string | null;
          joined_at: string;
        }> = [];

        try {
          const { data: groupData, error: groupError } = await supabase
            .from('group_members')
            .select(
              `
              created_at,
              groups:group_id(id, name, description)
            `
            )
            .eq('user_id', profile.id);

          if (!groupError && groupData) {
            userGroups = groupData.map((item: any) => ({
              id: item.groups.id,
              name: item.groups.name,
              description: item.groups.description,
              joined_at: item.created_at,
            }));
          }
        } catch (error) {
          console.warn(
            `Failed to get group information for user ${profile.id}:`,
            error
          );
        }

        return {
          id: profile.id,
          email: authUser?.email || null,
          phone: authUser?.phone || null,
          email_confirmed_at: authUser?.email_confirmed_at,
          phone_confirmed_at: authUser?.phone_confirmed_at,
          created_at: authUser?.created_at || profile.created_at,
          updated_at: authUser?.updated_at || profile.updated_at,
          last_sign_in_at: authUser?.last_sign_in_at,
          full_name: profile.full_name,
          username: profile.username,
          avatar_url: profile.avatar_url,
          role: profile.role,
          status: profile.status,
          auth_source: profile.auth_source,
          sso_provider_id: profile.sso_provider_id,
          employee_number: profile.employee_number,
          profile_created_at: profile.created_at,
          profile_updated_at: profile.updated_at,
          last_login: profile.last_login,
          groups: userGroups,
        };
      })
    );

    return success({
      users: enhancedUsers,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Exception while getting user list:', error);
    return failure(
      error instanceof Error ? error : new Error('Failed to get user list')
    );
  }
}

/**
 * Get user statistics (using database function)
 */
export async function getUserStats(): Promise<Result<UserStats>> {
  try {
    const { data, error } = await supabase.rpc('get_user_stats');

    if (error) {
      console.error('Failed to get user statistics:', error);
      return failure(
        new Error(`Failed to get user statistics: ${error.message}`)
      );
    }

    return success(data as UserStats);
  } catch (error) {
    console.error('Exception while getting user statistics:', error);
    return failure(
      error instanceof Error
        ? error
        : new Error('Failed to get user statistics')
    );
  }
}

/**
 * Get detailed information of a single user (using secure database function, does not expose sensitive auth.users data)
 */
export async function getUserById(
  userId: string
): Promise<Result<EnhancedUser | null>> {
  try {
    const { data, error } = await supabase.rpc('get_user_detail_for_admin', {
      target_user_id: userId,
    });

    if (error) {
      console.error('Failed to get user info:', error);
      return failure(new Error(`Failed to get user info: ${error.message}`));
    }

    if (!data || data.length === 0) {
      return success(null);
    }

    // Transform data format to be compatible with existing interface
    const userDetail = data[0];
    const enhancedUser: EnhancedUser = {
      ...userDetail,
      // Remap fields returned from secure function
      profile_created_at: userDetail.created_at,
      profile_updated_at: userDetail.updated_at,
      // For sensitive info, use safe alternative fields
      email: userDetail.has_email ? userDetail.email : null,
      phone: userDetail.has_phone ? userDetail.phone : null,
      email_confirmed_at: userDetail.email_confirmed
        ? new Date().toISOString()
        : null,
      phone_confirmed_at: userDetail.phone_confirmed
        ? new Date().toISOString()
        : null,
      groups: userDetail.groups,
    };

    return success(enhancedUser);
  } catch (error) {
    console.error('Exception while getting user info:', error);
    return failure(
      error instanceof Error ? error : new Error('Failed to get user info')
    );
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<ProfileUpdate>
): Promise<Result<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return failure(
        new Error(`Failed to update user profile: ${error.message}`)
      );
    }

    return success(data);
  } catch (error) {
    console.error('Exception while updating user profile:', error);
    return failure(
      error instanceof Error
        ? error
        : new Error('Failed to update user profile')
    );
  }
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<Result<Profile>> {
  return updateUserProfile(userId, { role });
}

/**
 * Update user status
 */
export async function updateUserStatus(
  userId: string,
  status: AccountStatus
): Promise<Result<Profile>> {
  return updateUserProfile(userId, { status });
}

/**
 * Delete user (use secure RPC function to delete auth.users record, triggers cascade delete)
 */
export async function deleteUser(userId: string): Promise<Result<void>> {
  try {
    const { data, error } = await supabase.rpc('safe_delete_user', {
      target_user_id: userId,
    });

    if (error) {
      return failure(new Error(`Failed to delete user: ${error.message}`));
    }

    if (!data) {
      return failure(
        new Error('Failed to delete user: operation not successful')
      );
    }

    return success(undefined);
  } catch (error) {
    console.error('Exception while deleting user:', error);
    return failure(
      error instanceof Error ? error : new Error('Failed to delete user')
    );
  }
}

/**
 * Create new user profile (only creates profile, requires existing auth.users record)
 */
export async function createUserProfile(
  userId: string,
  profileData: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
    role?: UserRole;
    status?: AccountStatus;
    auth_source?: string;
  }
): Promise<Result<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return failure(
        new Error(`Failed to create user profile: ${error.message}`)
      );
    }

    return success(data);
  } catch (error) {
    console.error('Exception while creating user profile:', error);
    return failure(
      error instanceof Error
        ? error
        : new Error('Failed to create user profile')
    );
  }
}

/**
 * Batch update user status
 */
export async function batchUpdateUserStatus(
  userIds: string[],
  status: AccountStatus
): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .in('id', userIds);

    if (error) {
      return failure(
        new Error(`Failed to batch update user status: ${error.message}`)
      );
    }

    return success(undefined);
  } catch (error) {
    console.error('Exception while batch updating user status:', error);
    return failure(
      error instanceof Error
        ? error
        : new Error('Failed to batch update user status')
    );
  }
}

/**
 * Batch update user role
 */
export async function batchUpdateUserRole(
  userIds: string[],
  role: UserRole
): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .in('id', userIds);

    if (error) {
      return failure(
        new Error(`Failed to batch update user role: ${error.message}`)
      );
    }

    return success(undefined);
  } catch (error) {
    console.error('Exception while batch updating user role:', error);
    return failure(
      error instanceof Error
        ? error
        : new Error('Failed to batch update user role')
    );
  }
}

// Note: Organization and department option functions have been removed, replaced by group system
