// --- BEGIN COMMENT ---
// 服务器端管理员权限验证模块
// 用于API路由验证管理员权限
// --- END COMMENT ---

import { createClient } from '@lib/supabase/server';

// --- BEGIN COMMENT ---
// 🎯 服务器端管理员权限验证函数（用于API路由）
// --- END COMMENT ---
export async function verifyAdminAuth(): Promise<{ isAdmin: boolean; user: any; error?: string }> {
  try {
    const supabase = await createClient();
    
    // 获取当前用户会话
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { isAdmin: false, user: null, error: 'Authentication required' };
    }

    // 获取用户资料
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { isAdmin: false, user, error: 'Profile not found' };
    }

    return { 
      isAdmin: profile.role === 'admin', 
      user,
      error: profile.role !== 'admin' ? 'Admin role required' : undefined
    };
  } catch (error) {
    console.error('Admin auth verification error:', error);
    return { 
      isAdmin: false, 
      user: null, 
      error: error instanceof Error ? error.message : 'Authentication failed' 
    };
  }
} 