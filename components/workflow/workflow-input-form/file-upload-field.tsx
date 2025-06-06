"use client"

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { useSupabaseAuth } from "@lib/supabase/hooks"
import { useCurrentApp } from '@lib/hooks/use-current-app'
import { cn, formatBytes } from '@lib/utils'
import { Upload, X, File, CheckCircle2Icon, RotateCcw, AlertCircle } from 'lucide-react'
import { Spinner } from "@components/ui/spinner"
import { TooltipWrapper } from "@components/ui/tooltip-wrapper"
import { uploadDifyFile } from "@lib/services/dify/file-service"
import type { DifyFileUploadResponse } from "@lib/services/dify/types"

// --- BEGIN COMMENT ---
// 定义上传文件的状态接口，与聊天输入组件保持一致
// --- END COMMENT ---
interface UploadFile {
  id: string // 本地生成的唯一ID
  file: File // 原始 File 对象
  name: string // 文件名
  size: number // 文件大小
  type: string // 文件类型 (MIME type)
  status: "pending" | "uploading" | "success" | "error" // 上传状态
  progress: number // 上传进度 (0-100)
  error?: string // 错误信息
  uploadedId?: string // 上传成功后 Dify 返回的文件 ID
}

interface FileUploadFieldProps {
  config: any
  value: any[] | any // 支持单文件对象或文件数组
  onChange: (files: any[] | any) => void // 返回Dify格式的文件对象或数组
  error?: string
  label?: string
  instanceId: string // 添加instanceId用于Dify API调用
  isSingleFileMode?: boolean // 是否为单文件模式
}

/**
 * 工作流文件上传字段组件 - 集成Dify文件上传API
 * 
 * 功能特点：
 * - 集成Dify文件上传API
 * - 实时上传进度显示
 * - 支持重试上传
 * - 文件状态管理
 * - 与聊天输入组件的文件上传功能保持一致
 */
export function FileUploadField({ config, value, onChange, error, label, instanceId, isSingleFileMode = false }: FileUploadFieldProps) {
  const { isDark } = useTheme()
  const { session } = useSupabaseAuth()
  const { currentAppId } = useCurrentApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // --- BEGIN COMMENT ---
  // 本地文件状态管理，用于跟踪上传状态
  // --- END COMMENT ---
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  
  // --- BEGIN COMMENT ---
  // 当外部value prop发生变化时，重置uploadFiles状态
  // 但只在初次渲染时执行，避免与内部状态管理冲突
  // --- END COMMENT ---
  const isInitializedRef = useRef(false)
  
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true
      
      if (value) {
        // 处理单文件对象的情况
        const valueArray = Array.isArray(value) ? value : [value]
        
        if (valueArray.length > 0) {
          // 检查value是否已经是处理过的Dify文件格式
          const isProcessedFiles = valueArray.every((item: any) => 
            typeof item === 'object' && item.upload_file_id
          )
        
          if (!isProcessedFiles) {
            // 如果是原始File对象数组，转换为UploadFile格式
            const convertedFiles = valueArray.map((file: File) => ({
              id: `${file.name}-${file.lastModified}-${file.size}`,
              file,
              name: file.name,
              size: file.size,
              type: file.type,
              status: "pending" as const,
              progress: 0
            }))
            setUploadFiles(convertedFiles)
          }
        } else {
          setUploadFiles([])
        }
      } else {
        setUploadFiles([])
      }
    }
  }, [value])
  
  // --- BEGIN COMMENT ---
  // 用ref跟踪上次的成功文件ID列表，避免无限循环
  // --- END COMMENT ---
  const lastSuccessIdsRef = useRef('')
  
  // --- BEGIN COMMENT ---
  // 当uploadFiles状态变化时，通知父组件
  // 根据number_limits决定返回单个文件对象还是文件数组
  // --- END COMMENT ---
  useEffect(() => {
    const successfulFiles = uploadFiles
      .filter(file => file.status === 'success' && file.uploadedId)
      .map(file => ({
        type: getDifyFileType(file),
        transfer_method: 'local_file' as const,
        upload_file_id: file.uploadedId as string,
      }))
    
    // 只有在成功文件列表实际发生变化时才调用onChange
    const currentSuccessIds = successfulFiles.map(f => f.upload_file_id).sort().join(',')
    
    if (lastSuccessIdsRef.current !== currentSuccessIds) {
      lastSuccessIdsRef.current = currentSuccessIds
      
      // --- BEGIN COMMENT ---
      // 根据isSingleFileMode判断是单文件还是多文件
      // --- END COMMENT ---
      console.log(`[工作流文件上传] isSingleFileMode: ${isSingleFileMode}, 成功文件数: ${successfulFiles.length}`)
      
      if (isSingleFileMode) {
        // 单文件模式：返回第一个文件对象或null
        const singleFile = successfulFiles.length > 0 ? successfulFiles[0] : null
        onChange(singleFile)
        console.log('[工作流文件上传] 单文件模式，文件数据已更新:', singleFile)
      } else {
        // 多文件模式：返回文件数组
        onChange(successfulFiles)
        console.log('[工作流文件上传] 多文件模式，文件数据已更新:', successfulFiles)
      }
    }
  }, [uploadFiles, isSingleFileMode]) // 添加isSingleFileMode依赖
  
  // --- BEGIN COMMENT ---
  // 根据文件类型推断 Dify 文件 type 字段
  // --- END COMMENT ---
  const getDifyFileType = (file: UploadFile): 'image' | 'document' | 'audio' | 'video' | 'custom' => {
    const mime = file.type.toLowerCase()
    if (mime.startsWith('image/')) return 'image'
    if (mime.startsWith('audio/')) return 'audio'
    if (mime.startsWith('video/')) return 'video'
    if (mime === 'application/pdf' || mime.includes('word') || mime.includes('excel') || mime.includes('csv') || mime.includes('text') || mime.includes('html') || mime.includes('xml') || mime.includes('epub') || mime.includes('powerpoint')) return 'document'
    return 'custom'
  }
  
  // --- BEGIN COMMENT ---
  // 更新文件状态的辅助函数
  // --- END COMMENT ---
  const updateFileStatus = useCallback((id: string, status: UploadFile["status"], progress?: number, error?: string, uploadedId?: string) => {
    setUploadFiles(prev => prev.map(file => 
      file.id === id ? {
        ...file,
        status,
        progress: progress ?? file.progress,
        error: status === 'error' ? error : undefined,
        uploadedId: status === 'success' ? uploadedId : file.uploadedId
      } : file
    ))
  }, [])
  
  // --- BEGIN COMMENT ---
  // 上传单个文件到Dify - 使用当前应用ID，与聊天输入框保持一致
  // --- END COMMENT ---
  const uploadFileToDify = useCallback(async (uploadFile: UploadFile) => {
    const userIdToUse = session?.user?.id || 'workflow-user-id'
    
    try {
      updateFileStatus(uploadFile.id, 'uploading', 0)
      
      // --- BEGIN COMMENT ---
      // 使用当前应用ID，如果没有则fallback到instanceId
      // 与聊天输入框的逻辑保持一致
      // --- END COMMENT ---
      const appIdToUse = currentAppId || instanceId
      console.log(`[工作流文件上传] 使用应用ID: ${appIdToUse} (currentAppId: ${currentAppId}, instanceId: ${instanceId})`)
      
      const response = await uploadDifyFile(
        appIdToUse,
        uploadFile.file,
        userIdToUse,
        (progress) => {
          updateFileStatus(uploadFile.id, 'uploading', progress)
        }
      )
      
      updateFileStatus(uploadFile.id, 'success', 100, undefined, response.id)
      console.log(`[工作流文件上传] 上传成功: ${uploadFile.name} -> ${response.id}`)
      
    } catch (error) {
      const errorMessage = (error as Error).message || '上传失败'
      updateFileStatus(uploadFile.id, 'error', undefined, errorMessage)
      console.error(`[工作流文件上传] 上传失败: ${uploadFile.name}`, error)
    }
  }, [currentAppId, instanceId, session?.user?.id, updateFileStatus])
  
  // --- BEGIN COMMENT ---
  // 处理文件选择
  // --- END COMMENT ---
  const handleFileSelect = useCallback((newFiles: File[]) => {
    const newUploadFiles = newFiles.map(file => {
      const uploadFile: UploadFile = {
        id: `${file.name}-${file.lastModified}-${file.size}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "pending",
        progress: 0
      }
      
      // 立即开始上传
      setTimeout(() => uploadFileToDify(uploadFile), 100)
      
      return uploadFile
    })
    
    setUploadFiles(prev => [...prev, ...newUploadFiles])
  }, [uploadFileToDify])
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files)
      // 重置输入框
      e.target.value = ''
    }
  }
  
  const handleRemoveFile = (id: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== id))
  }
  
  // --- BEGIN COMMENT ---
  // 重试上传
  // --- END COMMENT ---
  const handleRetryUpload = useCallback((id: string) => {
    const uploadFile = uploadFiles.find(file => file.id === id)
    if (uploadFile && uploadFile.status === 'error') {
      uploadFileToDify(uploadFile)
    }
  }, [uploadFiles, uploadFileToDify])
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }
  
  if (!config?.enabled) {
    return null
  }
  
  // --- BEGIN COMMENT ---
  // 计算状态统计
  // --- END COMMENT ---
  const isUploading = uploadFiles.some(f => f.status === 'uploading')
  const hasError = uploadFiles.some(f => f.status === 'error')
  const successCount = uploadFiles.filter(f => f.status === 'success').length
  // --- BEGIN COMMENT ---
  // 根据isSingleFileMode和配置确定最大文件数
  // file-list类型使用max_length字段，file类型使用number_limits字段
  // --- END COMMENT ---
  const maxFiles = isSingleFileMode ? 1 : (config.max_length || config.number_limits || 1)
  const canUploadMore = uploadFiles.length < maxFiles
  
  // --- BEGIN COMMENT ---
  // 根据Dify文件类型标识符生成文件类型提示和accept字符串
  // 参考file-type-selector.tsx的逻辑
  // --- END COMMENT ---
  const getFileTypeInfo = () => {
    const types = config.allowed_file_types
    if (!types || types.length === 0) {
      return {
        hint: '支持上传各种文件类型',
        accept: undefined
      }
    }
    
    const typeMap: Record<string, { name: string; accept: string }> = {
      'image': { 
        name: '图片', 
        accept: 'image/*,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp,.ico,.tiff,.tif'
      },
      'document': { 
        name: '文档', 
        accept: "txt,md,mdx,markdown,pdf,html,xlsx,xls,doc,docx,csv,eml,msg,pptx,ppt,xml,epub"
      },
      'audio': { 
        name: '音频', 
        accept: 'audio/*,.mp3,.wav,.flac,.aac,.ogg,.wma,.m4a,.opus'
      },
      'video': { 
        name: '视频', 
        accept: 'video/*,.mp4,.avi,.mkv,.mov,.wmv,.flv,.webm,.m4v,.3gp'
      },
      'custom': { name: '其他文件', accept: '*/*' }
    }
    
    const supportedTypes = types.map((type: string) => typeMap[type]?.name || type).filter(Boolean)
    const acceptStrings = types.map((type: string) => typeMap[type]?.accept).filter(Boolean)
    
    return {
      hint: supportedTypes.length > 0 ? `支持上传：${supportedTypes.join('、')}` : '支持上传各种文件类型',
      accept: acceptStrings.length > 0 ? acceptStrings.join(',') : undefined
    }
  }
  
  const fileTypeInfo = getFileTypeInfo()
  
  // 生成文件大小提示文本
  const getFileSizeHint = () => {
    const maxSize = config.max_file_size_mb
    if (maxSize) {
      return `单个文件最大 ${maxSize}MB`
    }
    return ''
  }
  
  return (
    <div className="space-y-2 px-1">
      {/* 标签 */}
      {label && (
        <label className={cn(
          "block text-sm font-medium font-serif mb-2",
          isDark ? "text-stone-200" : "text-stone-700"
        )}>
          {label}
          {successCount > 0 && (
            <span className={cn(
              "ml-2 text-xs",
              isDark ? "text-stone-400" : "text-stone-500"
            )}>
              ({successCount}/{maxFiles} 已上传)
            </span>
          )}
        </label>
      )}
      
      {/* 上传区域 */}
      {canUploadMore && (
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
                : "border-stone-300 bg-stone-50 hover:border-stone-400 hover:bg-stone-100",
            isUploading && "opacity-75 cursor-not-allowed"
          )}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <Upload className={cn(
            "h-8 w-8 mx-auto mb-2",
            isDark ? "text-stone-400" : "text-stone-500"
          )} />
          <p className={cn(
            "text-sm font-serif",
            isDark ? "text-stone-300" : "text-stone-600"
          )}>
            {isUploading ? "正在上传..." : "点击或拖拽文件到此处上传"}
          </p>
          <div className={cn(
            "text-xs font-serif mt-2 space-y-1",
            isDark ? "text-stone-400" : "text-stone-500"
          )}>
            <p>最多上传 {maxFiles} 个文件 (剩余 {maxFiles - uploadFiles.length} 个)</p>
            <p>{fileTypeInfo.hint}</p>
            {getFileSizeHint() && <p>{getFileSizeHint()}</p>}
          </div>
        </div>
      )}
      
      {/* 超出限制提示 */}
      {uploadFiles.length >= maxFiles && (
        <div className={cn(
          "px-3 py-2 rounded-lg text-sm font-serif border",
          isDark 
            ? "bg-orange-900/30 border-orange-500/30 text-orange-300" 
            : "bg-orange-100 border-orange-300 text-orange-700"
        )}>
          已达到最大文件数量限制 ({uploadFiles.length}/{maxFiles})
        </div>
      )}
      
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={fileTypeInfo.accept}
        className="hidden"
        onChange={handleFileInputChange}
        disabled={isUploading || !canUploadMore}
      />
      
      {/* 已选文件列表 */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          {uploadFiles.map((uploadFile) => (
            <div
              key={uploadFile.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border relative",
                "transition-all duration-200 ease-in-out",
                "animate-in slide-in-from-top-2 fade-in duration-300",
                isDark 
                  ? "border-stone-600 bg-stone-700" 
                  : "border-stone-200 bg-stone-50",
                uploadFile.status === 'error' && (isDark ? "border-red-500/30" : "border-red-400/30")
              )}
            >
              {/* 状态图标 */}
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center relative">
                {uploadFile.status === 'uploading' && <Spinner size="sm" />}
                {uploadFile.status === 'success' && (
                  <CheckCircle2Icon className={cn("w-4 h-4", isDark ? "text-green-400" : "text-green-500")} />
                )}
                {uploadFile.status === 'error' && (
                  <TooltipWrapper content="重新上传" placement="top" id={`retry-${uploadFile.id}`}>
                    <button 
                      type="button"
                      onClick={() => handleRetryUpload(uploadFile.id)}
                      className={cn(
                        "w-full h-full flex items-center justify-center rounded-full",
                        "text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20",
                        "focus:outline-none transition-colors duration-150"
                      )}
                      aria-label="重试上传"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </TooltipWrapper>
                )}
                {uploadFile.status === 'pending' && (
                  <File className={cn("w-4 h-4", isDark ? "text-stone-400" : "text-stone-500")} />
                )}
              </div>
              
              {/* 文件信息 */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-serif truncate",
                  isDark ? "text-stone-200" : "text-stone-700"
                )}>
                  {uploadFile.name}
                </p>
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-xs font-serif",
                    isDark ? "text-stone-400" : "text-stone-500"
                  )}>
                    {formatBytes(uploadFile.size)}
                  </p>
                  {uploadFile.status === 'uploading' && (
                    <span className={cn(
                      "text-xs font-serif",
                      isDark ? "text-stone-400" : "text-stone-500"
                    )}>
                      {uploadFile.progress}%
                    </span>
                  )}
                  {uploadFile.status === 'error' && uploadFile.error && (
                    <span className="text-xs font-serif text-red-500">
                      {uploadFile.error}
                    </span>
                  )}
                </div>
              </div>
              
              {/* 删除按钮 */}
              <TooltipWrapper content="移除文件" placement="top" id={`remove-${uploadFile.id}`}>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(uploadFile.id)}
                  className={cn(
                    "p-1 rounded-full transition-colors",
                    isDark
                      ? "hover:bg-stone-600 text-stone-400 hover:text-stone-300"
                      : "hover:bg-stone-200 text-stone-500 hover:text-stone-600"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </TooltipWrapper>
              
              {/* 上传进度条 */}
              {uploadFile.status === 'uploading' && (
                <div className={cn(
                  "absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300 rounded-b-lg",
                )} style={{ width: `${uploadFile.progress}%` }} />
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 text-xs font-serif text-red-500">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      
      {/* 上传状态提示 */}
      {hasError && (
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-serif",
          isDark 
            ? "bg-red-900/30 border border-red-500/30 text-red-300" 
            : "bg-red-100 border border-red-300 text-red-700"
        )}>
          <AlertCircle className="h-4 w-4" />
          部分文件上传失败，请点击重试按钮重新上传
        </div>
      )}
    </div>
  )
} 