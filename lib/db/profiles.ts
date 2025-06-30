/**
 * 用户资料相关的数据库查询函数
 *
 * 本文件包含与用户资料表(profiles)相关的所有数据库操作
 * 更新为使用统一的数据服务和Result类型
 */
import { CacheKeys, cacheService } from '@lib/services/db/cache-service';
import { dataService } from '@lib/services/db/data-service';
import {
  SubscriptionConfigs,
  SubscriptionKeys,
  realtimeService,
} from '@lib/services/db/realtime-service';
import { Profile } from '@lib/types/database';
import { Result, failure, success } from '@lib/types/result';

import { createClient } from '../supabase/client';

// 保持与现有代码的兼容性，同时使用新的数据服务
const supabase = createClient();

/**
 * 获取当前用户的资料（优化版本）
 * @returns 用户资料对象的Result，如果未找到则返回null
 */
export async function getCurrentUserProfile(): Promise<Result<Profile | null>> {
  // --- BEGIN COMMENT ---
  // 首先获取当前用户ID，然后查询用户资料
  // 使用新的数据服务和缓存机制
  // --- END COMMENT ---
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return success(null);
  }

  return getUserProfileById(user.id);
}

/**
 * 根据ID获取用户资料（优化版本）
 * @param userId 用户ID
 * @returns 用户资料对象的Result，如果未找到则返回null
 */
export async function getUserProfileById(
  userId: string
): Promise<Result<Profile | null>> {
  return dataService.findOne<Profile>(
    'profiles',
    { id: userId },
    {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10分钟缓存
      subscribe: true,
      subscriptionKey: SubscriptionKeys.userProfile(userId),
      onUpdate: () => {
        // 用户资料更新时清除缓存
        cacheService.delete(CacheKeys.userProfile(userId));
      },
    }
  );
}

/**
 * 根据用户名获取用户资料（优化版本）
 * @param username 用户名
 * @returns 用户资料对象的Result，如果未找到则返回null
 */
export async function getUserProfileByUsername(
  username: string
): Promise<Result<Profile | null>> {
  return dataService.findOne<Profile>(
    'profiles',
    { username },
    {
      cache: true,
      cacheTTL: 5 * 60 * 1000, // 5分钟缓存
    }
  );
}

/**
 * 获取所有管理员用户（优化版本）
 * @returns 管理员用户列表的Result
 */
export async function getAdminUsers(): Promise<Result<Profile[]>> {
  return dataService.findMany<Profile>(
    'profiles',
    { role: 'admin' },
    { column: 'created_at', ascending: false },
    undefined,
    {
      cache: true,
      cacheTTL: 15 * 60 * 1000, // 15分钟缓存
    }
  );
}

/**
 * 更新用户资料（优化版本）
 * @param userId 用户ID
 * @param updates 需要更新的字段
 * @returns 更新后的用户资料对象Result，如果更新失败则返回错误
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<Result<Profile>> {
  // --- BEGIN COMMENT ---
  // 添加自动更新时间戳
  // --- END COMMENT ---
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const result = await dataService.update<Profile>(
    'profiles',
    userId,
    updateData
  );

  // 清除相关缓存
  if (result.success) {
    cacheService.delete(CacheKeys.userProfile(userId));
    // 如果更新了username，也清除username相关的缓存
    if (updates.username) {
      cacheService.deletePattern(`profiles:*username*`);
    }
  }

  return result;
}

/**
 * 设置用户为管理员（优化版本）
 * @param userId 用户ID
 * @returns 是否设置成功的Result
 */
export async function setUserAsAdmin(userId: string): Promise<Result<boolean>> {
  const result = await dataService.update<Profile>('profiles', userId, {
    role: 'admin',
    updated_at: new Date().toISOString(),
  });

  if (result.success) {
    // 清除相关缓存
    cacheService.delete(CacheKeys.userProfile(userId));
    cacheService.deletePattern('profiles:*role*admin*');
    return success(true);
  }

  return success(false);
}

/**
 * 检查用户是否为管理员（优化版本）
 * @param userId 用户ID
 * @returns 是否为管理员的Result
 */
export async function isUserAdmin(userId: string): Promise<Result<boolean>> {
  const result = await dataService.findOne<Profile>(
    'profiles',
    { id: userId },
    {
      cache: true,
      cacheTTL: 5 * 60 * 1000, // 5分钟缓存，权限检查需要较新的数据
    }
  );

  if (result.success && result.data) {
    return success(result.data.role === 'admin');
  }

  if (result.success && !result.data) {
    return success(false); // 用户不存在，不是管理员
  }

  return failure(result.error || new Error('检查用户角色失败'));
}

// --- BEGIN COMMENT ---
// 兼容性函数，保持与现有代码的兼容性
// 这些函数将逐步迁移到使用Result类型
// --- END COMMENT ---

/**
 * 获取当前用户的资料（兼容版本）
 * @deprecated 请使用 getCurrentUserProfile() 并处理Result类型
 */
export async function getCurrentUserProfileLegacy(): Promise<Profile | null> {
  const result = await getCurrentUserProfile();
  return result.success ? result.data : null;
}

/**
 * 根据ID获取用户资料（兼容版本）
 * @deprecated 请使用 getUserProfileById() 并处理Result类型
 */
export async function getUserProfileByIdLegacy(
  userId: string
): Promise<Profile | null> {
  const result = await getUserProfileById(userId);
  return result.success ? result.data : null;
}

/**
 * 根据用户名获取用户资料（兼容版本）
 * @deprecated 请使用 getUserProfileByUsername() 并处理Result类型
 */
export async function getUserProfileByUsernameLegacy(
  username: string
): Promise<Profile | null> {
  const result = await getUserProfileByUsername(username);
  return result.success ? result.data : null;
}

/**
 * 获取所有管理员用户（兼容版本）
 * @deprecated 请使用 getAdminUsers() 并处理Result类型
 */
export async function getAdminUsersLegacy(): Promise<Profile[]> {
  const result = await getAdminUsers();
  return result.success ? result.data : [];
}

/**
 * 更新用户资料（兼容版本）
 * @deprecated 请使用 updateUserProfile() 并处理Result类型
 */
export async function updateUserProfileLegacy(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<Profile | null> {
  const result = await updateUserProfile(userId, updates);
  return result.success ? result.data : null;
}

/**
 * 设置用户为管理员（兼容版本）
 * @deprecated 请使用 setUserAsAdmin() 并处理Result类型
 */
export async function setUserAsAdminLegacy(userId: string): Promise<boolean> {
  const result = await setUserAsAdmin(userId);
  return result.success ? result.data : false;
}

/**
 * 检查用户是否为管理员（兼容版本）
 * @deprecated 请使用 isUserAdmin() 并处理Result类型
 */
export async function isUserAdminLegacy(userId: string): Promise<boolean> {
  const result = await isUserAdmin(userId);
  return result.success ? result.data : false;
}

// 注意：用户组织信息相关函数已移除，改用群组系统
