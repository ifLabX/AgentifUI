"use client"

import { useState, useCallback } from "react"
import { Paperclip, Loader2 } from "lucide-react"
import { Popover, PopoverItem } from "@components/ui/popover"
import { TooltipWrapper } from "@components/ui/tooltip-wrapper"
import { hideActiveTooltip } from "@components/ui/tooltip"
import { useFileTypes } from "@lib/hooks/use-file-types"
import { useTheme } from "@lib/hooks/use-theme"
import { useMobile } from "@lib/hooks/use-mobile"
import { useAttachmentStore } from "@lib/stores/attachment-store"
import { ChatButton } from "./button"
import { cn } from "@lib/utils"

// 定义文件选择回调类型
export type FileSelectCallback = (files: FileList | null, accept: string) => void

interface FileTypeSelectorProps {
  onFileSelect: FileSelectCallback
  disabled?: boolean
  ariaLabel?: string
  className?: string
}

export const FileTypeSelector = ({
  onFileSelect,
  disabled = false,
  ariaLabel = "添加附件",
  className
}: FileTypeSelectorProps) => {
  const { fileTypes, uploadConfig, isLoading, error } = useFileTypes()
  const { isDark } = useTheme()
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(false)
  const attachmentFiles = useAttachmentStore((state) => state.files)
  
  // --- BEGIN COMMENT ---
  // 检查是否可以上传文件的逻辑
  // 考虑管理界面配置和当前已上传文件数量
  // --- END COMMENT ---
  const canUpload = uploadConfig.enabled && uploadConfig.maxFiles > 0
  const hasReachedLimit = attachmentFiles.length >= uploadConfig.maxFiles
  const isDisabled = disabled || !canUpload || hasReachedLimit
  
  // 生成tooltip内容
  const getTooltipContent = () => {
    if (!uploadConfig.enabled) {
      return "该应用不支持上传文件"
    }
    if (uploadConfig.maxFiles === 0) {
      return "文件上传数量限制为0"
    }
    if (!uploadConfig.hasFileTypes) {
      return "未配置支持的文件类型"
    }
    if (hasReachedLimit) {
      return `已达到最大文件数量限制 (${uploadConfig.maxFiles})`
    }
    return `添加附件 (${attachmentFiles.length}/${uploadConfig.maxFiles})`
  }
  
  // 创建文件输入引用回调
  const fileInputCallback = useCallback((fileInput: HTMLInputElement | null, accept: string) => {
    if (fileInput) {
      // 设置接受的文件类型
      fileInput.accept = accept
      // 触发文件选择对话框
      fileInput.click()
      // 监听文件选择完成事件
      const handleChange = () => {
        onFileSelect(fileInput.files, accept)
        // 重置输入框，允许选择相同文件
        fileInput.value = ""
        // 移除事件监听器
        fileInput.removeEventListener("change", handleChange)
      }
      fileInput.addEventListener("change", handleChange)
    }
  }, [onFileSelect])
  
  // 处理文件类型选择
  const handleFileTypeSelect = (accept: string) => {
    // 再次检查是否可以上传
    if (isDisabled) {
      return
    }
    
    // 创建临时文件输入框
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.multiple = true // 允许多选
    
    // 使用回调处理文件选择
    fileInputCallback(fileInput, accept)
    
    // 关闭弹出框
    setIsOpen(false)
  }
  
  // 创建触发器按钮，并用 Tooltip 包裹
  const triggerButton = (
    <TooltipWrapper 
      content={getTooltipContent()}
      id="file-type-selector-tooltip"
      placement="top" 
    >
      <ChatButton
        icon={
          !canUpload ? (
            <Paperclip className="h-4 w-4" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )
        }
        isDark={isDark}
        ariaLabel={ariaLabel}
        disabled={isDisabled}
        className={cn(
          className,
          !canUpload && "opacity-50",
          hasReachedLimit && "opacity-75"
        )}
      />
    </TooltipWrapper>
  )
  
  // 如果配置不允许上传，直接返回禁用按钮
  if (!canUpload) {
    return triggerButton
  }
  
  return (
    <Popover
      trigger={triggerButton}
      placement="top"
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (isDisabled) {
          return
        }
        setIsOpen(open)
        if (open) {
          hideActiveTooltip();
        }
      }}
      minWidth={170} // 减小宽度从180到160
      offsetX={isMobile ? undefined : 105} // 相应调整偏移量
      offsetY={isMobile ? undefined : 42}
    >
      <div className="px-1 py-1">
        {isLoading ? (
          <div className={cn(
            "flex items-center justify-center py-4 font-serif",
            isDark ? "text-gray-400" : "text-gray-500"
          )}>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>加载中...</span>
          </div>
        ) : error ? (
          <div className={cn(
            "px-3 py-2 text-sm font-serif",
            isDark ? "text-red-300" : "text-red-500"
          )}>
            加载文件类型失败
          </div>
        ) : fileTypes.length === 0 ? (
          <div className={cn(
            "px-3 py-2 text-sm font-serif text-center",
            isDark ? "text-gray-400" : "text-gray-500"
          )}>
            未配置文件类型
          </div>
        ) : (
          <>
            {/* --- BEGIN COMMENT ---
            // 显示上传配置信息
            // --- END COMMENT --- */}
            <div className={cn(
              "px-3 py-1 text-xs font-serif border-b mb-1",
              isDark ? "text-gray-400 border-gray-600" : "text-gray-500 border-gray-200"
            )}>
              {uploadConfig.maxFiles > 0 ? (
                <>最多上传 {uploadConfig.maxFiles} 个文件</>
              ) : (
                <>无上传限制</>
              )}
              {hasReachedLimit && (
                <div className={cn(
                  "text-xs mt-1",
                  isDark ? "text-orange-400" : "text-orange-600"
                )}>
                  已达上限 ({attachmentFiles.length}/{uploadConfig.maxFiles})
                </div>
              )}
            </div>
            
            {fileTypes.map((type) => (
              <PopoverItem
                key={type.title}
                icon={type.icon}
                onClick={() => handleFileTypeSelect(type.acceptString)}
                disabled={hasReachedLimit}
                className={cn(
                  hasReachedLimit && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex flex-col">
                  <span>{type.title}</span>
                  <span className={cn(
                    "text-xs font-serif",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}>
                    {type.maxSize}
                  </span>
                </div>
              </PopoverItem>
            ))}
          </>
        )}
      </div>
    </Popover>
  )
} 