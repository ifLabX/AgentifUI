import { ArrowDown } from 'lucide-react'
import { useChatScrollStore } from '@lib/stores/chat-scroll-store'
import { useThemeColors } from '@lib/hooks/use-theme-colors'
import { usePathname } from 'next/navigation'
import { cn } from '@lib/utils'

// --- BEGIN COMMENT ---
// ScrollToBottomButton 组件
// 简化渲染逻辑：只在 /chat 路径下（非 /chat/new）且不在底部时显示
// --- END COMMENT ---
export const ScrollToBottomButton = () => {
  const { isAtBottom } = useChatScrollStore();
  const { colors, isDark } = useThemeColors();
  const resetScrollState = useChatScrollStore((state) => state.resetScrollState);
  const pathname = usePathname();

  // --- BEGIN COMMENT ---
  // 🎯 简化的渲染条件：
  // 1. 在 /chat 路径下（但不是 /chat/new）
  // 2. 不在底部
  // --- END COMMENT ---
  const isInChatPage = pathname.startsWith('/chat') && pathname !== '/chat/new';
  const shouldRender = isInChatPage && !isAtBottom;
  
  // --- BEGIN COMMENT ---
  // 动态计算 bottom 偏移量
  // 基于输入框高度（CSS 变量 --chat-input-height）
  // --- END COMMENT ---
  const bottomOffset = `calc(var(--chat-input-height, 80px) + 5.5rem)`;

  const handleClick = () => {
    // 重置滚动状态并滚动到底部
    resetScrollState();
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        // 定位与层级
        'absolute bottom-0 left-1/2 -translate-x-1/2 z-10 mb-4',
        
        // --- BEGIN MODIFIED COMMENT ---
        // 基础样式 (移除 all transition, 添加 transform transition)
        // --- END MODIFIED COMMENT ---
        'rounded-full p-1.5 shadow-md transition-transform duration-150 ease-in-out cursor-pointer', // 仅保留 transform 过渡
        
        // 颜色主题
        colors.userMessageBackground.tailwind,
        colors.buttonHover.tailwind,
        isDark ? 'text-stone-300' : 'text-stone-700',
        
        // 交互效果
        'hover:scale-110 active:scale-95'
      )}
      style={{
        bottom: bottomOffset,
      }}
      aria-label="滚动到底部"
    >
      {/* 使用 ArrowDown 图标并减小尺寸 */}
      <ArrowDown className="h-4 w-4" />
    </button>
  );
};
