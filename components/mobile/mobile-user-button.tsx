"use client"

import React, { useState } from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"
import { User } from "lucide-react"
import { useMobile } from "@lib/hooks/use-mobile"
import { UserBottomSheet } from "./ui/user-bottom-sheet"
import { useProfile } from "@lib/hooks/use-profile"
import { useSidebarStore } from "@lib/stores/sidebar-store"

/**
 * 移动端侧边栏用户按钮组件
 * 点击触发底部弹出框
 * 样式与侧边栏其他按钮一致
 */
export function MobileUserButton() {
  const { isDark } = useTheme()
  const isMobile = useMobile()
  const { isExpanded } = useSidebarStore()
  const [isOpen, setIsOpen] = useState(false)
  
  // 使用 useProfile hook 获取用户信息
  const { profile } = useProfile()
  
  // 从 profile 中提取用户信息
  const isLoggedIn = !!profile
  const userName = profile?.full_name || profile?.username || (isLoggedIn ? "用户" : "登录/注册")
  
  // 打开底部弹出框
  const handleOpenBottomSheet = () => {
    setIsOpen(true)
  }
  
  // 关闭底部弹出框
  const handleCloseBottomSheet = () => {
    setIsOpen(false)
  }
  
  // 非移动端不显示内容，但保留组件结构确保Hooks正确执行
  if (!isMobile) {
    return null
  }
  
  return (
    <>
      <button
        onClick={handleOpenBottomSheet}
        className={cn(
          "relative flex items-center rounded-lg px-3 py-2 text-sm font-medium w-full",
          "transition-all duration-200 ease-in-out",
          "cursor-pointer outline-none",
          
          // 根据主题和登录状态应用不同样式
          !isDark && [
            "text-stone-600", 
            "hover:bg-stone-300 hover:shadow-md",
            isLoggedIn 
              ? "" 
              : "text-blue-600"
          ],
          
          isDark && [
            "text-gray-200",
            "hover:bg-stone-600 hover:shadow-md",
            isLoggedIn 
              ? "" 
              : "text-blue-400"
          ],
        )}
        aria-label={isLoggedIn ? "打开用户菜单" : "登录/注册"}
      >
        {/* 左侧头像图标 */}
        <span className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full",
          "transition-all duration-200 ease-in-out",
          
          // 根据登录状态显示不同背景色
          isDark
            ? isLoggedIn 
              ? "bg-stone-700 text-stone-300" 
              : "bg-blue-600/20 text-blue-400"
            : isLoggedIn 
              ? "bg-stone-200 text-stone-700" 
              : "bg-blue-500/10 text-blue-600"
        )}>
          <User className="w-4 h-4" />
        </span>

        {/* 右侧文字，只在展开时显示 */}
        {isExpanded && (
          <span className="ml-3 truncate font-serif">
            {isLoggedIn ? userName : "登录/注册"}
          </span>
        )}
      </button>
      
      <UserBottomSheet 
        isOpen={isOpen}
        onClose={handleCloseBottomSheet}
        isLoggedIn={!!isLoggedIn}
      />
    </>
  )
} 