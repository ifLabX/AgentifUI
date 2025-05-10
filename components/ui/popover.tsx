"use client"

import React, { useRef, useEffect, useState } from "react"
import ReactDOM from "react-dom"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"
import { useMobile } from "@lib/hooks/use-mobile"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { motion, AnimatePresence } from "framer-motion"

interface PopoverProps {
  children: React.ReactNode
  trigger: React.ReactNode
  className?: string
  contentClassName?: string
  placement?: "top" | "bottom"
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
  minWidth?: number
}

export function Popover({
  children,
  trigger,
  className,
  contentClassName,
  placement = "bottom",
  isOpen: controlledIsOpen,
  onOpenChange,
  minWidth = 180
}: PopoverProps) {
  const { isDark } = useTheme()
  const { colors } = useThemeColors()
  const isMobile = useMobile()
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  
  // 判断是受控还是非受控组件
  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen
  
  // 位置状态
  const [position, setPosition] = useState({ top: 0, left: 0 })
  
  // 组件挂载后设置 isMounted 为 true
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])
  
  // 切换打开状态
  const toggleOpen = () => {
    const newIsOpen = !isOpen
    if (!isControlled) {
      setUncontrolledIsOpen(newIsOpen)
    }
    onOpenChange?.(newIsOpen)
  }
  
  // 关闭弹出框
  const close = () => {
    if (!isControlled) {
      setUncontrolledIsOpen(false)
    }
    onOpenChange?.(false)
  }
  
  // 计算弹出框位置
  const updatePosition = () => {
    if (!triggerRef.current) return
    
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    let top = 0
    
    // 估算内容高度
    const estimatedContentHeight = 150
    
    // 计算水平位置（尝试与触发器居中对齐）
    const triggerCenter = triggerRect.left + (triggerRect.width / 2)
    let left = triggerCenter - (minWidth / 2)
    
    // 防止超出屏幕左右边界
    if (left + minWidth > viewportWidth - 16) {
      left = viewportWidth - minWidth - 16
    }
    if (left < 16) {
      left = 16
    }
    
    // 计算垂直位置
    if (placement === "top") {
      // 向上弹出：从触发器顶部向上
      top = triggerRect.top - estimatedContentHeight - 10
      
      // 如果向上弹出会超出视窗顶部，则改为向下弹出
      if (top < 16) {
        top = triggerRect.bottom + 10
      }
    } else {
      // 向下弹出：从触发器底部向下
      top = triggerRect.bottom + 10
      
      // 如果向下弹出会超出视窗底部，则改为向上弹出
      if (top + estimatedContentHeight > viewportHeight - 16) {
        top = triggerRect.top - estimatedContentHeight - 10
        // 再次检查向上弹出是否超出顶部
        if (top < 16) {
           top = 16 // 如果两边都放不下，固定在顶部附近
        }
      }
    }
    
    // --- BEGIN: 条件偏移 --- 
    let adjustedTop = top;
    let adjustedLeft = left;

    if (!isMobile) {
      // 仅在桌面端应用微调偏移量
      adjustedTop = top + 2; // 上移 12px
      adjustedLeft = left + 108; // 右移 85px 
    }
    // --- END: 条件偏移 --- 

    setPosition({ top: adjustedTop, left: adjustedLeft })
  }
  
  // 打开时计算位置
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        updatePosition()
      })
    }
  }, [isOpen])
  
  // 监听点击外部关闭弹出框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isClickOutsideTrigger = triggerRef.current && !triggerRef.current.contains(event.target as Node)
      
      if (isOpen && isClickOutsideTrigger) {
          const portalContentElement = contentRef.current;
          if (portalContentElement && portalContentElement.contains(event.target as Node)) {
             return;
          }
          close()
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, close])
  
  // 监听滚动和窗口大小变化
  useEffect(() => {
    if (!isOpen) return
    
    const handleScrollAndResize = () => {
      updatePosition();
    }
    
    window.addEventListener("scroll", handleScrollAndResize, { capture: true, passive: true })
    window.addEventListener("resize", handleScrollAndResize)
    
    return () => {
      window.removeEventListener("scroll", handleScrollAndResize, { capture: true })
      window.removeEventListener("resize", handleScrollAndResize)
    }
  }, [isOpen])
  
  // ESC键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, close])
  
  // 动画变体
  const variants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
      y: placement === "top" ? 10 : -10,
      x: 0
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      x: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: placement === "top" ? 10 : -10,
      x: 0,
      transition: { 
        duration: 0.15 
      }
    }
  }
  
  // Portal 内容 JSX
  const popoverContent = isOpen ? (
    <motion.div
      ref={contentRef}
      className={cn(
        "fixed z-50",
        "py-2 rounded-xl shadow-lg backdrop-blur-sm",
        "overflow-hidden",
        isDark
          ? `${colors.sidebarBackground.tailwind} border border-stone-600/80 shadow-black/20`
          : "bg-white/95 border border-gray-200/80 shadow-gray-200/40",
        contentClassName
      )}
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        minWidth: `${minWidth}px`,
        transformOrigin: placement === "top" ? "bottom left" : "top left",
      }}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  ) : null;

  return (
    <div className={cn("relative inline-block", className)}>
      {/* 触发器 */}
      <div 
        ref={triggerRef} 
        onClick={toggleOpen}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      
      {/* 弹出内容通过 Portal 渲染到 body */}
      {isMounted && ReactDOM.createPortal(
        <AnimatePresence>{popoverContent}</AnimatePresence>, 
        document.body
      )}
    </div>
  )
}

// 弹出项组件，类似于DropdownItem
interface PopoverItemProps {
  icon?: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
  className?: string
  danger?: boolean
  disabled?: boolean
}

export function PopoverItem({
  icon,
  children,
  onClick,
  className,
  danger = false,
  disabled = false
}: PopoverItemProps) {
  const { isDark } = useTheme()
  const { colors } = useThemeColors()
  
  return (
    <button
      className={cn(
        "w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 rounded-lg",
        "transition-all duration-200",
        isDark
          ? [
              danger 
                ? "text-red-300 hover:bg-red-900/40 active:bg-red-900/60" 
                : `${colors.mainText.tailwind} hover:bg-stone-600/60 active:bg-stone-600/80`
            ]
          : [
              danger 
                ? "text-red-600 hover:bg-red-50 active:bg-red-100" 
                : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
            ],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {icon && (
        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {icon}
        </span>
      )}
      <span className="truncate font-medium leading-5 mt-px">{children}</span>
    </button>
  )
}

// 分割线组件
interface PopoverDividerProps {
  className?: string
}

export function PopoverDivider({ className }: PopoverDividerProps) {
  const { isDark } = useTheme()
  const { colors } = useThemeColors()
  
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