"use client"

import React, { useRef } from "react"
import { cn } from "@lib/utils"
import { User } from "lucide-react" // 默认图标
import { useDropdownStore } from "@lib/stores/ui/dropdown-store"

interface UserAvatarDisplayProps {
  // 未来可以传入 src 用于显示图片头像
  // src?: string; 
  alt?: string
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  dropdownId: string;
  isDark: boolean; // 添加 isDark prop
}

/**
 * 用户头像按钮组件
 * 用于显示用户头像（当前为图标占位），并作为下拉菜单的触发器
 * 设计风格与应用的石色(stone)主题保持一致，同时有足够对比度
 */
export function AvatarButton({ 
  alt = "用户头像", 
  onClick,
  dropdownId,
  isDark // 接收 isDark prop
}: UserAvatarDisplayProps) {
  const avatarRef = useRef<HTMLButtonElement>(null)
  const { toggleDropdown, isOpen, activeDropdownId } = useDropdownStore()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      const menuWidthEstimate = 160; 
      const screenPadding = 8; 
      let left = rect.right + window.scrollX - menuWidthEstimate;
      if (left + menuWidthEstimate > window.innerWidth - screenPadding) {
        left = window.innerWidth - menuWidthEstimate - screenPadding;
      }
      if (left < screenPadding) {
        left = screenPadding;
      }
      const position = {
        top: rect.bottom + window.scrollY + 4, 
        left: left,
      };
      toggleDropdown(dropdownId, position)
    }
    onClick?.(event)
  }

  const isDropdownActive = isOpen && activeDropdownId === dropdownId;
  
  // 根据主题状态选择颜色
  const getButtonStyles = () => {
    // 暗色模式下，使用深色系石色
    if (isDark) {
      return {
        base: "bg-stone-700",
        hover: "hover:bg-stone-600",
        active: isDropdownActive ? "bg-stone-600" : "bg-stone-700",
        iconColor: "text-stone-300"
      };
    } 
    // 亮色模式下，使用浅色系石色
    else {
      return {
        base: "bg-stone-200",
        hover: "hover:bg-stone-300",
        active: isDropdownActive ? "bg-stone-300" : "bg-stone-200",
        iconColor: "text-stone-700"
      };
    }
  };
  
  const styles = getButtonStyles();

  return (
    <button
      ref={avatarRef}
      onClick={handleClick}
      className={cn(
        // Base styles
        "w-10 h-10 rounded-full flex items-center justify-center overflow-hidden",
        styles.base,
        styles.hover,
        styles.active,
        "focus:outline-none", // 移除焦点环

        "mt-1", // 保持上边距
        "cursor-pointer hover:scale-105" // 添加悬停指针和缩放效果
      )}
      aria-label={alt}
      data-more-button-id={`${dropdownId}-trigger`}
    >
      {/* 未来可以替换为 <Image /> 组件显示用户头像 */}
      <User className={cn(
        "w-5 h-5",
        styles.iconColor
      )} />
    </button>
  )
}