"use client"

import { Blocks } from "lucide-react"
import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"

interface AppHeaderProps {
  totalApps: number
  filteredApps: number
}

export function AppHeader({ totalApps, filteredApps }: AppHeaderProps) {
  const { isDark } = useThemeColors()

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-stone-600 text-white">
          <Blocks className="w-6 h-6" />
        </div>
        <div>
          <h1 className={cn(
            "text-3xl font-bold font-serif",
            isDark ? "text-stone-100" : "text-stone-900"
          )}>
            应用广场
          </h1>
          <p className={cn(
            "font-serif",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            发现和使用各种AI应用工具
          </p>
        </div>
      </div>
      
      {/* 统计信息 */}
      <div className={cn(
        "flex items-center gap-6 text-sm font-serif",
        isDark ? "text-stone-400" : "text-stone-600"
      )}>
        <span>共 {totalApps} 个应用</span>
        <span>已筛选 {filteredApps} 个</span>
      </div>
    </div>
  )
} 