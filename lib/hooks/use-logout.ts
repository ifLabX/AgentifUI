'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@lib/supabase/client';

/**
 * 退出登录 Hook
 * 
 * 提供退出登录功能，处理所有相关逻辑，包括：
 * - 调用 Supabase Auth 的登出方法
 * - 清除本地状态
 * - 重定向到登录页面
 * 
 * @returns 包含退出登录方法和加载状态的对象
 * 
 * @example
 * ```tsx
 * const { logout, isLoggingOut } = useLogout();
 * 
 * return (
 *   <button 
 *     onClick={logout} 
 *     disabled={isLoggingOut}
 *   >
 *     {isLoggingOut ? '退出中...' : '退出登录'}
 *   </button>
 * );
 * ```
 */
export function useLogout() {
  const router = useRouter();
  const supabase = createClient();
  
  /**
   * 执行退出登录操作
   * - 调用 Supabase Auth 的登出方法
   * - 重定向到登录页面
   * - 刷新路由以更新认证状态
   */
  const logout = async () => {
    try {
      // 调用 Supabase Auth 的登出方法
      await supabase.auth.signOut();
      
      // 重定向到登录页面
      router.push('/login');
      
      // 刷新路由以更新认证状态
      router.refresh();
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };
  
  return { logout };
}
