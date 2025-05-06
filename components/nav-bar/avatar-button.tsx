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

// --- BEGIN COMMENT ---
// 用户头像按钮组件
// 用于显示用户头像（当前为图标占位），并作为下拉菜单的触发器。
// 设计上更美观，预留了未来显示图片头像的空间。
// --- END COMMENT ---
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

  return (
    <button
      ref={avatarRef}
      onClick={handleClick}
      className={cn(
        // Base styles
        "w-9 h-9 rounded-full flex items-center justify-center overflow-hidden",
        "border-2 border-transparent", // 保持透明边框占位，防止激活时跳动
        "focus:outline-none",
        "transition-colors duration-150 ease-in-out", // 只过渡颜色
        "mt-1", // 添加上边距

        // --- BEGIN MODIFIED COMMENT ---
        // 使用 isDark prop 进行条件渲染，替换 dark: 前缀
        // --- END MODIFIED COMMENT ---
        // Default colors
        isDark ? "bg-slate-700" : "bg-slate-100",
        // Hover colors
        isDark ? "hover:bg-slate-600" : "hover:bg-slate-200",
        // Active state colors (dropdown open)
        isDropdownActive ? (isDark ? "bg-slate-600" : "bg-slate-200") : (isDark ? "bg-slate-700" : "bg-slate-100")
        // 移除悬停边框，保持简洁
        // isDark ? "hover:border-slate-500" : "hover:border-slate-300", 
      )}
      aria-label={alt}
      data-more-button-id={`${dropdownId}-trigger`}
    >
      {/* --- BEGIN COMMENT --- */}
      {/* 
        TODO: 未来替换为 <Image /> 组件显示用户头像 
        <Image src={src || defaultAvatar} alt={alt} width={36} height={36} className="object-cover" /> 
      */}
      {/* --- END COMMENT --- */}
      <User className={cn(
        "w-5 h-5",
        // --- BEGIN MODIFIED COMMENT ---
        // 图标颜色也使用 isDark prop
        // --- END MODIFIED COMMENT ---
        isDark ? "text-slate-400" : "text-slate-500"
      )} />
    </button>
  )
} 