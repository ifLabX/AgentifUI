import { useTheme as useNextTheme } from 'next-themes'; // 别名导入以区分
import { useEffect, useState } from 'react';

// --- BEGIN COMMENT ---
// 从localStorage同步获取初始主题状态，避免闪烁
// 这个函数在客户端立即执行，不依赖React状态
// --- END COMMENT ---
const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    // 首先检查localStorage中的主题设置
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') return true;
    if (storedTheme === 'light') return false;
    
    // 如果是system或未设置，检查系统偏好
    if (storedTheme === 'system' || !storedTheme) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return false;
  } catch {
    return false;
  }
};

// --- BEGIN COMMENT ---
// 自定义 useTheme Hook
// 内部封装了 next-themes 的 useTheme Hook，提供与项目之前使用习惯兼容的接口
// 并处理了客户端水合问题以确保 isDark 状态在初始渲染时的正确性
// --- END COMMENT ---
export function useTheme() {
  const { 
    theme, // 当前设置的主题 ('light', 'dark', 或 'system')
    setTheme, // 用于设置主题的函数 ('light', 'dark', 'system')
    resolvedTheme, // 实际解析并应用的主题 ('light' 或 'dark')，会解析 'system'
    systemTheme // 用户的系统偏好 ('light' 或 'dark')
  } = useNextTheme();

  // --- BEGIN COMMENT ---
  // 使用初始主题状态，避免闪烁
  // 在客户端立即获取正确的主题状态，而不是等待mounted
  // --- END COMMENT ---
  const [mounted, setMounted] = useState(false);
  const [initialDark] = useState(() => getInitialTheme());
  
  useEffect(() => setMounted(true), []);

  // --- BEGIN COMMENT ---
  // 计算 isDark 状态
  // 在挂载前使用初始主题状态，挂载后使用resolvedTheme
  // 这样可以避免初始渲染时的主题闪烁
  // --- END COMMENT ---
  const isDark = mounted ? resolvedTheme === 'dark' : initialDark;

  // --- BEGIN COMMENT ---
  // 提供一个便捷的切换函数，用于在亮色和暗色之间切换
  // 使用 resolvedTheme 判断当前实际应用的主题来进行切换
  // --- END COMMENT ---
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // 返回一个包含主题相关状态和操作的对象
  return {
    theme, // 当前设置 ('light', 'dark', 'system')
    setTheme, // 设置主题函数
    resolvedTheme, // 实际应用的主题 ('light', 'dark')
    isDark, // 是否为暗色模式 (仅在客户端挂载后有效)
    toggleTheme // 切换亮/暗模式函数
  };
} 