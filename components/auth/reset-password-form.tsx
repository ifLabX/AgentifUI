'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@components/ui/button';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

  // --- 验证用户认证状态 ---
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const supabase = createClient();
        
        // --- 调试：显示所有URL参数 ---
        console.log('=== 重置密码调试信息 ===');
        console.log('完整URL:', window.location.href);
        console.log('URL参数:', window.location.search);
        
        // --- 检查URL参数 ---
        const access_token = searchParams.get('access_token');
        const refresh_token = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        const token_hash = searchParams.get('token_hash');
        
        console.log('URL参数解析:');
        console.log('- access_token:', access_token);
        console.log('- refresh_token:', refresh_token);
        console.log('- type:', type);
        console.log('- token_hash:', token_hash);
        
        // --- 处理Supabase的重置密码重定向 ---
        if (type === 'recovery' && token_hash) {
          console.log('检测到Supabase重置密码链接，尝试验证token');
          
          // 使用正确的方法处理重置密码token
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: token_hash,
          });
          
          if (verifyError) {
            console.error('重置密码token验证失败:', verifyError);
            setError(`重置链接验证失败: ${verifyError.message}`);
            setIsTokenValid(false);
          } else {
            console.log('重置密码token验证成功:', data);
            setIsTokenValid(true);
          }
          return;
        }
        
        // --- 处理直接的access_token（兼容旧版本） ---
        if (access_token) {
          console.log('检测到access_token，尝试设置会话');
          
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || '',
          });

          if (sessionError) {
            console.error('会话设置失败:', sessionError);
            setError(`重置链接验证失败: ${sessionError.message}`);
            setIsTokenValid(false);
          } else {
            console.log('会话设置成功');
            setIsTokenValid(true);
          }
          return;
        }
        
        // --- 检查是否已有有效会话 ---
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('获取用户信息失败:', userError);
          setError('无法验证用户身份，请重新申请重置密码');
          setIsTokenValid(false);
        } else if (user) {
          console.log('用户已认证:', user.email);
          setIsTokenValid(true);
        } else {
          console.log('用户未认证，且无有效的重置token');
          setError('重置链接无效或已过期，请重新申请重置密码');
          setIsTokenValid(false);
        }
        
      } catch (err) {
        console.error('会话验证异常:', err);
        setError('验证失败，请重新申请重置密码');
        setIsTokenValid(false);
      }
    };

    checkUserSession();
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // --- 清除错误信息 ---
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.password.trim()) {
      setError('请输入新密码');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('密码长度至少6位');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const supabase = createClient();
      
      // --- 更新密码 ---
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });
      
      if (error) {
        // --- 处理常见错误 ---
        if (error.message.includes('Password should be')) {
          throw new Error('密码强度不够，请使用更复杂的密码');
        } else if (error.message.includes('session')) {
          throw new Error('会话已过期，请重新申请重置密码');
        } else {
          throw error;
        }
      }
      
      // --- 重置成功 ---
      setIsSuccess(true);
      
      // --- 3秒后跳转到登录页面 ---
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || '密码重置失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Token验证中的加载状态 ---
  if (isTokenValid === null) {
    return (
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 bg-stone-50 rounded-xl shadow-lg border border-stone-200 dark:bg-stone-900 dark:border-stone-800 transition-all">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 bg-stone-300 dark:bg-stone-600 rounded-full"></div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text text-transparent">
            验证中...
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            正在验证重置链接的有效性
          </p>
        </div>
      </div>
    );
  }

  // --- Token无效状态 ---
  if (isTokenValid === false) {
    return (
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 bg-stone-50 rounded-xl shadow-lg border border-stone-200 dark:bg-stone-900 dark:border-stone-800 transition-all">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-stone-600 dark:text-stone-400" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text text-transparent">
            链接无效
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            重置链接已失效或不正确
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border-l-4 border-red-500 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            className="w-full"
            onClick={() => router.push('/forgot-password')}
          >
            重新申请重置密码
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.push('/login')}
          >
            返回登录
          </Button>
        </div>
      </div>
    );
  }

  // --- 重置成功状态 ---
  if (isSuccess) {
    return (
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 bg-stone-50 rounded-xl shadow-lg border border-stone-200 dark:bg-stone-900 dark:border-stone-800 transition-all">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-stone-600 dark:text-stone-400" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text text-transparent">
            重置成功
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            密码已成功更新，正在跳转至登录页面...
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-stone-50 text-stone-700 rounded-lg text-sm border-l-4 border-stone-400 dark:bg-stone-800/50 dark:text-stone-300 dark:border-stone-600">
            请使用新密码登录您的账户
          </div>

          <Button
            type="button"
            className="w-full"
            onClick={() => router.push('/login')}
          >
            立即登录
          </Button>
        </div>
      </div>
    );
  }

  // --- 主要的重置密码表单 ---
  return (
    <div className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 bg-stone-50 rounded-xl shadow-lg border border-stone-200 dark:bg-stone-900 dark:border-stone-800 transition-all">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text text-transparent">
          重置密码
        </h2>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          请输入您的新密码
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border-l-4 border-red-500 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-5">
          {/* --- 新密码输入 --- */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              新密码
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="block w-full px-4 py-3 pr-10 bg-white border border-stone-300 rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-stone-400" />
                ) : (
                  <Eye className="h-5 w-5 text-stone-400" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              密码长度至少6位
            </p>
          </div>

          {/* --- 确认新密码输入 --- */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              确认新密码
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="block w-full px-4 py-3 pr-10 bg-white border border-stone-300 rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all dark:bg-stone-800 dark:border-stone-700 dark:text-white"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-stone-400" />
                ) : (
                  <Eye className="h-5 w-5 text-stone-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div>
          <Button 
            type="submit" 
            isLoading={isLoading}
            className="w-full h-12 text-base"
            variant="gradient"
          >
            {isLoading ? '更新中...' : '更新密码'}
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <Link 
          href="/login" 
          className="text-sm text-stone-700 hover:text-stone-600 dark:text-stone-400 dark:hover:text-stone-300 transition-colors"
        >
          返回登录
        </Link>
      </div>
    </div>
  );
} 