'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@components/ui/button';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';

export function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
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
    
    // 表单验证
    if (!formData.name.trim()) {
      setError('请输入姓名');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('请输入邮箱地址');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('密码长度至少6位');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    // 验证用户名格式（如果提供）
    if (formData.username.trim() && !/^[a-zA-Z0-9_-]{2,20}$/.test(formData.username.trim())) {
      setError('昵称只能包含字母、数字、下划线和连字符，长度2-20位');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      // 使用 Supabase Auth 进行注册
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name.trim(), // 去除首尾空格
            username: formData.username.trim() || undefined, // 去除空格，如果为空则不传递
          },
        },
      });
      
      if (signUpError) {
        // 处理常见的注册错误
        if (signUpError.message.includes('already registered')) {
          throw new Error('该邮箱已被注册，请使用其他邮箱或直接登录');
        } else if (signUpError.message.includes('Password should be')) {
          throw new Error('密码强度不够，请使用更复杂的密码');
        } else if (signUpError.message.includes('Invalid email')) {
          throw new Error('邮箱格式不正确，请检查后重试');
        } else {
          throw signUpError;
        }
      }
      
      // 检查是否需要邮箱验证
      if (data.user && !data.user.email_confirmed_at) {
        // 需要邮箱验证
        router.push('/login?registered=true&verify=true');
      } else {
        // 直接注册成功（如果禁用了邮箱验证）
        router.push('/login?registered=true');
      }
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 bg-stone-50 rounded-xl shadow-lg border border-stone-200 dark:bg-stone-900 dark:border-stone-800 transition-all font-serif">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text text-transparent font-serif">注册账号</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-serif">
          加入我们，开始探索AI应用的无限可能
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border-l-4 border-red-500 dark:bg-red-900/30 dark:text-red-400 font-serif">
          {error}
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-serif">
              姓名
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="block w-full px-4 py-3 bg-white border border-stone-300 rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all dark:bg-stone-800 dark:border-stone-700 dark:text-white font-serif"
              placeholder="您的姓名"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-serif">
              昵称 <span className="text-gray-500 text-xs font-serif">(可选)</span>
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              className="block w-full px-4 py-3 bg-white border border-stone-300 rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all dark:bg-stone-800 dark:border-stone-700 dark:text-white font-serif"
              placeholder="您的昵称（可选）"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-serif">
              邮箱
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full px-4 py-3 bg-white border border-stone-300 rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all dark:bg-stone-800 dark:border-stone-700 dark:text-white font-serif"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-serif">
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="block w-full px-4 py-3 bg-white border border-stone-300 rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all dark:bg-stone-800 dark:border-stone-700 dark:text-white font-serif"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-serif">
              确认密码
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="block w-full px-4 py-3 bg-white border border-stone-300 rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all dark:bg-stone-800 dark:border-stone-700 dark:text-white font-serif"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <Button 
            type="submit" 
            isLoading={isLoading}
            className="w-full h-12 text-base font-serif"
            variant="gradient"
          >
            注册
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 font-serif">
          已有账号？{' '}
          <Link href="/login" className="font-medium text-stone-700 hover:text-stone-600 dark:text-stone-400 font-serif">
            立即登录
          </Link>
        </p>
      </div>
    </div>
  );
} 