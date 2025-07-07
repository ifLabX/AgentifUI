'use client';

import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { useChatScrollStore } from '@lib/stores/chat-scroll-store';
import { selectIsProcessing, useChatStore } from '@lib/stores/chat-store';
import { cn } from '@lib/utils';
import { ChevronDown } from 'lucide-react';

import React, { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

// ScrollToBottomButton 组件
// 增强渲染逻辑：考虑流式响应状态，提供更好的用户体验
export const ScrollToBottomButton = () => {
  const { isAtBottom, userScrolledUp } = useChatScrollStore();
  const { colors, isDark } = useThemeColors();
  const resetScrollState = useChatScrollStore(state => state.resetScrollState);
  const pathname = usePathname();
  const t = useTranslations('pages.chat.input');

  // 获取流式响应状态
  const isProcessing = useChatStore(selectIsProcessing);
  const isWaitingForResponse = useChatStore(
    state => state.isWaitingForResponse
  );

  // 添加延迟显示状态，避免按钮频繁闪烁
  const [showButton, setShowButton] = useState(false);
  const [isStreamingAndScrolledUp, setIsStreamingAndScrolledUp] =
    useState(false);

  // 🎯 增强的渲染条件：
  // 1. 在 /chat 路径下（但不是 /chat/new）
  // 2. 不在底部
  // 3. 考虑流式响应状态
  const isInChatPage = pathname.startsWith('/chat') && pathname !== '/chat/new';
  const baseCondition = isInChatPage && !isAtBottom;

  // 检测流式响应期间用户是否向上滚动
  useEffect(() => {
    if ((isProcessing || isWaitingForResponse) && userScrolledUp) {
      setIsStreamingAndScrolledUp(true);
    } else if (!isProcessing && !isWaitingForResponse) {
      // 流式响应结束，重置状态
      setIsStreamingAndScrolledUp(false);
    }
  }, [isProcessing, isWaitingForResponse, userScrolledUp]);

  // 🎯 延迟显示逻辑：避免按钮频繁闪烁
  useEffect(() => {
    if (baseCondition) {
      // 延迟显示按钮，避免滚动时频繁闪烁
      const showTimer = setTimeout(() => {
        setShowButton(true);
      }, 150);

      return () => clearTimeout(showTimer);
    } else {
      // 立即隐藏按钮
      setShowButton(false);
    }
  }, [baseCondition]);

  const shouldRender = showButton;

  // 动态计算 bottom 偏移量
  // 基于输入框高度（CSS 变量 --chat-input-height）
  const bottomOffset = `calc(var(--chat-input-height, 80px) + 5.5rem)`;

  const handleClick = () => {
    // 重置滚动状态并滚动到底部
    resetScrollState();

    // 如果在流式响应期间点击，重置流式滚动状态
    if (isStreamingAndScrolledUp) {
      setIsStreamingAndScrolledUp(false);
    }
  };

  if (!shouldRender) {
    return null;
  }

  // 🎯 根据流式响应状态调整按钮样式
  const isStreamingContext = isProcessing || isWaitingForResponse;
  const buttonVariant =
    isStreamingContext && isStreamingAndScrolledUp ? 'streaming' : 'default';

  return (
    <button
      onClick={handleClick}
      className={cn(
        // 定位与层级
        'absolute bottom-0 left-1/2 z-10 mb-4 -translate-x-1/2',

        // Base styles with enhanced animations
        'cursor-pointer rounded-full p-1.5 shadow-md transition-all duration-200 ease-in-out',

        // 颜色主题 - 保持stone主题一致性
        buttonVariant === 'streaming'
          ? cn(
              // 流式响应时的高亮样式 - 使用stone主题
              isDark
                ? 'border-stone-500/50 bg-stone-600/90 text-stone-100'
                : 'border-stone-400/50 bg-stone-300/90 text-stone-800',
              'border shadow-lg'
            )
          : cn(
              // 默认样式
              colors.userMessageBackground.tailwind,
              colors.buttonHover.tailwind,
              isDark ? 'text-stone-300' : 'text-stone-700'
            ),

        // 交互效果
        'hover:scale-110 hover:shadow-lg active:scale-95'
      )}
      style={{
        bottom: bottomOffset,
      }}
      aria-label={t('scrollToBottom')}
    >
      {/* 使用 ChevronDown 图标，流式响应时添加脉动效果 */}
      <ChevronDown
        className={cn(
          'h-4 w-4',
          isStreamingContext && isStreamingAndScrolledUp && 'animate-pulse'
        )}
      />
    </button>
  );
};
