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
  placement?: "top" | "bottom" // For "bottom-align-bottom", we'll internally adjust 'bottom'
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
  minWidth?: number
  alignToTriggerBottom?: boolean // New prop to control bottom alignment
  offsetX?: number // 新增：水平偏移量
  offsetY?: number // 新增：垂直偏移量
}

export function Popover({
  children,
  trigger,
  className,
  contentClassName,
  placement = "bottom",
  isOpen: controlledIsOpen,
  onOpenChange,
  minWidth = 180,
  alignToTriggerBottom = false, // Default to false
  offsetX, // 新增：水平偏移量参数
  offsetY, // 新增：垂直偏移量参数
}: PopoverProps) {
  const { isDark } = useTheme()
  const { colors } = useThemeColors()
  const isMobile = useMobile()
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  
  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen
  
  const [position, setPosition] = useState({ top: 0, left: 0 })
  
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])
  
  const toggleOpen = () => {
    const newIsOpen = !isOpen
    if (!isControlled) {
      setUncontrolledIsOpen(newIsOpen)
    }
    onOpenChange?.(newIsOpen)
  }
  
  const close = () => {
    if (!isControlled) {
      setUncontrolledIsOpen(false)
    }
    onOpenChange?.(false)
  }
  
  const updatePosition = () => {
    if (!triggerRef.current) return
    
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    let top = 0
    
    const popoverContentHeight = contentRef.current?.offsetHeight || 150
    
    const triggerCenter = triggerRect.left + (triggerRect.width / 2)
    let left = triggerCenter - (minWidth / 2)
    
    if (left + minWidth > viewportWidth - 16) {
      left = viewportWidth - minWidth - 16
    }
    if (left < 16) {
      left = 16
    }
    
    if (placement === "top") {
      top = triggerRect.top - popoverContentHeight - 10 // Popover top aligns with trigger top, then moves up by its height
      if (top < 16) { // If not enough space above, try placing below
        top = triggerRect.bottom + 10
      }
    } else { // placement "bottom"
      if (alignToTriggerBottom) {
        // Align popover bottom with trigger bottom
        top = triggerRect.bottom - popoverContentHeight 
      } else {
        // Default: Align popover top with trigger bottom
        top = triggerRect.bottom + 10
      }

      // Check if it overflows viewport bottom
      if (top + popoverContentHeight > viewportHeight - 16) {
        // If overflows, try to place it above the trigger
        // (aligning popover bottom with trigger top)
        top = triggerRect.top - popoverContentHeight - 10
        if (top < 16) { // If still not enough space above
           top = 16 // Stick to top of viewport
        }
      }
    }
    
    let adjustedTop = top;
    let adjustedLeft = left;

    if (!isMobile) {
      // 使用自定义偏移量或默认值
      const defaultVerticalOffset = 12;
      const defaultHorizontalOffset = 105;
      
      adjustedTop = top + (offsetY !== undefined ? offsetY : defaultVerticalOffset);
      adjustedLeft = left + (offsetX !== undefined ? offsetX : defaultHorizontalOffset);
    }

    setPosition({ top: adjustedTop, left: adjustedLeft })
  }
  
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        updatePosition()
      })
    }
  }, [isOpen, minWidth, alignToTriggerBottom, placement, offsetX, offsetY]) // 添加新的依赖项

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
  
  const variants = {
    hidden: { opacity: 0, scale: 0.95, y: placement === "top" ? 10 : -10, x: 0 },
    visible: { opacity: 1, scale: 1, y: 0, x: 0, transition: { type: "spring", damping: 20, stiffness: 300 }},
    exit: { opacity: 0, scale: 0.95, y: placement === "top" ? 10 : -10, x: 0, transition: { duration: 0.15 }}
  }
  
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
        transformOrigin: placement === "top" ? "bottom center" : "top center",
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
      <div 
        ref={triggerRef} 
        onClick={toggleOpen}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      {isMounted && ReactDOM.createPortal(
        <AnimatePresence>{popoverContent}</AnimatePresence>, 
        document.body
      )}
    </div>
  )
}

interface PopoverItemProps {
  icon?: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
  className?: string
  danger?: boolean
  disabled?: boolean
}

export function PopoverItem({ icon, children, onClick, className, danger = false, disabled = false }: PopoverItemProps) {
  const { isDark } = useTheme()
  return (
    <button
      className={cn(
        "w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 rounded-lg",
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

interface PopoverDividerProps {
  className?: string
}

export function PopoverDivider({ className }: PopoverDividerProps) {
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