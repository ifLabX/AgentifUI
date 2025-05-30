import { NextRequest, NextResponse } from 'next/server';
import { getActiveProviders, getServiceInstancesByProvider } from '@lib/db';

/**
 * 获取管理后台状态信息
 */
export async function GET(request: NextRequest) {
  try {
    // 检查是否有活跃的服务提供商
    const providersResult = await getActiveProviders();
    
    if (!providersResult.success) {
      return NextResponse.json({
        hasActiveProviders: false,
        hasActiveInstances: false,
        error: '无法获取提供商信息'
      });
    }

    const providers = providersResult.data;
    let hasActiveInstances = false;

    // 检查是否有配置的服务实例
    if (providers.length > 0) {
      for (const provider of providers) {
        const instancesResult = await getServiceInstancesByProvider(provider.id);
        if (instancesResult.success && instancesResult.data.length > 0) {
          hasActiveInstances = true;
          break;
        }
      }
    }

    return NextResponse.json({
      hasActiveProviders: providers.length > 0,
      hasActiveInstances,
      providersCount: providers.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取管理状态失败:', error);
    return NextResponse.json(
      { 
        error: '获取状态信息失败',
        hasActiveProviders: false,
        hasActiveInstances: false
      },
      { status: 500 }
    );
  }
} 