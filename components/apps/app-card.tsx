"use client"

import { Star, ArrowRight, Cpu, Blocks } from "lucide-react"
import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"

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

interface AppCardProps {
  app: AppInstance
  viewMode: 'grid' | 'list'
  isFavorite: boolean
  onClick: (app: AppInstance) => void
}

export function AppCard({ app, viewMode, isFavorite, onClick }: AppCardProps) {
  const { colors, isDark } = useThemeColors()

  // 获取应用图标
  const getAppIcon = (app: AppInstance) => {
    if (app.iconUrl) {
      return (
        <img 
          src={app.iconUrl} 
          alt={app.displayName}
          className="w-12 h-12 rounded-xl object-cover"
        />
      )
    }

    return app.appType === 'model' ? (
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center",
        colors.sidebarBackground.tailwind
      )}>
        <Cpu className="w-6 h-6 text-blue-500" />
      </div>
    ) : (
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center",
        colors.sidebarBackground.tailwind
      )}>
        <Blocks className="w-6 h-6 text-green-500" />
      </div>
    )
  }

  return (
    <div
      onClick={() => onClick(app)}
      className={cn(
        "group cursor-pointer transition-all duration-300",
        "bg-white rounded-2xl border border-stone-200",
        "hover:shadow-xl hover:shadow-stone-200/50",
        "hover:border-stone-300",
        "hover:-translate-y-2 hover:scale-[1.02]",
        isDark && [
          "bg-stone-800 border-stone-700",
          "hover:shadow-stone-900/50",
          "hover:border-stone-600"
        ],
        viewMode === 'list' && "flex items-center p-4 gap-4 hover:scale-100 hover:-translate-y-1"
      )}
    >
      {viewMode === 'grid' ? (
        <div className="p-6">
          {/* 顶部区域：图标、标题和star */}
          <div className="flex items-start gap-3 mb-4">
            {/* 应用图标 */}
            <div className="flex-shrink-0">
              {getAppIcon(app)}
            </div>
            
            {/* 标题和分类 */}
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-semibold truncate font-serif mb-1",
                colors.mainText.tailwind
              )}>
                {app.displayName}
              </h3>
              <p className={cn(
                "text-sm font-serif",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                {app.category}
              </p>
            </div>
            
            {/* 常用标志 - 固定位置不被挤压 */}
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
              {isFavorite && (
                <Star className={cn(
                  "w-5 h-5 fill-current",
                  isDark ? "text-stone-400" : "text-stone-600"
                )} />
              )}
            </div>
          </div>

          {/* 应用描述 */}
          <p className={cn(
            "text-sm mb-4 line-clamp-2 font-serif leading-relaxed",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            {app.description}
          </p>

          {/* 标签区域 - 固定高度确保一致性 */}
          <div className="min-h-[2rem] mb-4">
            {app.tags && app.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {app.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className={cn(
                      "px-2.5 py-1 text-xs rounded-full font-serif font-medium",
                      isDark 
                        ? "bg-stone-700 text-stone-400" 
                        : "bg-stone-100 text-stone-600"
                    )}
                  >
                    {tag}
                  </span>
                ))}
                {app.tags.length > 3 && (
                  <span className={cn(
                    "px-2.5 py-1 text-xs rounded-full font-serif font-medium",
                    isDark 
                      ? "bg-stone-600 text-stone-500" 
                      : "bg-stone-200 text-stone-500"
                  )}>
                    +{app.tags.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <div></div>
            )}
          </div>

          {/* 底部箭头 */}
          <div className="flex items-center justify-end pt-2">
            <ArrowRight className={cn(
              "w-4 h-4 transition-all duration-200",
              "group-hover:translate-x-1",
              isDark 
                ? "text-stone-400 group-hover:text-stone-300" 
                : "text-stone-400 group-hover:text-stone-600"
            )} />
          </div>
        </div>
      ) : (
        <>
          {/* 列表视图 */}
          <div className="flex-shrink-0">
            {getAppIcon(app)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 pr-3">
                <h3 className={cn(
                  "font-semibold truncate font-serif",
                  colors.mainText.tailwind
                )}>
                  {app.displayName}
                </h3>
                <p className={cn(
                  "text-sm font-serif",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  {app.category}
                </p>
              </div>
              <div className="flex-shrink-0">
                {isFavorite && (
                  <Star className={cn(
                    "w-4 h-4 fill-current",
                    isDark ? "text-stone-400" : "text-stone-600"
                  )} />
                )}
              </div>
            </div>
            <p className={cn(
              "text-sm line-clamp-1 font-serif",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              {app.description}
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <ArrowRight className={cn(
              "w-5 h-5 transition-all duration-200",
              "group-hover:translate-x-1",
              isDark 
                ? "text-stone-400 group-hover:text-stone-300" 
                : "text-stone-400 group-hover:text-stone-600"
            )} />
          </div>
        </>
      )}
    </div>
  )
} 