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
        
        // 调试信息：会话状态
        console.log('调试 - 会话状态:', {
          有会话: !!session,
          会话错误: sessionError,
          用户ID: session?.user?.id,
          用户邮箱: session?.user?.email,
        });
        
        if (!session) {
          console.log('调试 - 无会话，用户未登录');
          // 如果用户未登录，设置为非管理员
          setIsAdmin(false);
          
          // 如果需要重定向，跳转到登录页面
          if (redirectOnFailure) {
            console.log('调试 - 准备重定向到登录页面');
            // 使用 setTimeout 延迟重定向，让错误信息有时间显示
            setTimeout(() => {
              router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
            }, 3000); // 延迟 3 秒
          }
          return;
        }
        
        // 检查用户是否为管理员
        console.log('调试 - 开始查询 profiles 表，用户ID:', session.user.id);
        
        // 首先直接查询所有 profiles 记录，来确认表是否存在数据
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('*')
          .limit(5);
          
        console.log('调试 - profiles 表数据样本:', {
          记录数: allProfiles?.length || 0,
          错误: allProfilesError,
          样本数据: allProfiles
        });
        
        // 然后查询当前用户的 profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*') // 选择所有字段以便调试
          .eq('id', session.user.id)
          .single();
          
        console.log('调试 - 当前用户的 profile 数据:', {
          用户ID: session.user.id,
          profile: profile,
          错误: profileError,
          角色字段值: profile?.role,
          角色字段类型: profile?.role ? typeof profile.role : 'undefined'
        });
        
        if (profileError) {
          console.error('调试 - 查询 profile 时出错:', profileError);
          throw profileError;
        }
        
        // 检查角色是否为 admin
        const isUserAdmin = profile?.role === 'admin';
        console.log('调试 - 用户管理员状态:', {
          角色值: profile?.role,
          是管理员: isUserAdmin,
          比较结果: `"${profile?.role}" === "admin" = ${profile?.role === 'admin'}`
        });
        
        setIsAdmin(isUserAdmin);
        
        // 如果不是管理员且需要重定向
        if (!isUserAdmin && redirectOnFailure) {
          console.log('调试 - 用户不是管理员，准备重定向到首页');
          // 使用 setTimeout 延迟重定向，让错误信息有时间显示
          setTimeout(() => {
            // 已登录但不是管理员，跳转到首页
            router.push('/');
          }, 3000); // 延迟 3 秒
        } else if (isUserAdmin) {
          console.log('调试 - 用户是管理员，允许访问');
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
