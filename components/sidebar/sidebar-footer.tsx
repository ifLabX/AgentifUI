"use client"
import { Settings, Sun, Moon, HelpCircle } from "lucide-react"
import { SidebarButton } from "./sidebar-button"
import { useTheme } from "@lib/hooks/use-theme"
import { cn } from "@lib/utils"
import { MobileUserButton } from "@components/mobile"
import { useMobile } from "@lib/hooks/use-mobile"

export function SidebarFooter() {
  const { isDark, toggleTheme } = useTheme()
  const isMobile = useMobile()

  return (
    <div className={cn(
      "flex flex-col gap-1.5 p-3 mt-auto",
    )}>
      {/* 分隔线 - 已移除 */}
      {/* <div className={cn(
        "absolute top-0 left-4 right-4 h-px",
        isDark 
          ? "bg-gradient-to-r from-transparent via-gray-700 to-transparent"
          : "bg-gradient-to-r from-transparent via-muted/40 to-transparent"
      )}></div> */}
      
      {!isMobile && <SidebarButton
        icon={<Settings className={cn(
          "h-5 w-5 transition-transform duration-300 group-hover:rotate-45",
        )} />}
        text="设置"
        onClick={() => console.log("Settings")}
        aria-label="设置"
        className="group"
      />}
      {!isMobile && <SidebarButton
        icon={isDark
          ? <Sun className="h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:text-yellow-400" />
          : <Moon className="h-5 w-5 transition-all duration-300 group-hover:scale-110" />
        }
        text={isDark ? "亮色模式" : "暗色模式"}
        onClick={toggleTheme}
        aria-label={isDark ? "切换到亮色模式" : "切换到暗色模式"}
        className="group"
      />}
      {!isMobile && <SidebarButton
        icon={<HelpCircle className={cn(
          "h-5 w-5 transition-all duration-300",
        )} />}
        text="帮助"
        onClick={() => console.log("Help")}
        aria-label="帮助"
        className="group"
      />}
      
      {/* 仅在移动端显示的用户按钮 */}
      {isMobile && <MobileUserButton />}
    </div>
  )
} 