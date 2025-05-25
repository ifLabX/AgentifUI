import { NextRequest, NextResponse } from 'next/server';
import { cacheService } from '@lib/services/db/cache-service';
import { getCurrentUserProfile } from '@lib/db';
import { createClient } from '@lib/supabase/server';

/**
 * 清理服务端缓存的API端点
 * 只有管理员可以调用
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 检查用户是否为管理员
    const profileResult = await getCurrentUserProfile();
    if (!profileResult.success || !profileResult.data || profileResult.data.role !== 'admin') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      );
    }

    // 获取请求参数
    const body = await request.json();
    const { pattern } = body;

    let clearedCount = 0;
    
    if (pattern) {
      // 清理指定模式的缓存
      clearedCount = cacheService.deletePattern(pattern);
      console.log(`[管理员操作] 清理缓存模式: ${pattern}, 清理数量: ${clearedCount}`);
    } else {
      // 清理所有应用相关的缓存
      const patterns = [
        'providers:*',           // 清理所有providers表的缓存
        'service_instances:*',   // 清理所有service_instances表的缓存  
        'api_keys:*'            // 清理所有api_keys表的缓存
      ];
      
      for (const p of patterns) {
        clearedCount += cacheService.deletePattern(p);
      }
      
      console.log(`[管理员操作] 清理所有应用配置缓存, 清理数量: ${clearedCount}`);
    }

    // 获取缓存统计信息
    const stats = cacheService.getStats();

    return NextResponse.json({
      success: true,
      message: `成功清理 ${clearedCount} 个缓存项`,
      clearedCount,
      cacheStats: stats
    });

  } catch (error) {
    console.error('清理缓存时出错:', error);
    return NextResponse.json(
      { error: '清理缓存失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
} 