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
    <div 
      className="relative flex flex-col gap-8 w-full py-6 px-4 animate-pulse"
      style={{
        background: isDark
          ? "linear-gradient(to bottom, rgba(41, 37, 36, 1), rgba(41, 37, 36, 0.3))"
          : "linear-gradient(to bottom, rgba(245, 245, 245, 1), rgba(245, 245, 245, 0.3))"
      }}
    >
      {/* 用户消息骨架 */}
      <div className="flex justify-end">
        <div className={cn(
          "rounded-xl px-4 py-3 w-3/4 max-w-[600px]",
          isDark ? "bg-stone-700" : "bg-stone-300/60"
        )}>
          <div className="h-4 rounded bg-stone-400/50 mb-2 w-full"></div>
          <div className="h-4 rounded bg-stone-400/50 mb-2 w-[80%]"></div>
          <div className="h-4 rounded bg-stone-400/50 w-[40%]"></div>
        </div>
      </div>

      {/* 助手消息骨架 */}
      <div className="flex justify-start">
        <div className={cn(
          "rounded-xl px-4 py-3 w-4/5 max-w-[600px]",
          isDark ? "bg-stone-900 border border-stone-700" : "bg-white shadow-sm"
        )}>
          <div className="h-4 rounded bg-stone-400/40 mb-2 w-full"></div>
          <div className="h-4 rounded bg-stone-400/40 mb-2 w-[90%]"></div>
          <div className="h-4 rounded bg-stone-400/40 mb-2 w-[75%]"></div>
          <div className="h-4 rounded bg-stone-400/40 w-[50%]"></div>
        </div>
      </div>
    </div>
  );
}

// --- BEGIN COMMENT ---
// 添加 MessageSkeletonGroup 组件，用于显示多个消息骨架屏
// --- END COMMENT ---
interface MessageSkeletonGroupProps {
  count?: number;
  className?: string;
}

export function MessageSkeletonGroup({ count = 3, className }: MessageSkeletonGroupProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <MessageSkeleton key={index} />
      ))}
    </div>
  );
}
