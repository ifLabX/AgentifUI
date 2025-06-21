// --- BEGIN COMMENT ---
// SSO提供商连接测试API
// 验证SSO服务器的可达性和配置正确性
// --- END COMMENT ---

import { NextRequest, NextResponse } from 'next/server';
import { testProviderConnection } from '@lib/db/sso-providers';
import { verifyAdminAuth } from '@lib/auth/admin-auth';

// --- BEGIN COMMENT ---
// 🎯 测试SSO提供商连接
// --- END COMMENT ---
export async function POST(
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

    console.log(`Testing SSO provider connection: ${id}`);

    // 执行连接测试
    const testResult = await testProviderConnection(id);

    // 记录测试结果
    console.log(`SSO connection test for ${id}:`, {
      success: testResult.success,
      message: testResult.message,
      responseTime: testResult.responseTime
    });

    return NextResponse.json({
      success: true,
      data: testResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Failed to test SSO provider connection ${params.id}:`, error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : '连接测试失败',
        data: {
          success: false,
          message: '连接测试过程中发生错误',
          details: { 
            error: error instanceof Error ? error.message : String(error) 
          }
        }
      },
      { status: 500 }
    );
  }
} 