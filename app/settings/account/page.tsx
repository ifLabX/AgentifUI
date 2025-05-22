'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@lib/utils';
import { useSettingsColors } from '@lib/hooks/use-settings-colors';
import { AccountSettings } from '@components/settings/account-settings';
import { createClient } from '@lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, Shield } from 'lucide-react';

// --- BEGIN COMMENT ---
// 账号设置页面
// 显示用户账号信息并提供账号相关功能
// --- END COMMENT ---
export default function AccountSettingsPage() {
  const { colors } = useSettingsColors();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authSource, setAuthSource] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  
  // --- BEGIN COMMENT ---
  // 加载用户账号数据
  // --- END COMMENT ---
  useEffect(() => {
    async function loadUserAccount() {
      try {
        setIsLoading(true);
        setError(null);
        
        // 检查用户是否已登录
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        
        // 获取用户邮箱和认证来源
        setUserEmail(user.email || null);
        setAuthSource(user.app_metadata?.provider || '邮箱密码');
        
      } catch (err) {
        console.error('加载用户账号信息失败:', err);
        setError(err instanceof Error ? err : new Error('加载用户账号信息失败'));
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserAccount();
  }, [router, supabase.auth]);
  
  // 处理错误情况
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold mb-6">账号设置</h1>
        
        <div className={cn(
          "rounded-lg p-6",
          "border border-red-200 dark:border-red-800",
          "bg-red-50 dark:bg-red-900/20",
          "text-red-700 dark:text-red-300"
        )}>
          <h2 className="text-lg font-medium mb-4 text-red-800 dark:text-red-200">加载账号信息时出错</h2>
          <p className="mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className={cn(
              "px-4 py-2 rounded-lg",
              "bg-red-100 dark:bg-red-800/50",
              "hover:bg-red-200 dark:hover:bg-red-700/50",
              "text-red-800 dark:text-red-200",
              "transition-colors duration-200"
            )}
          >
            重试
          </button>
        </div>
      </motion.div>
    );
  }

  // 加载状态 - 使用骨架屏
  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold mb-6">账号设置</h1>
        
        <div className={cn(
          "w-full rounded-lg",
          "border",
          colors.borderColor.tailwind,
          colors.cardBackground.tailwind,
          "p-6 mb-6"
        )}>
          <div className={cn(
            "h-6 w-32 mb-6",
            colors.skeletonBackground.tailwind,
            "animate-pulse rounded-md"
          )}></div>
          
          <div className="space-y-6">
            {[1, 2].map((item) => (
              <div key={item} className="flex items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full",
                  colors.skeletonBackground.tailwind,
                  "animate-pulse"
                )}></div>
                <div className="ml-4">
                  <div className={cn(
                    "h-3 w-16",
                    colors.skeletonBackground.tailwind,
                    "animate-pulse rounded-md"
                  )}></div>
                  <div className={cn(
                    "h-4 w-32 mt-1",
                    colors.skeletonBackground.tailwind,
                    "animate-pulse rounded-md"
                  )}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className={cn(
          "w-full rounded-lg",
          "border",
          colors.borderColor.tailwind,
          colors.cardBackground.tailwind,
          "p-6"
        )}>
          <div className={cn(
            "h-6 w-32 mb-6",
            colors.skeletonBackground.tailwind,
            "animate-pulse rounded-md"
          )}></div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={cn(
                "w-5 h-5 mr-2",
                colors.skeletonBackground.tailwind,
                "animate-pulse rounded-full"
              )}></div>
              <div className={cn(
                "h-4 w-32",
                colors.skeletonBackground.tailwind,
                "animate-pulse rounded-md"
              )}></div>
            </div>
            
            <div className={cn(
              "h-8 w-24",
              "bg-stone-800 dark:bg-stone-700",
              "rounded-lg"
            )}></div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold mb-6">账号设置</h1>
      
      <AccountSettings 
        email={userEmail || undefined}
        authSource={authSource || undefined}
      />
    </motion.div>
  );
}
