"use client"
import { Settings, HelpCircle } from "lucide-react"
import { SidebarButton } from "./sidebar-button"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { cn } from "@lib/utils"
import { MobileUserButton } from "@components/mobile"
import { useMobile } from "@lib/hooks/use-mobile"
import { useRouter } from "next/navigation"

export function SidebarFooter() {
  const isMobile = useMobile()
  const router = useRouter()
  const { isExpanded, isLocked } = useSidebarStore()
  return (
    <div className={cn(
      "flex flex-col gap-1.5 p-3 mt-auto",
    )}>
      {!isMobile && <SidebarButton
        icon={<Settings className={cn(
          "h-5 w-5 transition-transform duration-300 group-hover:rotate-45",
        )} />}
        onClick={() => {
          useSidebarStore.setState({ isExpanded: true, isLocked: true })
          router.push('/settings')
        }}
        aria-label="设置"
        className="group"
      >
        设置
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