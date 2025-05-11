"use client"

import React, { useRef, useEffect } from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"
import { useDropdownStore } from "@lib/stores/ui/dropdown-store"
import { useSidebarStore } from "@lib/stores/sidebar-store"

interface DropdownItemProps {
  icon?: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
  className?: string
  danger?: boolean
}

function DropdownItem({ 
  icon, 
  children, 
  onClick, 
  className,
  danger = false
}: DropdownItemProps) {
  const { isDark } = useTheme()
  const { closeDropdown } = useDropdownStore()
  
  const handleClick = (e: React.MouseEvent) => {
    // 阻止事件冒泡
    e.stopPropagation()
    closeDropdown()
    onClick?.()
  }
  
  return (
    <button
      className={cn(
        "w-full text-left px-3 py-2 text-sm flex items-center gap-2 rounded-md cursor-pointer",
        "transition-all duration-200",
        isDark
          ? [
              danger 
                ? "text-red-300 hover:bg-red-900/40 active:bg-red-900/60" 
                : "text-gray-200 hover:bg-stone-600/60 active:bg-stone-600/80"
            ]
          : [
              danger 
                ? "text-red-600 hover:bg-red-50 active:bg-red-100" 
                : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
            ],
        className
      )}
      onClick={handleClick}
    >
      {icon && <span className="flex-shrink-0 w-4 h-4">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  )
}

interface DropdownDividerProps {
  className?: string
}

function DropdownDivider({ className }: DropdownDividerProps) {
  const { isDark } = useTheme()
  
  return (
    <div 
      className={cn(
        "h-px my-1.5 mx-3",
        isDark ? "bg-stone-600/80" : "bg-gray-200/80",
        className
      )}
    />
  )
}

interface DropdownMenuProps {
  id: string
  className?: string
  children: React.ReactNode
  placement?: "top" | "bottom" | "left" | "right"
  minWidth?: number
}

export function DropdownMenu({ 
  id, 
  className, 
  children,
  minWidth = 180
}: DropdownMenuProps) {
  const { isDark } = useTheme()
  const { isOpen, activeDropdownId, position, closeDropdown } = useDropdownStore()
  const { isExpanded } = useSidebarStore()
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const isVisible = isOpen && activeDropdownId === id
  
  // 修改监听点击外部关闭下拉菜单
  useEffect(() => {
    // 使用mouseup事件而不是mousedown，避免与按钮点击冲突
    const handleClickOutside = (event: MouseEvent) => {
      // 检查点击的元素是否是more-button或其子元素
      const target = event.target as Element;
      const isMoreButton = target.closest('[data-more-button-id]');
      
      // 如果是more-button，不执行关闭操作，让按钮自己的点击事件处理
      if (isMoreButton) {
        return;
      }
      
      if (dropdownRef.current && !dropdownRef.current.contains(target as Node)) {
        closeDropdown();
      }
    }
    
    if (isVisible) {
      // 使用延迟添加事件监听器，避免与当前点击事件冲突
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isVisible, closeDropdown, id]);
  
  // 滚动时关闭下拉菜单
  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) {
        closeDropdown()
      }
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isVisible, closeDropdown])
  
  // 处理ESC键关闭菜单
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        closeDropdown()
      }
    }
    
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, closeDropdown])
  
  if (!isVisible || !position) return null
  
  const handleMenuClick = (e: React.MouseEvent) => {
    // 阻止菜单点击事件冒泡
    e.stopPropagation()
  }
  
  return (
    <div
      ref={dropdownRef}
      className={cn(
        "fixed z-50 animate-fade-in",
        "py-2 rounded-xl shadow-lg backdrop-blur-sm",
        "overflow-hidden",
        isDark
          ? "bg-stone-800/95 border border-stone-600/80 shadow-black/20"
          : "bg-white/95 border border-gray-200/80 shadow-gray-200/40",
        className
      )}
      style={{ 
        top: position.top, 
        left: position.left,
        minWidth: `${minWidth}px`
      }}
      onClick={handleMenuClick}
    >
      {children}
    </div>
  )
}

DropdownMenu.Item = DropdownItem
DropdownMenu.Divider = DropdownDivider 