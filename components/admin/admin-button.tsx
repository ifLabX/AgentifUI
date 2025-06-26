"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Wrench } from 'lucide-react'
import { useAdminAuth } from '@lib/hooks/use-admin-auth'
import { useTheme } from '@lib/hooks/use-theme'
import { useTranslations } from 'next-intl'
import { cn } from '@lib/utils'

/**
 * 管理员按钮组件
 * 特点：
 * - 仅对管理员用户显示，提供进入管理后台的入口
 * - 使用与语言切换器一致的样式设计，参考 sidebar button 的悬停效果
 * - 支持多语言显示
 */
export function AdminButton() {
  const { isAdmin } = useAdminAuth(false)
  const { isDark } = useTheme()
  const t = useTranslations('pages.admin')

  // --- BEGIN COMMENT ---
  // 非管理员用户不显示此按钮
  // --- END COMMENT ---
  if (!isAdmin) {
    return null
  }

  // --- BEGIN COMMENT ---
  // 根据主题获取按钮样式：参考 sidebar button 的悬停效果
  // --- END COMMENT ---
  const getButtonColors = () => {
    if (isDark) {
      return "bg-stone-800/50 hover:bg-stone-600/60 text-gray-200 border-stone-600/30"
    }
    return "bg-stone-200/50 hover:bg-stone-300/80 text-stone-600 border-stone-400/30"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
    >
      <Link
        href="/admin"
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border backdrop-blur-sm",
          "transition-colors duration-200 cursor-pointer font-serif h-10",
          "shadow-sm hover:shadow-md no-underline",
          getButtonColors()
        )}
      >
        <Wrench className="h-4 w-4" />
        <span className="text-sm font-medium hidden sm:inline">
          {t('title')}
        </span>
      </Link>
    </motion.div>
  )
} 