'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@components/ui/button';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';

export function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 bg-stone-50 rounded-xl shadow-lg border border-stone-200 dark:bg-stone-900 dark:border-stone-800 transition-all">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text text-transparent">登录</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          继续探索 AI 教育的无限可能
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border-l-4 border-red-500 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              邮箱
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full px-4 py-3 bg-white border border-stone-300 rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all dark:bg-stone-800 dark:border-stone-700 dark:text-white"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="block w-full px-4 py-3 bg-white border border-stone-300 rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all dark:bg-stone-800 dark:border-stone-700 dark:text-white"
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
              className="h-4 w-4 text-stone-600 focus:ring-stone-500 border-gray-300 rounded"
            />
            <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              记住我
            </label>
          </div>

          <div className="text-sm">
            <Link href="/forgot-password" className="font-medium text-stone-700 hover:text-stone-600 dark:text-stone-400">
              忘记密码？
            </Link>
          </div>
        </div>

        <div>
          <Button 
            type="submit" 
            isLoading={isLoading}
            className="w-full h-12 text-base"
            variant="gradient"
          >
            登录
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          还没有账号？{' '}
          <Link href="/register" className="font-medium text-stone-700 hover:text-stone-600 dark:text-stone-400">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
} 