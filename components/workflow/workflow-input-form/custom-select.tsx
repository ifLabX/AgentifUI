"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { ChevronDown, Check } from 'lucide-react'

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
  error?: string
  className?: string
}

/**
 * 现代化自定义下拉选择组件
 * 
 * 特点：
 * - 美观的现代化设计
 * - 平滑的动画效果
 * - 支持键盘导航
 * - 统一的stone色系主题
 */
export function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  error,
  className 
}: CustomSelectProps) {
  const { isDark } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const selectRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  
  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          )
          break
        case 'Enter':
          event.preventDefault()
          if (highlightedIndex >= 0) {
            onChange(options[highlightedIndex])
            setIsOpen(false)
            setHighlightedIndex(-1)
          }
          break
        case 'Escape':
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, highlightedIndex, options, onChange])
  
  // 滚动到高亮选项
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current) {
      const highlightedElement = optionsRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [highlightedIndex])
  
  const selectedOption = options.find(option => option === value)
  
  const triggerClasses = cn(
    "w-full px-3 py-2 rounded-lg border font-serif transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-stone-500/30 focus:border-stone-500",
    "focus:shadow-md focus:shadow-stone-500/20",
    "cursor-pointer select-none",
    "flex items-center justify-between",
    error
      ? "border-red-500 bg-red-50 dark:bg-red-900/20 focus:ring-red-500/30 focus:border-red-500"
      : isDark
        ? "border-stone-600 bg-stone-700 text-stone-100 hover:border-stone-500"
        : "border-stone-300 bg-white text-stone-900 hover:border-stone-400",
    className
  )
  
  const dropdownClasses = cn(
    "absolute top-full left-0 right-0 mt-1 z-50",
    "rounded-lg border shadow-lg backdrop-blur-sm",
    "max-h-60 overflow-y-auto",
    "transform transition-all duration-200 ease-out",
    isOpen 
      ? "opacity-100 scale-100 translate-y-0" 
      : "opacity-0 scale-95 -translate-y-2 pointer-events-none",
    isDark
      ? "bg-stone-700/95 border-stone-600"
      : "bg-white/95 border-stone-300"
  )
  
  const optionClasses = (index: number, isSelected: boolean) => cn(
    "px-3 py-2 cursor-pointer transition-all duration-150",
    "flex items-center justify-between font-serif",
    "first:rounded-t-lg last:rounded-b-lg",
    index === highlightedIndex
      ? isDark
        ? "bg-stone-600 text-stone-100"
        : "bg-stone-100 text-stone-900"
      : isSelected
        ? isDark
          ? "bg-stone-600/50 text-stone-200"
          : "bg-stone-50 text-stone-800"
        : isDark
          ? "text-stone-300 hover:bg-stone-600/30"
          : "text-stone-700 hover:bg-stone-50"
  )
  
  return (
    <div ref={selectRef} className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={triggerClasses}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={cn(
          selectedOption ? "" : "text-stone-400 dark:text-stone-500"
        )}>
          {selectedOption || placeholder}
        </span>
        
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform duration-200",
          isOpen ? "rotate-180" : "rotate-0",
          isDark ? "text-stone-400" : "text-stone-500"
        )} />
      </div>
      
      <div className={dropdownClasses}>
        <div ref={optionsRef} role="listbox">
          {options.map((option, index) => {
            const isSelected = option === value
            return (
              <div
                key={option}
                onClick={() => {
                  onChange(option)
                  setIsOpen(false)
                  setHighlightedIndex(-1)
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={optionClasses(index, isSelected)}
                role="option"
                aria-selected={isSelected}
              >
                <span>{option}</span>
                {isSelected && (
                  <Check className={cn(
                    "h-4 w-4 ml-2",
                    isDark ? "text-stone-300" : "text-stone-600"
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 