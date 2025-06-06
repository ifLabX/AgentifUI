"use client"

import React, { useState, useEffect } from 'react'
import { useCurrentApp } from '@lib/hooks/use-current-app'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { FormField } from './form-field'
import { FileUploadField } from './file-upload-field'
import { validateFormData } from './validation'
import type { DifyUserInputFormItem } from '@lib/services/dify/types'
import type { DifyParametersSimplifiedConfig } from '@lib/types/dify-parameters'
import { Play, Loader2, AlertCircle } from 'lucide-react'

interface WorkflowInputFormProps {
  instanceId: string
  onExecute: (formData: Record<string, any>) => Promise<void>
  isExecuting: boolean
}

/**
 * 工作流动态输入表单组件
 * 
 * 功能特点：
 * - 基于 user_input_form 配置动态渲染表单字段
 * - 支持文本、段落、下拉选择、文件上传等字段类型
 * - 完整的表单验证和错误提示
 * - 统一的 stone 色系主题
 */
export function WorkflowInputForm({ instanceId, onExecute, isExecuting }: WorkflowInputFormProps) {
  const { isDark } = useTheme()
  const { currentAppInstance, ensureAppReady } = useCurrentApp()
  
  // --- 状态管理 ---
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [appConfig, setAppConfig] = useState<any>(null)
  
  // --- 初始化应用配置 ---
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true)
        console.log('[表单初始化] 开始加载应用配置，instanceId:', instanceId)
        
        // 直接从数据库获取指定 instanceId 的配置
        try {
          // 导入数据库查询函数
          const { createClient } = await import('@lib/supabase/client')
          const supabase = createClient()
          
          // 查询指定的服务实例
          const { data: serviceInstance, error } = await supabase
            .from('service_instances')
            .select('*')
            .eq('instance_id', instanceId)
            .single()
          
          if (error || !serviceInstance) {
            throw new Error(`未找到 instanceId 为 ${instanceId} 的服务实例`)
          }
          
          console.log('[表单初始化] 找到服务实例:', serviceInstance)
          setAppConfig(serviceInstance.config)
          
          // 初始化表单默认值
          const difyParams = serviceInstance.config?.dify_parameters as DifyParametersSimplifiedConfig
          const userInputForm = difyParams?.user_input_form || []
          const initialData: Record<string, any> = {}
          
          console.log('[表单初始化] 解析到的 user_input_form:', userInputForm)
          
          userInputForm.forEach((formItem: DifyUserInputFormItem) => {
            const fieldType = Object.keys(formItem)[0]
            const fieldConfig = formItem[fieldType as keyof typeof formItem]
            
            if (fieldConfig) {
              // 根据字段类型设置默认值
              if (fieldType === 'file' || fieldType === 'file-list') {
                initialData[fieldConfig.variable] = fieldConfig.default || []
              } else if (fieldType === 'number') {
                // number类型的默认值处理
                const numberConfig = fieldConfig as any
                initialData[fieldConfig.variable] = numberConfig.default !== undefined ? numberConfig.default : ''
              } else {
                initialData[fieldConfig.variable] = fieldConfig.default || ''
              }
            }
          })
          
          setFormData(initialData)
          console.log('[表单初始化] 应用配置加载完成:', { 
            instanceId, 
            userInputForm, 
            initialData,
            serviceInstance: serviceInstance.display_name 
          })
          
        } catch (configError) {
          console.warn('[表单初始化] 无法获取应用配置，使用默认配置:', configError)
          
          // 设置默认配置，允许用户继续使用
          setAppConfig({
            dify_parameters: {
              user_input_form: [
                {
                  paragraph: {
                    type: 'paragraph',
                    label: '输入文本',
                    variable: 'input_text',
                    required: true,
                    default: ''
                  }
                }
              ]
            }
          })
          
          setFormData({ input_text: '' })
        }
        
      } catch (error) {
        console.error('[表单初始化] 初始化失败:', error)
        
        // 即使完全失败，也提供基本的表单
        setAppConfig({
          dify_parameters: {
            user_input_form: [
              {
                paragraph: {
                  type: 'paragraph',
                  label: '输入文本',
                  variable: 'input_text',
                  required: true,
                  default: ''
                }
              }
            ]
          }
        })
        setFormData({ input_text: '' })
        
      } finally {
        setIsLoading(false)
      }
    }
    
    initializeApp()
  }, [instanceId])
  
  // --- 表单字段更新 ---
  const handleFieldChange = (variable: string, value: any) => {
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
  }
  
  // --- 表单提交 ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isExecuting) return
    
    // 验证表单
    const userInputForm = appConfig?.dify_parameters?.user_input_form || []
    const validationErrors = validateFormData(formData, userInputForm)
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      console.log('[表单验证] 验证失败:', validationErrors)
      return
    }
    
    // 清除错误并执行
    setErrors({})
    await onExecute(formData)
  }
  
  // --- 加载状态 ---
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className={cn(
            "h-8 w-8 animate-spin mx-auto",
            isDark ? "text-stone-400" : "text-stone-600"
          )} />
          <p className={cn(
            "text-sm font-serif",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            正在加载应用配置...
          </p>
        </div>
      </div>
    )
  }
  
  // --- 获取表单配置 ---
  const userInputForm = appConfig?.dify_parameters?.user_input_form || []
  const fileUploadConfig = appConfig?.dify_parameters?.file_upload
  const hasFileUpload = fileUploadConfig?.enabled || 
    fileUploadConfig?.image?.enabled || 
    fileUploadConfig?.document?.enabled ||
    fileUploadConfig?.audio?.enabled || 
    fileUploadConfig?.video?.enabled
  
  // --- 无配置状态（更宽松的检查）---
  if (userInputForm.length === 0 && !hasFileUpload) {
    // 如果没有配置，显示提示但仍然提供基本的执行按钮
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <AlertCircle className={cn(
              "h-12 w-12 mx-auto",
              isDark ? "text-stone-400" : "text-stone-600"
            )} />
            <div className="space-y-2">
              <h3 className={cn(
                "text-lg font-semibold font-serif",
                isDark ? "text-stone-200" : "text-stone-800"
              )}>
                使用默认配置
              </h3>
              <p className={cn(
                "text-sm font-serif",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                此工作流应用使用默认配置。您可以在管理页面中配置 user_input_form 参数来自定义输入字段。
              </p>
            </div>
          </div>
        </div>
        
        {/* 提供基本的执行按钮 */}
        <div className="mt-6 pt-6 border-t border-stone-200 dark:border-stone-700">
          <button
            onClick={() => onExecute({})}
            disabled={isExecuting}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-medium font-serif transition-all duration-200",
              "flex items-center justify-center gap-2",
              isExecuting
                ? "bg-stone-400 text-stone-100 cursor-not-allowed"
                : isDark
                  ? "bg-stone-700 hover:bg-stone-600 text-stone-100 hover:shadow-lg"
                  : "bg-stone-800 hover:bg-stone-700 text-white hover:shadow-lg"
            )}
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>执行中...</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span>开始执行工作流</span>
              </>
            )}
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* --- 表单内容 --- */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto">
          {/* --- 动态表单字段 --- */}
          {userInputForm.map((formItem: DifyUserInputFormItem, index: number) => {
            const fieldType = Object.keys(formItem)[0]
            const fieldConfig = formItem[fieldType as keyof typeof formItem]
            
            if (!fieldConfig) return null
            
                      // 根据字段类型确定值和处理函数
          const fieldValue = (fieldType === 'file' || fieldType === 'file-list')
            ? (formData[fieldConfig.variable] || [])
            : (formData[fieldConfig.variable] || '')
          
          const fieldOnChange = (fieldType === 'file' || fieldType === 'file-list')
            ? (value: any) => handleFieldChange(fieldConfig.variable, value)
            : (value: string) => handleFieldChange(fieldConfig.variable, value)
          
          // --- BEGIN COMMENT ---
          // 调试：输出文件字段的配置信息
          // --- END COMMENT ---
          if (fieldType === 'file' || fieldType === 'file-list') {
            const fileConfig = fieldConfig as any
            console.log(`[工作流表单] ${fieldType}字段配置:`, {
              variable: fileConfig.variable,
              label: fileConfig.label,
              max_length: fileConfig.max_length, // file-list类型的文件数量限制
              number_limits: fileConfig.number_limits, // file类型的文件数量限制
              required: fileConfig.required,
              allowed_file_types: fileConfig.allowed_file_types,
              max_file_size_mb: fileConfig.max_file_size_mb,
              fullConfig: fileConfig // 输出完整配置以便调试
            })
          }
            
            return (
              <FormField
                key={`${fieldType}_${fieldConfig.variable}_${index}`}
                type={fieldType as 'text-input' | 'number' | 'paragraph' | 'select' | 'file' | 'file-list'}
                config={fieldConfig}
                value={fieldValue}
                onChange={fieldOnChange}
                error={errors[fieldConfig.variable]}
                instanceId={instanceId}
              />
            )
          })}
          
          {/* --- 文件上传字段 --- */}
          {hasFileUpload && (
            <FileUploadField
              config={fileUploadConfig}
              value={formData._files || []}
              onChange={(files: any[]) => handleFieldChange('_files', files)}
              error={errors._files}
              label="文件上传"
              instanceId={instanceId}
            />
          )}
        </div>
        
        {/* --- 提交按钮 --- */}
        <div className="mt-6 pt-6 border-t border-stone-200 dark:border-stone-700">
          <button
            type="submit"
            disabled={isExecuting}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-medium font-serif transition-all duration-200",
              "flex items-center justify-center gap-2",
              isExecuting
                ? "bg-stone-400 text-stone-100 cursor-not-allowed"
                : isDark
                  ? "bg-stone-700 hover:bg-stone-600 text-stone-100 hover:shadow-lg"
                  : "bg-stone-800 hover:bg-stone-700 text-white hover:shadow-lg"
            )}
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>执行中...</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span>开始执行工作流</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
} 