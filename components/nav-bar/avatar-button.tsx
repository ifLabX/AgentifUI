"use client"

import React, { useRef } from "react"
import { cn } from "@lib/utils"
import { User } from "lucide-react" // 默认图标
import { useDropdownStore } from "@lib/stores/ui/dropdown-store"

interface AvatarButtonProps {
  // 未来可以传入 src 用于显示图片头像
  // src?: string; 
  alt?: string
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  dropdownId: string;
}

// --- BEGIN COMMENT ---
// 用户头像按钮组件
// 用于显示用户头像（当前为图标占位），并作为下拉菜单的触发器。
// 设计上更美观，预留了未来显示图片头像的空间。
// --- END COMMENT ---
export function AvatarButton({ 
  alt = "用户头像", 
  onClick,
  dropdownId
}: AvatarButtonProps) {
  const avatarRef = useRef<HTMLButtonElement>(null)
  const { toggleDropdown, isOpen, activeDropdownId } = useDropdownStore()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (avatarRef.current) {
      toggleDropdown(dropdownId, avatarRef.current)
    }
    onClick?.(event)
  }

  const isDropdownActive = isOpen && activeDropdownId === dropdownId;

  return (
    <button
      ref={avatarRef}
      onClick={handleClick}
      className={cn(
        // 尺寸和形状
        "w-9 h-9 rounded-full flex items-center justify-center overflow-hidden",
        // 背景和边框
        "bg-gray-200 dark:bg-gray-700",
        "border-2 border-transparent", // 初始无边框
        // 交互效果
        "hover:border-primary/50 dark:hover:border-primary/70",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-gray-800",
        // 下拉菜单激活时的状态
        isDropdownActive && "ring-2 ring-primary border-primary dark:ring-offset-gray-800",
        "transition-all duration-150 ease-in-out"
      )}
      aria-label={alt}
      data-more-button-id={`${dropdownId}-trigger`} // 确保与 dropdown 关闭逻辑兼容
    >
      {/* --- BEGIN COMMENT --- */}
      {/* 
        TODO: 未来替换为 <Image /> 组件显示用户头像 
        <Image src={src || defaultAvatar} alt={alt} width={36} height={36} className="object-cover" /> 
      */}
      {/* --- END COMMENT --- */}
      <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
    </button>
  )
} 