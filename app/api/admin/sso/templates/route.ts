// --- BEGIN COMMENT ---
// SSO协议模板API
// 提供协议模板获取和配置验证功能
// --- END COMMENT ---
import {
  PROTOCOL_TEMPLATES,
  ProtocolTemplateHelper,
} from '@lib/config/sso-protocol-definitions';
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
// GET /api/admin/sso/templates
// 获取所有协议模板
// --- END COMMENT ---
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    await verifyAdminAuth();

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const protocol = searchParams.get('protocol');

    if (protocol) {
      // 获取特定协议模板
      const template = ProtocolTemplateHelper.getTemplate(protocol);
      if (!template) {
        return NextResponse.json(
          { success: false, error: '不支持的协议类型' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: template,
      });
    } else {
      // 获取所有协议模板
      const protocols = ProtocolTemplateHelper.getSupportedProtocols();
      const templates = protocols.map(proto => {
        const template = ProtocolTemplateHelper.getTemplate(proto);
        return {
          protocol: proto,
          ...ProtocolTemplateHelper.getProtocolInfo(proto),
          supportedFields: {
            required: template?.requiredFields || [],
            optional: template?.optionalFields || [],
          },
        };
      });

      return NextResponse.json({
        success: true,
        data: templates,
      });
    }
  } catch (error) {
    console.error('获取协议模板失败:', error);

    if (error instanceof Error) {
      if (error.message.includes('未授权') || error.message.includes('权限')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: '获取协议模板失败' },
      { status: 500 }
    );
  }
}

// --- BEGIN COMMENT ---
// POST /api/admin/sso/templates/validate
// 验证协议配置
// --- END COMMENT ---
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    await verifyAdminAuth();

    // 解析请求体
    const body = await request.json();

    if (!body.protocol) {
      return NextResponse.json(
        { success: false, error: '协议类型为必填项' },
        { status: 400 }
      );
    }

    if (!body.config) {
      return NextResponse.json(
        { success: false, error: '配置信息为必填项' },
        { status: 400 }
      );
    }

    // 验证协议配置
    const validationResult = ProtocolTemplateHelper.validateProtocolConfig(
      body.protocol,
      body.config
    );

    return NextResponse.json({
      success: true,
      data: validationResult,
    });
  } catch (error) {
    console.error('验证协议配置失败:', error);

    if (error instanceof Error) {
      if (error.message.includes('未授权') || error.message.includes('权限')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: '验证协议配置失败' },
      { status: 500 }
    );
  }
}
