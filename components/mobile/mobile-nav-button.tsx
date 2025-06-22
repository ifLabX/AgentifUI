"use client"

import { Menu } from "lucide-react"
import { cn } from "@lib/utils"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useTheme } from "@lib/hooks/use-theme"

export function MobileNavButton() {
  const { isExpanded, showMobileNav } = useSidebarStore()
  const { isDark } = useTheme()
  
  // 如果侧边栏已展开，直接返回null，不渲染按钮
  if (isExpanded) {
    return null;
  }
  
  return (
    <button
      type="button"
      aria-label="打开菜单"
      onClick={showMobileNav}
      className={cn(
        "fixed top-4 left-4 z-50 md:hidden", // 仅在移动设备上显示，固定在左上角
        "flex items-center justify-center",
        "w-10 h-10 rounded-full",
        "select-none", // 防止文字选中
        
        // 去掉transition效果
        
        // 亮色模式样式
        !isDark && [
          "bg-stone-100 hover:bg-stone-300 text-stone-900",
          "shadow-lg shadow-primary/5", 
        ],
        
        // 暗色模式样式
        isDark && [
          "bg-stone-700 hover:bg-stone-600 text-gray-100",
          "shadow-[0_0_10px_rgba(0,0,0,0.4)]",
        ],
      )}
    >
      <Menu className="w-6 h-6" />
    </button>
  )
}
