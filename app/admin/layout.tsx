'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { cn } from '@lib/utils';
import {
  Bell,
  Building2,
  ChevronRight,
  Edit,
  FileText,
  Home,
  Key,
  Menu,
  PanelLeft,
  PanelLeftClose,
  Pin,
  PinOff,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';

import React, { ReactNode, useEffect, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description?: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { isDark } = useTheme();
  const { colors } = useThemeColors();

  // --- BEGIN COMMENT ---
  // 侧边栏状态管理 - 简化为只有悬停功能
  // --- END COMMENT ---
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [hoverTimeoutId, setHoverTimeoutId] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // --- BEGIN COMMENT ---
  // 导航状态管理 - 提供立即视觉反馈和加载状态
  // --- END COMMENT ---
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // --- BEGIN COMMENT ---
  // 管理菜单项配置 - 包含管理主页
  // --- END COMMENT ---
  const menuItems: MenuItem[] = [
    {
      text: '管理主页',
      icon: Wrench,
      href: '/admin',
      description: '管理后台概览',
    },
    {
      text: 'API 密钥',
      icon: Key,
      href: '/admin/api-config',
      description: '管理应用实例和配置参数',
    },
    {
      text: '关于与通知',
      icon: Bell,
      href: '/admin/content',
      description: '管理About页面和系统通知推送',
    },
    {
      text: '用户管理',
      icon: Users,
      href: '/admin/users',
      description: '管理用户账户和权限',
    },
    {
      text: '群组管理',
      icon: Building2,
      href: '/admin/groups',
      description: '管理用户和群组，配置群组应用权限',
    },
  ];

  // --- BEGIN COMMENT ---
  // 面包屑导航生成
  // --- END COMMENT ---
  const getBreadcrumbs = () => {
    const currentItem = menuItems.find(item => pathname.startsWith(item.href));
    return [
      { text: '管理后台', href: '/admin' },
      ...(currentItem && currentItem.href !== '/admin'
        ? [{ text: currentItem.text, href: currentItem.href }]
        : []),
    ];
  };

  // --- BEGIN COMMENT ---
  // 客户端挂载
  // --- END COMMENT ---
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- BEGIN COMMENT ---
  // 处理内容显示逻辑 - 优化响应速度
  // --- END COMMENT ---
  useEffect(() => {
    if (!isExpanded) {
      setContentVisible(false);
      return;
    }

    // 🎯 减少内容显示延迟，提升响应速度
    const timer = setTimeout(() => {
      setContentVisible(true);
    }, 20); // 从50ms减少到20ms

    return () => clearTimeout(timer);
  }, [isExpanded]);

  // --- BEGIN COMMENT ---
  // 处理悬停 - 优化响应速度，减少延迟
  // --- END COMMENT ---
  const handleSetHovering = (hovering: boolean) => {
    // 移动端忽略悬停
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return;
    }

    // 清除现有超时
    if (hoverTimeoutId) {
      clearTimeout(hoverTimeoutId);
      setHoverTimeoutId(null);
    }

    // 🎯 悬停进入 - 立即响应，无延迟
    if (hovering && !isExpanded) {
      setIsHovering(true);
      setIsExpanded(true);
      return;
    }

    // 🎯 悬停离开 - 减少延迟，提升响应速度
    if (!hovering && isHovering) {
      const timeoutId = window.setTimeout(() => {
        setIsHovering(false);
        setIsExpanded(false);
        setContentVisible(false);
      }, 100); // 从150ms减少到100ms
      setHoverTimeoutId(timeoutId);
      return;
    }

    setIsHovering(hovering);
  };

  // --- BEGIN COMMENT ---
  // 处理菜单项点击 - 提供立即视觉反馈和互斥选中
  // --- END COMMENT ---
  const handleMenuClick = (href: string) => {
    // 如果已经在导航中，忽略重复点击
    if (isNavigating) return;

    // 立即设置导航状态
    setNavigatingTo(href);
    setIsNavigating(true);
  };

  // --- BEGIN COMMENT ---
  // 监听路由变化，清除导航状态
  // --- END COMMENT ---
  useEffect(() => {
    if (navigatingTo && pathname === navigatingTo) {
      // 路由已经切换到目标页面，清除导航状态
      setNavigatingTo(null);
      setIsNavigating(false);
    }
  }, [pathname, navigatingTo]);

  // --- BEGIN COMMENT ---
  // 清理定时器
  // --- END COMMENT ---
  useEffect(() => {
    return () => {
      if (hoverTimeoutId) {
        clearTimeout(hoverTimeoutId);
      }
    };
  }, [hoverTimeoutId]);

  return (
    <div
      className={cn(
        'relative min-h-screen font-serif',
        colors.mainBackground.tailwind
      )}
    >
      {/* --- BEGIN COMMENT ---
      顶部导航栏 - 固定在顶部，不受sidebar影响，使用与sidebar相同的配色，确保z-index在sidebar之上
      --- END COMMENT --- */}
      <header
        className={cn(
          'fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-md',
          colors.sidebarBackground.tailwind,
          isDark ? 'border-b-stone-700/50' : 'border-b-stone-300/60'
        )}
      >
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-4">
            <h1
              className={cn(
                'text-base font-semibold',
                colors.mainText.tailwind
              )}
            >
              AgentifUI 管理后台
            </h1>

            {/* --- BEGIN COMMENT ---
            面包屑导航
            --- END COMMENT --- */}
            {getBreadcrumbs().length > 1 && (
              <nav className="ml-4">
                <ol className="flex items-center space-x-2 text-sm">
                  {getBreadcrumbs().map((crumb, index) => (
                    <li key={crumb.href} className="flex items-center">
                      {index > 0 && (
                        <ChevronRight className="mx-2 h-3 w-3 text-stone-400" />
                      )}
                      <Link
                        href={crumb.href}
                        className={cn(
                          'transition-colors hover:underline',
                          index === getBreadcrumbs().length - 1
                            ? colors.mainText.tailwind + ' font-medium'
                            : isDark
                              ? 'text-stone-400 hover:text-stone-200'
                              : 'text-stone-500 hover:text-stone-700'
                        )}
                      >
                        {crumb.text}
                      </Link>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-200',
                isDark
                  ? 'border border-stone-600/50 bg-stone-700/50 text-stone-300 hover:border-stone-500 hover:bg-stone-600 hover:text-stone-100'
                  : 'border border-stone-200 bg-stone-100/80 text-stone-600 hover:border-stone-300 hover:bg-stone-200 hover:text-stone-900'
              )}
            >
              <Edit className="h-4 w-4" />
              <span className="hidden text-sm sm:inline">返回对话</span>
            </Link>
          </div>
        </div>
      </header>

      {/* --- BEGIN COMMENT ---
      侧边栏 - 从顶部开始，消除与navbar的缝隙，只有悬停功能
      --- END COMMENT --- */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 flex flex-col border-r',
          // 🎯 优化动画速度 - 从300ms减少到150ms，使用更快的缓动函数
          'transition-[width] duration-150 ease-out',
          // 宽度设置 - 展开时64，收起时16
          isExpanded ? 'w-64' : 'w-16',
          // 移动端未挂载时隐藏
          !isMounted && 'opacity-0',
          // 高z-index确保覆盖其他内容
          'z-45',
          // 主题样式 - 与navbar使用相同配色
          colors.sidebarBackground.tailwind,
          'backdrop-blur-sm',
          isDark
            ? 'border-r-stone-700/50 text-stone-300 shadow-xl shadow-black/40'
            : 'border-r-stone-300/60 text-stone-700 shadow-xl shadow-stone-300/60'
        )}
        onMouseEnter={() => handleSetHovering(true)}
        onMouseLeave={() => handleSetHovering(false)}
      >
        <div className="flex h-full flex-col">
          {/* --- BEGIN COMMENT ---
          侧边栏头部 - 为navbar留出空间
          --- END COMMENT --- */}
          <div className="px-3 pt-16 pb-4">
            <div className="space-y-1">
              {menuItems.map(item => {
                // 🎯 重新设计选中逻辑，确保互斥
                const isCurrentPage =
                  pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href));
                const isNavigatingToThis = navigatingTo === item.href;

                // 🎯 选中状态：正在导航到此页面 OR (当前在此页面 AND 没有在导航到其他页面)
                const isActive =
                  isNavigatingToThis || (isCurrentPage && !navigatingTo);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleMenuClick(item.href)}
                    className={cn(
                      'relative flex items-center rounded-lg px-3 py-2 text-sm font-medium',
                      'transition-all duration-200 ease-in-out',
                      'outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                      isDark
                        ? 'focus-visible:ring-stone-500 focus-visible:ring-offset-gray-900'
                        : 'focus-visible:ring-primary focus-visible:ring-offset-background',
                      'h-10 min-h-[2.5rem] border border-transparent',
                      !isDark && [
                        'text-stone-600',
                        'hover:bg-stone-300 hover:shadow-md',
                        isActive &&
                          'border-stone-400/80 bg-stone-300 shadow-sm',
                      ],
                      isDark && [
                        'text-gray-200',
                        'hover:border-stone-500/50 hover:bg-stone-600 hover:shadow-md',
                        isActive && 'border-stone-500 bg-stone-600 shadow-sm',
                      ],
                      isExpanded ? 'w-full' : 'w-10 justify-center'
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center">
                      <span
                        className={cn(
                          '-ml-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center',
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      {isExpanded && contentVisible && (
                        <div
                          className={cn(
                            'ml-2 min-w-0 flex-1 truncate font-serif',
                            'flex items-center leading-snug'
                          )}
                        >
                          {item.text}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* --- BEGIN COMMENT ---
      主内容区域 - 顶部留出navbar空间，左侧始终留出slim sidebar空间
      --- END COMMENT --- */}
      <main
        className={cn(
          // 🎯 优化主内容区域过渡动画速度
          'relative ml-16 min-h-screen pt-12 transition-all duration-150 ease-out'
        )}
      >
        {/* --- BEGIN COMMENT ---
        导航加载状态覆盖层 - 仅覆盖主内容区域
        --- END COMMENT --- */}
        {isNavigating && (
          <div
            className={cn(
              'absolute inset-0 z-10 flex items-center justify-center',
              'backdrop-blur-sm',
              isDark ? 'bg-stone-900/50' : 'bg-white/50'
            )}
          >
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg border px-6 py-3 shadow-lg',
                isDark
                  ? 'border-stone-700 bg-stone-800 text-stone-200'
                  : 'border-stone-200 bg-white text-stone-700'
              )}
            >
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span className="text-sm font-medium">正在加载...</span>
            </div>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
