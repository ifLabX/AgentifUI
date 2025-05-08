import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

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
  const supabase = createClientComponentClient();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        setIsLoading(true);
        setError(null);
        
        // 获取当前会话
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (redirectOnFailure) {
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
          }
          setIsAdmin(false);
          return;
        }
        
        // 检查用户是否为管理员
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) {
          throw profileError;
        }
        
        const isUserAdmin = profile?.role === 'admin';
        setIsAdmin(isUserAdmin);
        
        // 如果不是管理员且需要重定向
        if (!isUserAdmin && redirectOnFailure) {
          router.push('/');
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
