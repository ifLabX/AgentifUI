'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LoginForm } from '@components/auth/login-form';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { CheckCircle } from 'lucide-react';
import { useTheme } from '@lib/hooks/use-theme';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const resetSuccess = searchParams.get('reset');
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // 确保客户端渲染一致性
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 根据主题获取颜色
  const getColors = () => {
    if (isDark) {
      return {
        bgColor: 'bg-stone-800',
        alertBg: 'bg-stone-800/50',
        alertBorder: 'border-stone-600',
        alertText: 'text-stone-300',
        iconColor: 'text-stone-400'
      };
    } else {
      return {
        bgColor: 'bg-stone-100',
        alertBg: 'bg-stone-50',
        alertBorder: 'border-stone-300',
        alertText: 'text-stone-700',
        iconColor: 'text-stone-600'
      };
    }
  };
  
  const colors = mounted ? getColors() : {
    bgColor: '',
    alertBg: '',
    alertBorder: '',
    alertText: '',
    iconColor: ''
  };

  return (
    <main className={`min-h-screen w-full flex flex-col items-center justify-center gap-4 py-12 px-4 sm:px-6 lg:px-8 ${colors.bgColor}`}>
      {registered && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Alert className={`max-w-md border-l-4 ${colors.alertBg} ${colors.alertBorder}`}>
            <CheckCircle className={`h-4 w-4 ${colors.iconColor}`} />
            <AlertDescription className={colors.alertText}>
              注册成功！请查看您的邮箱以验证账户，然后登录。
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
      {resetSuccess === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Alert className={`max-w-md border-l-4 ${colors.alertBg} ${colors.alertBorder}`}>
            <CheckCircle className={`h-4 w-4 ${colors.iconColor}`} />
            <AlertDescription className={colors.alertText}>
              密码重置成功！请使用新密码登录。
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <LoginForm />
      </motion.div>
    </main>
  );
}