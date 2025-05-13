"use client"

import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"

// --- BEGIN MODIFIED COMMENT ---
// 容器组件
// --- END MODIFIED COMMENT ---
interface ChatContainerProps {
  children: React.ReactNode
  isWelcomeScreen?: boolean
  isDark?: boolean
  className?: string
  widthClass: string
  // --- BEGIN COMMENT ---
  // 是否正在从对话界面过渡到欢迎界面
  // 当为 true 时，使用闪烁效果而不是滑动
  // 当为 false 时，保持现有的滑动效果
  // --- END COMMENT ---
  isTransitioningToWelcome?: boolean
}

// 定义欢迎界面时的向上偏移量
const INPUT_VERTICAL_SHIFT = "5rem"; 
// 定义对话界面距离底部的距离
const INPUT_BOTTOM_MARGIN = "1rem";

export const ChatContainer = ({ 
  children, 
  isWelcomeScreen = false, 
  isDark = false, 
  className, 
  widthClass,
  isTransitioningToWelcome = false
}: ChatContainerProps) => {
  // --- BEGIN COMMENT ---
  // 获取主题颜色
  // --- END COMMENT ---
  const { colors } = useThemeColors();
  
  // --- BEGIN COMMENT ---
  // 基本样式，包括绝对定位和宽度
  // 根据 isTransitioningToWelcome 属性决定使用哪种过渡效果
  // --- END COMMENT ---
  const baseClasses = cn(
    "w-full absolute left-1/2", // 定位和宽度
    widthClass,
    // 当从对话界面到欢迎界面时，使用闪烁效果
    // 否则保持现有的滑动效果
    isTransitioningToWelcome 
      ? "transition-opacity duration-100 ease-in-out" // 闪烁效果，只过渡透明度
      : "transition-all duration-300 ease-in-out", // 滑动效果，过渡所有属性
    className,
  );

  // --- BEGIN COMMENT ---
  // 动态计算样式，根据当前状态决定定位和变形
  // --- END COMMENT ---
  const dynamicStyles: React.CSSProperties = isWelcomeScreen 
    ? { 
        // 欢迎界面：基于顶部定位，并通过 transform 居中和上移
        top: `50%`, 
        bottom: 'auto', // 确保 bottom 无效
        transform: `translate(-50%, calc(-50% - ${INPUT_VERTICAL_SHIFT}))`,
        // 如果是从对话界面过渡到欢迎界面，不使用滑动效果
        transition: isTransitioningToWelcome ? 'opacity 100ms ease-in-out' : undefined
      }
    : { 
        // 对话界面：基于底部定位，并通过 transform 水平居中
        top: 'auto', // 确保 top 无效
        bottom: INPUT_BOTTOM_MARGIN, 
        transform: 'translateX(-50%)',
        // 从欢迎界面到对话界面始终使用滑动效果
        transition: 'all 300ms ease-in-out'
      };

  return (
    <div
      className={baseClasses}
      style={dynamicStyles}
    >
      <div
        className={cn(
          "flex flex-col rounded-2xl",
          isDark ? colors.sidebarBackground.tailwind : "bg-white",
          "shadow-[0_0_15px_rgba(0,0,0,0.1)]",
        )}
      >
        {children}
      </div>
    </div>
  )
}
