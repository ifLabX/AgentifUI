"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@lib/utils';
import { useAppParametersPreloader } from '@lib/hooks/use-app-parameters-preloader';

interface ClientLayoutProps {
  children: React.ReactNode;
  fontClasses: string;
}

/**
 * 客户端布局组件
 * 负责根据当前路径应用适当的 CSS 类
 * 聊天页面使用固定高度和溢出滚动，其他页面使用自然高度
 */
export function ClientLayout({ children, fontClasses }: ClientLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith('/chat');
  
  // --- BEGIN COMMENT ---
  // 🎯 在根布局中启动应用参数预加载
  // 这确保用户在使用应用时，所有应用的参数都已预先缓存
  // --- END COMMENT ---
  const { isPreloading, progress } = useAppParametersPreloader();
  
  useEffect(() => {
    setMounted(true);
    // 当客户端组件挂载后，给 body 添加 render-ready 类，使其可见
    document.body.classList.add('render-ready');

    // 清理函数：仅当 ClientLayout 自身卸载时才移除 render-ready
    return () => {
      document.body.classList.remove('render-ready');
    };
  }, []); // 空依赖数组，确保此 effect 只在挂载和卸载时运行一次
  
  useEffect(() => {
    if (!mounted) return;
    const bodyElement = document.body;
    if (isChatPage) {
      bodyElement.classList.add('chat-page');
      bodyElement.classList.remove('default-page');
    } else {
      bodyElement.classList.add('default-page');
      bodyElement.classList.remove('chat-page');
    }
    // 清理函数：只清理页面特定的类
    return () => {
      bodyElement.classList.remove('chat-page', 'default-page');
    };
  }, [pathname, isChatPage, mounted]); // 依赖项保持不变，用于页面特定类的切换
  
  const layoutClass = mounted
    ? cn(
        fontClasses,
        'antialiased',
        isChatPage ? 'h-full' : 'min-h-screen'
      )
    : cn(fontClasses, 'antialiased');
  
  return (
    <div className={layoutClass}>
      {/* --- BEGIN COMMENT ---
      🎯 开发环境下显示预加载进度（可选）
      --- END COMMENT --- */}
      {process.env.NODE_ENV === 'development' && isPreloading && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white text-xs px-4 py-1 text-center">
          预加载应用参数中... {progress.loaded}/{progress.total} ({progress.percentage}%)
        </div>
      )}
      {children}
    </div>
  );
}
