// --- BEGIN COMMENT ---
// 北京信息科技大学SSO登录按钮组件
// 提供统一的SSO登录入口界面
// --- END COMMENT ---

'use client';

import { useState } from 'react';
import { Button } from '@components/ui/button';
import { cn } from '@lib/utils';

interface BistuSSOButtonProps {
  returnUrl?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  children?: React.ReactNode;
}

export function BistuSSOButton({
  returnUrl,
  className,
  variant = 'default',
  size = 'default',
  disabled = false,
  children,
}: BistuSSOButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSSOLogin = async () => {
    try {
      setIsLoading(true);
      
      console.log('Initiating BISTU SSO login...');

      // --- BEGIN COMMENT ---
      // 构建SSO登录URL
      // --- END COMMENT ---
      const params = new URLSearchParams();
      if (returnUrl) {
        params.set('returnUrl', returnUrl);
      }

      const ssoLoginUrl = `/api/sso/bistu/login${params.toString() ? '?' + params.toString() : ''}`;
      
      // --- BEGIN COMMENT ---
      // 重定向到SSO登录接口
      // --- END COMMENT ---
      window.location.href = ssoLoginUrl;
    } catch (error) {
      console.error('Failed to initiate SSO login:', error);
      setIsLoading(false);
      
      // --- BEGIN COMMENT ---
      // 显示错误提示
      // --- END COMMENT ---
      alert('启动SSO登录失败，请稍后重试');
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        // --- BEGIN COMMENT ---
        // 北信特色的按钮样式
        // --- END COMMENT ---
        "relative w-full flex items-center justify-center gap-2",
        "bg-blue-600 hover:bg-blue-700 text-white",
        "border border-blue-600 hover:border-blue-700",
        "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      disabled={disabled || isLoading}
      onClick={handleSSOLogin}
    >
      {/* --- BEGIN COMMENT --- */}
      {/* 北信Logo图标（可选） */}
      {/* --- END COMMENT --- */}
      <svg 
        className="w-5 h-5" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      
      {/* --- BEGIN COMMENT --- */}
      {/* 按钮文本内容 */}
      {/* --- END COMMENT --- */}
      {isLoading ? (
        <>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="none"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          正在跳转...
        </>
      ) : (
        children || '使用北信统一认证登录'
      )}
    </Button>
  );
}

// --- BEGIN COMMENT ---
// 简化版的SSO登录按钮，用于快速集成
// --- END COMMENT ---
export function SimpleBistuSSOButton({ 
  returnUrl, 
  className 
}: { 
  returnUrl?: string; 
  className?: string; 
}) {
  return (
    <BistuSSOButton
      returnUrl={returnUrl}
      className={className}
      variant="outline"
    >
      <span className="text-sm">
        🏛️ 北信统一认证
      </span>
    </BistuSSOButton>
  );
}

// --- BEGIN COMMENT ---
// 带有详细说明的SSO登录卡片
// --- END COMMENT ---
export function BistuSSOCard({ 
  returnUrl, 
  className 
}: { 
  returnUrl?: string; 
  className?: string; 
}) {
  return (
    <div className={cn(
      "p-6 border border-gray-200 rounded-lg bg-white shadow-sm",
      "hover:shadow-md transition-shadow",
      className
    )}>
      <div className="text-center space-y-4">
        {/* --- BEGIN COMMENT --- */}
        {/* 标题和说明 */}
        {/* --- END COMMENT --- */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            北京信息科技大学统一认证
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            使用您的学工号和密码登录
          </p>
        </div>

        {/* --- BEGIN COMMENT --- */}
        {/* 登录按钮 */}
        {/* --- END COMMENT --- */}
        <BistuSSOButton
          returnUrl={returnUrl}
          className="w-full"
        />

        {/* --- BEGIN COMMENT --- */}
        {/* 帮助信息 */}
        {/* --- END COMMENT --- */}
        <div className="text-xs text-gray-500">
          <p>首次登录将自动创建账户</p>
          <p>如有问题请联系系统管理员</p>
        </div>
      </div>
    </div>
  );
} 