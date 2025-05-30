"use client"

import { SidebarContainer } from "./sidebar-container"
import { SidebarBackdrop } from "./sidebar-backdrop"

export function Sidebar() {
  return (
    <>
      <SidebarBackdrop />
      <SidebarContainer />
    </>
  )
}

// 导出所有组件以便按需使用
export { SidebarButton } from "./sidebar-button"
export { SidebarContainer } from "./sidebar-container"
export { SidebarContent } from "./sidebar-content"
export { SidebarHeader } from "./sidebar-header"
export { SidebarFooter } from "./sidebar-footer"
export { SidebarBackdrop } from "./sidebar-backdrop"
export { SidebarChatIcon } from "./sidebar-chat-icon"
export { SidebarChatList } from "./sidebar-chat-list"
export { SidebarFavoriteApps } from "./sidebar-favorite-apps" 