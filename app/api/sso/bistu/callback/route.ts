// --- BEGIN COMMENT ---
// 北京信息科技大学SSO回调处理
// 处理CAS服务器的回调，验证ticket，创建或查找用户，建立会话
// --- END COMMENT ---
import { createBistuCASService } from '@lib/services/admin/sso/bistu-cas-service';
import { SSOUserService } from '@lib/services/admin/user/sso-user-service';
import { createAdminClient } from '@lib/supabase/server';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const ticket = requestUrl.searchParams.get('ticket');
  const returnUrl = requestUrl.searchParams.get('returnUrl') || '/chat';

  console.log(
    `SSO callback received - ticket: ${ticket ? 'present' : 'missing'}, returnUrl: ${returnUrl}`
  );

  // --- BEGIN COMMENT ---
  // 获取配置的应用URL，用于构建重定向URL
  // --- END COMMENT ---
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not configured');
  }

  if (!ticket) {
    console.error('SSO callback: missing ticket parameter');
    return NextResponse.redirect(
      new URL(
        '/login?error=missing_ticket&message=认证参数缺失，请重新登录',
        appUrl
      )
    );
  }

  try {
    // --- BEGIN COMMENT ---
    // 初始化CAS服务
    // --- END COMMENT ---
    const casService = createBistuCASService();

    // --- BEGIN COMMENT ---
    // 构建service URL，必须与登录时的URL保持一致
    // 使用配置的NEXT_PUBLIC_APP_URL而不是当前请求的域名
    // --- END COMMENT ---
    const serviceUrl = `${appUrl}/api/sso/bistu/callback`;

    console.log(`Validating ticket with service URL: ${serviceUrl}`);

    // --- BEGIN COMMENT ---
    // 验证ticket并获取用户信息
    // --- END COMMENT ---
    const userInfo = await casService.validateTicket(ticket, serviceUrl);

    // --- BEGIN COMMENT ---
    // 打印原始XML响应内容到终端进行调试
    // --- END COMMENT ---
    console.log('=== CAS原始XML响应内容 ===');
    console.log(userInfo.rawResponse || '无原始响应数据');
    console.log('=== CAS XML响应结束 ===');

    // --- BEGIN COMMENT ---
    // 同时打印解析后的用户信息便于对比
    // --- END COMMENT ---
    console.log('=== CAS解析后的用户信息 ===');
    console.log(JSON.stringify(userInfo, null, 2));
    console.log('=== 用户信息结束 ===');

    if (!userInfo.success || !userInfo.employeeNumber) {
      console.error('SSO callback: ticket validation failed', {
        success: userInfo.success,
        employeeNumber: userInfo.employeeNumber,
        attributes: userInfo.attributes,
      });

      const errorMessage = userInfo.attributes?.error_message || '身份验证失败';
      return NextResponse.redirect(
        new URL(
          `/login?error=ticket_validation_failed&message=${encodeURIComponent(errorMessage)}`,
          appUrl
        )
      );
    }

    console.log(
      `Ticket validation successful for employee: ${userInfo.employeeNumber}`
    );

    // --- BEGIN COMMENT ---
    // 验证学工号格式，添加详细调试信息
    // 确保employeeNumber为字符串类型
    // --- END COMMENT ---
    const employeeNumberStr = String(userInfo.employeeNumber || '');
    console.log(
      `Validating employee number: "${employeeNumberStr}" (original type: ${typeof userInfo.employeeNumber}, string length: ${employeeNumberStr.length})`
    );

    if (!SSOUserService.validateEmployeeNumber(employeeNumberStr)) {
      console.error(`Invalid employee number format: "${employeeNumberStr}"`);
      console.error(`Employee number validation details:`, {
        original_value: userInfo.employeeNumber,
        original_type: typeof userInfo.employeeNumber,
        string_value: employeeNumberStr,
        string_length: employeeNumberStr.length,
        trimmed: employeeNumberStr.trim(),
        regex_test: /^\d{10}$/.test(employeeNumberStr.trim()),
        full_userInfo: userInfo,
      });
      return NextResponse.redirect(
        new URL(
          '/login?error=invalid_employee_number&message=学工号格式不正确',
          appUrl
        )
      );
    }

    // --- BEGIN COMMENT ---
    // 查找或创建用户
    // --- END COMMENT ---
    let user = await SSOUserService.findUserByEmployeeNumber(employeeNumberStr);

    if (!user) {
      console.log(`Creating new user for employee: ${employeeNumberStr}`);

      // --- BEGIN COMMENT ---
      // 获取SSO提供商信息
      // 原有实现（暂时注释掉，方便后续恢复）
      // --- END COMMENT ---

      // --- 原有数据库查询实现（暂时注释） ---
      // const ssoProvider = await SSOUserService.getBistuSSOProvider();
      //
      // if (!ssoProvider) {
      //   console.error('BISTU SSO provider not found in database');
      //   return NextResponse.redirect(
      //     new URL('/login?error=sso_provider_not_found&message=SSO服务配置错误，请联系管理员', appUrl)
      //   );
      // }

      // --- 临时硬编码实现（用于快速测试） ---
      const ssoProvider = {
        id: '10000000-0000-0000-0000-000000000001', // 硬编码ID，用于测试
        name: '北京信息科技大学',
        protocol: 'CAS',
        enabled: true,
      };

      console.log(
        'Using hardcoded SSO provider for testing:',
        ssoProvider.name
      );

      // --- BEGIN COMMENT ---
      // 创建新用户，使用CAS返回的真实姓名
      // --- END COMMENT ---
      try {
        const realName = userInfo.attributes?.name || userInfo.username;
        user = await SSOUserService.createSSOUser({
          employeeNumber: employeeNumberStr,
          username: userInfo.username,
          fullName: realName, // 使用CAS返回的真实姓名
          ssoProviderId: ssoProvider.id,
        });

        console.log(
          `Successfully created new SSO user: ${user.id} (${realName})`
        );
      } catch (createError) {
        console.error('Failed to create SSO user:', createError);

        // --- BEGIN COMMENT ---
        // 根据错误类型返回不同的错误码
        // --- END COMMENT ---
        let errorCode = 'user_creation_failed';
        if (createError instanceof Error) {
          if (createError.message === 'ACCOUNT_DATA_INCONSISTENT') {
            errorCode = 'account_data_inconsistent';
          } else if (createError.message === 'PROFILE_CREATION_FAILED') {
            errorCode = 'profile_creation_failed';
          }
        }

        return NextResponse.redirect(
          new URL(`/login?error=${errorCode}`, appUrl)
        );
      }
    } else {
      console.log(`Found existing user: ${user.id} (${user.username})`);

      // --- BEGIN COMMENT ---
      // 更新最后登录时间
      // --- END COMMENT ---
      try {
        await SSOUserService.updateLastLogin(user.id);
      } catch (updateError) {
        console.warn('Failed to update last login time:', updateError);
        // 不阻断登录流程，仅记录警告
      }
    }

    // --- BEGIN COMMENT ---
    // 简化SSO会话处理逻辑
    // 重定向到专门的SSO处理页面，而不是登录页面
    // 修复：确保使用正确的学工号构建邮箱，优先使用employeeNumberStr
    // --- END COMMENT ---
    const userEmail = `${user.employee_number || employeeNumberStr}@bistu.edu.cn`;
    console.log(
      `Setting user email in URL: ${userEmail} (from employee_number: ${user.employee_number}, employeeNumberStr: ${employeeNumberStr})`
    );

    const successUrl = new URL('/sso/processing', appUrl);
    successUrl.searchParams.set('sso_login', 'success');
    successUrl.searchParams.set(
      'welcome',
      user.full_name || user.username || 'User'
    );
    successUrl.searchParams.set('redirect_to', returnUrl);
    successUrl.searchParams.set('user_id', user.id);
    successUrl.searchParams.set('user_email', userEmail);

    const response = NextResponse.redirect(successUrl);

    // --- BEGIN COMMENT ---
    // 设置简化的SSO用户信息cookie，前端可以使用这些信息进行登录
    // 修复：确保cookie中的邮箱和学工号一致
    // --- END COMMENT ---
    const ssoUserData = {
      userId: user.id,
      email: userEmail,
      employeeNumber: user.employee_number || employeeNumberStr,
      username: user.username,
      fullName: user.full_name,
      authSource: 'bistu_sso',
      loginTime: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24小时后过期
    };

    response.cookies.set('sso_user_data', JSON.stringify(ssoUserData), {
      httpOnly: false, // 允许前端读取
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24小时
      path: '/',
    });

    console.log(
      `SSO login successful - User: ${user.username}, Redirecting to SSO processing page`
    );
    return response;
  } catch (error) {
    console.error('SSO callback processing failed:', error);

    // --- BEGIN COMMENT ---
    // 处理回调过程中的错误
    // --- END COMMENT ---
    const errorMessage =
      error instanceof Error ? error.message : '处理登录回调时发生错误';
    return NextResponse.redirect(
      new URL(
        `/login?error=sso_callback_failed&message=${encodeURIComponent(errorMessage)}`,
        appUrl
      )
    );
  }
}
