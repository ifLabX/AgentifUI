"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@lib/utils"
import { useSettingsColors } from '@lib/hooks/use-settings-colors'
import { Settings, User, Palette } from "lucide-react"

// --- BEGIN COMMENT ---
// 定义设置选项，包括图标、标题和路径
// --- END COMMENT ---
export const settingsNavItems = [
  {
    title: "概览",
    href: "/settings",
    icon: Settings
  },
  {
    title: "个人资料",
    href: "/settings/profile",
    icon: User
  },
  {
    title: "外观",
    href: "/settings/appearance",
    icon: Palette
  }
]

export function SettingsSidebar() {
  const pathname = usePathname()
  const { colors } = useSettingsColors();
  
  return (
    <div className="h-full py-6">
      <div className="px-4 mb-6">
        <h2 className="text-xl font-semibold">设置</h2>
      </div>
      <nav className="space-y-1">
        {settingsNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm rounded-lg",
                "transition-colors duration-200",
                isActive 
                  ? `${colors.sidebarItemActive.tailwind} font-medium` 
                  : colors.sidebarItemHover.tailwind
              )}
            >
              <span className="mr-3">
                <Icon className="h-5 w-5" />
              </span>
              {item.title}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
