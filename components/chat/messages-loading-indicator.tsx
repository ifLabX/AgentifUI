/**
 * 消息加载指示器组件
 */

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
  const { colors } = useThemeColors();
  
  // 初始加载中但没有更多历史消息时，不显示指示器
  if (!hasMoreMessages && !error && loadingState !== 'loading') {
    return null;
  }
  
  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className={cn(
          "rounded-lg px-4 py-3 text-sm",
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
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
  
  // 加载中
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
  
  // 有更多消息可加载
  if (hasMoreMessages && loadingState !== 'loading') {
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