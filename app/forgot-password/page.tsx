'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ForgotPasswordForm } from '@components/auth/forgot-password-form';
import { useTheme } from '@lib/hooks/use-theme';

export default function ForgotPasswordPage() {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // --- 确保客户端渲染一致性 ---
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // --- 根据主题获取颜色 ---
  const getColors = () => {
    if (isDark) {
      return {
        bgColor: 'bg-stone-800'
      };
    } else {
      return {
        bgColor: 'bg-stone-100'
      };
    }
  };
  
  const colors = mounted ? getColors() : {
    bgColor: ''
  };

  return (
    <main className={`min-h-screen w-full flex flex-col items-center justify-center gap-4 py-12 px-4 sm:px-6 lg:px-8 ${colors.bgColor} font-serif`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <ForgotPasswordForm />
      </motion.div>
    </main>
  );
} 
