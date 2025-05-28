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
        <span className="font-serif">设置</span>
      </SidebarButton>}
      {!isMobile && <SidebarButton
        icon={<HelpCircle className={cn(
          "h-5 w-5 transition-all duration-300",
        )} />}
        onClick={() => console.log("Help")}
        aria-label="帮助"
        className="group"
      >
        <span className="font-serif">帮助</span>
      </SidebarButton>}
      
      {isMobile && <MobileUserButton />}
    </div>
  )
}