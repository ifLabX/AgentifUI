'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@lib/utils';
import { useTheme } from '@lib/hooks/use-theme';
import { motion, AnimatePresence } from 'framer-motion';

// --- BEGIN COMMENT ---
// 现代化语言切换器组件
// 支持两种变体：floating（首页）和navbar（导航栏）
// 使用真正的 dropdown，参考 sidebar button 的悬停效果
// --- END COMMENT ---

const languages = {
  'zh-CN': { name: '简体中文', flag: '🇨🇳' },
  'en-US': { name: 'English', flag: '🇺🇸' }
} as const;

interface LanguageSwitcherProps {
  variant?: 'floating' | 'navbar';
}

export function LanguageSwitcher({ variant = 'floating' }: LanguageSwitcherProps) {
  const { isDark } = useTheme();
  const currentLocale = useLocale() as keyof typeof languages;
  const [isOpen, setIsOpen] = useState(false);

  // --- BEGIN COMMENT ---
  // 实际的语言切换逻辑：设置 Cookie 并刷新页面
  // --- END COMMENT ---
  const handleLanguageChange = async (locale: keyof typeof languages) => {
    // 设置 Cookie
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${365 * 24 * 60 * 60}`;
    
    // 关闭下拉菜单
    setIsOpen(false);
    
    // 刷新页面以应用新语言
    window.location.reload();
  };

  // --- BEGIN COMMENT ---
  // 点击外部区域关闭下拉菜单
  // --- END COMMENT ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-language-switcher]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // --- BEGIN COMMENT ---
  // 根据主题获取按钮样式：参考 sidebar button 的悬停效果
  // --- END COMMENT ---
  const getButtonColors = () => {
    if (isDark) {
      return "bg-stone-800/50 hover:bg-stone-600/60 text-gray-200 border-stone-600/30";
    }
    return "bg-stone-200/50 hover:bg-stone-300/80 text-stone-600 border-stone-400/30";
  };

  // --- BEGIN COMMENT ---
  // 获取下拉菜单的样式
  // --- END COMMENT ---
  const getDropdownColors = () => {
    if (isDark) {
      return "bg-stone-900/95 border-stone-600/30 text-gray-200";
    }
    return "bg-white/95 border-stone-400/30 text-stone-600";
  };

  // --- BEGIN COMMENT ---
  // floating变体：用于首页，带有动画效果
  // --- END COMMENT ---
  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="relative"
        data-language-switcher
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border backdrop-blur-sm",
            "transition-colors duration-200 cursor-pointer font-serif h-10",
            "shadow-sm hover:shadow-md",
            getButtonColors()
          )}
        >
          <span className="text-lg">{languages[currentLocale].flag}</span>
          <span className="text-sm font-medium hidden sm:inline">
            {languages[currentLocale].name}
          </span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "absolute top-full mt-2 right-0 w-36 rounded-lg border backdrop-blur-sm z-50",
                "shadow-lg",
                getDropdownColors()
              )}
            >
              {Object.entries(languages).map(([locale, info]) => (
                <button
                  key={locale}
                  onClick={() => handleLanguageChange(locale as keyof typeof languages)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer",
                    "hover:bg-stone-100/50 dark:hover:bg-stone-700/50",
                    "transition-colors duration-150 font-serif",
                    "first:rounded-t-lg last:rounded-b-lg",
                    currentLocale === locale && "bg-stone-100/70 dark:bg-stone-700/70"
                  )}
                >
                  <span className="text-lg">{info.flag}</span>
                  <span className="text-sm font-medium">{info.name}</span>
                  {currentLocale === locale && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // --- BEGIN COMMENT ---
  // navbar变体：用于导航栏，更紧凑的设计
  // --- END COMMENT ---
  return (
    <div className="relative" data-language-switcher>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md border",
          "transition-colors duration-200 cursor-pointer font-serif h-10",
          "shadow-sm hover:shadow-md",
          getButtonColors()
        )}
      >
        <span className="text-base">{languages[currentLocale].flag}</span>
        <span className="text-sm font-medium hidden md:inline">
          {languages[currentLocale].name}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute top-full mt-2 right-0 w-32 rounded-lg border backdrop-blur-sm z-50",
              "shadow-lg",
              getDropdownColors()
            )}
          >
            {Object.entries(languages).map(([locale, info]) => (
              <button
                key={locale}
                onClick={() => handleLanguageChange(locale as keyof typeof languages)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer",
                  "hover:bg-stone-100/50 dark:hover:bg-stone-700/50",
                  "transition-colors duration-150 font-serif",
                  "first:rounded-t-lg last:rounded-b-lg",
                  currentLocale === locale && "bg-stone-100/70 dark:bg-stone-700/70"
                )}
              >
                <span className="text-base">{info.flag}</span>
                <span className="text-sm font-medium">{info.name}</span>
                {currentLocale === locale && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 