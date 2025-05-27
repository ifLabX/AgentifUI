'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ResetPasswordForm } from '@components/auth/reset-password-form';
import { useTheme } from '@lib/hooks/use-theme';

function ResetPasswordContent() {
  return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
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
    <main className={`min-h-screen w-full flex flex-col items-center justify-center gap-4 py-12 px-4 sm:px-6 lg:px-8 ${colors.bgColor}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Suspense fallback={
          <div className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 bg-stone-50 rounded-xl shadow-lg border border-stone-200 dark:bg-stone-900 dark:border-stone-800 transition-all">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-8 h-8 bg-stone-300 dark:bg-stone-600 rounded-full"></div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text text-transparent">
                加载中...
              </h2>
            </div>
          </div>
        }>
          <ResetPasswordContent />
        </Suspense>
      </motion.div>
    </main>
  );
} 