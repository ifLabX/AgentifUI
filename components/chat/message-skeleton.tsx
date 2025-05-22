/**
 * 消息骨架屏组件
 * 
 * 用于消息加载时显示的占位效果
 */

import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { cn } from '@lib/utils';

export function MessageSkeleton() {
  const { colors, isDark } = useThemeColors();
  
  return (
    <div className="flex flex-col gap-6 w-full py-4 animate-pulse">
      {/* 用户消息骨架 */}
      <div className="flex justify-end w-full">
        <div className={cn(
          "rounded-lg p-4 w-full md:w-[85%] lg:w-[75%]",
          colors.userMessageBackground.tailwind
        )}>
          <div className="h-4 bg-stone-300 dark:bg-stone-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-stone-300 dark:bg-stone-700 rounded w-[80%] mb-2"></div>
          <div className="h-4 bg-stone-300 dark:bg-stone-700 rounded w-[50%]"></div>
        </div>
      </div>
      
      {/* 助手消息骨架 */}
      <div className="flex justify-start w-full">
        <div className={cn(
          "rounded-lg p-4 w-full md:w-[85%] lg:w-[75%]",
          "bg-transparent border",
          isDark ? "border-stone-700" : "border-stone-200"
        )}>
          <div className="h-4 bg-stone-300 dark:bg-stone-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-stone-300 dark:bg-stone-700 rounded w-[90%] mb-2"></div>
          <div className="h-4 bg-stone-300 dark:bg-stone-700 rounded w-[85%] mb-2"></div>
          <div className="h-4 bg-stone-300 dark:bg-stone-700 rounded w-[60%]"></div>
        </div>
      </div>
    </div>
  );
}

export function MessageSkeletonGroup() {
  return (
    <div className="space-y-8 py-4 w-full">
      <MessageSkeleton />
      <MessageSkeleton />
    </div>
  );
} 