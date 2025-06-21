// --- BEGIN COMMENT ---
// SSO提供商管理API - 主路由
// 支持获取列表和创建新提供商
// --- END COMMENT ---

import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllSSOProviders, 
  createSSOProvider,
  type SSOProviderFilters,
  type CreateSSOProviderData 
} from '@lib/db/sso-providers';
import { SSOConfigService } from '@lib/services/sso';
import { verifyAdminAuth } from '@lib/auth/admin-auth';

// --- BEGIN COMMENT ---
// 🎯 获取所有SSO提供商
// 支持筛选、搜索和排序
// --- END COMMENT ---
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdminAuth();
    if (!authResult.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error || '需要管理员权限' },
        { status: 401 }
      );
    }

    // 解析查询参数
    const searchParams = request.nextUrl.searchParams;
    const filters: SSOProviderFilters = {
      protocol: searchParams.get('protocol') as any || undefined,
      enabled: searchParams.get('enabled') ? searchParams.get('enabled') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
      orderBy: searchParams.get('orderBy') as any || 'display_order',
      orderDirection: searchParams.get('orderDirection') as any || 'asc'
    };

    console.log('Fetching SSO providers with filters:', filters);

    // 获取提供商列表
    const providers = await getAllSSOProviders(filters);

    // 统计信息
    const stats = {
      total: providers.length,
      enabled: providers.filter(p => p.enabled).length,
      disabled: providers.filter(p => !p.enabled).length,
      protocols: [...new Set(providers.map(p => p.protocol))]
    };

    return NextResponse.json({
      success: true,
      data: providers,
      stats,
      filters
    });
  } catch (error) {
    console.error('Failed to fetch SSO providers:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : '获取SSO提供商列表失败' 
      },
      { status: 500 }
    );
  }
}

// --- BEGIN COMMENT ---
// 🎯 创建新的SSO提供商
// --- END COMMENT ---
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdminAuth();
    if (!authResult.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error || '需要管理员权限' },
        { status: 401 }
      );
    }

    // 解析请求数据
    const body = await request.json();
    console.log('Creating SSO provider with data:', {
      name: body.name,
      protocol: body.protocol,
      enabled: body.enabled
    });

    // 数据验证
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Bad Request', message: '提供商名称不能为空' },
        { status: 400 }
      );
    }

    if (!body.protocol) {
      return NextResponse.json(
        { error: 'Bad Request', message: '协议类型不能为空' },
        { status: 400 }
      );
    }

    if (!body.settings || !body.settings.protocol_config) {
      return NextResponse.json(
        { error: 'Bad Request', message: '协议配置不能为空' },
        { status: 400 }
      );
    }

    // 验证配置
    const validation = await SSOConfigService.validateConfig(body.protocol, body.settings);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Bad Request', 
          message: '配置验证失败',
          details: validation.errors,
          warnings: validation.warnings
        },
        { status: 400 }
      );
    }

    // 构建创建数据
    const createData: CreateSSOProviderData = {
      name: body.name.trim(),
      protocol: body.protocol,
      settings: body.settings,
      button_text: body.button_text?.trim() || null,
      display_order: body.display_order || undefined,
      enabled: body.enabled !== undefined ? body.enabled : true,
      client_id: body.client_id?.trim() || null,
      client_secret: body.client_secret?.trim() || null,
      metadata_url: body.metadata_url?.trim() || null,
    };

    // 创建提供商
    const newProvider = await createSSOProvider(createData);

    // 清除缓存
    SSOConfigService.clearCache();

    console.log(`SSO provider created successfully: ${newProvider.name}`);

    return NextResponse.json({
      success: true,
      data: newProvider,
      message: 'SSO提供商创建成功',
      validation: {
        warnings: validation.warnings
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create SSO provider:', error);
    
    // 处理特定错误
    if (error instanceof Error) {
      if (error.message.includes('已存在')) {
        return NextResponse.json(
          { error: 'Conflict', message: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : '创建SSO提供商失败' 
      },
      { status: 500 }
    );
  }
} 