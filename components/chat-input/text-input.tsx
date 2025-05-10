"use client"

import { useRef, useCallback, useEffect, forwardRef } from "react"
import { cn } from "@lib/utils"
import { INITIAL_INPUT_HEIGHT } from "@lib/stores/chat-layout-store"
import { useThemeColors } from "@lib/hooks/use-theme-colors"

interface ChatTextInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  maxHeight?: number
  isDark?: boolean
  className?: string
  onCompositionStart?: (e: React.CompositionEvent<HTMLTextAreaElement>) => void
  onCompositionEnd?: (e: React.CompositionEvent<HTMLTextAreaElement>) => void
  onHeightChange?: (height: number) => void
  disabled?: boolean
  readOnly?: boolean
}

export const ChatTextInput = forwardRef<HTMLTextAreaElement, ChatTextInputProps>(({
  value,
  onChange,
  onKeyDown,
  placeholder = "输入消息...",
  maxHeight = 180,
  isDark = false,
  className,
  onCompositionStart,
  onCompositionEnd,
  onHeightChange,
  disabled,
  readOnly,
}, ref) => {
  // 获取主题颜色
  const { colors } = useThemeColors()
  
  // 内部引用，用于在没有外部ref时使用
  const internalRef = useRef<HTMLTextAreaElement>(null)
  
  // 获取当前可用的引用
  const getTextarea = () => {
    if (ref && typeof ref === 'object' && ref.current) {
      return ref.current;
    }
    return internalRef.current;
  };

  // 高度调整逻辑
  const updateHeight = useCallback(() => {
    const textarea = getTextarea();
    if (!textarea) return;

    // 保存当前选择位置和滚动位置
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const scrollTop = textarea.scrollTop;

    // 重置高度以准确计算scrollHeight
    textarea.style.height = '0';
    
    // 获取scrollHeight并设置新高度
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
    
    // 恢复选择位置和滚动位置
    textarea.setSelectionRange(selectionStart, selectionEnd);
    textarea.scrollTop = scrollTop;
    
    // 通知父组件高度变化
    if (onHeightChange) {
      onHeightChange(Math.max(newHeight, INITIAL_INPUT_HEIGHT));
    }
  }, [maxHeight, onHeightChange, ref]);

  // 基于值变化调整高度
  useEffect(() => {
    updateHeight();
  }, [value, updateHeight]);

  // 组件挂载后初始调整
  useEffect(() => {
    updateHeight();
    // 添加一个额外的计时器，以便在所有DOM操作完成后再次调整（解决某些边缘情况）
    const timer = setTimeout(updateHeight, 10);
    return () => clearTimeout(timer);
  }, [updateHeight]);

  return (
    <textarea
      ref={(node) => {
        // 同时更新内部引用
        internalRef.current = node;
        
        // 如果外部提供了ref回调，也调用它
        if (ref && typeof ref === 'function') {
          ref(node);
        }
      }}
      value={value}
      onChange={(e) => {
        onChange(e);
        // 内容变化时即时调整高度
        requestAnimationFrame(updateHeight);
      }}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      rows={1}
      className={cn(
        "w-full resize-none border-0 bg-transparent focus:ring-0 focus:outline-none",
        "min-h-[48px] overflow-y-auto",
        isDark ? `${colors.mainText.tailwind} placeholder:text-stone-400` : "text-gray-900 placeholder:text-gray-500",
        className,
      )}
      style={{ maxHeight: `${maxHeight}px` }}
      disabled={disabled}
      readOnly={readOnly}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
    />
  );
}); 