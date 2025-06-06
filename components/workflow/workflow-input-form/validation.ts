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
    
    // 检查字段是否为空
    const isFileField = fieldType === 'file' || fieldType === 'file-list'
    const isEmpty = isFileField 
      ? (!value || 
         (Array.isArray(value) && value.length === 0) ||
         (typeof value === 'object' && !value.upload_file_id))
      : (!value || (typeof value === 'string' && value.trim() === ''))
    
    // 如果字段为空且非必填，跳过所有验证
    if (isEmpty && !required) {
      return
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
    if (isFileField) {
      const fileConfig = fieldConfig as any
      
      // 将单文件对象转换为数组进行统一处理
      const fileArray = Array.isArray(value) ? value : [value]
      
      // 1. 优先检查文件数量限制（支持max_length和number_limits两种字段）
      const maxFileCount = fileConfig.max_length || fileConfig.number_limits
      if (maxFileCount && fileArray.length > maxFileCount) {
        errors[variable] = `${label}文件数量不能超过${maxFileCount}个`
        return // 数量超限时，不再检查其他错误
      }
      
      // 2. 如果字段为空且必填，显示必填错误
      if (isEmpty && required) {
        errors[variable] = `${label}为必填项`
        return
      }
      
      // 3. 文件大小和类型验证（仅对原始File对象进行验证）
      for (const file of fileArray) {
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
        // 对于已上传的Dify文件对象（有upload_file_id），跳过验证
      }
    } else {
      // 非文件字段的必填验证
      if (isEmpty && required) {
        errors[variable] = `${label}为必填项`
        return
      }
    }
  })
  
  return errors
} 