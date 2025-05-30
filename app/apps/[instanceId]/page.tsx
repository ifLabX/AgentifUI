"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { useMobile } from "@lib/hooks"
import { cn } from "@lib/utils"
import { 
  ArrowLeft,
  Bot, 
  Zap, 
  Star,
  Users,
  Calendar,
  MessageSquare,
  Heart,
  Share2,
  Play
} from "lucide-react"
import { useFavoriteAppsStore } from "@lib/stores/favorite-apps-store"
import { useCurrentApp } from "@lib/hooks/use-current-app"
import { useChatStore } from "@lib/stores/chat-store"

// 临时模拟数据
interface AppDetail {
  instanceId: string
  displayName: string
  description: string
  longDescription?: string
  appType: 'model' | 'marketplace'
  iconUrl?: string
  category: string
  isPopular?: boolean
  userCount?: number
  lastUsed?: string
  features?: string[]
  examples?: string[]
  tags?: string[]
}

// 模拟详细数据
const mockAppDetails: Record<string, AppDetail> = {
  "gpt-4-turbo": {
    instanceId: "gpt-4-turbo",
    displayName: "GPT-4 Turbo",
    description: "最新的GPT-4模型，具有更快的响应速度和更强的推理能力",
    longDescription: "GPT-4 Turbo是OpenAI最新发布的大语言模型，在保持GPT-4强大能力的基础上，显著提升了响应速度和处理效率。该模型在文本理解、代码生成、创意写作等方面表现卓越，是您的智能助手首选。",
    appType: "model",
    category: "AI助手",
    isPopular: true,
    userCount: 1250,
    lastUsed: "2024-01-15",
    features: [
      "更快的响应速度",
      "增强的推理能力", 
      "支持多语言对话",
      "代码生成和调试",
      "创意写作辅助"
    ],
    examples: [
      "帮我写一份项目计划书",
      "解释量子计算的基本原理",
      "用Python实现一个排序算法",
      "创作一首关于春天的诗"
    ],
    tags: ["AI助手", "文本生成", "代码", "创意写作"]
  },
  "claude-3-sonnet": {
    instanceId: "claude-3-sonnet",
    displayName: "Claude 3 Sonnet",
    description: "Anthropic的Claude 3模型，擅长分析和创作",
    longDescription: "Claude 3 Sonnet是Anthropic开发的先进AI模型，以其出色的分析能力和创作才能而闻名。该模型在处理复杂推理任务、文档分析和创意内容生成方面表现突出，为用户提供深度思考和精准表达。",
    appType: "model",
    category: "AI助手",
    isPopular: true,
    userCount: 890,
    lastUsed: "2024-01-14",
    features: [
      "深度分析能力",
      "优秀的创作才能",
      "文档理解和总结",
      "逻辑推理",
      "安全可靠的对话"
    ],
    examples: [
      "分析这份市场报告的关键洞察",
      "帮我改进这篇文章的结构",
      "解释这个复杂的哲学概念",
      "创作一个科幻小说开头"
    ],
    tags: ["AI助手", "分析", "创作", "推理"]
  }
}

export default function AppDetailPage() {
  const { colors, isDark } = useThemeColors()
  const isMobile = useMobile()
  const router = useRouter()
  const params = useParams()
  const instanceId = params.instanceId as string
  
  const { switchToSpecificApp } = useCurrentApp()
  const { clearMessages } = useChatStore()
  const { addFavoriteApp, removeFavoriteApp, favoriteApps } = useFavoriteAppsStore()

  const [app, setApp] = useState<AppDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)

  // 检查是否已收藏
  const isFavorited = favoriteApps.some(fav => fav.instanceId === instanceId)

  useEffect(() => {
    // 模拟加载应用详情
    const loadAppDetail = async () => {
      setIsLoading(true)
      try {
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const appDetail = mockAppDetails[instanceId]
        if (appDetail) {
          setApp(appDetail)
          // 设置页面标题
          document.title = `${appDetail.displayName} | AgentifUI`
        } else {
          // 应用不存在，跳转回应用广场
          router.push('/apps')
        }
      } catch (error) {
        console.error('加载应用详情失败:', error)
        router.push('/apps')
      } finally {
        setIsLoading(false)
      }
    }

    if (instanceId) {
      loadAppDetail()
    }
  }, [instanceId, router])

  // 开始对话
  const handleStartChat = async () => {
    if (!app) return
    
    setIsStarting(true)
    try {
      // 切换到指定应用
      await switchToSpecificApp(app.instanceId)
      
      // 清除当前聊天状态
      clearMessages()
      
      // 跳转到新对话页面
      router.push('/chat/new')
      
    } catch (error) {
      console.error('启动对话失败:', error)
    } finally {
      setIsStarting(false)
    }
  }

  // 切换收藏状态
  const handleToggleFavorite = () => {
    if (!app) return
    
    if (isFavorited) {
      removeFavoriteApp(app.instanceId)
    } else {
      addFavoriteApp({
        instanceId: app.instanceId,
        displayName: app.displayName,
        description: app.description,
        iconUrl: app.iconUrl,
        appType: app.appType
      })
    }
  }

  // 获取应用图标
  const getAppIcon = (app: AppDetail) => {
    if (app.iconUrl) {
      return (
        <img 
          src={app.iconUrl} 
          alt={app.displayName}
          className="w-20 h-20 rounded-2xl object-cover"
        />
      )
    }

    return app.appType === 'model' ? (
      <div className={cn(
        "w-20 h-20 rounded-2xl flex items-center justify-center",
        isDark ? "bg-green-900/30" : "bg-green-50"
      )}>
        <Bot className={cn(
          "w-10 h-10",
          isDark ? "text-green-400" : "text-green-600"
        )} />
      </div>
    ) : (
      <div className={cn(
        "w-20 h-20 rounded-2xl flex items-center justify-center", 
        isDark ? "bg-blue-900/30" : "bg-blue-50"
      )}>
        <Zap className={cn(
          "w-10 h-10",
          isDark ? "text-blue-400" : "text-blue-600"
        )} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn(
        "min-h-screen w-full flex items-center justify-center",
        colors.mainBackground.tailwind
      )}>
        <div className="text-center">
          <div className={cn(
            "w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4",
            isDark ? "border-stone-600" : "border-stone-300"
          )} />
          <p className={cn(
            "text-lg font-serif",
            isDark ? "text-stone-300" : "text-stone-600"
          )}>
            加载中...
          </p>
        </div>
      </div>
    )
  }

  if (!app) {
    return null
  }

  return (
    <div className={cn(
      "min-h-screen w-full",
      colors.mainBackground.tailwind
    )}>
      {/* 顶部导航 */}
      <div className={cn(
        "border-b",
        isDark ? "border-stone-700" : "border-stone-200"
      )}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className={cn(
              "flex items-center gap-2 text-sm font-serif transition-colors duration-200",
              isDark 
                ? "text-stone-400 hover:text-stone-200" 
                : "text-stone-600 hover:text-stone-900"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
        </div>
      </div>

      {/* 应用详情 */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* 应用头部信息 */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* 应用图标 */}
            <div className="flex-shrink-0">
              {getAppIcon(app)}
            </div>

            {/* 应用基本信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className={cn(
                      "text-3xl font-bold font-serif",
                      colors.mainText.tailwind
                    )}>
                      {app.displayName}
                    </h1>
                    {app.isPopular && (
                      <Star className="w-6 h-6 text-yellow-500 fill-current" />
                    )}
                  </div>
                  
                  <p className={cn(
                    "text-lg font-serif mb-4",
                    isDark ? "text-stone-300" : "text-stone-600"
                  )}>
                    {app.description}
                  </p>

                  {/* 应用元信息 */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {/* 应用类型 */}
                    <span className={cn(
                      "px-3 py-1 rounded-full font-medium",
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

                    {/* 分类 */}
                    <span className={cn(
                      "px-3 py-1 rounded-full font-medium",
                      isDark 
                        ? "bg-stone-700 text-stone-300" 
                        : "bg-stone-100 text-stone-700"
                    )}>
                      {app.category}
                    </span>

                    {/* 用户数量 */}
                    {app.userCount && (
                      <div className={cn(
                        "flex items-center gap-1",
                        isDark ? "text-stone-400" : "text-stone-500"
                      )}>
                        <Users className="w-4 h-4" />
                        <span>{app.userCount} 用户</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-3">
                  {/* 收藏按钮 */}
                  <button
                    onClick={handleToggleFavorite}
                    className={cn(
                      "p-3 rounded-xl border transition-colors duration-200",
                      isFavorited
                        ? (isDark 
                            ? "bg-red-900/30 border-red-700 text-red-400 hover:bg-red-900/50" 
                            : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100")
                        : (isDark 
                            ? "border-stone-600 text-stone-400 hover:bg-stone-700" 
                            : "border-stone-300 text-stone-500 hover:bg-stone-50")
                    )}
                  >
                    <Heart className={cn(
                      "w-5 h-5",
                      isFavorited && "fill-current"
                    )} />
                  </button>

                  {/* 分享按钮 */}
                  <button
                    className={cn(
                      "p-3 rounded-xl border transition-colors duration-200",
                      isDark 
                        ? "border-stone-600 text-stone-400 hover:bg-stone-700" 
                        : "border-stone-300 text-stone-500 hover:bg-stone-50"
                    )}
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 开始对话按钮 */}
              <button
                onClick={handleStartChat}
                disabled={isStarting}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-xl font-medium font-serif",
                  "transition-all duration-200 transform hover:scale-105",
                  "bg-blue-600 hover:bg-blue-700 text-white",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                )}
              >
                {isStarting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" />
                    启动中...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    开始对话
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 详细描述 */}
          {app.longDescription && (
            <div className={cn(
              "p-6 rounded-2xl border",
              isDark 
                ? "bg-stone-700 border-stone-600" 
                : "bg-white border-stone-200"
            )}>
              <h2 className={cn(
                "text-xl font-semibold font-serif mb-4",
                colors.mainText.tailwind
              )}>
                详细介绍
              </h2>
              <p className={cn(
                "text-base font-serif leading-relaxed",
                isDark ? "text-stone-300" : "text-stone-600"
              )}>
                {app.longDescription}
              </p>
            </div>
          )}

          {/* 功能特性 */}
          {app.features && app.features.length > 0 && (
            <div className={cn(
              "p-6 rounded-2xl border",
              isDark 
                ? "bg-stone-700 border-stone-600" 
                : "bg-white border-stone-200"
            )}>
              <h2 className={cn(
                "text-xl font-semibold font-serif mb-4",
                colors.mainText.tailwind
              )}>
                主要功能
              </h2>
              <ul className="space-y-2">
                {app.features.map((feature, index) => (
                  <li key={index} className={cn(
                    "flex items-center gap-3 text-base font-serif",
                    isDark ? "text-stone-300" : "text-stone-600"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isDark ? "bg-blue-400" : "bg-blue-600"
                    )} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 使用示例 */}
          {app.examples && app.examples.length > 0 && (
            <div className={cn(
              "p-6 rounded-2xl border",
              isDark 
                ? "bg-stone-700 border-stone-600" 
                : "bg-white border-stone-200"
            )}>
              <h2 className={cn(
                "text-xl font-semibold font-serif mb-4",
                colors.mainText.tailwind
              )}>
                使用示例
              </h2>
              <div className="space-y-3">
                {app.examples.map((example, index) => (
                  <div key={index} className={cn(
                    "p-4 rounded-xl border-l-4",
                    isDark 
                      ? "bg-stone-800 border-l-blue-400" 
                      : "bg-stone-50 border-l-blue-600"
                  )}>
                    <p className={cn(
                      "text-sm font-serif",
                      isDark ? "text-stone-300" : "text-stone-600"
                    )}>
                      "{example}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 标签 */}
          {app.tags && app.tags.length > 0 && (
            <div>
              <h2 className={cn(
                "text-xl font-semibold font-serif mb-4",
                colors.mainText.tailwind
              )}>
                相关标签
              </h2>
              <div className="flex flex-wrap gap-2">
                {app.tags.map((tag, index) => (
                  <span key={index} className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium",
                    isDark 
                      ? "bg-stone-700 text-stone-300" 
                      : "bg-stone-100 text-stone-700"
                  )}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 