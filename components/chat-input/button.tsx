"use client"

import type React from "react"
import { cn } from "@lib/utils"
import { Button as UIButton } from "@components/ui/button"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { useMounted } from "@lib/hooks"

interface ChatButtonProps {
  icon: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  variant?: "function" | "submit"
  isDark?: boolean
  ariaLabel: string
  forceActiveStyle?: boolean
}

export const ChatButton = ({
  icon,
  onClick,
  disabled = false,
  className,
  variant = "function",
  isDark = false,
  ariaLabel,
  forceActiveStyle = false,
}: ChatButtonProps) => {
  const isMounted = useMounted();
  // 获取主题颜色
  const { colors } = useThemeColors();

  if (!isMounted) {
    return null;
  }

  // 功能按钮 - 带有渐变感觉的浅灰色边框
  if (variant === "function") {
    return (
      <UIButton
        type="button"
        size="sm"
        variant="ghost"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "rounded-lg h-8 w-8 flex items-center justify-center",
          isDark
            ? `border border-stone-600 bg-stone-600/30 ${colors.mainText.tailwind} ${colors.buttonHover.tailwind}`
            : "border border-gray-200 text-gray-600 hover:bg-gray-50",
          "bg-transparent",
          "cursor-pointer",
          className,
        )}
        aria-label={ariaLabel}
      >
        {icon}
      </UIButton>
    )
  }

  // 提交/上传按钮 - 空状态为深灰色
  return (
    <UIButton
      type="button"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full h-8 w-8 flex items-center justify-center",
        forceActiveStyle || !disabled
          ? isDark
            ? "bg-stone-900 text-white hover:bg-stone-800"
            : "bg-black text-white hover:bg-gray-800"
          : isDark
            ? "bg-stone-600 text-stone-300"
            : "bg-gray-200 text-gray-400",
        "cursor-pointer shadow-sm",
        className,
      )}
      aria-label={ariaLabel}
    >
      {icon}
    </UIButton>
  )
}
