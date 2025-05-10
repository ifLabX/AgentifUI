"use client"

import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"

// 容器组件
interface ChatContainerProps {
  children: React.ReactNode
  isWelcomeScreen?: boolean
  isDark?: boolean
  className?: string
  widthClass: string
}

// 定义欢迎界面时的向上偏移量
const INPUT_VERTICAL_SHIFT = "5rem"; 
// 定义对话界面距离底部的距离
const INPUT_BOTTOM_MARGIN = "1.5rem";

export const ChatContainer = ({ 
  children, 
  isWelcomeScreen = false, 
  isDark = false, 
  className, 
  widthClass 
}: ChatContainerProps) => {
  // 获取主题颜色
  const { colors } = useThemeColors();
  
  // 基本样式，包括绝对定位和宽度
  const baseClasses = cn(
    "w-full absolute left-1/2", // 定位和宽度
    widthClass,
    // 应用过渡到所有变化的属性，特别是 transform, top, bottom
    "transition-all duration-300 ease-in-out", 
    className,
  );

  // 动态计算样式，优先使用 transform 实现动画
  const dynamicStyles: React.CSSProperties = isWelcomeScreen 
    ? { 
        // 欢迎界面：基于顶部定位，并通过 transform 居中和上移
        top: `50%`, 
        bottom: 'auto', // 确保 bottom 无效
        transform: `translate(-50%, calc(-50% - ${INPUT_VERTICAL_SHIFT}))` 
      }
    : { 
        // 对话界面：基于底部定位，并通过 transform 水平居中
        top: 'auto', // 确保 top 无效
        bottom: INPUT_BOTTOM_MARGIN, 
        transform: 'translateX(-50%)' 
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
