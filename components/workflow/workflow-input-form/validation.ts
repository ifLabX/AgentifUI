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
    const isNumberField = fieldType === 'number'
    
    const isEmpty = isFileField 
      ? (!value || 
         (Array.isArray(value) && value.length === 0) ||
         (typeof value === 'object' && !value.upload_file_id))
      : isNumberField
        ? (value === '' || value === null || value === undefined)
        : (!value || (typeof value === 'string' && value.trim() === ''))
    
    // 如果字段为空且非必填，跳过所有验证
    if (isEmpty && !required) {
      return
    }
    
    // 必填验证
    if (isEmpty && required) {
      errors[variable] = `${label}为必填项`
      return
    }
    
    // 数字类型验证
    if (fieldType === 'number') {
      const numberConfig = fieldConfig as any
      
      // 检查是否为有效数字
      const numValue = typeof value === 'number' ? value : parseFloat(value)
      if (isNaN(numValue)) {
        errors[variable] = `${label}必须是有效的数字`
        return
      }
      
      // 最小值验证
      if (numberConfig.min !== undefined && numValue < numberConfig.min) {
        errors[variable] = `${label}不能小于${numberConfig.min}`
        return
      }
      
      // 最大值验证
      if (numberConfig.max !== undefined && numValue > numberConfig.max) {
        errors[variable] = `${label}不能大于${numberConfig.max}`
        return
      }
      
      // 步长验证
      if (numberConfig.step && numberConfig.step > 0) {
        const minValue = numberConfig.min || 0
        const remainder = (numValue - minValue) % numberConfig.step
        if (Math.abs(remainder) > 1e-10) { // 使用小的容差处理浮点数精度问题
          errors[variable] = `${label}必须是${numberConfig.step}的倍数`
          return
        }
      }
      
      // 精度验证（小数位数）
      if (numberConfig.precision !== undefined) {
        const decimalPlaces = (numValue.toString().split('.')[1] || '').length
        if (decimalPlaces > numberConfig.precision) {
          errors[variable] = `${label}小数位数不能超过${numberConfig.precision}位`
          return
        }
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
      
      // 2. 文件大小和类型验证（仅对原始File对象进行验证）
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
    }
  })
  
  return errors
} 