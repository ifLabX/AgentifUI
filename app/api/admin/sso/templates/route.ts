// --- BEGIN COMMENT ---
// SSO协议模板API
// 提供协议配置模板和验证规则
// --- END COMMENT ---

import { NextRequest, NextResponse } from 'next/server';
import { getAllProtocolTemplates, getProtocolTemplate } from '@lib/db/sso-providers';
import { SSOServiceFactory } from '@lib/services/sso';
import { verifyAdminAuth } from '@lib/auth/admin-auth';
import type { SsoProtocol } from '@lib/types/database';

// --- BEGIN COMMENT ---
// 🎯 获取所有协议模板或特定协议模板
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

    const searchParams = request.nextUrl.searchParams;
    const protocol = searchParams.get('protocol') as SsoProtocol | null;

    console.log('Fetching SSO protocol templates', { protocol });

    if (protocol) {
      // 获取特定协议模板
      const template = await getProtocolTemplate(protocol);
      
      if (!template) {
        return NextResponse.json(
          { error: 'Not Found', message: `协议 ${protocol} 的模板不存在` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: template
      });
    } else {
      // 获取所有协议模板
      const templates = await getAllProtocolTemplates();
      
      // 获取支持的协议信息
      const supportedProtocols = SSOServiceFactory.getSupportedProtocols();
      
      // 合并模板和支持信息
      const enrichedTemplates = templates.map(template => {
        const protocolInfo = supportedProtocols.find(p => p.protocol === template.protocol);
        return {
          ...template,
          implemented: protocolInfo?.implemented || false,
          protocolName: protocolInfo?.name || template.name,
          protocolDescription: protocolInfo?.description || template.description
        };
      });

      return NextResponse.json({
        success: true,
        data: enrichedTemplates,
        stats: {
          total: templates.length,
          implemented: enrichedTemplates.filter(t => t.implemented).length,
          protocols: [...new Set(templates.map(t => t.protocol))]
        }
      });
    }

  } catch (error) {
    console.error('Failed to fetch SSO protocol templates:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : '获取协议模板失败' 
      },
      { status: 500 }
    );
  }
} 