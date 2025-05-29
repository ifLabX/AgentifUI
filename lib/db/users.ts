/**
 * 用户管理相关的数据库查询函数
 * 
 * 本文件包含用户管理界面所需的所有数据库操作
 * 包括用户列表查询、用户详情、角色管理、状态管理等
 */

import { dataService } from '@lib/services/db/data-service';
import { Result, success, failure } from '@lib/types/result';
import { createClient } from '@lib/supabase/client';
import type { Database } from '@lib/supabase/types';

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
  profile_created_at: string;
  profile_updated_at: string;
  last_login?: string;
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
 * 获取用户列表（使用安全的数据库函数，不暴露敏感的auth.users数据）
 */
export async function getUserList(filters: UserFilters = {}): Promise<Result<{
  users: EnhancedUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}>> {
  try {
    const {
      role,
      status,
      auth_source,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      pageSize = 20
    } = filters;

    // 使用安全的数据库函数获取用户列表
    const { data: usersData, error: usersError } = await supabase.rpc('get_users_for_admin', {
      p_role: role || null,
      p_status: status || null,
      p_auth_source: auth_source || null,
      p_search: search || null,
      p_sort_by: sortBy,
      p_sort_order: sortOrder,
      p_page: page,
      p_page_size: pageSize
    });

    if (usersError) {
      console.error('获取用户列表失败:', usersError);
      return failure(new Error(`获取用户列表失败: ${usersError.message}`));
    }

    // 获取用户总数（用于分页）
    const { data: totalCount, error: countError } = await supabase.rpc('get_users_count_for_admin', {
      p_role: role || null,
      p_status: status || null,
      p_auth_source: auth_source || null,
      p_search: search || null
    });

    if (countError) {
      console.error('获取用户总数失败:', countError);
      return failure(new Error(`获取用户总数失败: ${countError.message}`));
    }

    const total = totalCount || 0;
    const totalPages = Math.ceil(total / pageSize);

    // 转换数据格式，添加缺失的字段以兼容现有接口
    const enhancedUsers: EnhancedUser[] = (usersData || []).map((user: any) => ({
      ...user,
      // 从安全函数返回的字段重新映射
      created_at: user.created_at,
      updated_at: user.updated_at,
      profile_created_at: user.created_at,
      profile_updated_at: user.updated_at,
      // 对于敏感信息，使用安全的替代字段
      email: user.has_email ? '[已设置]' : null,
      phone: null, // 不暴露手机号
      email_confirmed_at: user.email_confirmed ? new Date().toISOString() : null,
      phone_confirmed_at: null
    }));

    return success({
      users: enhancedUsers,
      total,
      page,
      pageSize,
      totalPages
    });
  } catch (error) {
    console.error('获取用户列表异常:', error);
    return failure(error instanceof Error ? error : new Error('获取用户列表失败'));
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
    return failure(error instanceof Error ? error : new Error('获取用户统计失败'));
  }
}

/**
 * 获取单个用户详细信息（使用安全的数据库函数，不暴露敏感的auth.users数据）
 */
export async function getUserById(userId: string): Promise<Result<EnhancedUser | null>> {
  try {
    const { data, error } = await supabase.rpc('get_user_detail_for_admin', {
      target_user_id: userId
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
      email: userDetail.has_email ? '[已设置]' : null,
      phone: userDetail.has_phone ? '[已设置]' : null,
      email_confirmed_at: userDetail.email_confirmed ? new Date().toISOString() : null,
      phone_confirmed_at: userDetail.phone_confirmed ? new Date().toISOString() : null
    };

    return success(enhancedUser);
  } catch (error) {
    console.error('获取用户信息异常:', error);
    return failure(error instanceof Error ? error : new Error('获取用户信息失败'));
  }
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(userId: string, updates: Partial<ProfileUpdate>): Promise<Result<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
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
    return failure(error instanceof Error ? error : new Error('更新用户资料失败'));
  }
}

/**
 * 更新用户角色
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<Result<Profile>> {
  return updateUserProfile(userId, { role });
}

/**
 * 更新用户状态
 */
export async function updateUserStatus(userId: string, status: AccountStatus): Promise<Result<Profile>> {
  return updateUserProfile(userId, { status });
}

/**
 * 删除用户（仅删除profile，auth.users会通过级联删除）
 */
export async function deleteUser(userId: string): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      return failure(new Error(`删除用户失败: ${error.message}`));
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
export async function createUserProfile(userId: string, profileData: {
  full_name?: string;
  username?: string;
  avatar_url?: string;
  role?: UserRole;
  status?: AccountStatus;
  auth_source?: string;
}): Promise<Result<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return failure(new Error(`创建用户资料失败: ${error.message}`));
    }

    return success(data);
  } catch (error) {
    console.error('创建用户资料异常:', error);
    return failure(error instanceof Error ? error : new Error('创建用户资料失败'));
  }
}

/**
 * 批量更新用户状态
 */
export async function batchUpdateUserStatus(userIds: string[], status: AccountStatus): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .in('id', userIds);

    if (error) {
      return failure(new Error(`批量更新用户状态失败: ${error.message}`));
    }

    return success(undefined);
  } catch (error) {
    console.error('批量更新用户状态异常:', error);
    return failure(error instanceof Error ? error : new Error('批量更新用户状态失败'));
  }
}

/**
 * 批量更新用户角色
 */
export async function batchUpdateUserRole(userIds: string[], role: UserRole): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .in('id', userIds);

    if (error) {
      return failure(new Error(`批量更新用户角色失败: ${error.message}`));
    }

    return success(undefined);
  } catch (error) {
    console.error('批量更新用户角色异常:', error);
    return failure(error instanceof Error ? error : new Error('批量更新用户角色失败'));
  }
} 