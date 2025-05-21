/**
 * 消息加载指示器组件
 */

import { useEffect, useState, useRef } from 'react';
import { cn } from '@lib/utils';
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { LoadingState } from '@lib/hooks/use-conversation-messages';

interface MessagesLoadingIndicatorProps {
  loadingState: LoadingState;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  error: Error | null;
  onRetry: () => void;
}

export function MessagesLoadingIndicator({
  loadingState,
  isLoadingMore,
  hasMoreMessages,
  error,
  onRetry
}: MessagesLoadingIndicatorProps) {
  const { colors, isDark } = useThemeColors();
  const [isAtTop, setIsAtTop] = useState(false);
  
  // --- BEGIN COMMENT ---
  // 监听滚动容器的滚动事件
  // 使用防抖处理并延迟初始检测，避免初始加载完成后立即触发加载更多
  // --- END COMMENT ---
  const initialCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadCompleteRef = useRef<boolean>(false);
  
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const container = e.target as HTMLElement;
      if (!container) return;
      
      // 清除之前的延时
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // 添加一个防抖延迟，避免滚动过程中频繁触发
      scrollTimeoutRef.current = setTimeout(() => {
        // 只有在初始加载完成后才允许设置顶部状态
        if (isInitialLoadCompleteRef.current) {
          setIsAtTop(container.scrollTop < 50);
        }
      }, 200);
    };
    
    // 获取滚动容器
    const scrollContainer = document.querySelector('.chat-scroll-container');
    
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      
      // 延迟初始检查，等待初始加载完成
      initialCheckTimeoutRef.current = setTimeout(() => {
        isInitialLoadCompleteRef.current = true;
        handleScroll({ target: scrollContainer } as unknown as Event);
      }, 1000); // 当初始加载完成并居中后，等待1秒才允许进行顶部检测
      
      return () => {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        if (initialCheckTimeoutRef.current) {
          clearTimeout(initialCheckTimeoutRef.current);
        }
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);
  
  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className={cn(
          "rounded-lg px-4 py-3 text-sm",
          isDark ? "bg-red-900 text-red-100" : "bg-red-100 text-red-800",
          "mb-3"
        )}>
          <p>加载消息失败: {error.message}</p>
        </div>
        <button
          onClick={onRetry}
          className={cn(
            "px-4 py-2 rounded-full text-sm",
            colors.sidebarBackground.tailwind,
            colors.buttonHover.tailwind
          )}
        >
          重试
        </button>
      </div>
    );
  }
  
  // 正在加载中
  if (loadingState === 'loading' && isLoadingMore) {
    return (
      <div className="flex justify-center py-4">
        <div className={cn(
          "flex items-center space-x-2 px-4 py-2 rounded-full",
          colors.sidebarBackground.tailwind
        )}>
          <LoadingSpinner />
          <span className="text-sm">加载更多消息...</span>
        </div>
      </div>
    );
  }
  
  // 只有既有更多消息可加载，又滚动到了顶部，且不在加载过程中，才显示"加载更多"按钮
  if (hasMoreMessages && isAtTop && loadingState !== 'loading') {
    return (
      <div className="flex justify-center py-4">
        <button
          onClick={onRetry}
          className={cn(
            "px-4 py-2 rounded-full text-sm",
            colors.sidebarBackground.tailwind,
            colors.buttonHover.tailwind,
            "transition-colors duration-200"
          )}
        >
          加载更多历史消息
        </button>
      </div>
    );
  }
  
  return null;
}

function LoadingSpinner() {
  return (
    <svg 
      className="animate-spin h-4 w-4 text-stone-500" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
} 