// --- BEGIN COMMENT ---
// 公共SSO提供商列表API
// 返回所有启用的SSO提供商信息，供登录页面使用
// 不需要认证，但只返回公开信息
// --- END COMMENT ---
import { SSOProviderService } from '@lib/services/sso/data/sso-provider-service';

import { NextRequest, NextResponse } from 'next/server';

// --- BEGIN COMMENT ---
// GET请求处理：获取启用的SSO提供商列表
// 公开API，用于登录页面显示可用的SSO选项
// --- END COMMENT ---
export async function GET(request: NextRequest) {
  try {
    // --- BEGIN COMMENT ---
    // 获取所有启用的提供商
    // --- END COMMENT ---
    const providers = await SSOProviderService.getEnabledProviders();

    // --- BEGIN COMMENT ---
    // 过滤敏感信息，只返回前端需要的公开信息
    // --- END COMMENT ---
    const publicProviders = providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      protocol: provider.protocol,
      button_text: provider.button_text || provider.name,
      ui: {
        icon: provider.settings.ui?.icon || '🔐',
        theme: provider.settings.ui?.theme || 'primary',
        description:
          provider.settings.ui?.description || `${provider.name}登录`,
      },
      login_url: `/api/sso/${provider.id}/login`,
    }));

    console.log(
      `[SSO-PROVIDERS] Returning ${publicProviders.length} enabled providers`
    );

    return NextResponse.json({
      success: true,
      data: publicProviders,
      count: publicProviders.length,
    });
  } catch (error) {
    console.error('[SSO-PROVIDERS] Failed to fetch SSO providers:', error);

    return NextResponse.json(
      {
        success: false,
        error: '获取SSO提供商列表失败',
        data: [],
      },
      { status: 500 }
    );
  }
}
