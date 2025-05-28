'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@lib/utils';
import { useSettingsColors } from '@lib/hooks/use-settings-colors';
import { useLogout } from '@lib/hooks/use-logout';
import { LogOut, Shield, Key, AlertCircle } from 'lucide-react';

// --- BEGIN COMMENT ---
// 账号设置组件
// 提供账号相关功能，包括退出登录
// --- END COMMENT ---
interface AccountSettingsProps {
  email?: string;
  authSource?: string;
}

export function AccountSettings({ email, authSource }: AccountSettingsProps) {
  const { colors, isDark } = useSettingsColors();
  const { logout } = useLogout();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // --- BEGIN COMMENT ---
  // 处理退出登录
  // --- END COMMENT ---
  const handleLogout = async () => {
    if (showConfirm) {
      try {
        setIsLoggingOut(true);
        await logout();
      } catch (error) {
        console.error('退出登录失败:', error);
      } finally {
        setIsLoggingOut(false);
      }
    } else {
      setShowConfirm(true);
    }
  };

  // --- BEGIN COMMENT ---
  // 取消退出登录
  // --- END COMMENT ---
  const cancelLogout = () => {
    setShowConfirm(false);
  };

  return (
    <div className="space-y-8">
      {/* 账号信息卡片 */}
      <div className={cn(
        "p-6 rounded-lg border",
        colors.borderColor.tailwind,
        colors.cardBackground.tailwind
      )}>
        <h3 className={cn(
          "text-lg font-medium mb-4 font-serif",
          colors.textColor.tailwind
        )}>账号信息</h3>
        
        <div className="space-y-4">
          {email && (
            <div className="flex items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                colors.buttonBackground.tailwind,
                colors.borderColor.tailwind,
                "border"
              )}>
                <Shield className={cn("w-5 h-5", colors.secondaryTextColor.tailwind)} />
              </div>
              <div className="ml-4">
                <p className={cn("text-sm font-serif", colors.secondaryTextColor.tailwind)}>登录邮箱</p>
                <p className={cn("font-serif", colors.textColor.tailwind)}>{email}</p>
              </div>
            </div>
          )}
          
          {authSource && (
            <div className="flex items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                colors.buttonBackground.tailwind,
                colors.borderColor.tailwind,
                "border"
              )}>
                <Key className={cn("w-5 h-5", colors.secondaryTextColor.tailwind)} />
              </div>
              <div className="ml-4">
                <p className={cn("text-sm font-serif", colors.secondaryTextColor.tailwind)}>认证方式</p>
                <p className={cn("font-serif", colors.textColor.tailwind)}>{authSource}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 安全设置卡片 */}
      <div className={cn(
        "p-6 rounded-lg border",
        colors.borderColor.tailwind,
        colors.cardBackground.tailwind
      )}>
        <h3 className={cn(
          "text-lg font-medium mb-4 font-serif",
          colors.textColor.tailwind
        )}>安全设置</h3>
        
        <div className="space-y-4">
          {/* 退出登录按钮 */}
          {showConfirm ? (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 rounded-lg mb-4 flex items-center border",
                isDark 
                  ? "bg-red-900/20 text-red-300 border-red-800" 
                  : "bg-red-50 text-red-700 border-red-200"
              )}
            >
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="font-serif">确定要退出登录吗？</span>
            </motion.div>
          ) : null}
          
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex items-center font-serif",
              colors.textColor.tailwind
            )}>
              <LogOut className="w-5 h-5 mr-2" />
              <span>退出当前账号</span>
            </div>
            
            <div className="flex gap-3">
              {showConfirm && (
                <button
                  onClick={cancelLogout}
                  className={cn(
                    "px-3 py-2 rounded-lg",
                    "transition-all duration-200",
                    "cursor-pointer",
                    "text-sm font-serif",
                    colors.buttonBackground.tailwind,
                    colors.buttonBorder.tailwind,
                    colors.textColor.tailwind,
                    colors.buttonHover.tailwind,
                    "border"
                  )}
                >
                  取消
                </button>
              )}
              
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={cn(
                  "px-3 py-2 rounded-lg",
                  "transition-all duration-200",
                  "cursor-pointer",
                  "text-sm font-serif",
                  showConfirm 
                    ? (isDark 
                        ? "bg-red-600 hover:bg-red-700 text-white" 
                        : "bg-red-600 hover:bg-red-700 text-white"
                      )
                    : `${colors.primaryButtonBackground.tailwind} ${colors.primaryButtonHover.tailwind} ${colors.primaryButtonText.tailwind}`
                )}
              >
                {isLoggingOut ? '退出中...' : (showConfirm ? '确认退出' : '退出登录')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
