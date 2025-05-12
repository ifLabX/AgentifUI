"use client"

import React, { useEffect, useRef } from "react"
import { cn } from "@lib/utils"
import { useMobile } from "@lib/hooks"
import { useTheme } from "@lib/hooks/use-theme"
import { X } from "lucide-react"
import { createPortal } from "react-dom"

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

/**
 * 移动端专用的底部弹出模态框组件
 * 从屏幕底部弹出，覆盖部分屏幕，适合移动端用户交互
 * 使用Portal确保在整个页面级别渲染，不受父组件布局限制
 */
export function BottomSheet({ 
  isOpen, 
  onClose, 
  children, 
  title 
}: BottomSheetProps) {
  const { isDark } = useTheme()
  const isMobile = useMobile()
  const sheetRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)

  // 客户端挂载后才能使用Portal
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // 点击遮罩层关闭弹窗
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  // 处理点击外部关闭
  useEffect(() => {
    if (!isOpen) return
    
    const handleClickOutside = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    
    // 添加延迟，避免打开时立即关闭
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside)
    }, 100)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])
  
  // 处理滑动关闭
  useEffect(() => {
    if (!isOpen || !sheetRef.current) return
    
    let startY = 0
    let currentY = 0
    const sheet = sheetRef.current
    
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY
      const deltaY = currentY - startY
      
      if (deltaY > 0) {
        sheet.style.transform = `translateY(${deltaY}px)`
      }
    }
    
    const handleTouchEnd = () => {
      const deltaY = currentY - startY
      
      if (deltaY > 100) {
        // 向下滑动超过阈值，关闭弹窗
        onClose()
      } else {
        // 恢复原位
        sheet.style.transform = ""
      }
    }
    
    sheet.addEventListener("touchstart", handleTouchStart)
    sheet.addEventListener("touchmove", handleTouchMove)
    sheet.addEventListener("touchend", handleTouchEnd)
    
    return () => {
      sheet.removeEventListener("touchstart", handleTouchStart)
      sheet.removeEventListener("touchmove", handleTouchMove)
      sheet.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isOpen, onClose, sheetRef])

  // 非移动端不渲染
  if (!isMobile) {
    return null
  }

  // 弹出框内容
  const sheetContent = (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-end justify-center",
        "bg-black/40 backdrop-blur-sm",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        "transition-opacity duration-300 ease-in-out"
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className={cn(
          "w-full max-w-md rounded-t-2xl",
          "transform transition-transform duration-300 ease-in-out",
          isDark ? "bg-stone-800 border-t border-stone-700" : "bg-white border-t border-stone-200",
          isOpen ? "translate-y-0" : "translate-y-full",
          "shadow-2xl"
        )}
        style={{ maxHeight: "85vh", overflowY: "auto" }}
      >
        {/* 顶部拖动条 */}
        <div className="flex items-center justify-center pt-3 pb-2">
          <div className={cn(
            "w-12 h-1 rounded-full",
            isDark ? "bg-stone-600" : "bg-stone-300"
          )}></div>
        </div>
        
        {/* 标题和关闭按钮 */}
        {title && (
          <div className={cn(
            "flex items-center justify-between px-4 py-3",
            "border-b",
            isDark ? "border-stone-700" : "border-stone-200"
          )}>
            <h3 className={cn(
              "font-medium text-lg",
              isDark ? "text-white" : "text-stone-800"
            )}>
              {title}
            </h3>
            <button
              onClick={onClose}
              className={cn(
                "p-1.5 rounded-full",
                isDark 
                  ? "text-stone-400 hover:text-white hover:bg-stone-700" 
                  : "text-stone-500 hover:text-stone-900 hover:bg-stone-100",
                "transition-colors duration-200"
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* 内容区域 */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )

  // 使用Portal将组件渲染到body下，确保它在整个屏幕范围内
  return mounted ? createPortal(sheetContent, document.body) : null
} 