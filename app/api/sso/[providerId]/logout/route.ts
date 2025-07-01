// --- BEGIN COMMENT ---
// SSO注销处理API
// 核心功能：处理用户注销，清除本地会话并重定向到SSO提供商注销页面
// 确保完整的注销流程，包括本地和远程会话清理
// --- END COMMENT ---
import { SSOServiceFactory } from '@lib/services/sso/core/service-factory';
import { SSOProviderService } from '@lib/services/sso/data/sso-provider-service';

import { NextRequest, NextResponse } from 'next/server';

// --- BEGIN COMMENT ---
// GET请求处理：SSO注销
// 清除本地会话并重定向到SSO提供商的注销页面
// --- END COMMENT ---
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get('returnUrl') || '/login';
    const { providerId } = await params;

    console.log(`[SSO-LOGOUT] Processing logout for provider: ${providerId}`, {
      providerId,
      returnUrl,
    });

    // --- BEGIN COMMENT ---
    // 参数验证
    // --- END COMMENT ---
    if (!providerId) {
      return createLogoutResponse(request, returnUrl, '提供商ID无效');
    }

    // --- BEGIN COMMENT ---
    // 获取SSO提供商配置
    // --- END COMMENT ---
    const provider = await SSOProviderService.getProviderById(providerId);
    if (!provider) {
      return createLogoutResponse(request, returnUrl, '提供商不存在');
    }

    // --- BEGIN COMMENT ---
    // 创建响应并清除本地会话cookie
    // --- END COMMENT ---
    const response = createLogoutResponse(request, returnUrl);

    // --- BEGIN COMMENT ---
    // 如果提供商支持远程注销，则重定向到SSO注销页面
    // 否则直接重定向到本地页面
    // --- END COMMENT ---
    try {
      const ssoService = await SSOServiceFactory.createService(provider);
      const logoutUrl = ssoService.generateLogoutURL(returnUrl);

      console.log(`[SSO-LOGOUT] Redirecting to SSO logout: ${provider.name}`, {
        providerId,
        logoutUrl: logoutUrl.replace(/([?&])(token|ticket)=[^&]*/g, '$1$2=***'),
      });

      return NextResponse.redirect(logoutUrl);
    } catch (error) {
      console.warn(
        `[SSO-LOGOUT] SSO provider logout not available, using local logout:`,
        error
      );
      return response;
    }
  } catch (error) {
    console.error('[SSO-LOGOUT] SSO注销失败:', error);

    // --- BEGIN COMMENT ---
    // 即使出错也要清除本地会话
    // --- END COMMENT ---
    return createLogoutResponse(request, '/login', '注销过程中发生错误');
  }
}

// --- BEGIN COMMENT ---
// POST请求处理：程序化注销
// 支持通过POST请求进行注销，返回JSON响应
// --- END COMMENT ---
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { providerId } = await params;
    const body = await request.json();
    const returnUrl = body.returnUrl || '/login';

    console.log(
      `[SSO-LOGOUT] Processing programmatic logout for provider: ${providerId}`
    );

    // --- BEGIN COMMENT ---
    // 清除会话cookie
    // --- END COMMENT ---
    const response = NextResponse.json({
      success: true,
      message: '注销成功',
      redirectUrl: returnUrl,
    });

    response.cookies.set('sso-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // 立即过期
    });

    return response;
  } catch (error) {
    console.error('[SSO-LOGOUT] 程序化注销失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: '注销失败',
      },
      { status: 500 }
    );
  }
}

// --- BEGIN COMMENT ---
// 创建注销响应，清除会话cookie
// --- END COMMENT ---
function createLogoutResponse(
  request: NextRequest,
  returnUrl: string,
  message?: string
): NextResponse {
  const logoutUrl = new URL(returnUrl, request.url);

  if (message) {
    logoutUrl.searchParams.set('message', message);
  }

  const response = NextResponse.redirect(logoutUrl);

  // --- BEGIN COMMENT ---
  // 清除所有相关的认证cookie
  // --- END COMMENT ---
  response.cookies.set('sso-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // 立即过期
  });

  // --- BEGIN COMMENT ---
  // 清除NextAuth session cookie（如果存在）
  // --- END COMMENT ---
  response.cookies.set('next-auth.session-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });

  response.cookies.set('__Secure-next-auth.session-token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
  });

  return response;
}
