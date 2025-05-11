"use client";

import React, { useState, useEffect } from 'react';
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
  // 使用状态来确保客户端渲染和服务器渲染一致
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith('/chat');
  
  // 组件挂载后设置状态
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 在组件挂载时为 body 元素添加适当的类
  useEffect(() => {
    if (!mounted) return;
    
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
  }, [pathname, isChatPage, mounted]);
  
  // 在客户端渲染之前使用一个基本的类名，避免水合错误
  const layoutClass = mounted
    ? cn(
        fontClasses,
        'antialiased',
        isChatPage ? 'h-full' : 'min-h-screen'
      )
    : cn(fontClasses, 'antialiased'); // 初始渲染时使用最小的类集合
  
  return (
    <div className={layoutClass}>
      {children}
    </div>
  );
}
