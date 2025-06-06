import type { DifyUserInputFormItem } from '@lib/services/dify/types'

/**
 * 验证工作流表单数据
 * 
 * @param formData 表单数据
 * @param userInputForm 表单配置
 * @returns 验证错误对象
 */
export function validateFormData(
  formData: Record<string, any>,
  userInputForm: DifyUserInputFormItem[]
): Record<string, string> {
  const errors: Record<string, string> = {}
  
  userInputForm.forEach((formItem) => {
    const fieldType = Object.keys(formItem)[0]
    const fieldConfig = formItem[fieldType as keyof typeof formItem]
    
    if (!fieldConfig) return
    
    const { variable, required, label } = fieldConfig
    const value = formData[variable]
    
    // 必填验证
    if (required) {
      if (fieldType === 'file') {
        // 文件字段：检查是否有文件
        if (!value || !Array.isArray(value) || value.length === 0) {
          errors[variable] = `${label}为必填项`
          return
        }
      } else {
        // 文本字段：检查是否为空
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors[variable] = `${label}为必填项`
          return
        }
      }
    }
    
    // 如果字段为空且非必填，跳过其他验证
    if (fieldType === 'file') {
      if (!value || !Array.isArray(value) || value.length === 0) {
        return
      }
    } else {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return
      }
    }
    
    // 字符长度验证（仅适用于文本字段）
    if (fieldType === 'text-input' || fieldType === 'paragraph') {
      const maxLength = (fieldConfig as any).max_length
      if (maxLength && typeof value === 'string' && value.length > maxLength) {
        errors[variable] = `${label}长度不能超过${maxLength}个字符`
      }
    }
    
    // 下拉选择验证
    if (fieldType === 'select') {
      const selectConfig = fieldConfig as any
      if (selectConfig.options && !selectConfig.options.includes(value)) {
        errors[variable] = `${label}选择的值无效`
      }
    }
    
    // 文件验证
    if (fieldType === 'file') {
      const fileConfig = fieldConfig as any
      if (Array.isArray(value)) {
        // 文件数量限制
        if (fileConfig.number_limits && value.length > fileConfig.number_limits) {
          errors[variable] = `${label}文件数量不能超过${fileConfig.number_limits}个`
        }
        
        // 文件大小和类型验证
        for (const file of value) {
          if (file instanceof File) {
            // 文件大小验证
            if (fileConfig.max_file_size_mb) {
              const maxSizeBytes = fileConfig.max_file_size_mb * 1024 * 1024
              if (file.size > maxSizeBytes) {
                errors[variable] = `${label}中的文件"${file.name}"大小超过${fileConfig.max_file_size_mb}MB`
                break
              }
            }
            
            // 文件类型验证
            if (fileConfig.allowed_file_types && fileConfig.allowed_file_types.length > 0) {
              const fileExtension = file.name.split('.').pop()?.toLowerCase()
              if (!fileExtension || !fileConfig.allowed_file_types.includes(fileExtension)) {
                errors[variable] = `${label}中的文件"${file.name}"类型不支持，支持的类型：${fileConfig.allowed_file_types.join(', ')}`
                break
              }
            }
          }
        }
      }
    }
  })
  
  return errors
} 