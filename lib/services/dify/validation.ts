import { isValidDifyAppType } from '@lib/types/dify-app-types';
import type { ServiceInstanceConfig } from '@lib/types/database';

/**
 * Dify应用配置验证服务
 */

export interface DifyConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 验证Dify应用配置
 * @param config 服务实例配置
 * @returns 验证结果
 */
export function validateDifyAppConfig(config: ServiceInstanceConfig): DifyConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // --- 验证app_metadata是否存在 ---
  if (!config.app_metadata) {
    errors.push('应用元数据配置不能为空');
    return { isValid: false, errors, warnings };
  }
  
  // --- 验证dify_apptype是否存在且有效 ---
  if (!config.app_metadata.dify_apptype) {
    errors.push('Dify应用类型不能为空');
  } else if (!isValidDifyAppType(config.app_metadata.dify_apptype)) {
    errors.push(`无效的Dify应用类型: ${config.app_metadata.dify_apptype}`);
  }
  
  // --- 验证app_type是否存在 ---
  if (!config.app_metadata.app_type) {
    warnings.push('建议设置应用类型(app_type)');
  } else if (!['model', 'marketplace'].includes(config.app_metadata.app_type)) {
    errors.push(`无效的应用类型: ${config.app_metadata.app_type}`);
  }
  
  // --- 验证display_name是否存在 ---
  if (!config.app_metadata.brief_description && config.app_metadata.app_type === 'marketplace') {
    warnings.push('应用市场类型建议添加应用简介');
  }
  
  // --- 验证标签配置 ---
  if (config.app_metadata.tags && !Array.isArray(config.app_metadata.tags)) {
    errors.push('应用标签必须为数组格式');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证表单数据的Dify配置
 * @param formData 表单数据
 * @returns 错误信息数组
 */
export function validateDifyFormData(formData: any): string[] {
  const errors: string[] = [];
  
  // --- 验证基础字段 ---
  if (!formData.instance_id?.trim()) {
    errors.push('应用实例ID不能为空');
  } else {
    const instanceId = formData.instance_id.trim();
    
    if (instanceId.includes(' ')) {
      errors.push('应用实例ID不能包含空格（会影响URL路由）');
    }
    
    const urlUnsafeChars = /[^a-zA-Z0-9\-_\.]/;
    if (urlUnsafeChars.test(instanceId)) {
      errors.push('应用实例ID只能包含字母、数字、连字符(-)、下划线(_)和点(.)');
    }
    
    if (instanceId.length > 50) {
      errors.push('应用实例ID长度不能超过50个字符');
    }
    
    if (!/^[a-zA-Z0-9]/.test(instanceId)) {
      errors.push('应用实例ID必须以字母或数字开头');
    }
  }
  
  if (!formData.display_name?.trim()) {
    errors.push('显示名称不能为空');
  }
  
  if (!formData.config?.app_metadata?.dify_apptype) {
    errors.push('请选择Dify应用类型');
  } else if (!isValidDifyAppType(formData.config.app_metadata.dify_apptype)) {
    errors.push('请选择有效的Dify应用类型');
  }
  
  if (!formData.config?.app_metadata?.app_type) {
    errors.push('请选择应用类型');
  }
  
  // --- 验证API配置 ---
//   if (!formData.config?.api_url?.trim()) {
//     errors.push('API地址不能为空');
//   }
  
//   if (!formData.apiKey?.trim()) {
//     errors.push('API密钥不能为空');
//   }
  
  return errors;
}

/**
 * 生成配置建议
 * @param config 服务实例配置
 * @returns 建议信息数组
 */
export function generateConfigSuggestions(config: ServiceInstanceConfig): string[] {
  const suggestions: string[] = [];
  
  if (!config.app_metadata) {
    return suggestions;
  }
  
  const { dify_apptype, app_type, tags, icon_url } = config.app_metadata;
  
  // --- 根据Dify应用类型给出建议 ---
  if (dify_apptype === 'workflow' && app_type === 'model') {
    suggestions.push('工作流应用建议设置为应用市场类型而非模型类型');
  }
  
  if (dify_apptype === 'text-generation' && !tags?.includes('文本生成')) {
    suggestions.push('文本生成应用建议添加"文本生成"标签');
  }
  
  return suggestions;
} 