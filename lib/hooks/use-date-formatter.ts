import { useMemo } from 'react';

import { useFormatter, useTranslations } from 'next-intl';

import { useUserTimezone } from './use-user-timezone';

// --- BEGIN COMMENT ---
// 时间格式化选项接口
// --- END COMMENT ---
export interface DateFormatOptions {
  includeTime?: boolean;
  style?: 'short' | 'medium' | 'long' | 'full';
  timeStyle?: 'short' | 'medium' | 'long';
  relative?: boolean;
  timezone?: string;
}

// --- BEGIN COMMENT ---
// 时间问候语选项
// --- END COMMENT ---
export interface TimeGreetingOptions {
  timezone?: string;
  includeUsername?: boolean;
  username?: string | null;
}

// --- BEGIN COMMENT ---
// 统一的时间格式化 Hook
// 提供标准化的时间显示功能，支持时区和国际化
// 使用 common.time 翻译路径，作为全局通用组件
// --- END COMMENT ---
export function useDateFormatter(defaultTimezone?: string) {
  const format = useFormatter();
  const t = useTranslations('common.time');
  const { timezone: userTimezone } = useUserTimezone();

  // --- BEGIN COMMENT ---
  // 核心日期格式化函数
  // --- END COMMENT ---
  const formatDate = useMemo(() => {
    return (
      dateInput: string | Date | null | undefined,
      options: DateFormatOptions = {}
    ): string => {
      // 处理空值情况
      if (!dateInput) {
        return t('notRecorded');
      }

      try {
        const date =
          typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

        // 检查日期有效性
        if (isNaN(date.getTime())) {
          console.warn('[useDateFormatter] Invalid date:', dateInput);
          return t('invalidDate');
        }

        const timezone = options.timezone || defaultTimezone || userTimezone;

        // 构建格式化选项 - 使用next-intl兼容的类型
        const formatOptions: any = {
          timeZone: timezone,
        };

        // 根据样式设置日期格式
        switch (options.style) {
          case 'short':
            formatOptions.year = 'numeric';
            formatOptions.month = 'short';
            formatOptions.day = 'numeric';
            break;
          case 'medium':
            formatOptions.year = 'numeric';
            formatOptions.month = 'long';
            formatOptions.day = 'numeric';
            break;
          case 'long':
            formatOptions.year = 'numeric';
            formatOptions.month = 'long';
            formatOptions.day = 'numeric';
            formatOptions.weekday = 'long';
            break;
          case 'full':
            formatOptions.dateStyle = 'full';
            break;
          default:
            // 默认中等样式
            formatOptions.year = 'numeric';
            formatOptions.month = 'long';
            formatOptions.day = 'numeric';
        }

        // 添加时间格式
        if (options.includeTime) {
          switch (options.timeStyle) {
            case 'short':
              formatOptions.hour = '2-digit';
              formatOptions.minute = '2-digit';
              break;
            case 'medium':
              formatOptions.hour = '2-digit';
              formatOptions.minute = '2-digit';
              formatOptions.second = '2-digit';
              break;
            case 'long':
              formatOptions.hour = '2-digit';
              formatOptions.minute = '2-digit';
              formatOptions.second = '2-digit';
              formatOptions.timeZoneName = 'short'; // 仅使用next-intl支持的值
              break;
            default:
              formatOptions.hour = '2-digit';
              formatOptions.minute = '2-digit';
          }
        }

        return format.dateTime(date, formatOptions);
      } catch (error) {
        console.error('[useDateFormatter] 格式化失败:', error);
        return typeof dateInput === 'string' ? dateInput : t('formatError');
      }
    };
  }, [format, t, defaultTimezone, userTimezone]);

  // --- BEGIN COMMENT ---
  // 相对时间格式化（如：2小时前）
  // --- END COMMENT ---
  const formatRelativeTime = useMemo(() => {
    return (
      dateInput: string | Date | null | undefined,
      options: { timezone?: string } = {}
    ): string => {
      if (!dateInput) return t('notRecorded');

      try {
        const date =
          typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        const now = new Date();

        // 如果指定了时区，需要调整当前时间
        if (options.timezone) {
          // 这里可以根据需要实现时区调整逻辑
        }

        return format.relativeTime(date, now);
      } catch (error) {
        console.error('[useDateFormatter] 相对时间格式化失败:', error);
        return formatDate(dateInput, { style: 'short' });
      }
    };
  }, [format, formatDate, t]);

  // --- BEGIN COMMENT ---
  // 基于时间的问候语生成
  // 🎯 这是核心的时间问候功能，使用 common.time.greeting 翻译路径
  // 🚨 修复：使用用户时区设置生成问候语
  // --- END COMMENT ---
  const getTimeBasedGreeting = useMemo(() => {
    return (options: TimeGreetingOptions = {}): string => {
      try {
        const now = new Date();

        // 获取指定时区的小时数 - 优先使用用户时区设置
        let hour: number;
        const timezone = options.timezone || userTimezone;

        if (timezone) {
          const timeString = new Intl.DateTimeFormat('en', {
            hour: 'numeric',
            hour12: false,
            timeZone: timezone,
          }).format(now);
          hour = parseInt(timeString, 10);
        } else {
          hour = now.getHours();
        }

        // 确定问候语类型
        let greetingKey: string;
        if (hour >= 6 && hour < 12) {
          greetingKey = 'morning';
        } else if (hour >= 12 && hour < 18) {
          greetingKey = 'afternoon';
        } else if (hour >= 18 && hour < 22) {
          greetingKey = 'evening';
        } else {
          greetingKey = 'night';
        }

        const greeting = t(`greeting.${greetingKey}`);

        // 添加用户名（如果提供）
        if (options.includeUsername && options.username) {
          return `${greeting}，${options.username}`;
        }

        return greeting;
      } catch (error) {
        console.error('[useDateFormatter] 问候语生成失败:', error);
        return t('greeting.default');
      }
    };
  }, [t, userTimezone]);

  // --- BEGIN COMMENT ---
  // 格式化执行时间（毫秒转可读格式）
  // --- END COMMENT ---
  const formatDuration = useMemo(() => {
    return (milliseconds: number): string => {
      if (milliseconds < 1000) {
        return `${milliseconds}ms`;
      }

      const seconds = (milliseconds / 1000).toFixed(1);
      return `${seconds}s`;
    };
  }, []);

  // --- BEGIN COMMENT ---
  // 获取当前用户时区
  // --- END COMMENT ---
  const getCurrentTimezone = useMemo(() => {
    return (): string => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch (error) {
        console.warn('[useDateFormatter] 无法获取系统时区，使用默认值');
        return 'Asia/Shanghai';
      }
    };
  }, []);

  // --- BEGIN COMMENT ---
  // 验证时区是否有效
  // --- END COMMENT ---
  const isValidTimezone = useMemo(() => {
    return (timezone: string): boolean => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
        return true;
      } catch {
        return false;
      }
    };
  }, []);

  return {
    formatDate,
    formatRelativeTime,
    formatDuration,
    getTimeBasedGreeting,
    getCurrentTimezone,
    isValidTimezone,
  };
}

// --- BEGIN COMMENT ---
// 预设的常用格式化选项
// --- END COMMENT ---
export const DateFormatPresets = {
  // 短日期：2024年1月15日
  shortDate: { style: 'short' as const },

  // 中等日期：2024年1月15日
  mediumDate: { style: 'medium' as const },

  // 长日期：2024年1月15日 星期一
  longDate: { style: 'long' as const },

  // 完整日期：2024年1月15日星期一
  fullDate: { style: 'full' as const },

  // 日期时间：2024年1月15日 14:30
  dateTime: { style: 'medium' as const, includeTime: true },

  // 详细时间：2024年1月15日 14:30:25
  detailedDateTime: {
    style: 'medium' as const,
    includeTime: true,
    timeStyle: 'medium' as const,
  },

  // 完整时间：2024年1月15日 14:30:25 CST
  fullDateTime: {
    style: 'medium' as const,
    includeTime: true,
    timeStyle: 'long' as const,
  },
} as const;
