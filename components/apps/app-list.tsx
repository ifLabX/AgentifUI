"use client"

import { Blocks } from "lucide-react"
import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { AppCard } from "./app-card"

interface AppInstance {
  instanceId: string
  displayName: string
  description?: string
  appType: 'model' | 'marketplace'
  iconUrl?: string
  category?: string
  tags?: string[]
  isPopular?: boolean
  lastUsed?: string
}

interface AppListProps {
  apps: AppInstance[]
  viewMode: 'grid' | 'list'
  favoriteAppIds: string[]
  onAppClick: (app: AppInstance) => void
}

export function AppList({ apps, viewMode, favoriteAppIds, onAppClick }: AppListProps) {
  const { isDark } = useThemeColors()

  if (apps.length === 0) {
    return (
      <div className="text-center py-16">
        <Blocks className="w-16 h-16 text-stone-400 mx-auto mb-4" />
        <h3 className={cn(
          "text-xl font-semibold mb-2 font-serif",
          isDark ? "text-stone-400" : "text-stone-600"
        )}>
          未找到匹配的应用
        </h3>
        <p className={cn(
          "font-serif",
          isDark ? "text-stone-500" : "text-stone-500"
        )}>
          尝试调整搜索条件或分类筛选
        </p>
      </div>
    )
  }

  return (
    <div className={cn(
      viewMode === 'grid' 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        : "space-y-4"
    )}>
      {apps.map((app) => {
        const isFavorite = favoriteAppIds.includes(app.instanceId)
        
        return (
          <AppCard
            key={app.instanceId}
            app={app}
            viewMode={viewMode}
            isFavorite={isFavorite}
            onClick={onAppClick}
          />
        )
      })}
    </div>
  )
} 