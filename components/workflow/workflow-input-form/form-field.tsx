"use client"

import React from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { CustomSelect } from './custom-select'
import { FileUploadField } from './file-upload-field'
import type { DifyTextInputControl, DifyParagraphControl, DifySelectControl, DifyFileInputControl } from '@lib/services/dify/types'

interface FormFieldProps {
  type: 'text-input' | 'paragraph' | 'select' | 'file' | 'file-list'
  config: DifyTextInputControl | DifyParagraphControl | DifySelectControl | DifyFileInputControl
  value: any
  onChange: (value: any) => void
  error?: string
  instanceId?: string // 添加instanceId用于文件上传
}

/**
 * 通用表单字段组件
 * 
 * 支持的字段类型：
 * - text-input: 单行文本输入
 * - paragraph: 多行文本输入
 * - select: 下拉选择
 * - file: 文件上传
 */
export function FormField({ type, config, value, onChange, error, instanceId }: FormFieldProps) {
  const { isDark } = useTheme()
  
  const baseInputClasses = cn(
    "w-full px-3 py-2 rounded-lg border font-serif transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-stone-500/30 focus:border-stone-500",
    "focus:shadow-md focus:shadow-stone-500/20",
    error
      ? "border-red-500 bg-red-50 dark:bg-red-900/20 focus:ring-red-500/30 focus:border-red-500"
      : isDark
        ? "border-stone-600 bg-stone-700 text-stone-100 placeholder-stone-400"
        : "border-stone-300 bg-white text-stone-900 placeholder-stone-500"
  )
  
  const labelClasses = cn(
    "block text-sm font-medium font-serif mb-2",
    isDark ? "text-stone-200" : "text-stone-700"
  )
  
  const errorClasses = cn(
    "mt-1 text-xs font-serif text-red-500"
  )
  
  const renderInput = () => {
    switch (type) {
      case 'text-input':
        const textConfig = config as DifyTextInputControl
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`请输入${config.label}`}
            maxLength={textConfig.max_length || undefined}
            className={baseInputClasses}
          />
        )
      
      case 'paragraph':
        const paragraphConfig = config as DifyParagraphControl
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`请输入${config.label}`}
            rows={6}
            maxLength={(paragraphConfig as any).max_length || undefined}
            className={cn(baseInputClasses, "resize-none")}
          />
        )
      
      case 'select':
        const selectConfig = config as DifySelectControl
        return (
          <CustomSelect
            value={value}
            onChange={onChange}
            options={selectConfig.options}
            placeholder={`请选择${config.label}`}
            error={error}
          />
        )
      
      case 'file':
        const fileConfig = config as any
        if (!instanceId) {
          console.warn('[FormField] file类型字段需要instanceId参数')
          return null
        }
        return (
          <FileUploadField
            config={{
              ...fileConfig, // 保留所有原始字段
              enabled: true // 确保启用
            }}
            value={value || []}
            onChange={onChange}
            error={error}
            instanceId={instanceId}
            isSingleFileMode={true} // 单文件模式
          />
        )
      
      case 'file-list':
        const fileListConfig = config as any
        if (!instanceId) {
          console.warn('[FormField] file-list类型字段需要instanceId参数')
          return null
        }
        return (
          <FileUploadField
            config={{
              ...fileListConfig, // 保留所有原始字段
              enabled: true // 确保启用
            }}
            value={value || []}
            onChange={onChange}
            error={error}
            instanceId={instanceId}
            isSingleFileMode={false} // 多文件模式
          />
        )
      
      default:
        return null
    }
  }
  
  return (
    <div className="space-y-1 px-1">
      <label className={labelClasses}>
        {config.label}
        {config.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      
      {renderInput()}
      
      {/* 字符计数（仅对有长度限制的字段显示） */}
      {(type === 'text-input' || type === 'paragraph') && (config as any).max_length && (
        <div className={cn(
          "text-xs font-serif text-right",
          isDark ? "text-stone-400" : "text-stone-500"
        )}>
          {(value || '').length} / {(config as any).max_length}
        </div>
      )}
      
      {/* 错误提示 */}
      {error && (
        <div className={errorClasses}>
          {error}
        </div>
      )}
    </div>
  )
} 