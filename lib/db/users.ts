/**
 * 用户管理相关的数据库查询函数
 *
 * 本文件包含用户管理界面所需的所有数据库操作
 * 包括用户列表查询、用户详情、角色管理、状态管理等
 */
import { dataService } from '@lib/services/db/data-service';
import { createClient } from '@lib/supabase/client';
import type { Database } from '@lib/supabase/types';
import { Result, failure, success } from '@lib/types/result';

// 类型定义
type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type UserRole = Database['public']['Enums']['user_role'];
type AccountStatus = Database['public']['Enums']['account_status'];

// 扩展的用户信息，包含 auth.users 表的信息
export interface EnhancedUser {
  id: string;
  email?: string;
  phone?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  // profiles 表信息
  full_name?: string;
  username?: string;
  avatar_url?: string;
  role: UserRole;
  status: AccountStatus;
  auth_source?: string;
  sso_provider_id?: string;
  employee_number?: string | null; // 新增：学工号字段（可选，仅SSO用户有值）
  profile_created_at: string;
  profile_updated_at: string;
  last_login?: string;
  // 群组信息
  groups?: Array<{
    id: string;
    name: string;
    description?: string | null;
    joined_at: string;
  }>;
  // 注意：组织相关字段已移除，改用群组系统
}

// 用户统计信息
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

// 用户筛选参数
export interface UserFilters {
  role?: UserRole;
  status?: AccountStatus;
  auth_source?: string;
  search?: string; // 搜索邮箱、用户名、全名
  sortBy?: 'created_at' | 'last_sign_in_at' | 'email' | 'full_name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

const supabase = createClient();

/**
 * 获取用户列表（使用安全的管理员函数）
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

    // 获取用户信息，包含auth.users表的邮箱和手机号信息
    let query = supabase.from('profiles').select('*', { count: 'exact' });

    // 应用筛选条件
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

    // 注意：组织和部门筛选已移除，改用群组系统

    // 应用排序
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // 应用分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: profiles, error: profilesError, count } = await query;

    if (profilesError) {
      console.error('获取用户列表失败:', profilesError);
      return failure(new Error(`获取用户列表失败: ${profilesError.message}`));
    }

    // 获取auth.users表中的邮箱和手机号信息
    // 对于管理员，显示完整的联系信息
    const userIds = (profiles || []).map(p => p.id);
    let authUsers: any[] = [];

    if (userIds.length > 0) {
      // 通过RPC函数获取auth.users信息（需要管理员权限）
      const { data: authData, error: authError } = await supabase.rpc(
        'get_admin_users',
        { user_ids: userIds }
      );

      if (authError) {
        console.error('获取auth.users信息失败:', {
          error: authError,
          userIdsCount: userIds.length,
          errorCode: authError.code,
          errorMessage: authError.message,
          errorDetails: authError.details,
        });
        // 如果RPC调用失败，仍然继续处理，但记录错误
      } else if (authData) {
        console.log('成功获取auth数据，用户数量:', authData.length);
        authUsers = authData;
      } else {
        console.warn('RPC调用成功但返回空数据');
      }
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    // 合并profiles和auth.users数据，并获取群组信息
    const enhancedUsers: EnhancedUser[] = await Promise.all(
      (profiles || []).map(async (profile: any) => {
        const authUser = authUsers.find(au => au.id === profile.id);

        // 获取用户的群组信息
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
    console.error('获取用户列表异常:', error);
    return failure(
      error instanceof Error ? error : new Error('获取用户列表失败')
    );
  }
}

/**
 * 获取用户统计信息（使用数据库函数）
 */
export async function getUserStats(): Promise<Result<UserStats>> {
  try {
    const { data, error } = await supabase.rpc('get_user_stats');

    if (error) {
      console.error('获取用户统计失败:', error);
      return failure(new Error(`获取用户统计失败: ${error.message}`));
    }

    return success(data as UserStats);
  } catch (error) {
    console.error('获取用户统计异常:', error);
    return failure(
      error instanceof Error ? error : new Error('获取用户统计失败')
    );
  }
}

/**
 * 获取单个用户详细信息（使用安全的数据库函数，不暴露敏感的auth.users数据）
 */
export async function getUserById(
  userId: string
): Promise<Result<EnhancedUser | null>> {
  try {
    const { data, error } = await supabase.rpc('get_user_detail_for_admin', {
      target_user_id: userId,
    });

    if (error) {
      console.error('获取用户信息失败:', error);
      return failure(new Error(`获取用户信息失败: ${error.message}`));
    }

    if (!data || data.length === 0) {
      return success(null);
    }

    // 转换数据格式，兼容现有接口
    const userDetail = data[0];
    const enhancedUser: EnhancedUser = {
      ...userDetail,
      // 从安全函数返回的字段重新映射
      profile_created_at: userDetail.created_at,
      profile_updated_at: userDetail.updated_at,
      // 对于敏感信息，使用安全的替代字段
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
    console.error('获取用户信息异常:', error);
    return failure(
      error instanceof Error ? error : new Error('获取用户信息失败')
    );
  }
}

/**
 * 更新用户资料
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
      return failure(new Error(`更新用户资料失败: ${error.message}`));
    }

    return success(data);
  } catch (error) {
    console.error('更新用户资料异常:', error);
    return failure(
      error instanceof Error ? error : new Error('更新用户资料失败')
    );
  }
}

/**
 * 更新用户角色
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<Result<Profile>> {
  return updateUserProfile(userId, { role });
}

/**
 * 更新用户状态
 */
export async function updateUserStatus(
  userId: string,
  status: AccountStatus
): Promise<Result<Profile>> {
  return updateUserProfile(userId, { status });
}

/**
 * 删除用户（使用安全的RPC函数删除auth.users记录，触发级联删除）
 */
export async function deleteUser(userId: string): Promise<Result<void>> {
  try {
    const { data, error } = await supabase.rpc('safe_delete_user', {
      target_user_id: userId,
    });

    if (error) {
      return failure(new Error(`删除用户失败: ${error.message}`));
    }

    if (!data) {
      return failure(new Error('删除用户失败：操作未成功'));
    }

    return success(undefined);
  } catch (error) {
    console.error('删除用户异常:', error);
    return failure(error instanceof Error ? error : new Error('删除用户失败'));
  }
}

/**
 * 创建新用户（仅创建profile，需要先有auth.users记录）
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
      return failure(new Error(`创建用户资料失败: ${error.message}`));
    }

    return success(data);
  } catch (error) {
    console.error('创建用户资料异常:', error);
    return failure(
      error instanceof Error ? error : new Error('创建用户资料失败')
    );
  }
}

/**
 * 批量更新用户状态
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
      return failure(new Error(`批量更新用户状态失败: ${error.message}`));
    }

    return success(undefined);
  } catch (error) {
    console.error('批量更新用户状态异常:', error);
    return failure(
      error instanceof Error ? error : new Error('批量更新用户状态失败')
    );
  }
}

/**
 * 批量更新用户角色
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
      return failure(new Error(`批量更新用户角色失败: ${error.message}`));
    }

    return success(undefined);
  } catch (error) {
    console.error('批量更新用户角色异常:', error);
    return failure(
      error instanceof Error ? error : new Error('批量更新用户角色失败')
    );
  }
}

// 注意：组织和部门选项函数已移除，改用群组系统
