'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@lib/utils';
import { useSettingsColors } from '@lib/hooks/use-settings-colors';
import { ProfileForm } from '@components/settings/profile-form';
import { useProfile } from '@lib/hooks/use-profile';
import { Profile } from '@lib/types/database';
import { UserCircle } from 'lucide-react';
import { useTheme } from '@lib/hooks/use-theme';
import { useTranslations } from 'next-intl';

// --- BEGIN COMMENT ---
// 生成用户头像的首字母（与desktop-user-avatar保持一致）
// --- END COMMENT ---
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// --- BEGIN COMMENT ---
// 根据用户名生成一致的石色系背景颜色（与desktop-user-avatar保持一致）
// --- END COMMENT ---
const getAvatarBgColor = (name: string) => {
  const colors = [
    "#78716c", // stone-500
    "#57534e", // stone-600
    "#44403c", // stone-700
    "#64748b", // slate-500
    "#475569", // slate-600
    "#6b7280", // gray-500
    "#4b5563", // gray-600
    "#737373", // neutral-500
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// --- BEGIN COMMENT ---
// 个人资料设置页面
// 显示用户个人资料信息并提供编辑功能
// --- END COMMENT ---
export default function ProfileSettingsPage() {
  const { colors } = useSettingsColors();
  const { isDark } = useTheme();
  const t = useTranslations('pages.settings.profileSettings');
  const tCommon = useTranslations('common.ui');
  
  // --- BEGIN COMMENT ---
  // 使用useProfile hook获取包含组织信息的完整用户资料
  // --- END COMMENT ---
  const { profile, isLoading, error } = useProfile();
  
  // --- BEGIN COMMENT ---
  // 处理资料更新成功
  // --- END COMMENT ---
  const handleProfileUpdateSuccess = () => {
    // 刷新页面数据
    window.location.reload();
  };
  
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
          isDark ? "border border-red-800 bg-red-900/20 text-red-300" : "border border-red-200 bg-red-50 text-red-700"
        )}>
          <h2 className={cn(
            "text-lg font-medium mb-4 font-serif",
            isDark ? "text-red-200" : "text-red-800"
          )}>
            {t('loadProfileError')}
          </h2>
          <p className="mb-4 font-serif">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className={cn(
              "px-4 py-2 rounded-md transition-colors font-serif",
              isDark ? "bg-red-800/50 hover:bg-red-700/50 text-red-200" : "bg-red-100 hover:bg-red-200 text-red-800"
            )}
          >
            {tCommon('retry')}
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
          "p-6"
        )}>
          {/* 账户信息骨架屏 */}
          <div className={cn(
            "mb-8 p-4 rounded-lg border",
            colors.borderColor.tailwind,
          )}>
            <div className={cn(
              "h-6 w-32 mb-4",
              colors.skeletonBackground.tailwind,
              "animate-pulse rounded-md"
            )}></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex items-center">
                  <div className={cn(
                    "w-5 h-5 mr-3",
                    colors.skeletonBackground.tailwind,
                    "animate-pulse rounded-full"
                  )}></div>
                  <div>
                    <div className={cn(
                      "h-3 w-16",
                      colors.skeletonBackground.tailwind,
                      "animate-pulse rounded-md"
                    )}></div>
                    <div className={cn(
                      "h-4 w-24 mt-1",
                      colors.skeletonBackground.tailwind,
                      "animate-pulse rounded-md"
                    )}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 个人资料表单骨架屏 */}
          <div className="space-y-6">
            <div className={cn(
              "h-6 w-32",
              colors.skeletonBackground.tailwind,
              "animate-pulse rounded-md"
            )}></div>
            
            {[1, 2, 3].map((item) => (
              <div key={item} className="space-y-2">
                <div className={cn(
                  "h-4 w-16",
                  colors.skeletonBackground.tailwind,
                  "animate-pulse rounded-md"
                )}></div>
                <div className={cn(
                  "h-10 w-full",
                  colors.skeletonBackground.tailwind,
                  "animate-pulse rounded-md"
                )}></div>
              </div>
            ))}
            
            <div className={cn(
              "h-12 w-full mt-8",
              colors.skeletonBackground.tailwind,
              "animate-pulse rounded-md"
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
      <h1 className="text-2xl font-bold mb-6 font-serif">{t('title')}</h1>
      
      {profile && (
        <div className={cn(
          "w-full rounded-lg",
          "border",
          colors.borderColor.tailwind,
          colors.cardBackground.tailwind,
          "p-6"
        )}>
          {/* 用户资料头部 */}
          <div className="flex items-center mb-8">
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${profile.full_name || profile.username || tCommon('user')}的头像`}
                  className="w-16 h-16 rounded-full object-cover"
                  style={{
                    border: "none",
                  }}
                  onError={(e) => {
                    // 头像加载失败时隐藏图片
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-medium text-lg"
                  style={{
                    backgroundColor: getAvatarBgColor(profile.full_name || profile.username || tCommon('user')),
                    border: "none",
                  }}
                >
                  {getInitials(profile.full_name || profile.username || tCommon('user'))}
                </div>
              )}
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium font-serif">{profile.full_name || profile.username || tCommon('user')}</h2>
              <p className={cn(
                "text-sm font-serif",
                colors.secondaryTextColor.tailwind
              )}>
                {profile.role === 'admin' ? t('roles.admin') : t('roles.user')}
              </p>
            </div>
          </div>
          
          {/* 个人资料表单 */}
          <ProfileForm 
            profile={profile as any} 
            onSuccess={handleProfileUpdateSuccess}
          />
        </div>
      )}
    </motion.div>
  );
}
