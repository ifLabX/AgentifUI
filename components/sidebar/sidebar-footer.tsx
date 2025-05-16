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
      {!isMobile && <SidebarButton
        icon={<Settings className={cn(
          "h-5 w-5 transition-transform duration-300 group-hover:rotate-45",
        )} />}
        onClick={() => console.log("Settings")}
        aria-label="设置"
        className="group"
      >
        设置
      </SidebarButton>}
      {!isMobile && <SidebarButton
        icon={isDark
          ? <Sun className="h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:text-yellow-400" />
          : <Moon className="h-5 w-5 transition-all duration-300 group-hover:scale-110" />
        }
        onClick={toggleTheme}
        aria-label={isDark ? "切换到亮色模式" : "切换到暗色模式"}
        className="group"
      >
        {isDark ? "亮色模式" : "暗色模式"}
      </SidebarButton>}
      {!isMobile && <SidebarButton
        icon={<HelpCircle className={cn(
          "h-5 w-5 transition-all duration-300",
        )} />}
        onClick={() => console.log("Help")}
        aria-label="帮助"
        className="group"
      >
        帮助
      </SidebarButton>}
      
      {isMobile && <MobileUserButton />}
    </div>
  )
}