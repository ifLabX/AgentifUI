/**
 * 用户资料相关的数据库查询函数
 * 
 * 本文件包含与用户资料表(profiles)相关的所有数据库操作
 */

import { createClient } from '@supabase/supabase-js';
import { Profile } from '../types/database';

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * 获取当前用户的资料
 * @returns 用户资料对象，如果未找到则返回null
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  return getUserProfileById(user.id);
}

/**
 * 根据ID获取用户资料
 * @param userId 用户ID
 * @returns 用户资料对象，如果未找到则返回null
 */
export async function getUserProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('获取用户资料失败:', error);
    return null;
  }

  return data as Profile;
}

/**
 * 根据用户名获取用户资料
 * @param username 用户名
 * @returns 用户资料对象，如果未找到则返回null
 */
export async function getUserProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !data) {
    console.error('获取用户资料失败:', error);
    return null;
  }

  return data as Profile;
}

/**
 * 获取所有管理员用户
 * @returns 管理员用户列表
 */
export async function getAdminUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'admin');

  if (error) {
    console.error('获取管理员用户失败:', error);
    return [];
  }

  return data as Profile[];
}

/**
 * 更新用户资料
 * @param userId 用户ID
 * @param updates 需要更新的字段
 * @returns 更新后的用户资料对象，如果更新失败则返回null
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    console.error('更新用户资料失败:', error);
    return null;
  }

  return data as Profile;
}

/**
 * 设置用户为管理员
 * @param userId 用户ID
 * @returns 是否设置成功
 */
export async function setUserAsAdmin(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({
      role: 'admin',
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    console.error('设置用户为管理员失败:', error);
    return false;
  }

  return true;
}

/**
 * 检查用户是否为管理员
 * @param userId 用户ID
 * @returns 是否为管理员
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('检查用户角色失败:', error);
    return false;
  }

  return data.role === 'admin';
}
