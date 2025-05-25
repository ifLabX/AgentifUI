import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserProfile } from '@lib/db'; // 使用新的优化数据库接口
import { useSupabaseAuth } from '@lib/supabase/hooks';

export interface AdminAuthResult {
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * 用于检查用户是否为管理员的 Hook
 * 更新为使用新的数据服务和Result类型
 * 
 * @returns 管理员权限检查结果
 * 
 * @example
 * ```tsx
 * const { isAdmin, isLoading, error } = useAdminAuth();
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (!isAdmin) return <AccessDenied />;
 * 
 * // 管理员界面内容
 * ```
 */
export function useAdminAuth(redirectOnFailure: boolean = true): AdminAuthResult {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSupabaseAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        setIsLoading(true);
        setError(null);
        
        // 等待session加载完成
        if (sessionLoading) {
          return;
        }
        
        // 检查是否有有效的用户会话
        if (!session?.user) {
          // 如果用户未登录，设置为非管理员
          setIsAdmin(false);
          
          // 如果需要重定向且还没有重定向过，立即跳转到登录页面
          if (redirectOnFailure && !hasRedirected) {
            setHasRedirected(true);
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
          }
          return;
        }
        
        // --- BEGIN COMMENT ---
        // 使用新的数据服务获取当前用户资料
        // getCurrentUserProfile 已经包含了缓存和错误处理
        // --- END COMMENT ---
        const result = await getCurrentUserProfile();
        
        if (result.success && result.data) {
          // 检查角色是否为 admin
          const isUserAdmin = result.data.role === 'admin';
          
          setIsAdmin(isUserAdmin);
          
          // 如果不是管理员且需要重定向
          if (!isUserAdmin && redirectOnFailure && !hasRedirected) {
            setHasRedirected(true);
            // 已登录但不是管理员，立即跳转到首页
            router.push('/');
          }
        } else if (result.success && !result.data) {
          // 用户资料不存在
          setIsAdmin(false);
          throw new Error('用户资料不存在');
        } else {
          // 查询失败
          throw new Error(result.error?.message || '检查管理员状态时出错');
        }
      } catch (err) {
        console.error('检查管理员状态时出错:', err);
        setError(err instanceof Error ? err : new Error('检查管理员状态时出错'));
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAdminStatus();
  }, [session, sessionLoading, router, redirectOnFailure, hasRedirected]);
  
  return { isAdmin, isLoading, error };
}
