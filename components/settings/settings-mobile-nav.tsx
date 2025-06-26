"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'
import { cn } from "@lib/utils"
import { useSettingsColors } from '@lib/hooks/use-settings-colors'
import { ChevronDown } from "lucide-react"

// 复用相同的设置项定义
import { getSettingsNavItems } from "./settings-sidebar"

// 设置项类型定义
type SettingsNavItem = {
  title: string
  href: string
  icon: React.ElementType
}

export function SettingsMobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { colors } = useSettingsColors();
  const t = useTranslations('pages.settings');
  const [isOpen, setIsOpen] = useState(false)
  
  // --- BEGIN COMMENT ---
  // 根据当前路径获取当前选中的导航项
  // --- END COMMENT ---
  // 根据当前路径查找匹配的导航项
  const navItems = getSettingsNavItems(t);
  const currentItem = navItems.find((item: SettingsNavItem) => item.href === pathname) || 
                     navItems[0] // 默认使用第一项（概览）
  
  const handleSelectChange = (path: string) => {
    router.push(path)
    setIsOpen(false)
  }
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-4 py-3 text-sm rounded-lg",
          `${colors.borderColor.tailwind}`,
          colors.sidebarItemActive.tailwind
        )}
      >
        <span className="flex items-center font-serif">
          {currentItem.icon && (
            <span className="mr-3">
              {currentItem.icon && <currentItem.icon className="h-5 w-5" />}
            </span>
          )}
          {currentItem.title}
        </span>
        <span>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            isOpen ? "rotate-180" : ""
          )} />
        </span>
      </button>
      
      {isOpen && (
        <div className={cn(
          "absolute left-0 right-0 z-10 mt-1 rounded-lg shadow-lg",
          `${colors.borderColor.tailwind}`,
          colors.cardBackground.tailwind
        )}>
          <div className="py-1">
            {navItems.map((item: SettingsNavItem) => {
              const Icon = item.icon
              return (
                <button
                  key={item.href}
                  onClick={() => handleSelectChange(item.href)}
                  className={cn(
                    "flex items-center w-full px-4 py-3 text-sm text-left",
                    "transition-colors duration-200",
                    pathname === item.href 
                      ? `${colors.sidebarItemActive.tailwind} font-medium` 
                      : colors.sidebarItemHover.tailwind
                  )}
                >
                  <span className="mr-3">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-serif">{item.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
