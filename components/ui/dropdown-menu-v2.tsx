"use client"

import React, { useState, createContext, useContext, useEffect, useRef } from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"
import { createPortal } from "react-dom"

// Context to provide closeMenu function to items
interface DropdownMenuV2ContextType {
  closeMenu: () => void
}
const DropdownMenuV2Context = createContext<DropdownMenuV2ContextType | null>(null)

// Custom Item component
interface DropdownMenuV2ItemProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
  icon?: React.ReactNode
  className?: string
}

const Item: React.FC<DropdownMenuV2ItemProps> = ({ 
  children, 
  onClick, 
  disabled = false,
  danger = false,
  icon,
  className 
}) => {
  const context = useContext(DropdownMenuV2Context);
  const { isDark } = useTheme();

  const handleItemClick = (e: React.MouseEvent) => { 
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return
    
    if (context) { 
      context.closeMenu();
    }
    
    setTimeout(() => {
      onClick?.();
    }, 0);
  };

  return (
    <button
      onClick={handleItemClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-sm font-serif text-left",
        "transition-colors duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        !disabled && (isDark ? "hover:bg-stone-600/40" : "hover:bg-stone-100/80"),
        danger 
          ? isDark 
            ? "text-red-400 hover:bg-red-900/20" 
            : "text-red-600 hover:bg-red-50"
          : isDark 
            ? "text-stone-300" 
            : "text-stone-600",
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

// Divider component
const Divider: React.FC = () => {
  const { isDark } = useTheme();
  return (
    <div className={cn("h-px my-1", isDark ? "bg-stone-500/40" : "bg-stone-300/40")} />
  );
}

// Main DropdownMenuV2 component
interface DropdownMenuV2Props {
  trigger: React.ReactNode
  children: React.ReactNode
  contentClassName?: string
  placement?: "top" | "bottom" | "left" | "right"
  minWidth?: number
  popoverContainerClassName?: string
  alignToTriggerBottom?: boolean
  preventScroll?: boolean // 是否阻止背景滚动
  isOpen?: boolean // 外部控制的打开状态
  onOpenChange?: (isOpen: boolean) => void // 状态变化回调
}

export function DropdownMenuV2({
  trigger,
  children,
  contentClassName,
  placement = "bottom",
  minWidth = 160,
  popoverContainerClassName,
  alignToTriggerBottom = false,
  preventScroll = true, // 默认阻止滚动
  isOpen: externalIsOpen,
  onOpenChange,
}: DropdownMenuV2Props) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const { isDark } = useTheme()
  
  // 使用外部状态或内部状态
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = onOpenChange || setInternalIsOpen

  // --- BEGIN COMMENT ---
  // 🎯 客户端挂载检测
  // --- END COMMENT ---
  useEffect(() => {
    setMounted(true)
  }, [])

  // --- BEGIN COMMENT ---
  // 🎯 计算trigger位置用于portal定位
  // --- END COMMENT ---
  const updateTriggerRect = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setTriggerRect(rect)
    }
  }

  // --- BEGIN COMMENT ---
  // 🎯 当菜单打开时更新位置
  // --- END COMMENT ---
  useEffect(() => {
    if (isOpen) {
      updateTriggerRect()
      // 监听滚动和resize事件
      const handleUpdate = () => updateTriggerRect()
      window.addEventListener('scroll', handleUpdate, true)
      window.addEventListener('resize', handleUpdate)
      return () => {
        window.removeEventListener('scroll', handleUpdate, true)
        window.removeEventListener('resize', handleUpdate)
      }
    }
  }, [isOpen])

  // --- BEGIN COMMENT ---
  // 🎯 全局点击监听器：点击组件外部时关闭菜单
  // 这样可以确保点击页面任何地方都能关闭菜单
  // --- END COMMENT ---
  useEffect(() => {
    if (!isOpen) return

    const handleGlobalClick = (event: MouseEvent) => {
      // --- BEGIN COMMENT ---
      // 🎯 修复：检查点击的元素，如果是dropdown内容区域则不关闭
      // 这样可以确保点击菜单项时不会被全局监听器干扰
      // --- END COMMENT ---
      const target = event.target as Node
      
      // 如果点击的是组件内部，不关闭菜单
      if (containerRef.current && containerRef.current.contains(target)) {
        return
      }
      
      // 如果点击的是portal中的dropdown内容，也不关闭菜单
      // 通过检查点击元素是否包含dropdown相关的class来判断
      const clickedElement = event.target as Element
      if (clickedElement.closest && clickedElement.closest('[data-dropdown-content="true"]')) {
        return
      }
      
      // 点击组件外部，关闭菜单
      setIsOpen(false)
    }

    // --- BEGIN COMMENT ---
    // 🎯 使用setTimeout延迟添加监听器，避免与当前点击事件冲突
    // --- END COMMENT ---
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleGlobalClick)
    }, 0)
    
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleGlobalClick)
    }
  }, [isOpen, setIsOpen])

  // --- BEGIN COMMENT ---
  // 阻止背景滚动：当下拉菜单打开时
  // --- END COMMENT ---
  useEffect(() => {
    if (!preventScroll) return

    if (isOpen) {
      // 阻止滚动
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      
      return () => {
        // 恢复滚动
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen, preventScroll])

  const closeMenu = () => {
    setIsOpen(false)
  }

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  // --- BEGIN COMMENT ---
  // 阻止trigger点击事件冒泡
  // --- END COMMENT ---
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleMenu()
  }

  // --- BEGIN COMMENT ---
  // 🎯 计算dropdown的固定位置
  // --- END COMMENT ---
  const getDropdownStyle = (): React.CSSProperties => {
    if (!triggerRect) return {}
    
    const style: React.CSSProperties = {}
    
    if (placement === "bottom") {
      style.top = triggerRect.bottom + 4 // 4px间距
      style.left = triggerRect.right - minWidth // 右对齐
    } else {
      style.bottom = window.innerHeight - triggerRect.top + 4 // 4px间距
      style.left = triggerRect.right - minWidth // 右对齐
    }
    
    // 确保不会超出视窗边界
    if (style.left && typeof style.left === 'number' && style.left < 8) {
      style.left = 8
    }
    
    return style
  }

  // --- BEGIN COMMENT ---
  // 🎯 Dropdown内容 - 使用Portal渲染到body
  // --- END COMMENT ---
  const dropdownContent = isOpen && triggerRect && (
    <div 
      className={cn(
        "fixed z-[9999]",
        popoverContainerClassName
      )}
      style={getDropdownStyle()}
    >
      <div 
        className={cn(
          "rounded-md shadow-lg border backdrop-blur-sm",
          // --- BEGIN COMMENT ---
          // 🎯 使用更深的颜色以区别于sidebar背景
          // --- END COMMENT ---
          isDark 
            ? "bg-stone-800/95 border-stone-600/80" 
            : "bg-white/95 border-stone-300/80",
          "py-1",
          contentClassName
        )}
        style={{ minWidth: `${minWidth}px` }}
        data-dropdown-content="true"
      >
        {children}
      </div>
    </div>
  )

  return (
    <DropdownMenuV2Context.Provider value={{ closeMenu }}>
      <div className="relative" ref={containerRef}>
        {/* Trigger */}
        <div ref={triggerRef} onClick={handleTriggerClick}>
          {trigger}
        </div>

        {/* Dropdown Menu - 使用Portal渲染到body，完全避免层叠上下文问题 */}
        {mounted && dropdownContent && createPortal(dropdownContent, document.body)}
      </div>
    </DropdownMenuV2Context.Provider>
  )
}

DropdownMenuV2.Item = Item
DropdownMenuV2.Divider = Divider