'use client';

import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { useCurrentAppStore } from '@lib/stores/current-app-store'; // 引入 App Store

export function Providers({ children }: { children: React.ReactNode }) {
  // 避免水合不匹配，确保在客户端渲染时才加载 ThemeProvider
  const [mounted, setMounted] = useState(false);
  
  // --- BEGIN COMMENT ---
  // 使用 hook 方式获取初始化方法，遵循 React 最佳实践
  // --- END COMMENT ---
  const initializeDefaultAppId = useCurrentAppStore(state => state.initializeDefaultAppId);

  useEffect(() => {
    setMounted(true);
    // --- BEGIN COMMENT ---
    // 初始化默认的 App ID，使用新版本的数据库接口
    // --- END COMMENT ---
    initializeDefaultAppId();
  }, [initializeDefaultAppId]);

  if (!mounted) {
    // 在 ThemeProvider 准备好之前，不渲染 children，或者渲染一个最小的占位符
    // 返回 null 确保子组件不会在没有主题上下文的情况下尝试渲染
    return null; 
  }

  return (
    <ThemeProvider
      attribute="class" // 使用 class 属性来切换主题 (TailwindCSS class 模式)
      defaultTheme="system" // 默认使用系统主题
      enableSystem={true} // 启用系统主题检测
      disableTransitionOnChange // 禁用切换时的过渡效果，避免闪烁
    >
      {children}
    </ThemeProvider>
  );
}
