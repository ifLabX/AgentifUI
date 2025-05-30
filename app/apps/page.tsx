"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { useMobile } from "@lib/hooks"
import { cn } from "@lib/utils"
import { 
  Search, 
  Grid3x3, 
  List, 
  Bot, 
  Zap, 
  Star,
  ArrowRight,
  Sparkles,
  Users,
  Plus
} from "lucide-react"
import { useFavoriteAppsStore } from "@lib/stores/favorite-apps-store"

// 临时模拟数据，后续替换为真实API
interface AppInstance {
  instanceId: string
  displayName: string
  description?: string
  appType: 'model' | 'marketplace'
  iconUrl?: string
  category?: string
  isPopular?: boolean
  userCount?: number
  lastUsed?: string
}

// 模拟数据 - 参考图片中的应用类型
const mockApps: AppInstance[] = [
  {
    instanceId: "gpt-4-turbo",
    displayName: "GPT-4 Turbo",
    description: "最新的GPT-4模型，具有更快的响应速度和更强的推理能力",
    appType: "model",
    category: "AI助手",
    isPopular: true,
    userCount: 1250,
    lastUsed: "2024-01-15"
  },
  {
    instanceId: "claude-3-sonnet", 
    displayName: "Claude 3 Sonnet",
    description: "Anthropic的Claude 3模型，擅长分析和创作",
    appType: "model",
    category: "AI助手", 
    isPopular: true,
    userCount: 890,
    lastUsed: "2024-01-14"
  },
  {
    instanceId: "code-assistant",
    displayName: "代码助手",
    description: "专业的编程助手，支持多种编程语言的代码生成和调试",
    appType: "marketplace",
    category: "开发工具",
    userCount: 567,
    lastUsed: "2024-01-13"
  },
  {
    instanceId: "writing-coach",
    displayName: "写作教练", 
    description: "帮助改善写作技巧，提供文章结构建议和语言优化",
    appType: "marketplace",
    category: "教育学习",
    userCount: 423,
    lastUsed: "2024-01-12"
  },
  {
    instanceId: "data-analyst",
    displayName: "数据分析师",
    description: "专业的数据分析工具，支持图表生成和数据洞察", 
    appType: "marketplace",
    category: "数据分析",
    userCount: 334,
    lastUsed: "2024-01-11"
  },
  {
    instanceId: "language-tutor",
    displayName: "语言导师",
    description: "多语言学习助手，提供对话练习和语法指导",
    appType: "marketplace", 
    category: "教育学习",
    userCount: 789,
    lastUsed: "2024-01-10"
  }
]

export default function AppsPage() {
  const { colors, isDark } = useThemeColors()
  const isMobile = useMobile()
  const router = useRouter()
  const { addFavoriteApp } = useFavoriteAppsStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("全部")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [apps, setApps] = useState<AppInstance[]>(mockApps)

  // 获取所有分类
  const categories = ["全部", ...Array.from(new Set(mockApps.map(app => app.category).filter(Boolean)))]

  // 过滤应用
  const filteredApps = apps.filter(app => {
    const matchesSearch = app.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "全部" || app.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // 处理应用点击
  const handleAppClick = async (app: AppInstance) => {
    try {
      // 添加到常用应用
      addFavoriteApp({
        instanceId: app.instanceId,
        displayName: app.displayName,
        description: app.description,
        iconUrl: app.iconUrl,
        appType: app.appType
      })
      
      // 跳转到应用详情页
      router.push(`/apps/${app.instanceId}`)
    } catch (error) {
      console.error('打开应用失败:', error)
    }
  }

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
        isDark ? "bg-green-900/30" : "bg-green-50"
      )}>
        <Bot className={cn(
          "w-6 h-6",
          isDark ? "text-green-400" : "text-green-600"
        )} />
      </div>
    ) : (
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center", 
        isDark ? "bg-blue-900/30" : "bg-blue-50"
      )}>
        <Zap className={cn(
          "w-6 h-6",
          isDark ? "text-blue-400" : "text-blue-600"
        )} />
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen w-full",
      colors.mainBackground.tailwind
    )}>
      {/* 页面头部 */}
      <div className={cn(
        "border-b",
        isDark ? "border-stone-700" : "border-stone-200"
      )}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col gap-6">
            {/* 标题和描述 */}
            <div className="text-center">
              <h1 className={cn(
                "text-4xl font-bold font-serif mb-4",
                colors.mainText.tailwind
              )}>
                应用广场
              </h1>
              <p className={cn(
                "text-lg font-serif max-w-2xl mx-auto",
                isDark ? "text-stone-300" : "text-stone-600"
              )}>
                探索并创建各种AI应用，提升您的工作效率
              </p>
            </div>

            {/* 搜索和筛选 */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-center max-w-4xl mx-auto w-full">
              {/* 搜索框 */}
              <div className="relative flex-1 max-w-md">
                <Search className={cn(
                  "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5",
                  isDark ? "text-stone-400" : "text-stone-500"
                )} />
                <input
                  type="text"
                  placeholder="搜索应用..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-4 py-3 rounded-xl border font-serif",
                    "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    "transition-colors duration-200",
                    isDark 
                      ? "bg-stone-700 border-stone-600 text-white placeholder-stone-400"
                      : "bg-white border-stone-300 text-stone-900 placeholder-stone-500"
                  )}
                />
              </div>

              {/* 分类筛选和视图切换 */}
              <div className="flex items-center gap-4">
                {/* 分类筛选 */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={cn(
                    "px-4 py-3 rounded-xl border font-serif",
                    "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    "transition-colors duration-200",
                    isDark 
                      ? "bg-stone-700 border-stone-600 text-white"
                      : "bg-white border-stone-300 text-stone-900"
                  )}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                {/* 视图切换 */}
                <div className={cn(
                  "flex rounded-xl border",
                  isDark ? "border-stone-600" : "border-stone-300"
                )}>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-3 rounded-l-xl transition-colors duration-200",
                      viewMode === "grid"
                        ? (isDark ? "bg-stone-600 text-white" : "bg-stone-200 text-stone-900")
                        : (isDark ? "text-stone-400 hover:text-white" : "text-stone-500 hover:text-stone-900")
                    )}
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-3 rounded-r-xl transition-colors duration-200",
                      viewMode === "list"
                        ? (isDark ? "bg-stone-600 text-white" : "bg-stone-200 text-stone-900")
                        : (isDark ? "text-stone-400 hover:text-white" : "text-stone-500 hover:text-stone-900")
                    )}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 应用列表 */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {filteredApps.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className={cn(
              "w-16 h-16 mx-auto mb-6",
              isDark ? "text-stone-500" : "text-stone-400"
            )} />
            <h3 className={cn(
              "text-xl font-medium font-serif mb-3",
              isDark ? "text-stone-300" : "text-stone-600"
            )}>
              未找到匹配的应用
            </h3>
            <p className={cn(
              "text-base font-serif",
              isDark ? "text-stone-500" : "text-stone-500"
            )}>
              尝试调整搜索条件或浏览其他分类
            </p>
          </div>
        ) : (
          <div className={cn(
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          )}>
            {filteredApps.map((app) => (
              <div
                key={app.instanceId}
                onClick={() => handleAppClick(app)}
                className={cn(
                  "group cursor-pointer rounded-2xl border transition-all duration-200",
                  "hover:shadow-lg hover:scale-[1.02]",
                  isDark 
                    ? "bg-stone-700 border-stone-600 hover:border-stone-500 hover:shadow-stone-900/20"
                    : "bg-white border-stone-200 hover:border-stone-300 hover:shadow-stone-900/10",
                  viewMode === "grid" ? "p-6" : "p-4 flex items-center gap-4"
                )}
              >
                {/* 应用图标 */}
                <div className={cn(
                  "flex-shrink-0",
                  viewMode === "grid" ? "mb-4" : ""
                )}>
                  {getAppIcon(app)}
                </div>

                {/* 应用信息 */}
                <div className={cn(
                  "flex-1 min-w-0",
                  viewMode === "grid" ? "" : "mr-4"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={cn(
                      "font-semibold font-serif truncate",
                      colors.mainText.tailwind,
                      viewMode === "grid" ? "text-lg" : "text-base"
                    )}>
                      {app.displayName}
                    </h3>
                    {app.isPopular && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>

                  {app.description && (
                    <p className={cn(
                      "text-sm font-serif mb-3",
                      isDark ? "text-stone-300" : "text-stone-600",
                      viewMode === "grid" ? "line-clamp-2" : "line-clamp-1"
                    )}>
                      {app.description}
                    </p>
                  )}

                  {/* 应用元信息 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs">
                      {/* 应用类型 */}
                      <span className={cn(
                        "px-2 py-1 rounded-full font-medium",
                        app.appType === 'model'
                          ? (isDark 
                              ? "bg-green-900/30 text-green-400" 
                              : "bg-green-50 text-green-700")
                          : (isDark 
                              ? "bg-blue-900/30 text-blue-400" 
                              : "bg-blue-50 text-blue-700")
                      )}>
                        {app.appType === 'model' ? '模型' : '应用'}
                      </span>

                      {/* 用户数量 */}
                      {app.userCount && (
                        <div className={cn(
                          "flex items-center gap-1",
                          isDark ? "text-stone-400" : "text-stone-500"
                        )}>
                          <Users className="w-3 h-3" />
                          <span>{app.userCount}</span>
                        </div>
                      )}
                    </div>

                    {/* 箭头图标 */}
                    <ArrowRight className={cn(
                      "w-5 h-5 transition-transform duration-200 group-hover:translate-x-1",
                      isDark ? "text-stone-400" : "text-stone-500"
                    )} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 