import { ArrowDown } from 'lucide-react'
import { useChatScrollStore } from '@lib/stores/chat-scroll-store'
import { useChatLayoutStore } from '@lib/stores/chat-layout-store'
import { useChatInputStore } from '@lib/stores/chat-input-store'
import { useWelcomeScreen } from '@lib/hooks'
import { useThemeColors } from '@lib/hooks/use-theme-colors'
import { cn } from '@lib/utils'

// --- BEGIN COMMENT ---
// ScrollToBottomButton 组件
// 当用户向上滚动离开聊天底部时显示，点击可平滑滚动回底部。
// 样式已简化：白色背景，仅向下箭头，尺寸减小。
// --- END COMMENT ---
export const ScrollToBottomButton = () => {
  const { isAtBottom, userScrolledUp } = useChatScrollStore();
  const { colors, isDark } = useThemeColors();
  const scrollToBottom = useChatScrollStore((state) => state.scrollToBottom);
  const resetScrollState = useChatScrollStore((state) => state.resetScrollState);
  const { isWelcomeScreen: isOnWelcomeScreen } = useWelcomeScreen();

  // 只有当不在欢迎屏幕且不在底部时才显示按钮
  const shouldRender = !isOnWelcomeScreen && !isAtBottom;
  
  // --- BEGIN COMMENT ---
  // 恢复动态计算 bottom 偏移量
  // 基于输入框高度（CSS 变量 --chat-input-height）
  // 额外增加一些间距
  // --- END COMMENT ---
  const bottomOffset = `calc(var(--chat-input-height, 80px) + 5.5rem)`;

  const handleClick = () => {
    // 使用新增的重置滚动状态方法，确保完全重置状态并滚动到底部
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
        'rounded-full p-1.5 shadow-md transition-transform duration-150 ease-in-out', // 仅保留 transform 过渡
        
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
