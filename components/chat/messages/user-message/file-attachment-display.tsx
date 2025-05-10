"use client"

import React from "react"
import { cn, formatBytes } from "@lib/utils"
import { useTheme } from "@lib/hooks"
import { FileTextIcon, FileImageIcon, FileArchiveIcon, FileMusicIcon, FileVideoIcon, FileIcon } from "lucide-react"
import { useFilePreviewStore } from "@lib/stores/ui/file-preview-store"
import type { MessageAttachment } from '@lib/stores/chat-store'
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { useMobile } from "@lib/hooks/use-mobile"

interface FileAttachmentDisplayProps {
  attachments: MessageAttachment[]
  isDark?: boolean
  className?: string
}

// 根据MIME类型获取相应图标
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return FileImageIcon
  if (mimeType.startsWith('audio/')) return FileMusicIcon
  if (mimeType.startsWith('video/')) return FileVideoIcon
  if (mimeType === 'application/pdf' || 
      mimeType.includes('word') || 
      mimeType.includes('excel') || 
      mimeType.includes('csv') || 
      mimeType.includes('text')) return FileTextIcon
  if (mimeType.includes('zip') || 
      mimeType.includes('rar') || 
      mimeType.includes('tar') || 
      mimeType.includes('7z') || 
      mimeType.includes('gzip')) return FileArchiveIcon
  return FileIcon
}

export const FileAttachmentDisplay: React.FC<FileAttachmentDisplayProps> = ({ 
  attachments, 
  isDark = false, 
  className
}) => {
  const openPreview = useFilePreviewStore((state) => state.openPreview);
  const isMobile = useMobile();

  if (!attachments || attachments.length === 0) return null

  const handleAttachmentClick = (attachment: MessageAttachment) => {
    const sidebarState = useSidebarStore.getState();

    if (isMobile) {
      if (sidebarState.isMobileNavVisible) {
        sidebarState.hideMobileNav();
      }
    } else {
      if (sidebarState.isExpanded) {
        sidebarState.toggleSidebar();
      }
    }
    openPreview(attachment);
  }

  return (
    <div
      className={cn(
        "w-full flex flex-wrap gap-2 px-2 pt-2 pb-1 justify-end",
        className
      )}
      style={{
        maxWidth: '100%',
        minHeight: '0',
        marginRight: 0
      }}
    >
      {attachments.map(attachment => {
        const IconComponent = getFileIcon(attachment.type)
        return (
          <button
            key={attachment.id}
            onClick={() => handleAttachmentClick(attachment)}
            className={cn(
              "relative pl-2 pr-1 py-1 rounded-md flex items-center gap-2 flex-shrink basis-[calc((100%-1rem)/3)] max-w-[180px] sm:max-w-[200px]",
              "text-left",
              isDark
                ? "bg-gray-700/90 border border-gray-600/80 hover:bg-gray-600/90"
                : "bg-gray-200 border border-gray-400 hover:bg-gray-300"
            )}
            title={`预览 ${attachment.name}`}
            aria-label={`预览文件 ${attachment.name}`}
          >
            <div className={cn(
              "flex-shrink-0 w-5 h-5 flex items-center justify-center relative",
              isDark ? "text-gray-200" : "text-gray-700"
            )}>
              <IconComponent className="w-4 h-4" />
            </div>
            <div className="flex-grow min-w-0">
              <p className={cn(
                "text-sm font-medium truncate",
                isDark ? "text-gray-100" : "text-gray-900"
              )}>{attachment.name}</p>
              <p className={cn(
                "text-xs",
                "whitespace-nowrap",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>{formatBytes(attachment.size)}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}