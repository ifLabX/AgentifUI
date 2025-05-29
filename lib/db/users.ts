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
 * 获取用户列表（使用数据库函数）
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

    // 调用数据库函数
    const { data, error } = await supabase.rpc('get_user_list', {
      p_role: role || null,
      p_status: status || null,
      p_auth_source: auth_source || null,
      p_search: search || null,
      p_sort_by: sortBy,
      p_sort_order: sortOrder,
      p_page: page,
      p_page_size: pageSize
    });

    if (error) {
      console.error('获取用户列表失败:', error);
      return failure(new Error(`获取用户列表失败: ${error.message}`));
    }

    if (!data || data.length === 0) {
      return success({
        users: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0
      });
    }

    const result = data[0];
    const users = result.users || [];
    const total = parseInt(result.total_count) || 0;
    const totalPages = parseInt(result.total_pages) || 0;

    return success({
      users,
      total,
      page: parseInt(result.page) || page,
      pageSize: parseInt(result.page_size) || pageSize,
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
 * 获取单个用户详细信息（使用数据库函数）
 */
export async function getUserById(userId: string): Promise<Result<EnhancedUser | null>> {
  try {
    const { data, error } = await supabase.rpc('get_user_detail', {
      target_user_id: userId
    });

    if (error) {
      console.error('获取用户信息失败:', error);
      return failure(new Error(`获取用户信息失败: ${error.message}`));
    }

    if (!data || data.length === 0) {
      return success(null);
    }

    return success(data[0] as EnhancedUser);
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