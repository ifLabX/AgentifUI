import { useState, useEffect } from 'react';
import { getCurrentUserProfile, getUserProfileById } from '@lib/db'; // 使用新的优化数据库接口
import { useSupabaseAuth } from '@lib/supabase/hooks';
import { useLoadingStore, PageKey } from '../stores/loading-store';

// 定义资料类型
export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  created_at: string | null;
}

// localStorage缓存相关常量
const PROFILE_CACHE_KEY = 'user_profile_cache';
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5分钟缓存过期时间

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
    
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!cached) return null;
    
    const cacheData: ProfileCache = JSON.parse(cached);
    
    // 检查用户ID是否匹配
    if (cacheData.userId !== userId) return null;
    
    // 检查是否过期
    if (Date.now() - cacheData.timestamp > CACHE_EXPIRY_TIME) {
      localStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }
    
    return cacheData.profile;
  } catch (error) {
    console.warn('读取profile缓存失败:', error);
    return null;
  }
};

const setProfileToCache = (profile: Profile, userId: string): void => {
  try {
    if (typeof window === 'undefined') return; // SSR安全检查
    
    const cacheData: ProfileCache = {
      profile,
      timestamp: Date.now(),
      userId
    };
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('保存profile缓存失败:', error);
  }
};

// 导出清除缓存的函数，供其他组件使用
export const clearProfileCache = (): void => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch (error) {
    console.warn('清除profile缓存失败:', error);
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
      
      // 使用新的数据服务获取用户资料
      // 根据是否指定用户ID调用不同的函数
      let result;
      if (userId) {
        // 获取指定用户的资料
        result = await getUserProfileById(targetUserId);
      } else {
        // 获取当前用户的资料
        result = await getCurrentUserProfile();
      }
      
      if (result.success && result.data) {
        const newProfile = result.data as Profile;
        
        // 更新状态和缓存
        setProfile(newProfile);
        setProfileToCache(newProfile, targetUserId);
      } else if (result.success && !result.data) {
        // 用户资料不存在
        setProfile(null);
        setError(new Error('用户资料不存在'));
      } else {
        // 获取失败
        throw new Error(result.error?.message || '获取用户资料失败');
      }
      
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
    mutate: loadProfile
  };
}
