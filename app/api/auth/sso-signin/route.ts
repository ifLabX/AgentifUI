// --- BEGIN COMMENT ---
// SSO登录API
// 为已验证的SSO用户建立Supabase会话
// 添加请求去重逻辑和改善的错误处理
// --- END COMMENT ---

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@lib/supabase/server';

// --- BEGIN COMMENT ---
// 简单的内存缓存，用于防止短时间内的重复请求
// 在生产环境中，建议使用Redis等持久化缓存
// --- END COMMENT ---
const processingRequests = new Map<string, Promise<NextResponse>>();

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestData;
  
  try {
    requestData = await request.json();
    const { userId, userEmail, ssoUserData } = requestData;
    
    if (!userId || !userEmail || !ssoUserData) {
      return NextResponse.json(
        { message: 'SSO登录数据不完整' },
        { status: 400 }
      );
    }

    // --- BEGIN COMMENT ---
    // 创建请求唯一标识，防止重复处理同一用户的并发请求
    // --- END COMMENT ---
    const requestKey = `sso-signin-${userId}-${ssoUserData.loginTime}`;
    
    // --- BEGIN COMMENT ---
    // 检查是否有相同的请求正在处理中
    // --- END COMMENT ---
    if (processingRequests.has(requestKey)) {
      console.log(`Duplicate SSO signin request detected for user: ${userId}, waiting for existing request...`);
      
      try {
        // 等待现有请求完成
        const existingResponse = await processingRequests.get(requestKey);
        console.log(`Returning result from existing request for user: ${userId}`);
        return existingResponse;
      } catch (error) {
        console.log(`Existing request failed for user: ${userId}, proceeding with new request`);
        // 如果现有请求失败，清理缓存并继续处理新请求
        processingRequests.delete(requestKey);
      }
    }

    // --- BEGIN COMMENT ---
    // 创建处理函数并添加到缓存中
    // --- END COMMENT ---
    const processRequest = async (): Promise<NextResponse> => {
      try {
        // --- BEGIN COMMENT ---
        // 验证SSO数据是否过期
        // --- END COMMENT ---
        if (Date.now() > ssoUserData.expiresAt) {
          return NextResponse.json(
            { message: 'SSO会话已过期' },
            { status: 401 }
          );
        }

        // --- BEGIN COMMENT ---
        // 使用Admin客户端为SSO用户生成会话
        // --- END COMMENT ---
        const adminSupabase = await createAdminClient();
        
        // --- BEGIN COMMENT ---
        // 验证用户是否存在于Supabase并获取实际邮箱
        // --- END COMMENT ---
        const { data: user, error: userError } = await adminSupabase.auth.admin.getUserById(userId);
        
        if (userError || !user) {
          console.error('SSO user not found in Supabase:', userError);
          return NextResponse.json(
            { message: '用户不存在' },
            { status: 404 }
          );
        }

        // --- BEGIN COMMENT ---
        // 使用数据库中实际存储的邮箱地址，而不是URL参数传递的邮箱
        // 这解决了邮箱不匹配导致的认证失败问题
        // --- END COMMENT ---
        const actualUserEmail = user.user.email || userEmail;
        if (!actualUserEmail) {
          console.error('No email found for user:', userId);
          return NextResponse.json(
            { message: '用户邮箱信息缺失' },
            { status: 400 }
          );
        }
        console.log(`Creating session for SSO user: ${userId}, URL email: ${userEmail}, actual email: ${actualUserEmail}`);

        // --- BEGIN COMMENT ---
        // 使用优化的临时密码方法创建会话
        // 这是最可靠和简单的方法
        // --- END COMMENT ---
        try {
          console.log('Creating session using temporary password method...');
          
          // --- BEGIN COMMENT ---
          // 生成更强的临时密码
          // --- END COMMENT ---
          const tempPassword = `SSO_${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
          
          // --- BEGIN COMMENT ---
          // 更新用户密码（临时）
          // --- END COMMENT ---
          const { error: updateError } = await adminSupabase.auth.admin.updateUserById(userId, {
            password: tempPassword,
          });

          if (updateError) {
            console.error('Failed to set temporary password:', updateError);
            return NextResponse.json(
              { message: '临时密码设置失败' },
              { status: 500 }
            );
          }

          // --- BEGIN COMMENT ---
          // 等待一小段时间确保密码更新生效
          // --- END COMMENT ---
          await new Promise(resolve => setTimeout(resolve, 100));

          // --- BEGIN COMMENT ---
          // 使用临时密码和实际邮箱进行登录获取会话
          // --- END COMMENT ---
          const { data: signInData, error: signInError } = await adminSupabase.auth.signInWithPassword({
            email: actualUserEmail,
            password: tempPassword,
          });

          if (signInError || !signInData.session) {
            console.error('Failed to sign in with temporary password:', signInError);
            return NextResponse.json(
              { message: '会话创建失败' },
              { status: 500 }
            );
          }

          // --- BEGIN COMMENT ---
          // 立即清理临时密码
          // --- END COMMENT ---
          try {
            await adminSupabase.auth.admin.updateUserById(userId, {
              password: undefined,
            });
          } catch (cleanupError) {
            console.warn('Failed to cleanup temporary password:', cleanupError);
          }

          const processingTime = Date.now() - startTime;
          console.log(`SSO signin successful for user: ${userId} (processing time: ${processingTime}ms)`);

          return NextResponse.json({
            success: true,
            session: signInData.session,
            message: 'SSO登录成功',
          });
        } catch (authError) {
          console.error('Authentication error:', authError);
          return NextResponse.json(
            { message: `认证失败: ${authError instanceof Error ? authError.message : '未知错误'}` },
            { status: 500 }
          );
        }
      } finally {
        // --- BEGIN COMMENT ---
        // 处理完成后清理缓存（延迟清理防止竞争条件）
        // --- END COMMENT ---
        setTimeout(() => {
          processingRequests.delete(requestKey);
        }, 1000);
      }
    };

    // --- BEGIN COMMENT ---
    // 将处理函数添加到缓存并执行
    // --- END COMMENT ---
    const requestPromise = processRequest();
    processingRequests.set(requestKey, requestPromise);
    
    return await requestPromise;

  } catch (error) {
    console.error('SSO signin failed:', error);
    
    // --- BEGIN COMMENT ---
    // 在发生错误时清理可能的缓存条目
    // --- END COMMENT ---
    if (requestData?.userId && requestData?.ssoUserData?.loginTime) {
      const requestKey = `sso-signin-${requestData.userId}-${requestData.ssoUserData.loginTime}`;
      processingRequests.delete(requestKey);
    }
    
    return NextResponse.json(
      { message: `登录失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
} 