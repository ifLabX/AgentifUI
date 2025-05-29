"use client"

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Settings } from 'lucide-react'
import { cn } from '@lib/utils'
import { useTheme } from '@lib/hooks/use-theme'
import { useProfile } from '@lib/hooks/use-profile'

interface AdminButtonProps {
  variant?: 'floating' | 'navbar'
}

/**
 * 管理员按钮组件
 * 特点：
 * - 支持两种变体：floating（首页右上角浮动）和navbar（导航栏内嵌）
 * - 使用isDark适配主题颜色
 * - 使用useProfile hook检查管理员权限，利用localStorage缓存
 * - 带有动画效果和hover交互
 */
export function AdminButton({ variant = 'floating' }: AdminButtonProps) {
  const router = useRouter()
  const { isDark } = useTheme()
  
  // --- BEGIN COMMENT ---
  // 使用useProfile hook获取用户信息，包含缓存机制
  // --- END COMMENT ---
  const { profile, isLoading } = useProfile()

  // --- BEGIN COMMENT ---
  // 管理员入口点击处理
  // --- END COMMENT ---
  const handleAdminClick = () => {
    router.push('/admin')
  }

  // --- BEGIN COMMENT ---
  // 根据主题获取颜色配置
  // --- END COMMENT ---
  const getAdminButtonColors = () => {
    if (isDark) {
      return 'bg-stone-700/80 hover:bg-stone-600/90 border-stone-600 text-stone-200'
    } else {
      return 'bg-stone-100/80 hover:bg-stone-200/90 border-stone-300 text-stone-700'
    }
  }

  // --- BEGIN COMMENT ---
  // 检查是否为管理员：profile存在且role为admin
  // --- END COMMENT ---
  const isAdmin = profile?.role === 'admin'

  // --- BEGIN COMMENT ---
  // 如果不是管理员或正在加载，不显示按钮
  // --- END COMMENT ---
  if (!isAdmin || isLoading) {
    return null
  }

  // --- BEGIN COMMENT ---
  // floating变体：用于首页右上角，带有完整的动画效果
  // --- END COMMENT ---
  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="fixed top-6 right-6 z-50"
      >
        <button
          onClick={handleAdminClick}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border backdrop-blur-sm",
            "transition-all duration-200 hover:scale-105 font-serif cursor-pointer",
            "shadow-lg hover:shadow-xl",
            getAdminButtonColors()
          )}
        >
          <Settings className="h-4 w-4" />
          <span className="text-sm font-medium">管理面板</span>
        </button>
      </motion.div>
    )
  }

  // --- BEGIN COMMENT ---
  // navbar变体：用于导航栏，样式简洁
  // --- END COMMENT ---
  return (
    <button
      onClick={handleAdminClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-md border",
        "transition-all duration-200 hover:scale-105 font-serif cursor-pointer",
        "shadow-sm hover:shadow-md",
        getAdminButtonColors()
      )}
    >
      <Settings className="h-4 w-4" />
      <span className="text-sm font-medium">管理</span>
    </button>
  )
} 