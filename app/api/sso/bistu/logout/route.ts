// --- BEGIN COMMENT ---
// 北京信息科技大学SSO注销处理
// 处理用户注销请求，清除本地会话并重定向到CAS注销页面
// --- END COMMENT ---
import { createBistuCASService } from '@lib/services/admin/sso/bistu-cas-service';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('SSO logout initiated');

    // --- BEGIN COMMENT ---
    // 获取查询参数
    // --- END COMMENT ---
    const searchParams = request.nextUrl.searchParams;
    const returnUrl = searchParams.get('returnUrl');

    // --- BEGIN COMMENT ---
    // 验证returnUrl的安全性
    // --- END COMMENT ---
    let safeReturnUrl: string | undefined;
    if (returnUrl) {
      // --- BEGIN COMMENT ---
      // 只允许相对路径或指定域名
      // --- END COMMENT ---
      const allowedUrls = ['/login', '/', '/about'];
      const isValidUrl =
        returnUrl.startsWith('/') &&
        allowedUrls.some(
          url => returnUrl === url || returnUrl.startsWith(url + '?')
        );

      if (isValidUrl) {
        safeReturnUrl = `${request.nextUrl.origin}${returnUrl}`;
      } else {
        console.warn(`Invalid logout return URL rejected: ${returnUrl}`);
      }
    }

    // --- BEGIN COMMENT ---
    // 创建CAS服务实例
    // --- END COMMENT ---
    const casService = createBistuCASService();

    // --- BEGIN COMMENT ---
    // 生成CAS注销URL
    // --- END COMMENT ---
    const logoutUrl = casService.generateLogoutURL(safeReturnUrl);

    console.log(
      `Redirecting to CAS logout: ${logoutUrl.replace(/service=[^&]+/, 'service=***')}`
    );

    // --- BEGIN COMMENT ---
    // 创建响应并清除本地会话
    // --- END COMMENT ---
    const response = NextResponse.redirect(logoutUrl);

    // --- BEGIN COMMENT ---
    // 清除所有相关的cookie和会话数据
    // 注意：localStorage缓存清理由前端useLogout hook处理
    // --- END COMMENT ---
    const cookiesToClear = [
      'sso_session',
      'sb-access-token',
      'sb-refresh-token',
      // --- BEGIN COMMENT ---
      // 添加其他需要清除的会话cookie
      // --- END COMMENT ---
    ];

    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // 立即过期
        path: '/',
      });
    });

    // --- BEGIN COMMENT ---
    // 记录注销日志
    // --- END COMMENT ---
    console.log('SSO logout: local session cleared, redirecting to CAS logout');

    return response;
  } catch (error) {
    console.error('SSO logout failed:', error);

    // --- BEGIN COMMENT ---
    // 注销失败，仍然清除本地会话并重定向到登录页面
    // --- END COMMENT ---
    const response = NextResponse.redirect(
      new URL('/login?message=注销完成', request.url)
    );

    // --- BEGIN COMMENT ---
    // 即使出错也要清除本地会话
    // --- END COMMENT ---
    response.cookies.set('sso_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  }
}

// --- BEGIN COMMENT ---
// 支持POST方法，用于前端JavaScript调用
// --- END COMMENT ---
export async function POST(request: NextRequest) {
  // --- BEGIN COMMENT ---
  // POST请求通常用于前端Ajax调用
  // 返回JSON响应而不是重定向
  // --- END COMMENT ---

  try {
    console.log('SSO logout via POST request');

    // --- BEGIN COMMENT ---
    // 解析请求体获取参数
    // --- END COMMENT ---
    let returnUrl: string | undefined;
    try {
      const body = await request.json();
      returnUrl = body.returnUrl;
    } catch {
      // 如果解析失败，忽略并继续
    }

    // --- BEGIN COMMENT ---
    // 创建CAS服务实例
    // --- END COMMENT ---
    const casService = createBistuCASService();

    // --- BEGIN COMMENT ---
    // 验证returnUrl
    // --- END COMMENT ---
    let safeReturnUrl: string | undefined;
    if (returnUrl && returnUrl.startsWith('/')) {
      safeReturnUrl = `${request.nextUrl.origin}${returnUrl}`;
    }

    // --- BEGIN COMMENT ---
    // 生成注销URL
    // --- END COMMENT ---
    const logoutUrl = casService.generateLogoutURL(safeReturnUrl);

    // --- BEGIN COMMENT ---
    // 创建响应，清除cookie
    // --- END COMMENT ---
    const response = NextResponse.json({
      success: true,
      logoutUrl,
      message: '注销成功',
    });

    // --- BEGIN COMMENT ---
    // 清除会话cookie
    // --- END COMMENT ---
    response.cookies.set('sso_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    console.log('SSO POST logout successful');
    return response;
  } catch (error) {
    console.error('SSO POST logout failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'logout_failed',
        message: '注销处理失败',
      },
      { status: 500 }
    );
  }
}
