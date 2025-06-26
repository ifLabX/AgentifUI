'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@lib/utils';
import { useSettingsColors } from '@lib/hooks/use-settings-colors';
import { AccountSettings } from '@components/settings/account-settings';
import { createClient } from '@lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, Shield } from 'lucide-react';
import { useTheme } from '@lib/hooks/use-theme';
import { useTranslations } from 'next-intl';

// --- BEGIN COMMENT ---
// 账号设置页面
// 显示用户账号信息并提供账号相关功能
// --- END COMMENT ---
export default function AccountSettingsPage() {
  const { colors } = useSettingsColors();
  const { isDark } = useTheme();
  const t = useTranslations('pages.settings.accountSettings');
  const tCommon = useTranslations('common.ui');
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
        setAuthSource(user.app_metadata?.provider || t('emailPasswordAuth'));
        
      } catch (err) {
        console.error('加载用户账号信息失败:', err);
        setError(err instanceof Error ? err : new Error(t('loadAccountError')));
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserAccount();
  }, [router, supabase.auth, t]);
  
  // 处理错误情况
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold mb-6 font-serif">{t('title')}</h1>
        
        <div className={cn(
          "rounded-lg p-6 mb-6",
          isDark 
            ? "border border-red-800 bg-red-900/20 text-red-300"
            : "border border-red-200 bg-red-50 text-red-700"
        )}>
          <h2 className={cn(
            "text-lg font-medium mb-4 font-serif",
            isDark ? "text-red-200" : "text-red-800"
          )}>
            {t('loadAccountError')}
          </h2>
          <p className="mb-4 font-serif">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className={cn(
              "px-4 py-2 rounded-md transition-colors font-serif",
              isDark 
                ? "bg-red-800/50 hover:bg-red-700/50 text-red-200"
                : "bg-red-100 hover:bg-red-200 text-red-800"
            )}
          >
            {t('retry')}
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
        <h1 className="text-2xl font-bold mb-6 font-serif">{t('title')}</h1>
        
        <div className={cn(
          "w-full rounded-lg",
          "border",
          colors.borderColor.tailwind,
          colors.cardBackground.tailwind,
          "p-6 mb-8"
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
          "p-6 rounded-lg border",
          colors.borderColor.tailwind,
          colors.cardBackground.tailwind
        )}>
          <h3 className={cn(
            "text-lg font-medium mb-4 font-serif",
            colors.textColor.tailwind
          )}>{t('securitySettings')}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className={cn(
                "flex items-center font-serif",
                colors.textColor.tailwind
              )}>
                <LogOut className="w-5 h-5 mr-2" />
                <span>{t('logoutAccount')}</span>
              </div>
              
              <button
                disabled
                className={cn(
                  "px-4 py-2 rounded-md font-serif",
                  isDark 
                    ? "bg-stone-600 text-stone-400"
                    : "bg-stone-300 text-stone-500"
                )}
              >
                {t('deleteAccount')}
              </button>
            </div>
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
      <h1 className="text-2xl font-bold mb-6 font-serif">{t('title')}</h1>
      
      <AccountSettings 
        email={userEmail || undefined}
        authSource={authSource || undefined}
      />
    </motion.div>
  );
}
