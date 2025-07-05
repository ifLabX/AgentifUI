// --- BEGIN COMMENT ---
// 公共SSO提供商列表API
// 返回所有启用的SSO提供商信息，供登录页面使用
// 不需要认证，但只返回公开信息
// --- END COMMENT ---
import type { PublicSsoProvider } from '@lib/types/sso/auth-types';

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// --- BEGIN COMMENT ---
// GET请求处理：获取启用的SSO提供商列表
// 公开API，用于登录页面显示可用的SSO选项
// --- END COMMENT ---
export async function GET() {
  if (process.env.NEXT_PUBLIC_ENABLE_DYNAMIC_SSO !== 'true') {
    return NextResponse.json(
      { error: 'Dynamic SSO is not enabled' },
      { status: 404 }
    );
  }

  try {
    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: ssoProviders, error } = await supabase
      .from('sso_providers')
      .select('id, name, protocol, display_order, button_text')
      .eq('enabled', true)
      .order('display_order', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(ssoProviders as PublicSsoProvider[]);
  } catch (error: any) {
    console.error('Error fetching SSO providers:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
