"use client"

import { useSettingsColors } from '@lib/hooks/use-settings-colors'
import { cn } from "@lib/utils"
import Link from "next/link"
import { motion } from "framer-motion"
import { User, Palette, Settings } from "lucide-react"
import { settingsNavItems } from "@components/settings/settings-sidebar"

// --- BEGIN COMMENT ---
// 设置页面入口
// 展示所有可用的设置选项，并提供导航链接
// --- END COMMENT ---
export default function SettingsPage() {
  const { colors } = useSettingsColors();
  
  // 设置项描述
  const settingsDescriptions: Record<string, string> = {
    "/settings": "管理您的个人偏好，自定义应用体验",
    "/settings/profile": "更新个人信息、头像和账号设置",
    "/settings/appearance": "自定义主题、颜色和界面布局"
  }
  
  // 过滤掉当前页面（概览）
  const filteredItems = settingsNavItems.filter(item => item.href !== "/settings")
  
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold mb-6">设置</h1>
        
        <p className={`${colors.secondaryTextColor.tailwind} mb-8`}>
          管理您的个人偏好，自定义应用体验
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-start p-4 rounded-lg border",
                  colors.borderColor.tailwind,
                  "transition-all duration-200",
                  "hover:shadow-md hover:-translate-y-1",
                  colors.cardBackground.tailwind
                )}
              >
                <div className="mr-3 mt-1">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">{item.title}</h3>
                  <p className={`text-sm ${colors.secondaryTextColor.tailwind}`}>
                    {settingsDescriptions[item.href] || ""}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
