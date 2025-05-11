"use client"

import React from "react"
import { cn, formatBytes } from "@lib/utils"
import { AttachmentFile, useAttachmentStore } from "@lib/stores/attachment-store"
import { XIcon, FileTextIcon, CheckCircle2Icon, RotateCcw } from "lucide-react"
import { TooltipWrapper } from "@components/ui/tooltip-wrapper"
import { Spinner } from "@components/ui/spinner"

/**
 * 单个附件预览项的 Props 定义
 * 使用石色(stone)调色板，与应用整体风格一致
 */
interface AttachmentPreviewItemProps {
  attachment: AttachmentFile
  isDark?: boolean
  onRetry: (id: string) => void
}

/**
 * 圆形进度条组件 (无文字)
 * 使用石色(stone)调色板，与应用整体风格一致
 */
const CircularProgress: React.FC<{ progress: number; size?: number; strokeWidth?: number; isDark?: boolean }> = ({ progress, size = 20, strokeWidth = 2, isDark = false }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  // 确保进度在 0-100 之间，防止 offset 计算错误
  const safeProgress = Math.max(0, Math.min(100, progress));
  const offset = circumference - (safeProgress / 100) * circumference

  return (
    <svg width={size} height={size} className="absolute inset-0 m-auto transform -rotate-90">
      {/* 背景圆环 */}
      <circle
        className={cn(
          isDark ? "text-stone-600" : "text-stone-300" // 石色背景环
        )}
        strokeWidth={strokeWidth}
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      {/* 进度圆环 */}
      <circle
        className={cn(
          "transition-all duration-300 ease-linear",
          isDark ? "text-stone-300" : "text-stone-700" // 石色进度环
        )}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  )
}

/**
 * 单个附件预览项组件 (简约风格)
 * 使用石色(stone)调色板，与应用整体风格一致
 */
export const AttachmentPreviewItem: React.FC<AttachmentPreviewItemProps> = ({ attachment, isDark = false, onRetry }) => {
  const removeFile = useAttachmentStore((state) => state.removeFile)

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeFile(attachment.id)
  }

  const handleRetryClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRetry(attachment.id)
  }

  const StatusIcon = () => {
    switch (attachment.status) {
      case 'uploading':
        return <Spinner size="sm" />
      case 'success':
        return <CheckCircle2Icon className={cn("w-4 h-4", isDark ? "text-stone-400" : "text-stone-500")} />
      case 'error':
        return (
          <TooltipWrapper content="重新上传" placement="top" id={`retry-att-${attachment.id}`}>
            <button 
              type="button"
              onClick={handleRetryClick}
              className={cn(
                "w-full h-full flex items-center justify-center rounded-full",
                isDark 
                  ? "text-stone-400 hover:bg-stone-800/50" 
                  : "text-stone-500 hover:bg-stone-100/50",
                "focus:outline-none",
                "transition-colors duration-150"
              )}
              aria-label="重试上传"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </TooltipWrapper>
        )
      case 'pending':
      default:
        return <FileTextIcon className={cn("w-4 h-4", isDark ? "text-stone-400" : "text-stone-500")} />
    }
  }

  return (
    <div
      className={cn(
        "relative pl-2 pr-1 py-1 rounded-md flex items-center gap-2",
        "flex-shrink basis-[calc((100%-1.5rem)/3)] sm:basis-[calc((100%-1rem)/2)]",
        "max-w-[180px] sm:max-w-[200px]",
        isDark 
          ? "bg-stone-800/90 border border-stone-700/80" 
          : "bg-stone-100 border border-stone-200",
        attachment.status === 'error' && (isDark ? "border-red-500/30" : "border-red-400/30")
      )}
      title={attachment.error ? `错误: ${attachment.error}` : attachment.name}
    >
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center relative">
        <StatusIcon />
      </div>

      <div className="flex-grow min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            isDark ? "text-stone-100" : "text-stone-900",
          )}
        >
          {attachment.name}
        </p>
        <p
          className={cn(
            "text-xs",
            isDark ? "text-stone-400" : "text-stone-500",
          )}
        >
          {formatBytes(attachment.size)}
        </p>
      </div>

      <TooltipWrapper content="移除附件" placement="top" id={`remove-att-${attachment.id}`}>
        <button
          type="button"
          onClick={handleRemove}
          className={cn(
            "ml-auto flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors",
            isDark 
              ? "bg-stone-700/80 hover:bg-stone-600/80 text-stone-300 hover:text-white" 
              : "bg-stone-300/50 hover:bg-stone-400/70 text-stone-600 hover:text-black",
          )}
          aria-label="移除附件"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </TooltipWrapper>
    </div>
  )
}