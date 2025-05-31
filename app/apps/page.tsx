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
import { getDifyAppTypeInfo, getAllDifyAppTypes } from "@lib/types/dify-app-types"
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
      
      // 🎯 优化：从Dify应用类型获取更丰富的描述信息
      const difyAppType = metadata?.dify_apptype
      const difyTypeInfo = difyAppType ? getDifyAppTypeInfo(difyAppType) : null
      
      // 🎯 智能生成应用描述：优先使用配置的描述，然后根据应用类型生成
      let description = metadata?.brief_description || app.description || difyParams?.opening_statement
      
      if (!description && difyTypeInfo) {
        description = `${difyTypeInfo.description} - ${difyTypeInfo.features.join('、')}`
      }
      
      if (!description) {
        description = '暂无描述'
      }
      
      return {
        instanceId: app.instance_id,
        displayName: app.display_name || app.instance_id,
        description,
        appType: 'marketplace' as const,
        iconUrl: metadata?.icon_url,
        // 🎯 优化：使用Dify应用类型作为主要分类
        category: difyTypeInfo?.label || '其他',
        difyAppType: difyAppType,
        tags: metadata?.tags || [],
        // 展示用的辅助信息
        isPopular: metadata?.is_common_model || false,
        lastUsed: new Date().toISOString().split('T')[0],
        config: app.config
      }
    })

  // 🎯 重构分类逻辑：基于Dify应用类型 + 常用应用
  const getDynamicCategories = () => {
    const categories = ['全部']
    
    // 添加常用应用分类（如果有）
    if (favoriteApps.length > 0) {
      categories.push('常用应用')
    }
    
    // 添加Dify应用类型分类
    const appTypesInUse = new Set<string>()
    apps.forEach(app => {
      if (app.difyAppType) {
        appTypesInUse.add(app.difyAppType)
      }
    })
    
    // 按照预定义顺序添加应用类型
    const allDifyTypes = getAllDifyAppTypes()
    allDifyTypes.forEach(typeInfo => {
      if (appTypesInUse.has(typeInfo.key)) {
        categories.push(typeInfo.label)
      }
    })
    
    // 添加其他分类（没有明确Dify类型的应用）
    const hasOtherApps = apps.some(app => !app.difyAppType)
    if (hasOtherApps) {
      categories.push('其他')
    }
    
    return categories
  }

  const categories = getDynamicCategories()

  // 🎯 优化过滤逻辑：支持Dify应用类型筛选
  const filteredApps = apps.filter(app => {
    const matchesSearch = app.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // 🎯 新的分类匹配逻辑：基于Dify应用类型
    let matchesCategory = false
    
    if (selectedCategory === "全部") {
      matchesCategory = true
    } else if (selectedCategory === "常用应用") {
      matchesCategory = favoriteApps.some(fav => fav.instanceId === app.instanceId)
    } else if (selectedCategory === "其他") {
      matchesCategory = !app.difyAppType
    } else {
      // 检查是否匹配Dify应用类型
      const difyTypeInfo = app.difyAppType ? getDifyAppTypeInfo(app.difyAppType) : null
      matchesCategory = difyTypeInfo?.label === selectedCategory
    }
    
    return matchesSearch && matchesCategory
  })

  // 🎯 优化排序逻辑：常用应用置顶，然后按应用类型分组
  const sortedApps = [...filteredApps].sort((a, b) => {
    // 首先按是否为常用应用排序（常用应用置顶）
    const aIsFavorite = favoriteApps.some(fav => fav.instanceId === a.instanceId)
    const bIsFavorite = favoriteApps.some(fav => fav.instanceId === b.instanceId)
    
    if (aIsFavorite && !bIsFavorite) return -1
    if (!aIsFavorite && bIsFavorite) return 1
    
    // 然后按Dify应用类型排序
    const typeOrder = ['chatbot', 'agent', 'chatflow', 'workflow', 'text-generation']
    const aTypeIndex = a.difyAppType ? typeOrder.indexOf(a.difyAppType) : 999
    const bTypeIndex = b.difyAppType ? typeOrder.indexOf(b.difyAppType) : 999
    
    if (aTypeIndex !== bTypeIndex) {
      return aTypeIndex - bTypeIndex
    }
    
    // 最后按名称排序
    return a.displayName.localeCompare(b.displayName)
  })

  // 🎯 打开应用详情 - 根据Dify应用类型动态路由
  const handleOpenApp = async (app: AppInstance) => {
    try {
      // 🎯 获取Dify应用类型
      const difyAppType = app.config?.app_metadata?.dify_apptype
      
      // 🎯 根据应用类型构建不同的路由路径
      let routePath: string
      
      switch (difyAppType) {
        case 'chatbot':
          routePath = `/apps/chatbot/${app.instanceId}`
          break
        case 'agent':
          routePath = `/apps/agent/${app.instanceId}`
          break
        case 'chatflow':
          routePath = `/apps/chatflow/${app.instanceId}`
          break
        case 'workflow':
          routePath = `/apps/workflow/${app.instanceId}`
          break
        case 'text-generation':
          routePath = `/apps/text-generation/${app.instanceId}`
          break
        default:
          // 🎯 如果没有指定类型或类型无效，默认跳转到chatbot
          console.warn(`未知的Dify应用类型: ${difyAppType}，使用默认路由`)
          routePath = `/apps/chatbot/${app.instanceId}`
      }
      
      console.log(`[路由跳转] 应用: ${app.displayName}, 类型: ${difyAppType}, 路径: ${routePath}`)
      
      // 🎯 执行路由跳转
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
      {/* 🎯 添加导航栏 */}
      <NavBar />
      
      <div className={cn(
        colors.mainBackground.tailwind,
        "min-h-screen",
        "pt-16 md:pt-12"
      )}>
        <div className="container mx-auto px-4 py-8">
          {/* 🎯 优化页面标题：显示更多统计信息 */}
          <AppHeader 
            totalApps={apps.length}
            filteredApps={sortedApps.length}
            selectedCategory={selectedCategory}
          />

          {/* 🎯 优化搜索和过滤栏：支持Dify应用类型筛选 */}
          <AppFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* 🎯 优化应用列表：显示Dify应用类型信息 */}
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