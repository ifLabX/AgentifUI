/**
 * 通用SSO回调处理
 * 处理任何CAS提供商的回调，验证ticket，创建或查找用户，建立会话
 */
import { SSOUserService } from '@lib/services/admin/user/sso-user-service';
import { CASConfigService } from '@lib/services/sso/generic-cas-service';
import { createAdminClient } from '@lib/supabase/server';
import { validateRedirectUrl } from '@lib/utils/redirect-validation';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const requestUrl = new URL(request.url);
  const ticket = requestUrl.searchParams.get('ticket');
  const returnUrl = requestUrl.searchParams.get('returnUrl') || '/chat';
  const { providerId } = await params;

  // 🔒 Security: Validate redirect URL to prevent open redirect attacks
  const validatedReturnUrl = validateRedirectUrl(
    returnUrl,
    request.url,
    '/chat'
  );

  console.log(
    `SSO callback received for provider ${providerId} - ticket: ${ticket ? 'present' : 'missing'}, returnUrl: ${returnUrl} (validated: ${validatedReturnUrl})`
  );

  // 获取配置的应用URL，用于构建重定向URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not configured');
  }

  if (!ticket) {
    console.error(
      `SSO callback: missing ticket parameter for provider ${providerId}`
    );
    return NextResponse.redirect(
      new URL(
        '/login?error=missing_ticket&message=Authentication parameter missing, please try again',
        appUrl
      )
    );
  }

  try {
    // 创建通用CAS服务实例
    const casService = await CASConfigService.createCASService(providerId);
    const casConfig = casService.getConfig();

    // Validate ticket - ensure service URL matches exactly with login time
    // Fix: Use the same logic as login time to build service URL
    let serviceUrl = `${appUrl}/api/sso/${providerId}/callback`;
    if (returnUrl) {
      // If returnUrl parameter exists, add it to service URL
      // This maintains consistency with login time service URL
      serviceUrl = `${serviceUrl}?returnUrl=${encodeURIComponent(returnUrl)}`;
    }
    console.log(`Using service URL for ticket validation: ${serviceUrl}`);

    const validationResult = await casService.validateTicket(
      ticket,
      serviceUrl
    );

    console.log(
      `CAS ticket validation result for ${casConfig.name}:`,
      validationResult.success ? 'SUCCESS' : 'FAILED'
    );

    if (!validationResult.success) {
      console.error(
        `CAS validation failed for ${casConfig.name}:`,
        validationResult.attributes
      );
      return NextResponse.redirect(
        new URL(
          '/login?error=cas_validation_failed&message=Failed to validate CAS ticket, please try again',
          appUrl
        )
      );
    }

    // 提取用户信息
    const employeeNumberStr = validationResult.employeeNumber;
    const username = validationResult.username;
    const fullName = validationResult.attributes?.name || username;

    if (!employeeNumberStr) {
      console.error(
        `No employee number found in CAS response for ${casConfig.name}`
      );
      return NextResponse.redirect(
        new URL(
          '/login?error=missing_employee_number&message=Failed to validate employee number, please try again',
          appUrl
        )
      );
    }

    console.log(
      `Processing SSO user for ${casConfig.name}: ${username} (${employeeNumberStr}), name: ${fullName}`
    );

    // 获取CAS配置中的完整信息（提前获取）
    const casFullConfig = await CASConfigService.getCASConfig(providerId);

    // 查找或创建用户
    let user = await SSOUserService.findUserByEmployeeNumber(employeeNumberStr);

    if (!user) {
      console.log(
        `Creating new user for employee: ${employeeNumberStr} via ${casConfig.name}`
      );

      console.log(
        `Using SSO provider for user creation: ${casFullConfig.name}`
      );

      user = await SSOUserService.createSSOUser({
        employeeNumber: employeeNumberStr,
        username: username,
        fullName: fullName,
        ssoProviderId: casFullConfig.id,
        ssoProviderName: casFullConfig.name,
        emailDomain: casFullConfig.emailDomain,
      });

      console.log(
        `Created new user: ${user.id} for employee ${employeeNumberStr}`
      );
    } else {
      console.log(
        `Found existing user: ${user.id} for employee ${employeeNumberStr}`
      );

      // 更新最后登录时间
      await SSOUserService.updateLastLogin(user.id);
    }

    // 使用配置中的邮箱域名
    const userEmail = `${user.employee_number || employeeNumberStr}@${casFullConfig.emailDomain}`;

    console.log(
      `Preparing to create Supabase session for user: ${user.id}, email: ${userEmail}`
    );

    // 构建SSO用户数据用于会话创建
    const ssoUserData = {
      userId: user.id,
      employeeNumber: employeeNumberStr,
      username: username,
      fullName: fullName,
      provider: casFullConfig.name,
      loginTime: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10分钟有效期
      authSource: `${casFullConfig.name.toLowerCase().replace(/\s+/g, '_')}_sso`,
    };

    // 重定向到SSO处理页面，由前端发起POST请求到signin API
    const processingUrl = new URL('/sso/processing', appUrl);
    processingUrl.searchParams.set('sso_login', 'success');
    processingUrl.searchParams.set('user_id', user.id);
    processingUrl.searchParams.set('user_email', userEmail);
    processingUrl.searchParams.set('redirect_to', validatedReturnUrl);
    processingUrl.searchParams.set('welcome', fullName);

    console.log(
      `Redirecting to SSO processing page for session creation: ${processingUrl.toString()}`
    );

    // 创建响应对象并设置SSO用户数据cookie供前端使用
    const response = NextResponse.redirect(processingUrl.toString());
    const cookieValue = JSON.stringify(ssoUserData);

    // 调试：输出设置的cookie值
    console.log(
      'Setting cookie value (first 100 chars):',
      cookieValue.substring(0, 100)
    );
    console.log('Cookie value length:', cookieValue.length);

    // 🔒 Security: Split sensitive and non-sensitive data
    // Store sensitive data in httpOnly cookie, accessible data in regular cookie
    const sensitiveData = {
      userId: ssoUserData.userId,
      employeeNumber: ssoUserData.employeeNumber,
      authSource: ssoUserData.authSource,
      loginTime: ssoUserData.loginTime,
      expiresAt: ssoUserData.expiresAt,
    };

    const publicData = {
      username: ssoUserData.username,
      fullName: ssoUserData.fullName,
      provider: ssoUserData.provider,
    };

    // Store sensitive data in httpOnly cookie (secure from XSS)
    response.cookies.set({
      name: 'sso_user_data_secure',
      value: JSON.stringify(sensitiveData),
      maxAge: 10 * 60, // 10 minutes
      httpOnly: true, // 🔒 Security: Prevent XSS attacks by blocking JavaScript access
      secure: appUrl.startsWith('https'),
      sameSite: 'lax',
      path: '/',
    });

    // Store non-sensitive data in accessible cookie (for frontend use)
    response.cookies.set({
      name: 'sso_user_data',
      value: JSON.stringify(publicData),
      maxAge: 10 * 60, // 10 minutes
      httpOnly: false, // Frontend needs access to display name and basic info
      secure: appUrl.startsWith('https'),
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error(
      `SSO callback processing failed for provider ${providerId}:`,
      error
    );

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(
        `/login?error=sso_callback_error&message=${encodeURIComponent(`SSO login processing failed: ${errorMessage}`)}`,
        appUrl
      )
    );
  }
}
