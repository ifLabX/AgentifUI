import { useState, useEffect } from 'react';
import { createClient } from '../supabase/client';
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

// 定义 hook 返回类型
interface UseProfileResult {
  profile: Profile | null;
  error: Error | null;
  isLoading: boolean;
  mutate: () => Promise<void>;
}

/**
 * 获取用户资料的自定义 hook
 * @param userId 可选的用户ID，如果不提供则获取当前登录用户的资料
 * @returns 包含资料数据、加载状态和错误信息的对象
 */
export function useProfile(userId?: string): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();
  
  // 使用全局加载状态
  const setPageLoading = useLoadingStore(state => state.setPageLoading);
  // 直接使用本地状态管理加载状态，确保初始值为 true
  const [isLoading, setIsLoading] = useState(true);

  // 加载资料的函数
  const loadProfile = async () => {
    try {
      // 设置本地加载状态
      setIsLoading(true);
      // 同时设置全局加载状态（为了兼容其他组件）
      setPageLoading('profile', true);
      setError(null);
      
      // 获取用户ID（当前用户或指定用户）
      let targetUserId = userId;
      
      if (!targetUserId) {
        // 如果未提供用户ID，则获取当前登录用户
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('未登录，无法获取用户资料');
        }
        
        targetUserId = user.id;
      }
      
      // 从数据库获取用户资料
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();
      
      if (error) {
        throw error;
      }
      
      setProfile(data as Profile);
    } catch (err) {
      console.error('加载用户资料失败:', err);
      setError(err instanceof Error ? err : new Error('加载用户资料失败'));
    } finally {
      // 重置本地和全局加载状态
      setIsLoading(false);
      setPageLoading('profile', false);
    }
  };

  // 首次加载和依赖变化时获取资料
  useEffect(() => {
    loadProfile();
  }, [userId, supabase]); // 添加 supabase 作为依赖项

  // 返回资料数据、加载状态、错误信息和刷新方法
  return {
    profile,
    error,
    isLoading,
    mutate: loadProfile
  };
}
