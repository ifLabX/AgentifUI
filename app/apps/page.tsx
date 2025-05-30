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
  Plus,
  Store,
  Cpu
} from "lucide-react"
import { useFavoriteAppsStore } from "@lib/stores/favorite-apps-store"
import { useAppListStore } from "@lib/stores/app-list-store"

// 🎯 应用市场卡片显示的核心信息
// 只包含卡片中需要展示的必要字段
interface AppInstance {
  instanceId: string
  displayName: string
  description?: string
  appType: 'model' | 'marketplace'
  iconUrl?: string
  category?: string
  tags?: string[]
  // 展示用的辅助信息
  isPopular?: boolean
  userCount?: number
  lastUsed?: string
}

export default function AppsPage() {
  const router = useRouter()
  const { colors } = useThemeColors()
  const isMobile = useMobile()
  const { addFavoriteApp } = useFavoriteAppsStore()
  
  // 🎯 使用真实的应用列表数据，替代硬编码
  const { apps: rawApps, fetchApps, isLoading } = useAppListStore()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("全部")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular')

  // 🎯 在组件挂载时获取应用列表
  useEffect(() => {
    fetchApps()
  }, [fetchApps])

  // 🎯 将原始应用数据转换为应用市场格式
  // 过滤出应用市场类型的应用，并从config中提取显示信息
  const apps: AppInstance[] = rawApps
    .filter(app => {
      const metadata = app.config?.app_metadata
      
      // 如果有元数据配置，检查是否为应用市场类型
      if (metadata) {
        return metadata.app_type === 'marketplace' || metadata.is_marketplace_app === true
      }
      
      // 如果没有元数据配置，根据名称进行启发式判断
      const appName = (app.display_name || app.instance_id).toLowerCase()
      const marketplaceKeywords = ['翻译', 'translate', '代码', 'code', '助手', 'assistant', '工具', 'tool', '生成', 'generate', '写作', 'writing']
      const modelKeywords = ['gpt', 'claude', 'gemini', 'llama', 'qwen', '通义', '模型', 'model']
      
      const isLikelyMarketplace = marketplaceKeywords.some(keyword => appName.includes(keyword))
      const isLikelyModel = modelKeywords.some(keyword => appName.includes(keyword))
      
      // 优先判断为应用市场应用，除非明确是模型
      return isLikelyMarketplace || (!isLikelyModel && !appName.includes('chat') && !appName.includes('对话'))
    })
    .map(app => {
      const metadata = app.config?.app_metadata
      const difyParams = app.config?.dify_parameters
      
      return {
        instanceId: app.instance_id,
        displayName: app.display_name || app.instance_id,
        description: metadata?.brief_description || app.description || difyParams?.opening_statement || '暂无描述',
        appType: 'marketplace' as const,
        iconUrl: metadata?.icon_url,
        category: metadata?.tags?.[0] || '工具',
        tags: metadata?.tags || [],
        // 展示用的辅助信息
        isPopular: metadata?.is_common_model || false,
        userCount: Math.floor(Math.random() * 1000) + 100,
        lastUsed: new Date().toISOString().split('T')[0]
      }
    })

  // 🎯 从应用数据中提取分类列表
  const categories = ['全部', ...Array.from(new Set(apps.map(app => app.category).filter(cat => cat && cat.trim())))]

  // 过滤和搜索逻辑
  const filteredApps = apps.filter(app => {
    const matchesSearch = app.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === "全部" || app.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // 排序逻辑
  const sortedApps = [...filteredApps].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.userCount || 0) - (a.userCount || 0)
      case 'recent':
        return new Date(b.lastUsed || 0).getTime() - new Date(a.lastUsed || 0).getTime()
      case 'name':
        return a.displayName.localeCompare(b.displayName)
      default:
        return 0
    }
  })

  // 打开应用详情
  const handleOpenApp = async (app: AppInstance) => {
    try {
      // 添加到收藏（如果还没有的话）
      await addFavoriteApp({
        instanceId: app.instanceId,
        displayName: app.displayName,
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
        colors.sidebarBackground.tailwind
      )}>
        <Cpu className="w-6 h-6 text-blue-500" />
      </div>
    ) : (
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center",
        colors.sidebarBackground.tailwind
      )}>
        <Store className="w-6 h-6 text-green-500" />
      </div>
    )
  }

  // 🎯 加载状态显示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-600"></div>
            <span className="ml-3 text-stone-600 dark:text-stone-400">加载应用列表...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-800">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-stone-600 text-white">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 font-serif">
                应用广场
              </h1>
              <p className="text-stone-600 dark:text-stone-400 font-serif">
                发现和使用各种AI应用工具
              </p>
            </div>
          </div>
          
          {/* 统计信息 */}
          <div className="flex items-center gap-6 text-sm text-stone-600 dark:text-stone-400">
            <span className="font-serif">共 {apps.length} 个应用</span>
            <span className="font-serif">已筛选 {sortedApps.length} 个</span>
          </div>
        </div>

        {/* 搜索和过滤栏 */}
        <div className="mb-8 space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="搜索应用名称、描述或标签..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-xl border font-serif",
                "bg-white dark:bg-stone-800",
                "border-stone-200 dark:border-stone-700",
                "text-stone-900 dark:text-stone-100",
                "placeholder-stone-500 dark:placeholder-stone-400",
                "focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
              )}
            />
          </div>

          {/* 过滤和排序控件 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            {/* 分类过滤 */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category || '全部')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors font-serif",
                    selectedCategory === category
                      ? "bg-stone-600 text-white"
                      : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* 视图模式和排序 */}
            <div className="flex items-center gap-4">
              {/* 排序 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'popular' | 'recent' | 'name')}
                className={cn(
                  "px-3 py-2 rounded-lg border text-sm font-serif",
                  "bg-white dark:bg-stone-800",
                  "border-stone-200 dark:border-stone-700",
                  "text-stone-900 dark:text-stone-100",
                  "focus:outline-none focus:ring-2 focus:ring-stone-500"
                )}
              >
                <option value="popular">按热度排序</option>
                <option value="recent">按最近使用</option>
                <option value="name">按名称排序</option>
              </select>

              {/* 视图切换 */}
              <div className="flex rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'grid'
                      ? "bg-stone-600 text-white"
                      : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700"
                  )}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'list'
                      ? "bg-stone-600 text-white"
                      : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 应用列表 */}
        {sortedApps.length === 0 ? (
          <div className="text-center py-16">
            <Store className="w-16 h-16 text-stone-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stone-600 dark:text-stone-400 mb-2 font-serif">
              {apps.length === 0 ? '暂无应用' : '未找到匹配的应用'}
            </h3>
            <p className="text-stone-500 dark:text-stone-500 font-serif">
              {apps.length === 0 
                ? '请在管理界面中添加应用实例' 
                : '尝试调整搜索条件或分类筛选'
              }
            </p>
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          )}>
            {sortedApps.map((app) => (
              <div
                key={app.instanceId}
                onClick={() => handleOpenApp(app)}
                className={cn(
                  "group cursor-pointer transition-all duration-200",
                  "bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700",
                  "hover:shadow-lg hover:border-stone-300 dark:hover:border-stone-600",
                  "hover:-translate-y-1",
                  viewMode === 'list' && "flex items-center p-4 gap-4"
                )}
              >
                {viewMode === 'grid' ? (
                  <div className="p-6">
                    {/* 应用图标和基本信息 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getAppIcon(app)}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-stone-900 dark:text-stone-100 truncate font-serif">
                            {app.displayName}
                          </h3>
                          <p className="text-sm text-stone-600 dark:text-stone-400 font-serif">
                            {app.category}
                          </p>
                        </div>
                      </div>
                      {app.isPopular && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>

                    {/* 应用描述 */}
                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 line-clamp-2 font-serif">
                      {app.description}
                    </p>

                    {/* 标签 */}
                    {app.tags && app.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {app.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs rounded-md bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 font-serif"
                          >
                            {tag}
                          </span>
                        ))}
                        {app.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs rounded-md bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 font-serif">
                            +{app.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 底部信息 */}
                    <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span className="font-serif">{app.userCount} 用户</span>
                      </div>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 列表视图 */}
                    {getAppIcon(app)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-stone-900 dark:text-stone-100 truncate font-serif">
                          {app.displayName}
                        </h3>
                        {app.isPopular && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <p className="text-sm text-stone-600 dark:text-stone-400 mb-2 line-clamp-1 font-serif">
                        {app.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-500">
                        <span className="font-serif">{app.category}</span>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span className="font-serif">{app.userCount} 用户</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-stone-400 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 