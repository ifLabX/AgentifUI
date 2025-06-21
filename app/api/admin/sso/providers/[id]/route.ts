// --- BEGIN COMMENT ---
// SSO提供商管理API - 单个提供商操作
// 支持获取、更新和删除特定提供商
// --- END COMMENT ---

import { NextRequest, NextResponse } from 'next/server';
import { 
  getSSOProviderById, 
  updateSSOProvider,
  deleteSSOProvider,
  type UpdateSSOProviderData 
} from '@lib/db/sso-providers';
import { SSOConfigService } from '@lib/services/sso';
import { verifyAdminAuth } from '@lib/auth/admin-auth';

// --- BEGIN COMMENT ---
// 🎯 获取特定SSO提供商详情
// --- END COMMENT ---
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdminAuth();
    if (!authResult.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error || '需要管理员权限' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: 'Bad Request', message: '提供商ID不能为空' },
        { status: 400 }
      );
    }

    console.log(`Fetching SSO provider: ${id}`);

    // 获取提供商详情
    const provider = await getSSOProviderById(id);
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Not Found', message: 'SSO提供商不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: provider
    });

  } catch (error) {
    console.error(`Failed to fetch SSO provider ${params.id}:`, error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : '获取SSO提供商详情失败' 
      },
      { status: 500 }
    );
  }
}

// --- BEGIN COMMENT ---
// 🎯 更新特定SSO提供商
// --- END COMMENT ---
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdminAuth();
    if (!authResult.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error || '需要管理员权限' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: 'Bad Request', message: '提供商ID不能为空' },
        { status: 400 }
      );
    }

    // 解析请求数据
    const body = await request.json();
    console.log(`Updating SSO provider ${id} with data:`, {
      name: body.name,
      protocol: body.protocol,
      enabled: body.enabled
    });

    // 检查提供商是否存在
    const existingProvider = await getSSOProviderById(id);
    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Not Found', message: 'SSO提供商不存在' },
        { status: 404 }
      );
    }

    // 如果有配置更新，进行验证
    if (body.settings && body.protocol) {
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
    }

    // 构建更新数据
    const updateData: UpdateSSOProviderData = {};
    
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.protocol !== undefined) updateData.protocol = body.protocol;
    if (body.settings !== undefined) updateData.settings = body.settings;
    if (body.button_text !== undefined) updateData.button_text = body.button_text?.trim() || null;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;
    if (body.enabled !== undefined) updateData.enabled = body.enabled;
    if (body.client_id !== undefined) updateData.client_id = body.client_id?.trim() || null;
    if (body.client_secret !== undefined) updateData.client_secret = body.client_secret?.trim() || null;
    if (body.metadata_url !== undefined) updateData.metadata_url = body.metadata_url?.trim() || null;

    // 更新提供商
    const updatedProvider = await updateSSOProvider(id, updateData);

    // 清除缓存
    SSOConfigService.clearProviderCache(id);

    console.log(`SSO provider updated successfully: ${updatedProvider.name}`);

    return NextResponse.json({
      success: true,
      data: updatedProvider,
      message: 'SSO提供商更新成功'
    });

  } catch (error) {
    console.error(`Failed to update SSO provider ${params.id}:`, error);
    
    // 处理特定错误
    if (error instanceof Error) {
      if (error.message.includes('已被其他提供商使用')) {
        return NextResponse.json(
          { error: 'Conflict', message: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : '更新SSO提供商失败' 
      },
      { status: 500 }
    );
  }
}

// --- BEGIN COMMENT ---
// 🎯 删除特定SSO提供商（软删除）
// --- END COMMENT ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdminAuth();
    if (!authResult.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error || '需要管理员权限' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: 'Bad Request', message: '提供商ID不能为空' },
        { status: 400 }
      );
    }

    console.log(`Deleting SSO provider: ${id}`);

    // 检查提供商是否存在
    const existingProvider = await getSSOProviderById(id);
    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Not Found', message: 'SSO提供商不存在' },
        { status: 404 }
      );
    }

    // 检查是否为默认提供商（北京信息科技大学）
    if (existingProvider.name === '北京信息科技大学') {
      return NextResponse.json(
        { error: 'Forbidden', message: '不能删除默认的北京信息科技大学SSO提供商' },
        { status: 403 }
      );
    }

    // 软删除提供商
    const success = await deleteSSOProvider(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Internal Server Error', message: '删除SSO提供商失败' },
        { status: 500 }
      );
    }

    // 清除缓存
    SSOConfigService.clearProviderCache(id);

    console.log(`SSO provider deleted successfully: ${existingProvider.name}`);

    return NextResponse.json({
      success: true,
      message: 'SSO提供商删除成功'
    });

  } catch (error) {
    console.error(`Failed to delete SSO provider ${params.id}:`, error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : '删除SSO提供商失败' 
      },
      { status: 500 }
    );
  }
} 