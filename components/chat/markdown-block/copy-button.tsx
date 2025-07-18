'use client';

import { TooltipWrapper } from '@components/ui/tooltip-wrapper';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { FiCheck, FiCopy } from 'react-icons/fi';

import React from 'react';

interface CopyButtonProps {
  content?: string;
  className?: string;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  tooltipSize?: 'sm' | 'md'; // tooltip尺寸
  showTooltipArrow?: boolean; // 是否显示tooltip箭头
  onCopy?: () => void;
}

// 使用随机ID生成器确保每个复制按钮的tooltip是唯一的
const generateUniqueId = () =>
  `copy-btn-${Math.random().toString(36).substring(2, 11)}`;

/**
 * 通用复制按钮组件
 * 适用于代码块、引用块等需要复制功能的地方
 * 符合应用的石色主题，在亮色和暗色模式下都有良好的视觉效果
 */
export const CopyButton: React.FC<CopyButtonProps> = React.memo(
  ({
    content,
    className,
    tooltipPlacement = 'bottom',
    tooltipSize = 'sm',
    showTooltipArrow = false,
    onCopy,
  }) => {
    const { isDark } = useTheme();

    // 复制功能状态
    const [isCopied, setIsCopied] = React.useState(false);

    // 为每个复制按钮生成唯一的tooltip ID
    const tooltipId = React.useRef(generateUniqueId()).current;

    // 处理复制操作
    const handleCopy = React.useCallback(async () => {
      if (!content) return;

      try {
        await navigator.clipboard.writeText(content);
        setIsCopied(true);

        // 调用外部传入的onCopy回调（如果有）
        if (onCopy) {
          onCopy();
        }

        // 2秒后重置状态
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      } catch (error) {
        console.error('Failed to copy content:', error);
      }
    }, [content, onCopy]);

    if (!content) return null;

    return (
      <TooltipWrapper
        content={isCopied ? '已复制' : '复制内容'}
        id={tooltipId}
        placement={tooltipPlacement}
        size={tooltipSize}
        showArrow={showTooltipArrow}
        _desktopOnly={true}
      >
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center justify-center rounded-md p-1.5',
            // 基础文本颜色 - 符合石色主题
            isDark ? 'text-stone-400' : 'text-stone-500',
            // 悬停文本颜色 - 亮色模式变深，暗色模式变亮
            isDark ? 'hover:text-stone-300' : 'hover:text-stone-700',
            // 悬停背景色 - 使用半透明的中间色调，适合亮暗两种模式
            isDark ? 'hover:bg-stone-600/40' : 'hover:bg-stone-300/40',
            'focus:outline-none',
            className
          )}
          style={{ transform: 'translateZ(0)' }} // 添加硬件加速，减少闪烁
          aria-label={isCopied ? '已复制' : '复制内容'}
        >
          {isCopied ? (
            <FiCheck className="h-4 w-4" />
          ) : (
            <FiCopy className="h-4 w-4" />
          )}
        </button>
      </TooltipWrapper>
    );
  }
);

// 显示名称，方便调试
CopyButton.displayName = 'CopyButton';
