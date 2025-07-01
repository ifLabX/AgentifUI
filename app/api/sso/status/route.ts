// --- BEGIN COMMENT ---
// SSO登录状态检查API
// 返回当前用户的SSO登录状态和基本信息
// 用于前端页面的认证状态检查
// --- END COMMENT ---
import { getSSOSession } from '@lib/auth/sso-session';

import { NextRequest, NextResponse } from 'next/server';

// --- BEGIN COMMENT ---
// GET请求处理：检查SSO登录状态
// 返回当前用户的认证状态和基本信息
// --- END COMMENT ---
export async function GET(request: NextRequest) {
  try {
    // --- BEGIN COMMENT ---
    // 获取SSO会话信息
    // --- END COMMENT ---
    const session = getSSOSession(request);

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        message: '未登录',
      });
    }

    // --- BEGIN COMMENT ---
    // 返回用户基本信息（不包含敏感数据）
    // --- END COMMENT ---
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        username: session.username,
        name: session.name,
        email: session.email,
        provider: session.provider,
        loginAt: session.loginAt,
      },
      message: '已登录',
    });
  } catch (error) {
    console.error('[SSO-STATUS] Failed to check SSO status:', error);

    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        error: '状态检查失败',
      },
      { status: 500 }
    );
  }
}
