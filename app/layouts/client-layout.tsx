"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@lib/utils';

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
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith('/chat');
  
  // 在组件挂载时为 body 元素添加适当的类
  React.useEffect(() => {
    // 获取 body 元素
    const bodyElement = document.body;
    
    // 添加适当的类
    if (isChatPage) {
      bodyElement.classList.add('chat-page');
      bodyElement.classList.remove('default-page');
    } else {
      bodyElement.classList.add('default-page');
      bodyElement.classList.remove('chat-page');
    }
    
    // 清理函数
    return () => {
      bodyElement.classList.remove('chat-page', 'default-page');
    };
  }, [pathname, isChatPage]);
  
  return (
    <div className={cn(
      fontClasses,
      'antialiased',
      isChatPage ? 'h-full' : 'min-h-screen'
    )}>
      {children}
    </div>
  );
}
