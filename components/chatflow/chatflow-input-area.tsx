"use client"

import React, { useState, useEffect, useCallback } from "react"
import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { useChatWidth } from "@lib/hooks/use-chat-width"
import { FormField } from "@components/workflow/workflow-input-form/form-field"
import { FileUploadField } from "@components/workflow/workflow-input-form/file-upload-field"
import { validateFormData } from "@components/workflow/workflow-input-form/validation"
import type { DifyUserInputFormItem } from "@lib/services/dify/types"
import { Send, RotateCcw, Loader2, Sparkles } from "lucide-react"

interface ChatflowInputAreaProps {
  instanceId: string
  onSubmit: (query: string, inputs: Record<string, any>, files?: any[]) => Promise<void>
  isProcessing?: boolean
  isWaiting?: boolean
  className?: string
  onFormConfigChange?: (hasFormConfig: boolean) => void
}

/**
 * Chatflow 输入区域组件
 * 
 * 功能特点：
 * - 始终包含查询输入框（sys.query）
 * - 根据应用配置显示动态表单字段
 * - 完整的表单验证（必选字段、文件类型等）
 * - 正确构建 chat-messages API payload
 */
export function ChatflowInputArea({
  instanceId,
  onSubmit,
  isProcessing = false,
  isWaiting = false,
  className,
  onFormConfigChange
}: ChatflowInputAreaProps) {
  const { colors, isDark } = useThemeColors()
  const { widthClass, paddingClass } = useChatWidth()
  
  // --- 状态管理 ---
  const [query, setQuery] = useState("")
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [initialFormData, setInitialFormData] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [userInputForm, setUserInputForm] = useState<DifyUserInputFormItem[]>([])
  const [hasFormConfig, setHasFormConfig] = useState(false)

  // --- 初始化应用配置 ---
  useEffect(() => {
    const initializeFormConfig = async () => {
      try {
        setIsLoading(true)
        console.log('[ChatflowInputArea] 开始加载应用配置，instanceId:', instanceId)
        
        // 从数据库获取应用配置
        const { createClient } = await import('@lib/supabase/client')
        const supabase = createClient()
        
        const { data: serviceInstance, error } = await supabase
          .from('service_instances')
          .select('*')
          .eq('instance_id', instanceId)
          .single()
        
        if (error || !serviceInstance) {
          console.warn('[ChatflowInputArea] 未找到服务实例，使用纯查询模式')
          setHasFormConfig(false)
          onFormConfigChange?.(false)
          return
        }
        
        console.log('[ChatflowInputArea] 找到服务实例:', serviceInstance)
        
        // 解析 user_input_form 配置
        const difyParams = serviceInstance.config?.dify_parameters
        const formItems = difyParams?.user_input_form || []
        
        console.log('[ChatflowInputArea] 解析到的 user_input_form:', formItems)
        
        if (Array.isArray(formItems) && formItems.length > 0) {
          setUserInputForm(formItems)
          setHasFormConfig(true)
          onFormConfigChange?.(true)
          
          // 初始化表单默认值
          const initialData: Record<string, any> = {}
          formItems.forEach((formItem: DifyUserInputFormItem) => {
            const fieldType = Object.keys(formItem)[0]
            const fieldConfig = formItem[fieldType as keyof typeof formItem]
            
            if (fieldConfig) {
              if (fieldType === 'file' || fieldType === 'file-list') {
                initialData[fieldConfig.variable] = fieldConfig.default || []
              } else if (fieldType === 'number') {
                const numberConfig = fieldConfig as any
                initialData[fieldConfig.variable] = numberConfig.default !== undefined ? numberConfig.default : ''
              } else {
                initialData[fieldConfig.variable] = fieldConfig.default || ''
              }
            }
          })
          
          setFormData(initialData)
          setInitialFormData(initialData)
        } else {
          setHasFormConfig(false)
          onFormConfigChange?.(false)
        }
        
      } catch (error) {
        console.error('[ChatflowInputArea] 初始化失败:', error)
        setHasFormConfig(false)
        onFormConfigChange?.(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (instanceId) {
      initializeFormConfig()
    }
  }, [instanceId, onFormConfigChange])

  // --- 表单字段更新 ---
  const handleFieldChange = useCallback((variable: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [variable]: value
    }))
    
    // 清除该字段的错误
    if (errors[variable]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[variable]
        return newErrors
      })
    }
  }, [errors])

  // --- 查询输入更新 ---
  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value)
    
    // 清除查询字段的错误
    if (errors.query) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.query
        return newErrors
      })
    }
  }, [errors])

  // --- 表单重置 ---
  const handleReset = useCallback(() => {
    setQuery("")
    setFormData({ ...initialFormData })
    setErrors({})
  }, [initialFormData])

  // --- 表单提交 ---
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isProcessing || isWaiting) return
    
    const newErrors: Record<string, string> = {}
    
    // 验证查询字段（必填）
    if (!query.trim()) {
      newErrors.query = "请输入您的问题或需求"
    }
    
    // 验证表单字段（如果有的话）
    if (hasFormConfig && userInputForm.length > 0) {
      const formValidationErrors = validateFormData(formData, userInputForm)
      Object.assign(newErrors, formValidationErrors)
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // 提取文件
    const files = extractFilesFromFormData(formData)
    
    // 清除错误并提交
    setErrors({})
    
    try {
      await onSubmit(query.trim(), formData, files)
      
      // 提交成功后清空表单
      setQuery("")
      setFormData({ ...initialFormData })
      
    } catch (error) {
      console.error('[ChatflowInputArea] 提交失败:', error)
    }
  }, [query, formData, userInputForm, hasFormConfig, isProcessing, isWaiting, onSubmit, initialFormData])

  // --- 检查是否可以提交 ---
  const canSubmit = useCallback(() => {
    if (!query.trim()) return false
    
    if (hasFormConfig && userInputForm.length > 0) {
      const formValidationErrors = validateFormData(formData, userInputForm)
      return Object.keys(formValidationErrors).length === 0
    }
    
    return true
  }, [query, formData, userInputForm, hasFormConfig])

  // --- 加载状态 ---
  if (isLoading) {
    return (
      <div className={cn(
        "w-full mx-auto",
        widthClass,
        paddingClass,
        "py-8"
      )}>
        <div className="flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className={cn(
              "h-6 w-6 animate-spin mx-auto",
              isDark ? "text-stone-400" : "text-stone-500"
            )} />
            <p className={cn(
              "text-sm font-serif",
              isDark ? "text-stone-400" : "text-stone-500"
            )}>
              正在加载输入配置...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "w-full mx-auto",
      widthClass,
      paddingClass,
      "py-8",
      className
    )}>
      {/* --- 表单标题 --- */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className={cn(
            "h-5 w-5",
            isDark ? "text-stone-400" : "text-stone-500"
          )} />
          <h3 className={cn(
            "text-lg font-semibold font-serif",
            isDark ? "text-stone-200" : "text-stone-800"
          )}>
            {hasFormConfig ? "请填写详细信息" : "开始对话"}
          </h3>
        </div>
        <p className={cn(
          "text-sm font-serif",
          isDark ? "text-stone-400" : "text-stone-600"
        )}>
          {hasFormConfig ? "填写完成后将开始智能对话" : "输入您的问题开始对话"}
        </p>
      </div>

      {/* --- 表单内容 --- */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* --- 查询输入框（必填） --- */}
        <div className={cn(
          "p-4 rounded-xl border transition-colors",
          isDark 
            ? "bg-stone-800/30 border-stone-700" 
            : "bg-stone-50/50 border-stone-200"
        )}>
          <label className={cn(
            "block text-sm font-medium font-serif mb-2",
            isDark ? "text-stone-300" : "text-stone-700"
          )}>
            您的问题或需求 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={query}
            onChange={handleQueryChange}
            placeholder="请描述您的问题或需求..."
            rows={3}
            className={cn(
              "w-full px-3 py-2 rounded-lg border resize-none font-serif",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-colors",
              isDark
                ? "bg-stone-800 border-stone-600 text-stone-200 placeholder-stone-500"
                : "bg-white border-stone-300 text-stone-900 placeholder-stone-400",
              errors.query && "border-red-500 focus:ring-red-500"
            )}
            disabled={isProcessing || isWaiting}
          />
          {errors.query && (
            <p className="mt-1 text-sm text-red-500 font-serif">{errors.query}</p>
          )}
        </div>

        {/* --- 动态表单字段 --- */}
        {hasFormConfig && userInputForm.map((formItem: DifyUserInputFormItem, index: number) => {
          const fieldType = Object.keys(formItem)[0]
          const fieldConfig = formItem[fieldType as keyof typeof formItem]
          
          if (!fieldConfig) return null
          
          // 文件上传字段特殊处理
          if (fieldType === 'file' || fieldType === 'file-list') {
            return (
              <div key={`${fieldConfig.variable}-${index}`} className={cn(
                "p-4 rounded-xl border transition-colors",
                isDark 
                  ? "bg-stone-800/30 border-stone-700" 
                  : "bg-stone-50/50 border-stone-200"
              )}>
                <FileUploadField
                  config={fieldConfig}
                  value={formData[fieldConfig.variable]}
                  onChange={(value) => handleFieldChange(fieldConfig.variable, value)}
                  error={errors[fieldConfig.variable]}
                  label={fieldConfig.label}
                  instanceId={instanceId}
                  isSingleFileMode={fieldType === 'file'}
                />
              </div>
            )
          }
          
          // 其他字段类型
          return (
            <div key={`${fieldConfig.variable}-${index}`} className={cn(
              "p-4 rounded-xl border transition-colors",
              isDark 
                ? "bg-stone-800/30 border-stone-700" 
                : "bg-stone-50/50 border-stone-200"
            )}>
              <FormField
                type={fieldType as 'text-input' | 'number' | 'paragraph' | 'select'}
                config={fieldConfig}
                value={formData[fieldConfig.variable]}
                onChange={(value) => handleFieldChange(fieldConfig.variable, value)}
                error={errors[fieldConfig.variable]}
              />
            </div>
          )
        })}

        {/* --- 表单操作按钮 --- */}
        <div className="flex gap-3 pt-6">
          {/* 重置按钮 */}
          <button
            type="button"
            onClick={handleReset}
            disabled={isProcessing || isWaiting || (!query && Object.values(formData).every(v => !v || (Array.isArray(v) && v.length === 0)))}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-serif transition-all duration-200",
              "border",
              isProcessing || isWaiting || (!query && Object.values(formData).every(v => !v || (Array.isArray(v) && v.length === 0)))
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-md",
              isDark
                ? "border-stone-600 text-stone-300 hover:bg-stone-700/50 hover:text-stone-200"
                : "border-stone-300 text-stone-700 hover:bg-stone-100 hover:text-stone-800"
            )}
          >
            <RotateCcw className="h-4 w-4" />
            重置
          </button>
          
          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isProcessing || isWaiting || !canSubmit()}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl",
              "text-sm font-serif font-medium transition-all duration-200",
              isProcessing || isWaiting || !canSubmit()
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-lg transform hover:scale-[1.02]",
              isDark
                ? "bg-stone-700 hover:bg-stone-600 text-stone-100"
                : "bg-stone-800 hover:bg-stone-700 text-white"
            )}
          >
            {isProcessing || isWaiting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                发送中...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                开始对话
              </>
            )}
          </button>
        </div>

        {/* --- 表单提示 --- */}
        {Object.keys(errors).length > 0 && (
          <div className={cn(
            "p-3 rounded-lg border-l-4 border-red-500",
            isDark ? "bg-red-900/20 text-red-200" : "bg-red-50 text-red-800"
          )}>
            <p className="text-sm font-serif">
              请检查并修正表单中的错误
            </p>
          </div>
        )}
      </form>
    </div>
  )
}

/**
 * 从表单数据中提取文件
 */
function extractFilesFromFormData(formData: Record<string, any>): any[] {
  const files: any[] = []
  
  Object.values(formData).forEach(value => {
    if (Array.isArray(value)) {
      // 检查是否是文件数组
      value.forEach(item => {
        if (item && typeof item === 'object' && (item.file || item.upload_file_id)) {
          files.push(item)
        }
      })
    } else if (value && typeof value === 'object' && (value.file || value.upload_file_id)) {
      // 单个文件对象
      files.push(value)
    }
  })
  
  return files
} 