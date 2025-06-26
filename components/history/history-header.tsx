"use client"

import * as React from "react"
import { ArrowLeft } from "lucide-react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"
import { useRouter } from "next/navigation"

// --- BEGIN COMMENT ---
// 历史对话页面的头部组件
// 包含标题和返回按钮
// --- END COMMENT ---
export function HistoryHeader() {
  const { isDark } = useTheme()
  const router = useRouter()
  
  return (
    <header className={cn(
      "flex items-center justify-between px-4 md:px-8 lg:px-12 py-4 border-b",
      isDark ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"
    )}>
      <div className="flex items-center">
        <button
          onClick={() => router.back()}
          className={cn(
            "p-2 rounded-full mr-4",
            "transition-colors duration-200",
            isDark 
              ? "hover:bg-stone-800 text-stone-400 hover:text-stone-300" 
              : "hover:bg-stone-100 text-stone-500 hover:text-stone-700"
          )}
          aria-label="返回"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <h1 className={cn(
          "text-xl font-medium font-serif",
          isDark ? "text-stone-100" : "text-stone-800"
        )}>
          历史对话
        </h1>
      </div>
    </header>
  )
}
