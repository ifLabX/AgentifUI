import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@lib/supabase/client';

export interface AdminAuthResult {
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * 用于检查用户是否为管理员的 Hook
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
  const supabase = createClient();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        setIsLoading(true);
        setError(null);
        
        // 获取当前会话
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!session) {
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
        
        // 首先直接查询所有 profiles 记录，来确认表是否存在数据
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('*')
          .limit(5);
        
        // 然后查询当前用户的 profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*') // 选择所有字段以便调试
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          throw profileError;
        }
        
        // 检查角色是否为 admin
        const isUserAdmin = profile?.role === 'admin';
        
        setIsAdmin(isUserAdmin);
        
        // 如果不是管理员且需要重定向
        if (!isUserAdmin && redirectOnFailure) {
          // 使用 setTimeout 延迟重定向，让错误信息有时间显示
          setTimeout(() => {
            // 已登录但不是管理员，跳转到首页
            router.push('/');
          }, 3000); // 延迟 3 秒
        } else if (isUserAdmin) {
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
  }, [supabase, router, redirectOnFailure]);
  
  return { isAdmin, isLoading, error };
}
