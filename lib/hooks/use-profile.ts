import { createClient } from '@lib/supabase/client';
// 使用新的优化数据库接口
import { useSupabaseAuth } from '@lib/supabase/hooks';
import type { UserRole } from '@lib/types/database';

import { useEffect, useState } from 'react';

import { PageKey, useLoadingStore } from '../stores/loading-store';

// 定义资料类型
export interface Profile {
  id: string;
  full_name: string | null | undefined;
  username: string | null;
  avatar_url: string | null;
  role: UserRole;
  updated_at: string | null;
  created_at: string | null;
  employee_number?: string | null; // 新增：学工号字段（可选，仅SSO用户有值）
  // --- BEGIN COMMENT ---
  // auth.users表的信息：用于settings页面显示
  // --- END COMMENT ---
  auth_last_sign_in_at?: string | null;
}

// --- BEGIN COMMENT ---
// 用户资料缓存配置
// 使用sessionStorage提高安全性，关闭标签页自动清理
// 缩短缓存时间，减少敏感信息暴露时间
// --- END COMMENT ---
const PROFILE_CACHE_KEY = 'user_profile_cache';
const CACHE_EXPIRY_TIME = 2 * 60 * 1000; // 缩短为2分钟缓存过期时间，提高安全性

// 缓存数据结构
interface ProfileCache {
  profile: Profile;
  timestamp: number;
  userId: string;
}

// 缓存工具函数
const getProfileFromCache = (userId: string): Profile | null => {
  try {
    if (typeof window === 'undefined') return null; // SSR安全检查

    // --- BEGIN COMMENT ---
    // 使用sessionStorage提高安全性，关闭标签页自动清理
    // --- END COMMENT ---
    const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (!cached) return null;

    const cacheData: ProfileCache = JSON.parse(cached);

    // --- BEGIN COMMENT ---
    // 严格的用户ID校验，防止跨用户数据污染
    // --- END COMMENT ---
    if (cacheData.userId !== userId) {
      console.warn(
        `[用户缓存] 用户ID不匹配，清理缓存 (缓存:${cacheData.userId}, 当前:${userId})`
      );
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }

    // --- BEGIN COMMENT ---
    // 检查缓存是否过期
    // --- END COMMENT ---
    if (Date.now() - cacheData.timestamp > CACHE_EXPIRY_TIME) {
      console.log(`[用户缓存] 缓存已过期，清理缓存`);
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }

    console.log(`[用户缓存] 命中用户缓存: ${userId}`);
    return cacheData.profile;
  } catch (error) {
    console.warn('[用户缓存] 读取profile缓存失败:', error);
    // 清理损坏的缓存
    try {
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
    } catch {}
    return null;
  }
};

const setProfileToCache = (profile: Profile, userId: string): void => {
  try {
    if (typeof window === 'undefined') return; // SSR安全检查

    const cacheData: ProfileCache = {
      profile,
      timestamp: Date.now(),
      userId,
    };

    // --- BEGIN COMMENT ---
    // 使用sessionStorage存储，提高安全性
    // --- END COMMENT ---
    sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData));
    console.log(`[用户缓存] 已缓存用户资料: ${userId}`);
  } catch (error) {
    console.warn('[用户缓存] 保存profile缓存失败:', error);
  }
};

// --- BEGIN COMMENT ---
// 导出清除缓存的函数，供其他组件使用
// 更新为清理sessionStorage
// --- END COMMENT ---
export const clearProfileCache = (): void => {
  try {
    if (typeof window === 'undefined') return;

    // --- BEGIN COMMENT ---
    // 清理sessionStorage中的用户资料缓存
    // --- END COMMENT ---
    sessionStorage.removeItem(PROFILE_CACHE_KEY);
    console.log('[用户缓存] 已清理用户资料缓存');
  } catch (error) {
    console.warn('[用户缓存] 清除profile缓存失败:', error);
  }
};

// 导出更新缓存的函数，供settings页面使用
export const updateProfileCache = (profile: Profile, userId: string): void => {
  setProfileToCache(profile, userId);
};

// 定义 hook 返回类型
interface UseProfileResult {
  profile: Profile | null;
  error: Error | null;
  isLoading: boolean;
  mutate: () => Promise<void>;
}

/**
 * 获取用户资料的自定义 hook
 * 使用localStorage缓存机制，优先从缓存读取，避免loading闪烁
 * 更新为使用新的数据服务和Result类型
 * @param userId 可选的用户ID，如果不提供则获取当前登录用户的资料
 * @returns 包含资料数据、加载状态和错误信息的对象
 */
export function useProfile(userId?: string): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false); // 修改初始值为false

  // 使用认证hook获取当前用户信息
  const { session } = useSupabaseAuth();

  // 使用全局加载状态
  const setPageLoading = useLoadingStore(state => state.setPageLoading);

  // 加载资料的函数
  const loadProfile = async () => {
    try {
      setError(null);

      // 获取用户ID（当前用户或指定用户）
      let targetUserId = userId;

      if (!targetUserId) {
        // 如果未提供用户ID，则使用当前登录用户
        if (!session?.user) {
          throw new Error('未登录，无法获取用户资料');
        }

        targetUserId = session.user.id;
      }

      // 首先尝试从缓存加载
      const cachedProfile = getProfileFromCache(targetUserId);
      if (cachedProfile) {
        setProfile(cachedProfile);
        // 有缓存时不显示loading，但在后台继续请求最新数据
      } else {
        // 没有缓存时才显示loading
        setIsLoading(true);
        setPageLoading('profile', true);
      }

      // --- BEGIN COMMENT ---
      // 查询用户资料信息
      // --- END COMMENT ---
      const supabase = createClient();
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message || '获取用户资料失败');
      }

      if (!profileData) {
        setProfile(null);
        setError(new Error('用户资料不存在'));
        return;
      }

      // --- BEGIN COMMENT ---
      // 获取auth.users中的last_sign_in_at信息
      // --- END COMMENT ---
      let authLastSignInAt: string | null = null;
      if (session?.user) {
        authLastSignInAt = session.user.last_sign_in_at || null;
      }

      const newProfile: Profile = {
        id: profileData.id,
        full_name: profileData.full_name,
        username: profileData.username,
        avatar_url: profileData.avatar_url,
        role: profileData.role,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
        employee_number: profileData.employee_number, // 新增：包含学工号数据
        // --- BEGIN COMMENT ---
        // 添加auth信息用于settings页面显示
        // --- END COMMENT ---
        auth_last_sign_in_at: authLastSignInAt,
      };

      // 更新状态和缓存
      setProfile(newProfile);
      setProfileToCache(newProfile, targetUserId);
    } catch (err) {
      console.error('加载用户资料失败:', err);
      setError(err instanceof Error ? err : new Error('加载用户资料失败'));
    } finally {
      // 重置加载状态
      setIsLoading(false);
      setPageLoading('profile', false);
    }
  };

  // 首次加载和依赖变化时获取资料
  useEffect(() => {
    if (session || userId) {
      // 只有在有session（当前用户）或指定userId时才加载
      loadProfile();
    }
  }, [userId, session]);

  // 返回资料数据、加载状态、错误信息和刷新方法
  return {
    profile,
    error,
    isLoading,
    mutate: loadProfile,
  };
}
