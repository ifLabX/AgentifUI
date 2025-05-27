'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@components/ui/button';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import { ArrowLeft, Mail } from 'lucide-react';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const supabase = createClient();
      
      // --- 发送重置密码邮件 ---
      // 使用Supabase Auth内置的resetPasswordForEmail方法
      // 邮件中的链接将包含重置token并重定向到reset-password页面
      const redirectUrl = `${window.location.origin}/reset-password`;
      console.log('发送重置密码邮件，重定向URL:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      console.log('重置邮件发送结果:', error ? '失败' : '成功');
      
      if (error) {
        // --- 处理常见错误情况 ---
        if (error.message.includes('Invalid email')) {
          throw new Error('请输入有效的邮箱地址');
        } else if (error.message.includes('rate limit')) {
          throw new Error('发送过于频繁，请稍后再试');
        } else {
          throw error;
        }
      }
      
      // --- 发送成功 ---
      setIsEmailSent(true);
    } catch (err: any) {
      setError(err.message || '发送失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // --- 清除之前的错误信息 ---
    if (error) setError('');
  };

  // --- 邮件发送成功状态的UI ---
  if (isEmailSent) {
    return (
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 bg-stone-50 rounded-xl shadow-lg border border-stone-200 dark:bg-stone-900 dark:border-stone-800 transition-all">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-stone-600 dark:text-stone-400" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text text-transparent">
            邮件已发送
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            我们已向 <span className="font-medium text-stone-700 dark:text-stone-300">{email}</span> 发送了重置密码链接
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-stone-50 text-stone-700 rounded-lg text-sm border-l-4 border-stone-400 dark:bg-stone-800/50 dark:text-stone-300 dark:border-stone-600">
            <ul className="space-y-1">
              <li>• 请检查您的邮箱收件箱</li>
              <li>• 重置链接有效期为1小时</li>
              <li>• 如未收到邮件，请检查垃圾邮件文件夹</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsEmailSent(false);
                setEmail('');
                setError('');
              }}
            >
              重新发送
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => router.push('/login')}
            >
              返回登录
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- 主要的忘记密码表单UI ---
  return (
    <div className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 bg-stone-50 rounded-xl shadow-lg border border-stone-200 dark:bg-stone-900 dark:border-stone-800 transition-all">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text text-transparent">
          忘记密码
        </h2>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          输入您的邮箱地址，我们将发送重置密码的链接
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border-l-4 border-red-500 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            邮箱地址
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="block w-full px-4 py-3 bg-white border border-stone-300 rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all dark:bg-stone-800 dark:border-stone-700 dark:text-white"
            placeholder="your@email.com"
            value={email}
            onChange={handleEmailChange}
          />
        </div>

        <div>
          <Button 
            type="submit" 
            isLoading={isLoading}
            className="w-full h-12 text-base"
            variant="gradient"
          >
            {isLoading ? '发送中...' : '发送重置链接'}
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <Link 
          href="/login" 
          className="flex items-center justify-center text-sm text-stone-700 hover:text-stone-600 dark:text-stone-400 dark:hover:text-stone-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回登录
        </Link>
      </div>
    </div>
  );
} 