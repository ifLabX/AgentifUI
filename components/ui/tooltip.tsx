"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

type TooltipPlacement = "top" | "bottom" | "left" | "right"

export interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  id: string
  placement?: TooltipPlacement
  className?: string
  delayShow?: number
  delayHide?: number
}

// 工具函数，用于合并类名
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ")
}

// 全局状态，确保在组件外部定义
let activeTooltipId: string | null = null
const listeners: ((id: string | null) => void)[] = []

const tooltipState = {
  showTooltip(id: string) {
    activeTooltipId = id
    listeners.forEach((listener) => listener(activeTooltipId))
  },

  hideTooltip() {
    activeTooltipId = null
    listeners.forEach((listener) => listener(activeTooltipId))
  },

  subscribe(listener: (id: string | null) => void) {
    listeners.push(listener)
    return () => {
      const index = listeners.indexOf(listener)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    }
  },

  getActiveId() {
    return activeTooltipId
  },
}

// Tooltip容器组件
export function TooltipContainer() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // 确保容器存在
    if (!document.getElementById("tooltip-root")) {
      const tooltipRoot = document.createElement("div")
      tooltipRoot.id = "tooltip-root"
      tooltipRoot.className = "fixed z-[9999] top-0 left-0 w-full h-0 overflow-visible pointer-events-none"
      document.body.appendChild(tooltipRoot)
    }

    return () => setIsMounted(false)
  }, [])

  return null // 不需要渲染任何内容，因为我们已经在useEffect中创建了容器
}

export function Tooltip({
  children,
  content,
  id,
  placement = "top",
  className,
  delayShow = 100, // 减少延迟，使响应更快
  delayHide = 100,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 检测是否为暗色模式（简化版）
  const isDark = false // 默认使用亮色模式

  // 客户端挂载检测
  useEffect(() => {
    setMounted(true)

    // 订阅全局tooltip状态
    const unsubscribe = tooltipState.subscribe((activeId) => {
      setIsVisible(activeId === id)
    })

    return () => {
      // 不要在清理函数中调用 setMounted(false)，这可能导致无限循环更新
      unsubscribe()
    }
  }, [id])

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return

    const tooltipRoot = document.getElementById("tooltip-root")
    if (!tooltipRoot) return

    const tooltipEl = tooltipRef.current
    const triggerRect = triggerRef.current.getBoundingClientRect()

    // 先让tooltip可见但置于屏幕外以便测量尺寸
    tooltipEl.style.visibility = "hidden"
    tooltipEl.style.position = "fixed"
    tooltipEl.style.top = "-9999px"
    tooltipEl.style.left = "-9999px"

    // 获取tooltip尺寸
    const tooltipRect = tooltipEl.getBoundingClientRect()

    if (tooltipRect.width === 0 || tooltipRect.height === 0) {
      tooltipEl.style.visibility = "hidden"
      return
    }

    // 计算位置
    let top: number
    let left: number
    const gap = 8 // tooltip与触发元素之间的间隙
    let effectivePlacement = placement

    switch (placement) {
      case "top":
        top = triggerRect.top - tooltipRect.height - gap
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break
      case "bottom":
        top = triggerRect.bottom + gap
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break
      case "left":
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.left - tooltipRect.width - gap
        break
      case "right":
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.right + gap
        break
      default:
        top = triggerRect.top - tooltipRect.height - gap
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
    }

    // 边界检查
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    const margin = 10 // 视口边缘的最小间距

    // 水平边界检查
    if (left < margin) {
      left = margin
    } else if (left + tooltipRect.width > viewportWidth - margin) {
      left = viewportWidth - tooltipRect.width - margin
    }

    // 垂直边界检查，包括翻转逻辑
    if (placement === "top" && top < margin) {
      // 尝试向下翻转
      const newTop = triggerRect.bottom + gap
      if (newTop + tooltipRect.height <= viewportHeight - margin) {
        top = newTop
        effectivePlacement = "bottom"
      } else {
        top = margin
      }
    } else if (placement === "bottom" && top + tooltipRect.height > viewportHeight - margin) {
      // 尝试向上翻转
      const newTop = triggerRect.top - tooltipRect.height - gap
      if (newTop >= margin) {
        top = newTop
        effectivePlacement = "top"
      } else {
        top = viewportHeight - tooltipRect.height - margin
      }
    }

    // 应用最终定位
    tooltipEl.style.top = `${top}px`
    tooltipEl.style.left = `${left}px`
    tooltipEl.style.visibility = "visible"

    // 更新箭头方向
    tooltipEl.setAttribute("data-placement", effectivePlacement)
  }

  const handleMouseEnter = () => {
    // 检测是否为移动设备（简化版）
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768
    if (isMobile) return

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }

    // 添加调试信息
    // console.log(`Mouse enter on tooltip ${id}, setting timeout to show`)

    showTimeoutRef.current = setTimeout(() => {
      // console.log(`Showing tooltip ${id}`)
      tooltipState.showTooltip(id)
    }, delayShow)
  }

  const handleMouseLeave = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current)
      showTimeoutRef.current = null
    }

    // 添加调试信息
    // console.log(`Mouse leave on tooltip ${id}, setting timeout to hide`)

    hideTimeoutRef.current = setTimeout(() => {
      // console.log(`Hiding tooltip ${id}`)
      tooltipState.hideTooltip()
    }, delayHide)
  }

  // 当tooltip可见性变化时，更新其位置
  useEffect(() => {
    // console.log(`Tooltip ${id} visibility changed to: ${isVisible}`)

    if (isVisible) {
      // console.log(`Updating position for tooltip ${id}`)
      requestAnimationFrame(updatePosition)
    }
  }, [isVisible, id])

  // 监听滚动和窗口大小调整事件
  useEffect(() => {
    if (!isVisible) return

    const handleScroll = () => requestAnimationFrame(updatePosition)
    const handleResize = () => requestAnimationFrame(updatePosition)

    window.addEventListener("scroll", handleScroll, true)
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("scroll", handleScroll, true)
      window.removeEventListener("resize", handleResize)
    }
  }, [isVisible])

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [])

  // 检测是否为移动设备（简化版）
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768

  // 在移动设备上不渲染tooltip
  if (isMobile) {
    return <>{children}</>
  }

  return (
    <>
      {/* 触发器元素 */}
      <div
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-tooltip-id={id} // 添加数据属性，便于调试
      >
        {children}
      </div>

      {/* Tooltip内容 */}
      {mounted &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`fixed z-[9999] pointer-events-none transition-opacity duration-200 ${
              isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            style={{
              visibility: isVisible ? "visible" : "hidden",
              top: "-9999px",
              left: "-9999px",
            }}
            data-placement={placement}
            data-tooltip-content-id={id} // 添加数据属性，便于调试
          >
            <div
              className={cn(
                "relative px-2.5 py-1.5 rounded-md text-sm pointer-events-auto max-w-xs",
                "backdrop-blur-sm bg-opacity-95 shadow-lg border border-gray-200/10",
                isDark ? "bg-gray-800 text-gray-100" : "bg-gray-800 text-gray-100",
                className,
              )}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {content}
              {/* 箭头元素 */}
              <div
                className={cn(
                  "absolute w-2 h-2 rotate-45 bg-inherit border-inherit",
                  placement === "top" && "bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r",
                  placement === "bottom" && "top-[-4px] left-1/2 -translate-x-1/2 border-t border-l",
                  placement === "left" && "right-[-4px] top-1/2 -translate-y-1/2 border-t border-r",
                  placement === "right" && "left-[-4px] top-1/2 -translate-y-1/2 border-b border-l",
                )}
              />
            </div>
          </div>,
          document.getElementById("tooltip-root") || document.body,
        )}
    </>
  )
}

// 简化的TooltipProvider组件，只负责渲染TooltipContainer
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TooltipContainer />
      {children}
    </>
  )
}

// --- BEGIN: 重新导出 hideTooltip --- 
export const hideActiveTooltip = tooltipState.hideTooltip;
// --- END: 重新导出 hideTooltip --- 

