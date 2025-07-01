// --- BEGIN COMMENT ---
// SSO登录入口API
// 核心功能：为指定提供商生成登录URL并重定向用户
// 解决CAS service参数构建问题，确保认证流程稳定
// --- END COMMENT ---
import { SSOServiceFactory } from '@lib/services/sso/core/service-factory';
import { SSOProviderService } from '@lib/services/sso/data/sso-provider-service';

import { NextRequest, NextResponse } from 'next/server';

// --- BEGIN COMMENT ---
// GET请求处理：SSO登录重定向
// 根据提供商ID生成对应的登录URL并重定向用户
// --- END COMMENT ---
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get('returnUrl');
    const { providerId } = await params;

    // --- BEGIN COMMENT ---
    // 参数验证
    // --- END COMMENT ---
    if (!providerId) {
      return NextResponse.json(
        { error: 'SSO提供商ID不能为空' },
        { status: 400 }
      );
    }

    // --- BEGIN COMMENT ---
    // 获取SSO提供商配置
    // 验证提供商是否存在且已启用
    // --- END COMMENT ---
    const provider = await SSOProviderService.getProviderById(providerId);
    if (!provider) {
      return NextResponse.json({ error: 'SSO提供商不存在' }, { status: 404 });
    }

    if (!provider.enabled) {
      return NextResponse.json({ error: 'SSO提供商已禁用' }, { status: 403 });
    }

    // --- BEGIN COMMENT ---
    // 创建SSO服务实例
    // 使用服务工厂根据协议类型创建对应的服务
    // --- END COMMENT ---
    const ssoService = await SSOServiceFactory.createService(provider);

    // --- BEGIN COMMENT ---
    // 生成登录URL
    // 使用修复后的URL构建逻辑，确保service参数正确
    // --- END COMMENT ---
    const loginUrl = ssoService.generateLoginURL(returnUrl || undefined);

    console.log(`[SSO-LOGIN] Redirecting to SSO provider: ${provider.name}`, {
      providerId,
      protocol: provider.protocol,
      returnUrl,
      loginUrl: loginUrl.replace(
        /([?&])(client_secret|password)=[^&]*/g,
        '$1$2=***'
      ),
    });

    // --- BEGIN COMMENT ---
    // 重定向到SSO登录页面
    // --- END COMMENT ---
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('[SSO-LOGIN] SSO登录失败:', error);

    // --- BEGIN COMMENT ---
    // 错误处理：重定向到登录页面并显示错误信息
    // --- END COMMENT ---
    const errorUrl = new URL('/login', request.url);
    errorUrl.searchParams.set('error', 'sso_login_failed');
    errorUrl.searchParams.set('message', '无法启动SSO登录流程');

    return NextResponse.redirect(errorUrl);
  }
}
