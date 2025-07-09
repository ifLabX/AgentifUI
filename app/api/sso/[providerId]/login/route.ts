/**
 * 通用SSO登录入口
 * 处理任何CAS提供商的SSO登录请求，重定向到相应的CAS服务器
 */
import { CASConfigService } from '@lib/services/sso/generic-cas-service';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const returnUrl = searchParams.get('returnUrl') || '/chat';
    const { providerId } = params;

    console.log(
      `SSO login initiated for provider: ${providerId}, return URL: ${returnUrl}`
    );

    // 验证returnUrl的安全性，防止开放重定向攻击
    const allowedReturnUrls = [
      '/chat',
      '/dashboard',
      '/settings',
      '/apps',
      '/', // 首页
    ];

    // 检查returnUrl是否为相对路径且在允许列表中
    const isValidReturnUrl =
      returnUrl.startsWith('/') &&
      (allowedReturnUrls.includes(returnUrl) || returnUrl.startsWith('/chat/'));

    const safeReturnUrl = isValidReturnUrl ? returnUrl : '/chat';

    if (returnUrl !== safeReturnUrl) {
      console.warn(
        `Invalid return URL rejected: ${returnUrl}, using default: ${safeReturnUrl}`
      );
    }

    // 创建通用CAS服务实例
    const casService = await CASConfigService.createCASService(providerId);

    // 生成登录URL并重定向
    const loginUrl = casService.generateLoginURL(safeReturnUrl);

    console.log(
      `Redirecting to CAS login: ${loginUrl.replace(/service=[^&]+/, 'service=***')}`
    );

    // 添加详细调试信息
    console.log(`Full login URL (for debugging): ${loginUrl}`);
    console.log(`User Agent: ${request.headers.get('user-agent')}`);
    console.log(`Referer: ${request.headers.get('referer')}`);

    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error(`SSO login failed for provider ${params.providerId}:`, error);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const errorMessage = error instanceof Error ? error.message : '未知错误';

    return NextResponse.redirect(
      new URL(
        `/login?error=sso_config_error&message=${encodeURIComponent(`SSO配置错误: ${errorMessage}`)}`,
        appUrl
      )
    );
  }
}
