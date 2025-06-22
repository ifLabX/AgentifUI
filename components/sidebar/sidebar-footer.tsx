"use client"
import { Settings } from "lucide-react"
import { SidebarButton } from "./sidebar-button"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { cn } from "@lib/utils"
import { MobileUserButton } from "@components/mobile"
import { useMobile } from "@lib/hooks/use-mobile"
import { useRouter } from "next/navigation"

export function SidebarFooter() {
  const isMobile = useMobile()
  const router = useRouter()
  const { isExpanded } = useSidebarStore()
  return (
    <div className={cn(
      "flex flex-col gap-1.5 p-3 mt-auto",
    )}>
      {!isMobile && <SidebarButton
        icon={<Settings className={cn(
          "h-5 w-5 transition-transform duration-300 group-hover:rotate-45",
        )} />}
        onClick={() => {
          router.push('/settings')
        }}
        aria-label="设置"
        className="group"
      >
        <span className="font-serif">设置</span>
      </SidebarButton>}
      
      {isMobile && <MobileUserButton />}
    </div>
  )
}