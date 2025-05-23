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
  const { session } = useSupabaseAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        setIsLoading(true);
        setError(null);
        
        // 检查是否有有效的用户会话
        if (!session?.user) {
          // 如果用户未登录，设置为非管理员
          setIsAdmin(false);
          
          // 如果需要重定向，跳转到登录页面
          if (redirectOnFailure) {
            // 使用 setTimeout 延迟重定向，让错误信息有时间显示
            setTimeout(() => {
              router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
            }, 3000); // 延迟 3 秒
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
          if (!isUserAdmin && redirectOnFailure) {
            // 使用 setTimeout 延迟重定向，让错误信息有时间显示
            setTimeout(() => {
              // 已登录但不是管理员，跳转到首页
              router.push('/');
            }, 3000); // 延迟 3 秒
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
  }, [session, router, redirectOnFailure]);
  
  return { isAdmin, isLoading, error };
}
