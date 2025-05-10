"use client";

import React from 'react';
// --- BEGIN COMMENT --- 移除 react-i18next 的导入 --- END COMMENT ---
// import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils';
import { Spinner } from '@components/ui/spinner';
import { useTheme } from '@lib/hooks/use-theme';
import { useMobile } from '@lib/hooks/use-mobile';
import { useThemeColors } from '@lib/hooks/use-theme-colors';

// --- BEGIN COMMENT --- 定义状态类型 --- END COMMENT ---
export type ThinkBlockStatus = 'thinking' | 'completed' | 'stopped'; 

/**
 * ThinkBlock 标题栏属性接口
 */
interface ThinkBlockHeaderProps {
  // --- BEGIN COMMENT --- 使用 status 替代 isThinking --- END COMMENT ---
  status: ThinkBlockStatus; 
  // 内容区域是否展开
  isOpen: boolean;
  // 点击时触发的回调函数
  onToggle: () => void;
  // --- BEGIN COMMENT --- 移除 statusText prop --- END COMMENT ---
  // statusText: { ... };
}

/**
 * ThinkBlock 的水平按钮样式标题栏组件
 * 显示展开/折叠图标、状态文本 ("正在深度思考", "已深度思考", "思考已停止") 和加载 Spinner。
 * --- 中文注释: 该组件负责渲染 ThinkBlock 的可交互标题栏，样式类似按钮 --- 
 */
export const ThinkBlockHeader: React.FC<ThinkBlockHeaderProps> = ({ 
  // --- BEGIN COMMENT --- 使用 status --- END COMMENT ---
  status, 
  isOpen, 
  onToggle 
}) => {
  // --- BEGIN COMMENT --- 移除 useTranslation hook --- END COMMENT ---
  // const { t } = useTranslation();
  const { isDark } = useTheme();
  const { colors } = useThemeColors();
  const isMobile = useMobile();

  // --- BEGIN COMMENT --- 根据 status 判断是否正在思考 (用于 Spinner 和样式) --- END COMMENT ---
  const isThinking = status === 'thinking'; 

  // --- BEGIN COMMENT --- 获取状态对应的显示文本 --- END COMMENT ---
  const getStatusText = () => { 
    switch (status) {
      case 'thinking':
        return "正在深度思考";
      case 'stopped':
        return "思考已停止";
      case 'completed':
      default:
        return "已深度思考";
    }
  };

  return (
    <button 
      className={cn(
        // --- 中文注释: 基础布局：Flex, 垂直居中, 两端对齐 --- 
        "flex items-center justify-between", 
        // --- 中文注释: 尺寸和样式：宽度占满，调整垂直内边距使其更矮，圆角，下边距，可点击 --- 
        isMobile ? "w-full" : "w-[22%]", // 移动端占满宽度，桌面端保持22%
        "px-3 py-1.5 rounded-md cursor-pointer mb-1 text-sm",
        // --- BEGIN COMMENT --- 背景和边框颜色根据 isThinking (即 status === 'thinking') --- END COMMENT ---
        isThinking
          ? isDark 
            ? "bg-stone-700/80 border border-stone-600/60" 
            : "bg-stone-200/80 border border-stone-300/60" 
          : isDark 
            ? "bg-stone-800 border border-stone-700 hover:bg-stone-700" 
            : "bg-stone-100 border border-stone-200 hover:bg-stone-200", 
        // --- BEGIN COMMENT --- 可以为 stopped 状态添加特殊样式，例如不同的背景色或边框色 --- END COMMENT ---
        // status === 'stopped' && (isDark ? "border-yellow-700" : "border-yellow-400"), 
        // --- 中文注释: 焦点样式和过渡效果 --- 
        "focus:outline-none"
      )}
      onClick={onToggle} // --- 中文注释: 点击时调用切换函数 --- 
      aria-expanded={isOpen} // --- 中文注释: 无障碍属性，指示是否展开 --- 
      aria-controls="think-block-content" // --- 中文注释: 无障碍属性，关联内容区域 --- 
    >
      {/* --- 左侧区域：图标和状态文本 --- */}
      <div className="flex items-center">
        {/* --- 展开/折叠图标 --- */}
        <svg
          className={cn(
            "h-4 w-4 mr-2", // --- 中文注释: 图标大小，右边距 --- 
            isOpen ? "rotate-90" : "rotate-0", // --- 中文注释: 根据展开状态旋转 --- 
            // --- BEGIN COMMENT --- 图标颜色根据 isThinking --- END COMMENT ---
            isThinking ? "text-stone-500 dark:text-stone-300" : "text-stone-500 dark:text-stone-400" // --- 中文注释: 图标颜色根据思考状态变化 --- 
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        {/* --- 状态文本 --- */}
        <span className={cn(
          "font-medium whitespace-nowrap", // 添加 whitespace-nowrap 防止文本换行
          // --- BEGIN COMMENT --- 文本颜色根据 isThinking (可以为 stopped 添加不同颜色) --- END COMMENT ---
          isThinking ? "text-stone-600 dark:text-stone-200" : "text-stone-500 dark:text-stone-300" 
          // status === 'stopped' && (isDark ? "text-yellow-400" : "text-yellow-600"), 
        )}>
          {/* --- BEGIN COMMENT --- 调用函数获取中文文本 --- END COMMENT --- */}
          {getStatusText()} 
        </span>
      </div>

      {/* --- 右侧区域：Spinner (仅在思考中显示) --- */}
      <div className="h-4 w-4 flex-shrink-0"> {/* 添加 flex-shrink-0 防止 Spinner 被压缩 --- */} 
        {isThinking && (
          <Spinner 
            size="md" 
            className={cn(isThinking ? "text-stone-500 dark:text-stone-300" : "text-stone-500 dark:text-stone-400")} // --- 中文注释: Spinner 颜色与状态匹配 --- 
          />
        )}
      </div>
    </button>
  );
}; 