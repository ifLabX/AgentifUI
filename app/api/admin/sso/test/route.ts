// --- BEGIN COMMENT ---
// SSO系统测试API
// 用于验证SSO服务功能是否正常工作
// --- END COMMENT ---
import { getSSOConfig } from '@lib/config/sso-config';
import { ProtocolTemplateHelper } from '@lib/config/sso-protocol-definitions';
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
// GET /api/admin/sso/test
// 测试SSO系统各组件功能
// --- END COMMENT ---
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    await verifyAdminAuth();

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    };

    // 测试1: 环境配置检查
    try {
      const ssoConfig = getSSOConfig();
      results.tests.environment = {
        status: 'success',
        data: {
          appUrl: ssoConfig.appUrl,
          enabledProtocols: ssoConfig.enabledProtocols,
          defaultTimeout: ssoConfig.defaultTimeout,
        },
      };
    } catch (error) {
      results.tests.environment = {
        status: 'error',
        error: error instanceof Error ? error.message : '环境配置检查失败',
      };
    }

    // 测试2: 协议模板功能
    try {
      const supportedProtocols = ProtocolTemplateHelper.getSupportedProtocols();
      const protocolInfo = supportedProtocols.map(protocol => ({
        protocol,
        info: ProtocolTemplateHelper.getProtocolInfo(protocol),
      }));

      results.tests.protocolTemplates = {
        status: 'success',
        data: {
          supportedProtocols,
          protocolInfo,
        },
      };
    } catch (error) {
      results.tests.protocolTemplates = {
        status: 'error',
        error: error instanceof Error ? error.message : '协议模板检查失败',
      };
    }

    // 测试3: 数据库连接
    try {
      const ssoDbService = new SSODatabaseService(true);
      const providers = await ssoDbService.getAllProviders();

      results.tests.database = {
        status: 'success',
        data: {
          totalProviders: providers.length,
          activeProviders: providers.filter(p => p.enabled).length,
        },
      };
    } catch (error) {
      results.tests.database = {
        status: 'error',
        error: error instanceof Error ? error.message : '数据库连接检查失败',
      };
    }

    // 测试4: 配置验证功能
    try {
      const testConfig = {
        base_url: 'https://example.com',
        client_id: 'test-client',
        client_secret: 'test-secret',
      };

      const validationResult = ProtocolTemplateHelper.validateProtocolConfig(
        'OIDC',
        testConfig
      );

      results.tests.configValidation = {
        status: 'success',
        data: validationResult,
      };
    } catch (error) {
      results.tests.configValidation = {
        status: 'error',
        error: error instanceof Error ? error.message : '配置验证检查失败',
      };
    }

    // 综合状态评估
    const failedTests = Object.values(results.tests).filter(
      (test: any) => test.status === 'error'
    );
    results.overall = {
      status: failedTests.length === 0 ? 'success' : 'partial',
      totalTests: Object.keys(results.tests).length,
      failedTests: failedTests.length,
      summary:
        failedTests.length === 0
          ? 'SSO系统所有组件运行正常'
          : `${failedTests.length}个测试失败，请检查相关配置`,
    };

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('SSO测试失败:', error);

    if (error instanceof Error) {
      if (error.message.includes('未授权') || error.message.includes('权限')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'SSO测试失败' },
      { status: 500 }
    );
  }
}
