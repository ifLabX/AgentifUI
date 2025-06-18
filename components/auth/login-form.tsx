'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@components/ui/button';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { SocialAuthButtons } from './social-auth-buttons';
import { BistuSSOCard } from './bistu-sso-button';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ssoProcessing, setSsoProcessing] = useState(false);

  // --- BEGIN COMMENT ---
  // 检查SSO登录会话并自动建立Supabase会话
  // --- END COMMENT ---
  useEffect(() => {
    const handleSSOSession = async () => {
      const ssoLogin = searchParams.get('sso_login');
      const welcome = searchParams.get('welcome');
      const redirectTo = searchParams.get('redirect_to') || '/chat/new'; // 修复：重定向到/chat/new
      const userId = searchParams.get('user_id');
      const userEmail = searchParams.get('user_email');
      
      if (ssoLogin === 'success' && userId && userEmail) {
        setSsoProcessing(true);
        
        try {
          // --- BEGIN COMMENT ---
          // 读取SSO用户数据cookie
          // --- END COMMENT ---
          const ssoUserCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('sso_user_data='));
          
          if (!ssoUserCookie) {
            throw new Error('SSO用户数据未找到');
          }
          
          const ssoUserData = JSON.parse(decodeURIComponent(ssoUserCookie.split('=')[1]));
          
          // --- BEGIN COMMENT ---
          // 检查数据是否过期
          // --- END COMMENT ---
          if (Date.now() > ssoUserData.expiresAt) {
            throw new Error('SSO会话已过期，请重新登录');
          }
          
          // --- BEGIN COMMENT ---
          // 使用Supabase的signInWithPassword方法
          // 因为SSO用户已经在服务器端创建，我们需要为其设置临时密码或使用其他方法
          // 这里我们使用Admin API创建的用户，可以直接调用API来建立会话
          // --- END COMMENT ---
          const response = await fetch('/api/auth/sso-signin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              userEmail,
              ssoUserData,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'SSO登录失败');
          }
          
          const { session } = await response.json();
          
          if (session) {
            // --- BEGIN COMMENT ---
            // 在客户端设置Supabase会话
            // --- END COMMENT ---
            const supabase = createClient();
            const { error: sessionError } = await supabase.auth.setSession(session);
            
            if (sessionError) {
              throw sessionError;
            }
            
            // --- BEGIN COMMENT ---
            // 清理会话cookie
            // --- END COMMENT ---
            document.cookie = 'sso_user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            
            // --- BEGIN COMMENT ---
            // 显示欢迎消息并跳转
            // --- END COMMENT ---
            console.log(`SSO登录成功，欢迎 ${welcome || '用户'}！`);
            
            // --- BEGIN COMMENT ---
            // 等待一小段时间确保会话已设置，然后跳转
            // --- END COMMENT ---
            setTimeout(() => {
              router.replace(redirectTo);
            }, 100);
          } else {
            throw new Error('未收到有效会话数据');
          }
        } catch (err: any) {
          console.error('SSO会话处理失败:', err);
          setError(`SSO登录失败: ${err.message}`);
          
          // --- BEGIN COMMENT ---
          // 清理可能存在的会话cookie
          // --- END COMMENT ---
          document.cookie = 'sso_user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        } finally {
          setSsoProcessing(false);
        }
      }
    };

    handleSSOSession();
  }, [searchParams, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // 使用 Supabase Auth 进行登录
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (error) {
        throw error;
      }
      
      // 登录成功，跳转到聊天页面
      router.push('/chat');
      router.refresh(); // 刷新页面以更新用户状态
    } catch (err: any) {
      setError(err.message || '登录失败，请检查您的邮箱和密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 rounded-xl shadow-lg border transition-all font-serif",
      isDark ? "bg-stone-900 border-stone-800" : "bg-stone-50 border-stone-200"
    )}>
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text text-transparent font-serif">登录</h2>
        <p className={cn(
          "mt-2 text-sm font-serif",
          isDark ? "text-gray-400" : "text-gray-600"
        )}>
          继续探索 AI 教育的无限可能
        </p>
      </div>

      {/* --- BEGIN COMMENT --- */}
      {/* SSO处理状态显示 */}
      {/* --- END COMMENT --- */}
      {ssoProcessing && (
        <div className={cn(
          "p-4 rounded-lg text-sm border-l-4 border-blue-500 font-serif",
          isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-700"
        )}>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span>正在处理SSO登录...</span>
          </div>
        </div>
      )}

      {error && (
        <div className={cn(
          "p-4 rounded-lg text-sm border-l-4 border-red-500 font-serif",
          isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-700"
        )}>
          {error}
        </div>
      )}

      {/* --- BEGIN COMMENT --- */}
      {/* 如果正在处理SSO，禁用所有登录选项 */}
      {/* --- END COMMENT --- */}
      <div className={cn("space-y-6", ssoProcessing && "opacity-50 pointer-events-none")}>
        {/* --- BEGIN COMMENT --- */}
        {/* 北信SSO登录区域 */}
        {/* --- END COMMENT --- */}
        <BistuSSOCard returnUrl="/chat" />

        {/* --- BEGIN COMMENT --- */}
        {/* 社交登录区域 */}
        {/* --- END COMMENT --- */}
        <SocialAuthButtons type="login" redirectTo="/chat" />

        {/* --- BEGIN COMMENT --- */}
        {/* 分割线 */}
        {/* --- END COMMENT --- */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className={cn(
              "w-full border-t",
              isDark ? "border-stone-700" : "border-stone-300"
            )} />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className={cn(
              "px-2 font-serif",
              isDark ? "bg-stone-900 text-gray-400" : "bg-stone-50 text-gray-500"
            )}>
              或使用邮箱密码
            </span>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className={cn(
                "block text-sm font-medium mb-1 font-serif",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>
                邮箱
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={ssoProcessing}
                className={cn(
                  "block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all font-serif",
                  isDark ? "bg-stone-800 border-stone-700 text-white" : "bg-white border-stone-300"
                )}
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className={cn(
                "block text-sm font-medium mb-1 font-serif",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={ssoProcessing}
                className={cn(
                  "block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all font-serif",
                  isDark ? "bg-stone-800 border-stone-700 text-white" : "bg-white border-stone-300"
                )}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember_me"
                name="remember_me"
                type="checkbox"
                disabled={ssoProcessing}
                className="h-4 w-4 text-stone-600 focus:ring-stone-500 border-gray-300 rounded"
              />
              <label htmlFor="remember_me" className={cn(
                "ml-2 block text-sm font-serif",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>
                记住我
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className={cn(
                "font-medium font-serif",
                isDark ? "text-stone-400 hover:text-stone-300" : "text-stone-700 hover:text-stone-600"
              )}>
                忘记密码？
              </Link>
            </div>
          </div>

          <div>
            <Button 
              type="submit" 
              isLoading={isLoading || ssoProcessing}
              disabled={ssoProcessing}
              className="w-full h-12 text-base font-serif"
              variant="gradient"
            >
              {ssoProcessing ? '处理中...' : '登录'}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center space-y-3">
          {/* --- BEGIN COMMENT --- */}
          {/* 手机号登录链接 */}
          {/* --- END COMMENT --- */}
          <div>
            <Link href="/phone-login" className={cn(
              "text-sm font-medium font-serif hover:underline",
              isDark ? "text-stone-400 hover:text-stone-300" : "text-stone-600 hover:text-stone-700"
            )}>
              📱 使用手机号验证码登录
            </Link>
          </div>
          
          <p className={cn(
            "text-sm font-serif",
            isDark ? "text-gray-400" : "text-gray-600"
          )}>
            还没有账号？{' '}
            <Link href="/register" className={cn(
              "font-medium font-serif",
              isDark ? "text-stone-400 hover:text-stone-300" : "text-stone-700 hover:text-stone-600"
            )}>
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 