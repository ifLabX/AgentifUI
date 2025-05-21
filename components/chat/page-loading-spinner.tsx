/**
 * 页面加载指示器组件
 * 
 * 用于显示全屏加载状态
 */

import React, { useEffect, useState } from 'react';
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { cn } from '@lib/utils';

interface PageLoadingSpinnerProps {
  isLoading: boolean;
}

export function PageLoadingSpinner({ isLoading }: PageLoadingSpinnerProps) {
  const { isDark } = useThemeColors();
  const [visible, setVisible] = useState(false);
  
  // 添加延迟显示，避免闪烁
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isLoading]);
  
  if (!isLoading || !visible) return null;
  
  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      "transition-opacity duration-300",
      isDark ? "bg-stone-900/50" : "bg-stone-100/50",
      "backdrop-blur-sm"
    )}>
      <SpinnerIcon size={40} />
    </div>
  );
}

interface SpinnerIconProps {
  size?: number;
}

function SpinnerIcon({ size = 24 }: SpinnerIconProps) {
  return (
    <svg 
      className="animate-spin text-stone-700 dark:text-stone-200"
      width={size} 
      height={size} 
      xmlns="http://www.w3.org/2000/svg"
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
} 