// --- BEGIN COMMENT ---
// SSO认证回调处理API
// 核心功能：处理SSO认证成功后的回调，验证认证信息并同步用户
// 解决CAS和OIDC回调处理，确保用户信息正确同步到本地系统
// --- END COMMENT ---
import { createSSOSessionToken } from '@lib/auth/sso-session';
import { SSOServiceFactory } from '@lib/services/admin/sso/core/service-factory';
import { SSOProviderService } from '@lib/services/admin/sso/data/sso-provider-service';
import { UserSyncService } from '@lib/services/admin/sso/user/user-sync-service';

import { NextRequest, NextResponse } from 'next/server';

// --- BEGIN COMMENT ---
// GET请求处理：SSO认证回调
// 处理不同协议的认证回调（CAS ticket验证、OIDC code交换等）
// --- END COMMENT ---
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get('returnUrl') || '/';
    const { providerId } = await params;

    // --- BEGIN COMMENT ---
    // 参数验证
    // --- END COMMENT ---
    if (!providerId) {
      return createErrorResponse(
        request,
        'SSO提供商ID不能为空',
        'invalid_provider'
      );
    }

    // --- BEGIN COMMENT ---
    // 获取SSO提供商配置
    // --- END COMMENT ---
    const provider = await SSOProviderService.getProviderById(providerId);
    if (!provider || !provider.enabled) {
      return createErrorResponse(
        request,
        'SSO提供商不存在或已禁用',
        'provider_not_found'
      );
    }

    // --- BEGIN COMMENT ---
    // 创建SSO服务实例
    // --- END COMMENT ---
    const ssoService = await SSOServiceFactory.createService(provider);

    // --- BEGIN COMMENT ---
    // 提取认证参数（支持不同协议）
    // CAS: ticket, service
    // OIDC: code, state
    // --- END COMMENT ---
    const authParams = Object.fromEntries(searchParams.entries());

    console.log(
      `[SSO-CALLBACK] Processing callback for provider: ${provider.name}`,
      {
        providerId,
        protocol: provider.protocol,
        hasTicket: !!authParams.ticket,
        hasCode: !!authParams.code,
        returnUrl,
      }
    );

    // --- BEGIN COMMENT ---
    // 验证认证信息
    // 使用协议特定的验证逻辑（CAS ticket验证、OIDC token交换等）
    // --- END COMMENT ---
    const userInfo = await ssoService.validateAuth(authParams);

    console.log(
      `[SSO-CALLBACK] Authentication successful for user: ${userInfo.username}`,
      {
        providerId,
        username: userInfo.username,
        email: userInfo.email,
      }
    );

    // --- BEGIN COMMENT ---
    // 同步用户信息到本地数据库
    // --- END COMMENT ---
    const user = await UserSyncService.syncUser(userInfo, provider);

    // --- BEGIN COMMENT ---
    // 创建会话令牌并设置认证cookie
    // 使用简化的会话管理，避免复杂的NextAuth集成
    // --- END COMMENT ---
    const sessionData = {
      userId: user.id,
      username: user.username || userInfo.username,
      email: user.email || userInfo.email,
      name: user.full_name || userInfo.name,
      provider: provider.name,
      providerId: provider.id,
      loginAt: new Date().toISOString(),
    };

    const sessionToken = createSSOSessionToken(sessionData);

    // --- BEGIN COMMENT ---
    // 构建成功回调URL
    // --- END COMMENT ---
    const successUrl = new URL(returnUrl, request.url);
    const response = NextResponse.redirect(successUrl);

    // --- BEGIN COMMENT ---
    // 设置会话cookie
    // --- END COMMENT ---
    response.cookies.set('sso-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24小时
    });

    console.log(`[SSO-CALLBACK] Callback completed successfully`, {
      providerId,
      userId: user.id,
      returnUrl,
    });

    return response;
  } catch (error) {
    console.error('[SSO-CALLBACK] SSO回调处理失败:', error);

    return createErrorResponse(
      request,
      error instanceof Error ? error.message : '认证回调处理失败',
      'callback_failed'
    );
  }
}

// --- BEGIN COMMENT ---
// 统一错误响应处理
// --- END COMMENT ---
function createErrorResponse(
  request: NextRequest,
  message: string,
  errorType: string
): NextResponse {
  const errorUrl = new URL('/login', request.url);
  errorUrl.searchParams.set('error', errorType);
  errorUrl.searchParams.set('message', message);

  return NextResponse.redirect(errorUrl);
}
