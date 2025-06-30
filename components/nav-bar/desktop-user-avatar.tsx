'use client';

import { LogoutConfirmDialog } from '@components/ui';
import { useLogout } from '@lib/hooks/use-logout';
import { useProfile } from '@lib/hooks/use-profile';
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { cn } from '@lib/utils';
import {
  Clock,
  Info,
  LogOut,
  Settings,
  Shield,
  Sliders,
  UserCircle,
  Wrench,
} from 'lucide-react';

import React, { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

// 直接从localStorage获取主题设置
const getThemeFromCache = () => {
  if (typeof window === 'undefined') return false;

  try {
    const theme = localStorage.getItem('theme');
    return theme === 'dark';
  } catch {
    return false;
  }
};

/**
 * 桌面端用户头像菜单组件
 * 特点：
 * - 纯圆形头像设计，无外框
 * - 使用useProfile hook获取用户信息，确保与认证状态同步
 * - 使用内联样式确保主题一致性
 * - 优化的渲染性能，减少重新渲染
 */
export function DesktopUserAvatar() {
  const { colors, isDark } = useThemeColors();
  const { logout } = useLogout();
  const router = useRouter();
  const t = useTranslations('navbar.user');

  // 使用useProfile hook获取用户信息，自动处理缓存和认证状态同步
  const { profile } = useProfile();

  const [currentTheme, setCurrentTheme] = useState(() => getThemeFromCache());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // 只监听主题变化，用户信息由useProfile hook管理
  useEffect(() => {
    const handleThemeChange = () => {
      setCurrentTheme(getThemeFromCache());
    };

    // 监听storage事件
    window.addEventListener('storage', handleThemeChange);

    // 定期检查主题更新
    const interval = setInterval(handleThemeChange, 5000);

    return () => {
      window.removeEventListener('storage', handleThemeChange);
      clearInterval(interval);
    };
  }, []);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // 生成用户头像的首字母
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // 根据用户名生成一致的石色系背景颜色
  const getAvatarBgColor = (name: string) => {
    const colors = [
      '#78716c', // stone-500
      '#57534e', // stone-600
      '#44403c', // stone-700
      '#64748b', // slate-500
      '#475569', // slate-600
      '#6b7280', // gray-500
      '#4b5563', // gray-600
      '#737373', // neutral-500
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // 切换下拉菜单
  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(prev => {
      if (prev) {
        // 关闭菜单时重置悬停状态
        setHoveredItem(null);
      }
      return !prev;
    });
  };

  // 处理菜单项点击
  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsDropdownOpen(false);
    setHoveredItem(null);
  };

  // 处理退出登录 - 显示确认对话框
  const handleLogout = () => {
    setShowLogoutDialog(true);
    setIsDropdownOpen(false);
    setHoveredItem(null);
  };

  // 菜单项定义
  const menuItems = [
    {
      icon: Clock,
      label: t('history'),
      action: () => router.push('/chat/history'),
    },
    {
      icon: Sliders,
      label: t('settings'),
      action: () => router.push('/settings'),
    },
    {
      icon: Info,
      label: t('about'),
      action: () => router.push('/about'),
    },
  ];

  // 管理员专用菜单项，仅对管理员用户显示
  const adminMenuItems = [
    {
      icon: Wrench,
      label: t('admin'),
      action: () => router.push('/admin'),
    },
  ];

  // 根据用户角色合并菜单项
  const allMenuItems =
    profile?.role === 'admin' ? [...menuItems, ...adminMenuItems] : menuItems;

  const isLoggedIn = !!profile;
  const userName = profile?.full_name || profile?.username || t('userMenu');
  const userCompany = '群组系统'; // 简化显示，移除组织部门概念
  const avatarUrl = profile?.avatar_url;

  // 使用当前主题状态而不是hook，避免闪烁
  const effectiveTheme = currentTheme;

  return (
    <>
      {/* 退出登录确认对话框 */}
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
      />

      <div className="relative mr-2">
        {/* 纯圆形头像按钮 - 使用内联样式避免闪烁 */}
        <button
          ref={triggerRef}
          onClick={toggleDropdown}
          className="relative cursor-pointer rounded-full transition-all duration-200 focus:outline-none"
          style={{
            padding: 0,
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label={isLoggedIn ? t('userMenu') : t('login')}
        >
          {isLoggedIn ? (
            <>
              {/* 纯圆形头像 - 无边框 */}
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`${userName}的头像`}
                  className="h-10 w-10 rounded-full object-cover transition-transform duration-200 hover:scale-105"
                  style={{
                    border: 'none',
                  }}
                  onError={e => {
                    // 头像加载失败时隐藏图片
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-base font-medium text-white transition-transform duration-200 hover:scale-105"
                  style={{
                    backgroundColor: getAvatarBgColor(userName),
                    border: 'none',
                  }}
                >
                  {getInitials(userName)}
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: effectiveTheme ? '#57534e' : '#f5f5f4',
                color: effectiveTheme ? '#e7e5e4' : '#57534e',
                border: `2px solid ${effectiveTheme ? '#44403c' : '#d6d3d1'}`,
                transition: 'all 0.2s',
              }}
            >
              <UserCircle size={20} />
            </div>
          )}
        </button>

        {/* 下拉菜单 */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className="animate-slide-in-down absolute top-12 right-0 z-50 w-64 rounded-xl p-2 shadow-xl"
            style={{
              backgroundColor: colors.mainBackground.rgb,
              border: `1px solid ${effectiveTheme ? '#44403c' : '#e7e5e4'}`,
            }}
          >
            {isLoggedIn ? (
              <>
                {/* 用户信息头部 - 无头像版本 */}
                <div
                  className="mb-2 rounded-lg p-3"
                  style={{
                    backgroundColor: effectiveTheme
                      ? 'rgba(120, 113, 108, 0.3)'
                      : 'rgba(231, 229, 228, 0.8)',
                  }}
                >
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate font-serif text-sm font-semibold"
                        style={{
                          color: effectiveTheme ? '#f5f5f4' : '#1c1917',
                        }}
                      >
                        {userName}
                      </p>
                      <p
                        className="truncate font-serif text-xs"
                        style={{
                          color: effectiveTheme ? '#a8a29e' : '#78716c',
                        }}
                      >
                        {userCompany}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 分割线 */}
                <div
                  className="mb-2 h-px"
                  style={{
                    backgroundColor: effectiveTheme ? '#44403c' : '#e7e5e4',
                  }}
                />

                {/* 菜单项 */}
                <div className="space-y-1">
                  {allMenuItems.map((item, index) => {
                    const itemKey = `menu-${index}`;
                    const isHovered = hoveredItem === itemKey;

                    return (
                      <button
                        key={index}
                        onClick={() => handleMenuItemClick(item.action)}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 focus:outline-none"
                        style={{
                          backgroundColor: isHovered
                            ? effectiveTheme
                              ? 'rgba(68, 64, 60, 0.5)'
                              : 'rgba(231, 229, 228, 1)'
                            : 'transparent',
                          color: effectiveTheme ? '#d6d3d1' : '#44403c',
                        }}
                        onMouseEnter={() => setHoveredItem(itemKey)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <item.icon
                          className="h-4 w-4"
                          style={{
                            color: effectiveTheme ? '#a8a29e' : '#57534e',
                          }}
                        />
                        <span
                          className="flex-1 font-serif text-sm"
                          style={{
                            color: effectiveTheme ? '#d6d3d1' : '#44403c',
                          }}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 分割线 */}
                <div
                  className="my-2 h-px"
                  style={{
                    backgroundColor: effectiveTheme ? '#44403c' : '#e7e5e4',
                  }}
                />

                {/* 退出登录 */}
                <button
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 focus:outline-none"
                  style={{
                    color: '#dc2626',
                    backgroundColor:
                      hoveredItem === 'logout'
                        ? effectiveTheme
                          ? 'rgba(153, 27, 27, 0.2)'
                          : 'rgba(254, 226, 226, 1)'
                        : 'transparent',
                  }}
                  onMouseEnter={() => setHoveredItem('logout')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-serif text-sm">{t('logout')}</span>
                </button>
              </>
            ) : (
              <div className="p-4">
                {/* 未登录状态 */}
                <div
                  className="mb-6 rounded-xl px-4 py-6 text-center"
                  style={{
                    backgroundColor: effectiveTheme
                      ? 'rgba(120, 113, 108, 0.3)'
                      : 'rgba(231, 229, 228, 0.8)',
                    color: effectiveTheme ? '#d6d3d1' : '#57534e',
                  }}
                >
                  <UserCircle
                    className="mx-auto mb-3 h-16 w-16"
                    style={{
                      color: effectiveTheme ? '#a8a29e' : '#78716c',
                    }}
                  />
                  <p className="font-serif font-medium">{t('loginPrompt')}</p>
                  <p className="mt-1 font-serif text-sm opacity-75">
                    {t('loginDescription')}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() =>
                      handleMenuItemClick(() => router.push('/login'))
                    }
                    className="w-full transform rounded-xl px-4 py-3 text-center font-serif font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
                    style={{
                      backgroundColor:
                        hoveredItem === 'login' ? '#44403c' : '#57534e',
                    }}
                    onMouseEnter={() => setHoveredItem('login')}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {t('login')}
                  </button>

                  <button
                    onClick={() =>
                      handleMenuItemClick(() => router.push('/register'))
                    }
                    className="w-full transform rounded-xl px-4 py-3 text-center font-serif font-medium shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                    style={{
                      backgroundColor:
                        hoveredItem === 'register'
                          ? effectiveTheme
                            ? '#57534e'
                            : '#d6d3d1'
                          : effectiveTheme
                            ? '#44403c'
                            : '#f5f5f4',
                      color: effectiveTheme ? '#e7e5e4' : '#44403c',
                      border: `1px solid ${effectiveTheme ? '#57534e' : '#d6d3d1'}`,
                    }}
                    onMouseEnter={() => setHoveredItem('register')}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {t('register')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
