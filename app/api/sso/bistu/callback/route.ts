// --- BEGIN COMMENT ---
// 北京信息科技大学SSO回调处理
// 处理CAS服务器的回调，验证ticket，创建或查找用户，建立会话
// --- END COMMENT ---

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createBistuCASService } from '@lib/services/sso/bistu-cas-service';
import { SSOUserService } from '@lib/services/user/sso-user-service';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const ticket = requestUrl.searchParams.get('ticket');
  const returnUrl = requestUrl.searchParams.get('returnUrl') || '/chat';

  console.log(`SSO callback received - ticket: ${ticket ? 'present' : 'missing'}, returnUrl: ${returnUrl}`);

  if (!ticket) {
    console.error('SSO callback: missing ticket parameter');
    return NextResponse.redirect(
      new URL('/login?error=missing_ticket&message=认证参数缺失，请重新登录', request.url)
    );
  }

  try {
    // --- BEGIN COMMENT ---
    // 初始化CAS服务
    // --- END COMMENT ---
    const casService = createBistuCASService();
    
    // --- BEGIN COMMENT ---
    // 构建service URL，必须与登录时的URL保持一致
    // --- END COMMENT ---
    const serviceUrl = `${requestUrl.origin}${requestUrl.pathname}`;
    
    console.log(`Validating ticket with service URL: ${serviceUrl}`);

    // --- BEGIN COMMENT ---
    // 验证ticket并获取用户信息
    // --- END COMMENT ---
    const userInfo = await casService.validateTicket(ticket, serviceUrl);
    
    if (!userInfo.success || !userInfo.employeeNumber) {
      console.error('SSO callback: ticket validation failed', {
        success: userInfo.success,
        employeeNumber: userInfo.employeeNumber,
        attributes: userInfo.attributes,
      });
      
      const errorMessage = userInfo.attributes?.error_message || '身份验证失败';
      return NextResponse.redirect(
        new URL(`/login?error=ticket_validation_failed&message=${encodeURIComponent(errorMessage)}`, request.url)
      );
    }

    console.log(`Ticket validation successful for employee: ${userInfo.employeeNumber}`);

    // --- BEGIN COMMENT ---
    // 验证学工号格式
    // --- END COMMENT ---
    if (!SSOUserService.validateEmployeeNumber(userInfo.employeeNumber)) {
      console.error(`Invalid employee number format: ${userInfo.employeeNumber}`);
      return NextResponse.redirect(
        new URL('/login?error=invalid_employee_number&message=学工号格式不正确', request.url)
      );
    }

    // --- BEGIN COMMENT ---
    // 查找或创建用户
    // --- END COMMENT ---
    let user = await SSOUserService.findUserByEmployeeNumber(userInfo.employeeNumber);
    
    if (!user) {
      console.log(`Creating new user for employee: ${userInfo.employeeNumber}`);
      
      // --- BEGIN COMMENT ---
      // 获取SSO提供商信息
      // --- END COMMENT ---
      const ssoProvider = await SSOUserService.getBistuSSOProvider();
      
      if (!ssoProvider) {
        console.error('BISTU SSO provider not found in database');
        return NextResponse.redirect(
          new URL('/login?error=sso_provider_not_found&message=SSO服务配置错误，请联系管理员', request.url)
        );
      }

      // --- BEGIN COMMENT ---
      // 创建新用户
      // --- END COMMENT ---
      try {
        user = await SSOUserService.createSSOUser({
          employeeNumber: userInfo.employeeNumber,
          username: userInfo.username,
          fullName: userInfo.username, // 初始使用用户名作为显示名
          ssoProviderId: ssoProvider.id,
        });
        
        console.log(`Successfully created new SSO user: ${user.id}`);
      } catch (createError) {
        console.error('Failed to create SSO user:', createError);
        return NextResponse.redirect(
          new URL('/login?error=user_creation_failed&message=账户创建失败，请联系管理员', request.url)
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
    // 创建Supabase客户端以建立会话
    // --- END COMMENT ---
    const cookieStore = cookies() as any;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // --- BEGIN COMMENT ---
    // 创建或更新Supabase用户会话
    // 注意：这里需要特殊处理，因为用户不是通过Supabase注册的
    // --- END COMMENT ---
    try {
      // --- BEGIN COMMENT ---
      // 检查是否已有Supabase auth用户记录
      // --- END COMMENT ---
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser.user) {
        // --- BEGIN COMMENT ---
        // 需要创建一个临时的会话标识
        // 由于用户是通过SSO创建的，我们使用自定义的会话管理
        // --- END COMMENT ---
        console.log('Creating custom SSO session for user:', user.id);
      }
    } catch (sessionError) {
      console.warn('Session creation warning:', sessionError);
      // 继续执行，使用自定义会话
    }

    // --- BEGIN COMMENT ---
    // 设置SSO会话cookie
    // ⚠️ 在生产环境中，建议使用更安全的会话管理方式，如JWT或加密cookie
    // --- END COMMENT ---
    const response = NextResponse.redirect(new URL(returnUrl, request.url));
    
    // --- BEGIN COMMENT ---
    // 创建会话数据
    // --- END COMMENT ---
    const sessionData = {
      userId: user.id,
      employeeNumber: user.employee_number,
      username: user.username,
      authSource: 'bistu_sso',
      loginTime: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24小时后过期
    };

    // --- BEGIN COMMENT ---
    // 设置会话cookie
    // TODO: 在生产环境中应该加密这个cookie
    // --- END COMMENT ---
    response.cookies.set('sso_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24小时
      path: '/',
    });

    // --- BEGIN COMMENT ---
    // 记录成功登录日志
    // --- END COMMENT ---
    console.log(`SSO login successful - User: ${user.username}, Employee: ${user.employee_number}, Redirect: ${returnUrl}`);

    // --- BEGIN COMMENT ---
    // 添加成功登录的查询参数，前端可以显示欢迎消息
    // --- END COMMENT ---
    const successUrl = new URL(returnUrl, request.url);
    successUrl.searchParams.set('sso_login', 'success');
    successUrl.searchParams.set('welcome', user.full_name || user.username || 'User');

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('SSO callback processing failed:', error);
    
    // --- BEGIN COMMENT ---
    // 处理回调过程中的错误
    // --- END COMMENT ---
    const errorMessage = error instanceof Error ? error.message : '处理登录回调时发生错误';
    return NextResponse.redirect(
      new URL(`/login?error=sso_callback_failed&message=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
} 