// --- BEGIN COMMENT ---
// SSO提供商管理API
// 提供完整的CRUD操作，仅管理员可访问
// --- END COMMENT ---
import { SSODatabaseService } from '@lib/services/sso/data/sso-database-service';
import { createClient } from '@lib/supabase/server';

import { NextRequest, NextResponse } from 'next/server';

// --- BEGIN COMMENT ---
// 验证管理员权限的助手函数
// --- END COMMENT ---
async function verifyAdminAuth() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('未授权访问');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    throw new Error('需要管理员权限');
  }

  return { user, profile };
}

// --- BEGIN COMMENT ---
// GET /api/admin/sso/providers
// 获取所有SSO提供商列表
// --- END COMMENT ---
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    await verifyAdminAuth();

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') as
      | 'active'
      | 'inactive'
      | null;

    // 创建数据库服务实例
    const ssoDbService = new SSODatabaseService(true);

    // 获取提供商列表
    const providers = await ssoDbService.getAllProviders(
      statusFilter || undefined
    );

    return NextResponse.json({
      success: true,
      data: providers,
      meta: {
        total: providers.length,
        filtered: statusFilter ? providers.length : undefined,
      },
    });
  } catch (error) {
    console.error('获取SSO提供商失败:', error);

    if (error instanceof Error) {
      if (error.message.includes('未授权') || error.message.includes('权限')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: '获取SSO提供商失败' },
      { status: 500 }
    );
  }
}

// --- BEGIN COMMENT ---
// POST /api/admin/sso/providers
// 创建新的SSO提供商
// --- END COMMENT ---
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    await verifyAdminAuth();

    // 解析请求体
    const body = await request.json();

    // 基础字段验证
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { success: false, error: '提供商名称为必填项' },
        { status: 400 }
      );
    }

    if (
      !body.protocol ||
      !['CAS', 'OIDC', 'SAML', 'OAuth2'].includes(body.protocol)
    ) {
      return NextResponse.json(
        { success: false, error: '无效的协议类型' },
        { status: 400 }
      );
    }

    if (!body.settings || typeof body.settings !== 'object') {
      return NextResponse.json(
        { success: false, error: '配置信息为必填项' },
        { status: 400 }
      );
    }

    // 创建数据库服务实例
    const ssoDbService = new SSODatabaseService(true);

    // 检查名称是否已存在
    const nameExists = await ssoDbService.isProviderNameExists(body.name);
    if (nameExists) {
      return NextResponse.json(
        { success: false, error: '提供商名称已存在' },
        { status: 400 }
      );
    }

    // 验证提供商配置
    const validationResult = await ssoDbService.validateProviderConfig(body);
    if (!validationResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: '配置验证失败',
          details: validationResult.errors,
        },
        { status: 400 }
      );
    }

    // 创建提供商
    const provider = await ssoDbService.createProvider({
      name: body.name,
      protocol: body.protocol,
      settings: body.settings,
      client_id: body.client_id || null,
      client_secret: body.client_secret || null,
      metadata_url: body.metadata_url || null,
      enabled: body.enabled !== false, // 默认启用
      display_order: body.display_order || undefined,
      button_text: body.button_text || null,
    });

    return NextResponse.json(
      {
        success: true,
        data: provider,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('创建SSO提供商失败:', error);

    if (error instanceof Error) {
      if (error.message.includes('未授权') || error.message.includes('权限')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: '创建SSO提供商失败' },
      { status: 500 }
    );
  }
}
