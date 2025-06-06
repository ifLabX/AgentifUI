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
    if (required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors[variable] = `${label}为必填项`
      return
    }
    
    // 如果字段为空且非必填，跳过其他验证
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return
    }
    
    // 字符长度验证
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
  })
  
  return errors
} 