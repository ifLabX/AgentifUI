"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
// --- BEGIN COMMENT ---
// 🎯 移除Dify应用类型依赖 - 现在使用基于tag的分类系统
// import { getDifyAppTypeInfo, getAllDifyAppTypes } from "@lib/types/dify-app-types"
// --- END COMMENT ---
import type { AppInstance } from "@components/apps/types"

export default function AppsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
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

  // 🎯 新增：处理URL查询参数，支持直接跳转到特定筛选
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const searchParam = searchParams.get('search')
    
    if (categoryParam) {
      setSelectedCategory(decodeURIComponent(categoryParam))
    }
    
    if (searchParam) {
      setSearchTerm(decodeURIComponent(searchParam))
    }
  }, [searchParams])

  // 🎯 新增：更新URL查询参数的函数
  const updateURLParams = (category?: string, search?: string) => {
    const params = new URLSearchParams()
    
    if (category && category !== "全部") {
      params.set('category', encodeURIComponent(category))
    }
    
    if (search && search.trim()) {
      params.set('search', encodeURIComponent(search.trim()))
    }
    
    const queryString = params.toString()
    const newURL = queryString ? `/apps?${queryString}` : '/apps'
    
    // 使用replace避免在浏览器历史中创建过多条目
    router.replace(newURL, { scroll: false })
  }

  // 🎯 修改分类选择处理函数，同步更新URL
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    updateURLParams(category, searchTerm)
  }

  // 🎯 修改搜索处理函数，同步更新URL
  const handleSearchChange = (search: string) => {
    setSearchTerm(search)
    updateURLParams(selectedCategory, search)
  }

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
      
      // --- BEGIN COMMENT ---
      // 🎯 重构：直接使用应用配置中的信息，移除对Dify应用类型映射的依赖
      // 优先使用用户配置的描述信息，简化数据转换逻辑
      // --- END COMMENT ---
      const difyAppType = metadata?.dify_apptype
      
      // --- BEGIN COMMENT ---
      // 🎯 智能生成应用描述：优先使用配置的描述
      // 移除对difyTypeInfo的依赖，使用更简单的fallback逻辑
      // --- END COMMENT ---
      let description = metadata?.brief_description || app.description || difyParams?.opening_statement
      
      if (!description) {
        description = '暂无描述'
      }
      
      return {
        instanceId: app.instance_id,
        displayName: app.display_name || app.instance_id,
        description,
        appType: 'marketplace' as const,
        iconUrl: metadata?.icon_url,
        // --- BEGIN COMMENT ---
        // 🎯 重构：移除category字段，改为完全基于tags进行分类
        // category: metadata?.tags?.[0] || '其他', // 可选：使用第一个tag作为主分类
        // --- END COMMENT ---
        difyAppType: difyAppType, // 保留用于路由跳转
        tags: metadata?.tags || [],
        // 展示用的辅助信息
        isPopular: metadata?.is_common_model || false,
        lastUsed: new Date().toISOString().split('T')[0],
        config: app.config
      }
    })

  // --- BEGIN COMMENT ---
  // 🎯 重构分类逻辑：基于用户友好的tag分类，而非技术性的Dify应用类型
  // 收集所有应用的tags，按使用频率和重要性动态生成分类
  // --- END COMMENT ---
  const getDynamicCategories = () => {
    const categories = ['全部']
    
    // 添加常用应用分类（如果有）
    if (favoriteApps.length > 0) {
      categories.push('常用应用')
    }
    
    // --- BEGIN COMMENT ---
    // 🎯 收集所有应用中的tags，统计使用频率
    // 优先显示使用频率高且用户关心的功能标签
    // --- END COMMENT ---
    const tagUsageMap = new Map<string, number>()
    
    apps.forEach(app => {
      const tags = app.tags || []
      tags.forEach(tag => {
        tagUsageMap.set(tag, (tagUsageMap.get(tag) || 0) + 1)
      })
    })
    
    // --- BEGIN COMMENT ---
    // 🎯 预定义标签优先级顺序 - 基于用户使用场景重要性
    // 将用户最关心的功能分类排在前面
    // --- END COMMENT ---
    const tagPriorityOrder = [
      // 核心功能类（用户最常用）
      '写作', '翻译', '代码', '代码生成', '分析', '总结',
      
      // 内容类型
      '文本生成', '对话', '助手', '文档', '数据分析',
      
      // 模型特性
      '多模态', '对话模型', '推理模型', '文档模型',
      
      // 技术特性
      '本地', '企业级', '快速响应', '高精度', '通用', '专业',
      
      // 工具类
      '工具'
    ]
    
    // --- BEGIN COMMENT ---
    // 🎯 按优先级顺序添加存在的标签，确保重要标签排在前面
    // 同时过滤掉使用频率过低的标签（可配置阈值）
    // --- END COMMENT ---
    const minUsageThreshold = 1 // 至少被1个应用使用才显示
    
    tagPriorityOrder.forEach(tag => {
      const usageCount = tagUsageMap.get(tag) || 0
      if (usageCount >= minUsageThreshold) {
        categories.push(tag)
        tagUsageMap.delete(tag) // 避免重复添加
      }
    })
    
    // --- BEGIN COMMENT ---
    // 🎯 添加其他未在优先级列表中的标签（按使用频率排序）
    // 确保不遗漏用户自定义的有价值标签
    // --- END COMMENT ---
    const remainingTags = Array.from(tagUsageMap.entries())
      .filter(([_, count]) => count >= minUsageThreshold)
      .sort((a, b) => b[1] - a[1]) // 按使用频率降序
      .map(([tag, _]) => tag)
    
    categories.push(...remainingTags)
    
    return categories
  }

  const categories = getDynamicCategories()

  // --- BEGIN COMMENT ---
  // 🎯 重构过滤逻辑：基于tag的用户友好分类筛选
  // 支持直接根据应用的tags进行匹配，更贴近用户使用场景
  // --- END COMMENT ---
  const filteredApps = apps.filter(app => {
    const matchesSearch = app.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // --- BEGIN COMMENT ---
    // 🎯 新的分类匹配逻辑：基于tag的直接匹配
    // 简化逻辑，直接检查应用的tags是否包含选定的分类
    // --- END COMMENT ---
    let matchesCategory = false
    
    if (selectedCategory === "全部") {
      matchesCategory = true
    } else if (selectedCategory === "常用应用") {
      matchesCategory = favoriteApps.some(fav => fav.instanceId === app.instanceId)
    } else {
      // --- BEGIN COMMENT ---
      // 🎯 直接检查应用的tags是否包含选定的分类标签
      // 这比基于Dify应用类型的映射更直观和准确
      // --- END COMMENT ---
      const appTags = app.tags || []
      matchesCategory = appTags.includes(selectedCategory)
    }
    
    return matchesSearch && matchesCategory
  })

  // --- BEGIN COMMENT ---
  // 🎯 重构排序逻辑：常用应用置顶，然后按功能重要性和名称排序
  // 移除对技术性Dify应用类型的依赖，基于用户使用偏好排序
  // --- END COMMENT ---
  const sortedApps = [...filteredApps].sort((a, b) => {
    // 首先按是否为常用应用排序（常用应用置顶）
    const aIsFavorite = favoriteApps.some(fav => fav.instanceId === a.instanceId)
    const bIsFavorite = favoriteApps.some(fav => fav.instanceId === b.instanceId)
    
    if (aIsFavorite && !bIsFavorite) return -1
    if (!aIsFavorite && bIsFavorite) return 1
    
    // --- BEGIN COMMENT ---
    // 🎯 按功能标签重要性排序：核心功能 > 专业功能 > 其他
    // 这比技术分类更符合用户的使用习惯
    // --- END COMMENT ---
    const getTagPriority = (tags: string[] = []) => {
      const coreTags = ['写作', '翻译', '代码', '对话', '助手']
      const professionalTags = ['分析', '总结', '文本生成', '数据分析']
      
      if (tags.some(tag => coreTags.includes(tag))) return 1 // 核心功能
      if (tags.some(tag => professionalTags.includes(tag))) return 2 // 专业功能
      return 3 // 其他功能
    }
    
    const aPriority = getTagPriority(a.tags)
    const bPriority = getTagPriority(b.tags)
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority
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
            onSearchChange={handleSearchChange}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            categories={categories}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* 🎯 优化应用列表：显示Dify应用类型信息 */}
          <AppList
            apps={sortedApps}
            viewMode={viewMode}
            onAppClick={handleOpenApp}
          />
        </div>
      </div>
    </>
  )
}