/**
 * 通用SSO注销处理
 * 处理任何CAS提供商的注销请求
 */
import { CASConfigService } from '@lib/services/sso/generic-cas-service';
import { createAdminClient } from '@lib/supabase/server';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

export async function GET(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  const requestUrl = new URL(request.url);
  const returnUrl = requestUrl.searchParams.get('returnUrl') || '/login';
  const { providerId } = params;

  console.log(
    `SSO logout initiated for provider ${providerId}, return URL: ${returnUrl}`
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not configured');
  }

  try {
    // 创建通用CAS服务实例
    const casService = await CASConfigService.createCASService(providerId);
    const casConfig = casService.getConfig();

    // 生成CAS注销URL
    const logoutUrl = casService.generateLogoutURL(
      new URL(returnUrl, appUrl).toString()
    );

    console.log(
      `Redirecting to CAS logout for ${casConfig.name}: ${logoutUrl}`
    );

    return NextResponse.redirect(logoutUrl);
  } catch (error) {
    console.error(`SSO logout failed for provider ${providerId}:`, error);

    // 即使CAS注销失败，也要清理本地会话
    return NextResponse.redirect(new URL(returnUrl, appUrl));
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  const { providerId } = params;
  console.log(`Processing SSO logout POST request for provider ${providerId}`);

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // 登出Supabase会话
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase signout error:', error);
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 500 }
      );
    }

    // 创建通用CAS服务实例
    const casService = await CASConfigService.createCASService(providerId);
    const casConfig = casService.getConfig();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL is not configured');
    }

    // 生成CAS注销URL
    const logoutUrl = casService.generateLogoutURL(
      new URL('/login', appUrl).toString()
    );

    console.log(`Generated CAS logout URL for ${casConfig.name}: ${logoutUrl}`);

    return NextResponse.json({
      success: true,
      logoutUrl: logoutUrl,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error(
      `SSO logout processing failed for provider ${providerId}:`,
      error
    );

    return NextResponse.json(
      {
        error: 'Logout failed',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
