// --- BEGIN COMMENT ---
// 单个SSO提供商管理API
// 提供获取、更新、删除单个提供商的功能
// --- END COMMENT ---
import { SSODatabaseService } from '@lib/services/admin/sso/data/sso-database-service';
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
// GET /api/admin/sso/providers/[id]
// 获取单个SSO提供商详情
// --- END COMMENT ---
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    await verifyAdminAuth();

    // 获取路由参数
    const params = await context.params;

    // 创建数据库服务实例
    const ssoDbService = new SSODatabaseService(true);

    // 获取提供商详情
    const provider = await ssoDbService.getProviderById(params.id);

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'SSO提供商不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: provider,
    });
  } catch (error) {
    console.error('获取SSO提供商详情失败:', error);

    if (error instanceof Error) {
      if (error.message.includes('未授权') || error.message.includes('权限')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: '获取SSO提供商详情失败' },
      { status: 500 }
    );
  }
}

// --- BEGIN COMMENT ---
// PUT /api/admin/sso/providers/[id]
// 更新SSO提供商
// --- END COMMENT ---
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    await verifyAdminAuth();

    // 获取路由参数
    const params = await context.params;

    // 解析请求体
    const body = await request.json();

    // 创建数据库服务实例
    const ssoDbService = new SSODatabaseService(true);

    // 检查提供商是否存在
    const existingProvider = await ssoDbService.getProviderById(params.id);
    if (!existingProvider) {
      return NextResponse.json(
        { success: false, error: 'SSO提供商不存在' },
        { status: 404 }
      );
    }

    // 验证更新数据
    if (body.name && typeof body.name !== 'string') {
      return NextResponse.json(
        { success: false, error: '提供商名称格式无效' },
        { status: 400 }
      );
    }

    if (
      body.protocol &&
      !['CAS', 'OIDC', 'SAML', 'OAuth2'].includes(body.protocol)
    ) {
      return NextResponse.json(
        { success: false, error: '无效的协议类型' },
        { status: 400 }
      );
    }

    // 检查名称是否与其他提供商冲突
    if (body.name && body.name !== existingProvider.name) {
      const nameExists = await ssoDbService.isProviderNameExists(
        body.name,
        params.id
      );
      if (nameExists) {
        return NextResponse.json(
          { success: false, error: '提供商名称已存在' },
          { status: 400 }
        );
      }
    }

    // 如果更新了配置，进行验证
    if (body.settings || body.protocol) {
      const configToValidate = {
        ...existingProvider,
        ...body,
      };

      const validationResult =
        await ssoDbService.validateProviderConfig(configToValidate);
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
    }

    // 更新提供商
    const updatedProvider = await ssoDbService.updateProvider(params.id, body);

    return NextResponse.json({
      success: true,
      data: updatedProvider,
    });
  } catch (error) {
    console.error('更新SSO提供商失败:', error);

    if (error instanceof Error) {
      if (error.message.includes('未授权') || error.message.includes('权限')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: '更新SSO提供商失败' },
      { status: 500 }
    );
  }
}

// --- BEGIN COMMENT ---
// DELETE /api/admin/sso/providers/[id]
// 删除SSO提供商
// --- END COMMENT ---
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    await verifyAdminAuth();

    // 获取路由参数
    const params = await context.params;

    // 创建数据库服务实例
    const ssoDbService = new SSODatabaseService(true);

    // 检查提供商是否存在
    const existingProvider = await ssoDbService.getProviderById(params.id);
    if (!existingProvider) {
      return NextResponse.json(
        { success: false, error: 'SSO提供商不存在' },
        { status: 404 }
      );
    }

    // 删除提供商
    await ssoDbService.deleteProvider(params.id);

    return NextResponse.json({
      success: true,
      message: '提供商删除成功',
    });
  } catch (error) {
    console.error('删除SSO提供商失败:', error);

    if (error instanceof Error) {
      if (error.message.includes('未授权') || error.message.includes('权限')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: '删除SSO提供商失败' },
      { status: 500 }
    );
  }
}

// --- BEGIN COMMENT ---
// PATCH /api/admin/sso/providers/[id]
// 切换提供商状态（启用/禁用）
// --- END COMMENT ---
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    await verifyAdminAuth();

    // 获取路由参数
    const params = await context.params;

    // 解析请求体
    const body = await request.json();

    // 创建数据库服务实例
    const ssoDbService = new SSODatabaseService(true);

    // 更新提供商状态
    const updatedProvider = await ssoDbService.updateProvider(params.id, {
      enabled: body.enabled,
    });

    return NextResponse.json({
      success: true,
      data: updatedProvider,
      message: `提供商已${updatedProvider.enabled ? '启用' : '禁用'}`,
    });
  } catch (error) {
    console.error('切换提供商状态失败:', error);

    if (error instanceof Error) {
      if (error.message.includes('未授权') || error.message.includes('权限')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'SSO提供商不存在' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: '切换提供商状态失败' },
      { status: 500 }
    );
  }
}
