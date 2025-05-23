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
    <div className="relative flex flex-col gap-8 w-full py-6 px-4 animate-pulse">
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
          isDark ? "bg-stone-800" : "bg-white shadow-sm"
        )}>
          <div className="h-4 rounded bg-stone-400/40 mb-2 w-full"></div>
          <div className="h-4 rounded bg-stone-400/40 mb-2 w-[90%]"></div>
          <div className="h-4 rounded bg-stone-400/40 mb-2 w-[75%]"></div>
          <div className="h-4 rounded bg-stone-400/40 w-[50%]"></div>
        </div>
      </div>

      {/* 底部渐变遮罩 */}
      <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
           style={{
             background: isDark
               ? "linear-gradient(to bottom, transparent, #171717)"
               : "linear-gradient(to bottom, transparent, #f5f5f5)"
           }}
      />
    </div>
  );
}
