"use client"

import { useState, useCallback } from "react"
import { Paperclip, Loader2 } from "lucide-react"
import { Popover, PopoverItem } from "@components/ui/popover"
import { TooltipWrapper } from "@components/ui/tooltip-wrapper"
import { hideActiveTooltip } from "@components/ui/tooltip"
import { useFileTypes } from "@lib/hooks/use-file-types"
import { useTheme } from "@lib/hooks/use-theme"
import { useMobile } from "@lib/hooks/use-mobile"
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
  const { fileTypes, isLoading, error } = useFileTypes()
  const { isDark } = useTheme()
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(false)
  
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
      content={
        <>
          添加附件
        </>
      }
      id="file-type-selector-tooltip"
      placement="top" 
    >
      <ChatButton
        icon={<Paperclip className="h-4 w-4" />}
        isDark={isDark}
        ariaLabel={ariaLabel}
        disabled={disabled}
        className={className}
      />
    </TooltipWrapper>
  )
  
  return (
    <Popover
      trigger={triggerButton}
      placement="top"
      isOpen={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (open) {
          hideActiveTooltip();
        }
      }}
      minWidth={180}
      offsetX={isMobile ? undefined : 108} // 在移动设备上使用默认值，桌面设备上使用自定义值
      offsetY={isMobile ? undefined : 42} // 在移动设备上使用默认值，桌面设备上微调垂直位置
    >
      <div className="px-1 py-1">
        {isLoading ? (
          <div className={cn(
            "flex items-center justify-center py-4",
            isDark ? "text-gray-400" : "text-gray-500"
          )}>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>加载中...</span>
          </div>
        ) : error ? (
          <div className={cn(
            "px-3 py-2 text-sm",
            isDark ? "text-red-300" : "text-red-500"
          )}>
            加载文件类型失败
          </div>
        ) : (
          fileTypes.map((type) => (
            <PopoverItem
              key={type.title}
              icon={type.icon}
              onClick={() => handleFileTypeSelect(type.acceptString)}
            >
              {type.title}
            </PopoverItem>
          ))
        )}
      </div>
    </Popover>
  )
} 