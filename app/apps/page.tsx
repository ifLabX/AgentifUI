"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { useMobile } from "@lib/hooks"
import { cn } from "@lib/utils"
import { useFavoriteAppsStore } from "@lib/stores/favorite-apps-store"
import { useAppListStore } from "@lib/stores/app-list-store"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { NavBar } from "@components/nav-bar"
import { 
  AppHeader, 
  AppFilters, 
  AppList, 
  AppLoading 
} from "@components/apps"
import type { AppInstance } from "@components/apps/types"

export default function AppsPage() {
  const router = useRouter()
  const { colors } = useThemeColors()
  const isMobile = useMobile()
  const { addFavoriteApp, favoriteApps } = useFavoriteAppsStore()
  const { selectItem } = useSidebarStore()
  
  // 🎯 使用真实的应用列表数据，替代硬编码
  const { apps: rawApps, fetchApps, isLoading } = useAppListStore()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("全部")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 🎯 在组件挂载时获取应用列表并清除sidebar选中状态
  useEffect(() => {
    fetchApps()
    // 清除sidebar选中状态，因为在应用市场页面不应该有选中的应用
    selectItem(null, null)
  }, [fetchApps, selectItem])

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
        category: metadata?.tags?.[0] || '未分类',
        tags: metadata?.tags || [],
        // 展示用的辅助信息
        isPopular: metadata?.is_common_model || false,
        lastUsed: new Date().toISOString().split('T')[0],
        config: app.config
      }
    })

  // 🎯 从应用数据中提取所有tags作为分类列表
  const allTags = new Set<string>()
  apps.forEach(app => {
    if (app.tags && app.tags.length > 0) {
      app.tags.forEach(tag => allTags.add(tag))
    }
  })
  
  // 检查是否有未分类的应用，如果有则添加"未分类"选项
  const hasUncategorizedApps = apps.some(app => !app.tags || app.tags.length === 0)
  
  // 检查是否有常用应用
  const hasFavoriteApps = favoriteApps.length > 0
  
  const categories = [
    '全部', 
    ...(hasFavoriteApps ? ['常用应用'] : []),
    ...Array.from(allTags).sort(),
    ...(hasUncategorizedApps ? ['未分类'] : [])
  ]

  // 过滤和搜索逻辑
  const filteredApps = apps.filter(app => {
    const matchesSearch = app.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // 修改分类匹配逻辑：检查应用的所有tags是否包含选中的分类
    const matchesCategory = selectedCategory === "全部" || 
                           (selectedCategory === "常用应用" && favoriteApps.some(fav => fav.instanceId === app.instanceId)) ||
                           (app.tags && app.tags.includes(selectedCategory)) ||
                           (selectedCategory === "未分类" && (!app.tags || app.tags.length === 0))
    
    return matchesSearch && matchesCategory
  })

  // 排序逻辑 - 常用应用置顶，其他按名称排序
  const sortedApps = [...filteredApps].sort((a, b) => {
    // 首先按是否为常用应用排序（常用应用置顶）
    const aIsFavorite = favoriteApps.some(fav => fav.instanceId === a.instanceId)
    const bIsFavorite = favoriteApps.some(fav => fav.instanceId === b.instanceId)
    
    if (aIsFavorite && !bIsFavorite) return -1
    if (!aIsFavorite && bIsFavorite) return 1
    
    // 如果都是常用应用或都不是，则按名称排序
    return a.displayName.localeCompare(b.displayName)
  })

  // --- BEGIN COMMENT ---
  // 🎯 打开应用详情 - 根据Dify应用类型动态路由
  // --- END COMMENT ---
  const handleOpenApp = async (app: AppInstance) => {
    try {
      // --- 获取Dify应用类型 ---
      const difyAppType = app.config?.app_metadata?.dify_apptype
      
      // --- 根据应用类型构建不同的路由路径 ---
      let routePath: string
      
      switch (difyAppType) {
        case 'chatbot':
          routePath = `/apps/${app.instanceId}/chatbot`
          break
        case 'agent':
          routePath = `/apps/${app.instanceId}/agent`
          break
        case 'chatflow':
          routePath = `/apps/${app.instanceId}/chatflow`
          break
        case 'workflow':
          routePath = `/apps/${app.instanceId}/workflow`
          break
        case 'text-generation':
          routePath = `/apps/${app.instanceId}/text-generation`
          break
        default:
          // --- 如果没有指定类型或类型无效，默认跳转到chatbot ---
          console.warn(`未知的Dify应用类型: ${difyAppType}，使用默认路由`)
          routePath = `/apps/${app.instanceId}/chatbot`
      }
      
      console.log(`[路由跳转] 应用: ${app.displayName}, 类型: ${difyAppType}, 路径: ${routePath}`)
      
      // --- 执行路由跳转 ---
      router.push(routePath)
    } catch (error) {
      console.error('打开应用失败:', error)
    }
  }

  // 🎯 加载状态显示
  if (isLoading) {
    return <AppLoading />
  }

  return (
    <>
      {/* --- 添加导航栏 --- */}
      <NavBar />
      
      <div className={cn(
        colors.mainBackground.tailwind,
        "min-h-screen",
        "pt-16 md:pt-12"
      )}>
        <div className="container mx-auto px-4 py-8">
          {/* 页面标题 */}
          <AppHeader 
            totalApps={apps.length}
            filteredApps={sortedApps.length}
          />

          {/* 搜索和过滤栏 */}
          <AppFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* 应用列表 */}
          <AppList
            apps={sortedApps}
            viewMode={viewMode}
            favoriteAppIds={favoriteApps.map(fav => fav.instanceId)}
            onAppClick={handleOpenApp}
          />
        </div>
      </div>
    </>
  )
}