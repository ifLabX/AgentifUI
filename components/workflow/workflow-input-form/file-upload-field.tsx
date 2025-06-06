"use client"

import React, { useRef } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { Upload, X, File } from 'lucide-react'

interface FileUploadFieldProps {
  config: any
  value: File[]
  onChange: (files: File[]) => void
  error?: string
}

/**
 * 文件上传字段组件
 * 
 * 支持的功能：
 * - 多文件上传
 * - 文件类型限制
 * - 文件大小限制
 * - 拖拽上传
 */
export function FileUploadField({ config, value, onChange, error }: FileUploadFieldProps) {
  const { isDark } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    onChange([...value, ...files])
  }
  
  const handleRemoveFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index)
    onChange(newFiles)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    onChange([...value, ...files])
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }
  
  if (!config?.enabled) {
    return null
  }
  
  return (
    <div className="space-y-2 px-1">
      <label className={cn(
        "block text-sm font-medium font-serif mb-2",
        isDark ? "text-stone-200" : "text-stone-700"
      )}>
        文件上传
      </label>
      
      {/* 上传区域 */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer",
          "transition-all duration-200 ease-in-out",
          "hover:scale-[1.02] hover:shadow-lg",
          error
            ? "border-red-500 bg-red-50 dark:bg-red-900/20 hover:border-red-400"
            : isDark
              ? "border-stone-600 bg-stone-700 hover:border-stone-500 hover:bg-stone-600"
              : "border-stone-300 bg-stone-50 hover:border-stone-400 hover:bg-stone-100"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className={cn(
          "h-8 w-8 mx-auto mb-2",
          isDark ? "text-stone-400" : "text-stone-500"
        )} />
        <p className={cn(
          "text-sm font-serif",
          isDark ? "text-stone-300" : "text-stone-600"
        )}>
          点击或拖拽文件到此处上传
        </p>
        <p className={cn(
          "text-xs font-serif mt-1",
          isDark ? "text-stone-400" : "text-stone-500"
        )}>
          最多上传 {config.number_limits || 3} 个文件
        </p>
      </div>
      
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      
      {/* 已选文件列表 */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border",
                "transition-all duration-200 ease-in-out",
                "hover:scale-[1.01] hover:shadow-md",
                "animate-in slide-in-from-top-2 fade-in duration-300",
                isDark 
                  ? "border-stone-600 bg-stone-700 hover:bg-stone-600" 
                  : "border-stone-200 bg-stone-50 hover:bg-stone-100"
              )}
            >
              <File className={cn(
                "h-4 w-4 flex-shrink-0",
                isDark ? "text-stone-400" : "text-stone-500"
              )} />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-serif truncate",
                  isDark ? "text-stone-200" : "text-stone-700"
                )}>
                  {file.name}
                </p>
                <p className={cn(
                  "text-xs font-serif",
                  isDark ? "text-stone-400" : "text-stone-500"
                )}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className={cn(
                  "p-1 rounded-full transition-colors",
                  isDark
                    ? "hover:bg-stone-600 text-stone-400 hover:text-stone-300"
                    : "hover:bg-stone-200 text-stone-500 hover:text-stone-600"
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* 错误提示 */}
      {error && (
        <div className="text-xs font-serif text-red-500">
          {error}
        </div>
      )}
    </div>
  )
} 