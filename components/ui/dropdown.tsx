"use client"

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@lib/utils'
import { useTheme } from '@lib/hooks/use-theme'

export interface DropdownItem {
  icon?: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  className?: string
  type?: 'item' | 'separator'
}

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  className?: string
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  placement = 'bottom-right',
  className
}) => {
  const { isDark } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // --- BEGIN COMMENT ---
  // 点击外部关闭下拉菜单
  // --- END COMMENT ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // --- BEGIN COMMENT ---
  // 获取定位样式
  // --- END COMMENT ---
  const getPlacementClasses = () => {
    switch (placement) {
      case 'bottom-left':
        return 'top-full left-0 mt-1'
      case 'bottom-right':
        return 'top-full right-0 mt-1'
      case 'top-left':
        return 'bottom-full left-0 mb-1'
      case 'top-right':
        return 'bottom-full right-0 mb-1'
      default:
        return 'top-full right-0 mt-1'
    }
  }

  return (
    <div className={cn("relative inline-block", className)} ref={dropdownRef}>
      {/* --- BEGIN COMMENT ---
      触发器
      --- END COMMENT --- */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {/* --- BEGIN COMMENT ---
      下拉菜单
      --- END COMMENT --- */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 min-w-[160px] rounded-lg border shadow-lg",
            getPlacementClasses(),
            isDark 
              ? "bg-stone-800 border-stone-700" 
              : "bg-white border-stone-200"
          )}
        >
          <div className="py-1">
            {items.map((item, index) => {
              if (item.type === 'separator') {
                return (
                  <div
                    key={index}
                    className={cn(
                      "h-px my-1 mx-2",
                      isDark ? "bg-stone-700" : "bg-stone-200"
                    )}
                  />
                )
              }

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick()
                      setIsOpen(false)
                    }
                  }}
                  disabled={item.disabled}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors font-serif",
                    item.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : isDark
                        ? "text-stone-300 hover:bg-stone-700"
                        : "text-stone-700 hover:bg-stone-100",
                    item.className
                  )}
                >
                  {item.icon && (
                    <span className="flex-shrink-0">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
} 