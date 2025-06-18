// --- BEGIN COMMENT ---
// SSO登录API
// 为已验证的SSO用户建立Supabase会话
// --- END COMMENT ---

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, ssoUserData } = await request.json();
    
    if (!userId || !userEmail || !ssoUserData) {
      return NextResponse.json(
        { message: 'SSO登录数据不完整' },
        { status: 400 }
      );
    }

    // --- BEGIN COMMENT ---
    // 验证SSO数据是否过期
    // --- END COMMENT ---
    if (Date.now() > ssoUserData.expiresAt) {
      return NextResponse.json(
        { message: 'SSO会话已过期' },
        { status: 401 }
      );
    }

    // --- BEGIN COMMENT ---
    // 使用Admin客户端为SSO用户生成会话
    // --- END COMMENT ---
    const adminSupabase = await createAdminClient();
    
    // --- BEGIN COMMENT ---
    // 验证用户是否存在于Supabase
    // --- END COMMENT ---
    const { data: user, error: userError } = await adminSupabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.error('SSO user not found in Supabase:', userError);
      return NextResponse.json(
        { message: '用户不存在' },
        { status: 404 }
      );
    }

    // --- BEGIN COMMENT ---
    // 为用户生成访问令牌 - 使用generateLink方法创建登录链接
    // --- END COMMENT ---
    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    if (linkError || !linkData) {
      console.error('Failed to generate login link:', linkError);
      return NextResponse.json(
        { message: '登录链接生成失败' },
        { status: 500 }
      );
    }

    // --- BEGIN COMMENT ---
    // 从生成的链接中提取会话信息
    // 由于直接获取令牌比较复杂，我们使用不同的方法
    // 我们将返回用户信息，让前端使用signInWithOtp或其他方法
    // --- END COMMENT ---
    
    // --- BEGIN COMMENT ---
    // 创建临时会话数据，使用Admin权限
    // 这里我们使用一个变通方法：生成临时密码并使用它登录
    // --- END COMMENT ---
    const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // --- BEGIN COMMENT ---
    // 更新用户密码（临时）
    // --- END COMMENT ---
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(userId, {
      password: tempPassword,
    });

    if (updateError) {
      console.error('Failed to set temporary password:', updateError);
      return NextResponse.json(
        { message: '密码设置失败' },
        { status: 500 }
      );
    }

    // --- BEGIN COMMENT ---
    // 使用临时密码进行登录获取会话
    // --- END COMMENT ---
    const { data: signInData, error: signInError } = await adminSupabase.auth.signInWithPassword({
      email: userEmail,
      password: tempPassword,
    });

    if (signInError || !signInData.session) {
      console.error('Failed to sign in with temporary password:', signInError);
      return NextResponse.json(
        { message: '会话创建失败' },
        { status: 500 }
      );
    }

    // --- BEGIN COMMENT ---
    // 清理临时密码（可选，让用户继续使用SSO）
    // --- END COMMENT ---
    try {
      await adminSupabase.auth.admin.updateUserById(userId, {
        password: undefined, // 清除密码，强制用户使用SSO
      });
    } catch (cleanupError) {
      console.warn('Failed to cleanup temporary password:', cleanupError);
      // 不阻断登录流程
    }

    console.log(`SSO signin successful for user: ${userId}`);

    return NextResponse.json({
      success: true,
      session: signInData.session,
      message: 'SSO登录成功',
    });

  } catch (error) {
    console.error('SSO signin failed:', error);
    return NextResponse.json(
      { message: `登录失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
} 