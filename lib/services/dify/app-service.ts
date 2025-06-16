import { getProviderByName } from '@lib/db';
import type { DifyAppParametersResponse, DifyApiError, DifyAppInfoResponse, DifyWebAppSettingsResponse, DifyAppMetaResponse } from './types';
import type { ServiceInstanceConfig } from '@lib/types/database';

/**
 * 获取所有可用的Dify应用（管理员用）
 * 返回所有应用，包括私有应用，用于管理界面
 */
export async function getAllDifyApps(): Promise<Array<{
  id: string;
  name: string;
  instance_id: string;
  display_name?: string;
  description?: string;
  config?: ServiceInstanceConfig;
  visibility?: string;
}>> {
  try {
    // --- BEGIN COMMENT ---
    // 🎯 重构：支持多提供商，获取所有活跃提供商的应用实例
    // --- END COMMENT ---
    const { createClient } = await import('@lib/supabase/client');
    const supabase = createClient();
    
    const { data: instances, error } = await supabase
      .from('service_instances')
      .select(`
        id, 
        instance_id, 
        display_name, 
        description, 
        config, 
        visibility,
        providers!inner(
          id,
          name,
          is_active
        )
      `)
      .eq('providers.is_active', true)
      .order('display_name');
      
    if (error) {
      throw error;
    }
    
    return instances?.map(instance => ({
      id: instance.id,  // 使用数据库UUID主键作为标识符
      name: instance.display_name || instance.instance_id,
      instance_id: instance.instance_id,
      display_name: instance.display_name,
      description: instance.description,
      config: instance.config as ServiceInstanceConfig,
      visibility: instance.visibility || 'public' // 默认为公开
    })) || [];
    
  } catch (error) {
    console.error('获取应用列表失败:', error);
    throw error;
  }
}

/**
 * 获取公开的Dify应用（未登录用户用）
 * 只返回公开应用，用于应用市场
 */
export async function getPublicDifyApps(): Promise<Array<{
  id: string;
  name: string;
  instance_id: string;
  display_name?: string;
  description?: string;
  config?: ServiceInstanceConfig;
  visibility?: string;
}>> {
  try {
    // --- BEGIN COMMENT ---
    // 🎯 重构：支持多提供商，获取所有活跃提供商的公开应用实例
    // --- END COMMENT ---
    const { createClient } = await import('@lib/supabase/client');
    const supabase = createClient();
    
    const { data: instances, error } = await supabase
      .from('service_instances')
      .select(`
        id, 
        instance_id, 
        display_name, 
        description, 
        config, 
        visibility,
        providers!inner(
          id,
          name,
          is_active
        )
      `)
      .eq('providers.is_active', true)
      .in('visibility', ['public']) // 只获取公开应用
      .order('display_name');
      
    if (error) {
      throw error;
    }
    
    return instances?.map(instance => ({
      id: instance.id,
      name: instance.display_name || instance.instance_id,
      instance_id: instance.instance_id,
      display_name: instance.display_name,
      description: instance.description,
      config: instance.config as ServiceInstanceConfig,
      visibility: instance.visibility || 'public'
    })) || [];
    
  } catch (error) {
    console.error('获取公开应用列表失败:', error);
    throw error;
  }
}

/**
 * 获取应用参数
 * 用于进入页面一开始，获取功能开关、输入参数名称、类型及默认值等使用
 * 
 * @param appId - 应用ID
 * @returns Promise<DifyAppParametersResponse> - 应用参数配置
 */
export async function getDifyAppParameters(appId: string): Promise<DifyAppParametersResponse> {
  const slug = 'parameters'; // Dify API 路径
  const apiUrl = `/api/dify/${appId}/${slug}`; // 指向后端代理

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 不需要 Authorization 头，这是代理的职责
    });

    if (!response.ok) {
      // 尝试解析错误响应
      let errorData: DifyApiError;
      try {
        errorData = await response.json();
      } catch {
        // 如果无法解析JSON，使用默认错误格式
        errorData = {
          status: response.status,
          code: response.status.toString(),
          message: response.statusText || '获取应用参数失败'
        };
      }
      
      console.error('[Dify App Service] 获取应用参数失败:', errorData);
      throw new Error(`获取应用参数失败: ${errorData.message}`);
    }

    const result: DifyAppParametersResponse = await response.json();
    
    console.log('[Dify App Service] 成功获取应用参数:', {
      appId,
      hasOpeningStatement: !!result.opening_statement,
      suggestedQuestionsCount: result.suggested_questions?.length || 0,
      userInputFormCount: result.user_input_form?.length || 0,
      textToSpeechEnabled: result.text_to_speech?.enabled || false
    });
    
    return result;

  } catch (error) {
    console.error('[Dify App Service] 获取应用参数时发生错误:', error);
    
    // 重新抛出错误，保持错误信息
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('获取应用参数时发生未知错误');
  }
}

/**
 * 测试获取应用参数API（仅用于开发调试）
 * 
 * @param appId - 应用ID
 */
export async function testDifyAppParameters(appId: string): Promise<void> {
  try {
    console.log(`[Test] 开始测试应用参数API，appId: ${appId}`);
    
    const parameters = await getDifyAppParameters(appId);
    
    console.log(`[Test] 成功获取应用参数:`, {
      appId,
      opening_statement: parameters.opening_statement,
      suggested_questions_count: parameters.suggested_questions?.length || 0,
      user_input_form_count: parameters.user_input_form?.length || 0,
      file_upload_enabled: parameters.file_upload?.image?.enabled || false,
      speech_to_text_enabled: parameters.speech_to_text?.enabled || false,
      text_to_speech_enabled: parameters.text_to_speech?.enabled || false,
      retriever_resource_enabled: parameters.retriever_resource?.enabled || false,
      annotation_reply_enabled: parameters.annotation_reply?.enabled || false
    });
    
  } catch (error) {
    console.error(`[Test] 测试应用参数API失败:`, error);
    throw error;
  }
}

/**
 * 获取应用基本信息
 * 
 * @param appId - 应用ID
 * @returns Promise<DifyAppInfoResponse> - 应用基本信息
 */
export async function getDifyAppInfo(appId: string): Promise<DifyAppInfoResponse> {
  const slug = 'info'; // Dify API 路径
  const apiUrl = `/api/dify/${appId}/${slug}`; // 指向后端代理

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 不需要 Authorization 头，这是代理的职责
    });

    if (!response.ok) {
      // 尝试解析错误响应
      let errorData: DifyApiError;
      try {
        errorData = await response.json();
      } catch {
        // 如果无法解析JSON，使用默认错误格式
        errorData = {
          status: response.status,
          code: response.status.toString(),
          message: response.statusText || '获取应用信息失败'
        };
      }
      
      console.error('[Dify App Service] 获取应用信息失败:', errorData);
      throw new Error(`获取应用信息失败: ${errorData.message}`);
    }

    const result: DifyAppInfoResponse = await response.json();
    
    console.log('[Dify App Service] 成功获取应用信息:', {
      appId,
      name: result.name,
      description: result.description,
      tagsCount: result.tags?.length || 0
    });
    
    return result;

  } catch (error) {
    console.error('[Dify App Service] 获取应用信息时发生错误:', error);
    
    // 重新抛出错误，保持错误信息
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('获取应用信息时发生未知错误');
  }
}

/**
 * 获取应用 WebApp 设置
 * 
 * @param appId - 应用ID
 * @returns Promise<DifyWebAppSettingsResponse> - WebApp 设置信息
 */
export async function getDifyWebAppSettings(appId: string): Promise<DifyWebAppSettingsResponse> {
  const slug = 'site'; // Dify API 路径
  const apiUrl = `/api/dify/${appId}/${slug}`; // 指向后端代理

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 不需要 Authorization 头，这是代理的职责
    });

    if (!response.ok) {
      // 尝试解析错误响应
      let errorData: DifyApiError;
      try {
        errorData = await response.json();
      } catch {
        // 如果无法解析JSON，使用默认错误格式
        errorData = {
          status: response.status,
          code: response.status.toString(),
          message: response.statusText || '获取 WebApp 设置失败'
        };
      }
      
      console.error('[Dify App Service] 获取 WebApp 设置失败:', errorData);
      throw new Error(`获取 WebApp 设置失败: ${errorData.message}`);
    }

    const result: DifyWebAppSettingsResponse = await response.json();
    
    console.log('[Dify App Service] 成功获取 WebApp 设置:', {
      appId,
      title: result.title,
      iconType: result.icon_type,
      hasDescription: !!result.description
    });
    
    return result;

  } catch (error) {
    console.error('[Dify App Service] 获取 WebApp 设置时发生错误:', error);
    
    // 重新抛出错误，保持错误信息
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('获取 WebApp 设置时发生未知错误');
  }
}

/**
 * 获取应用 Meta 信息
 * 
 * @param appId - 应用ID
 * @returns Promise<DifyAppMetaResponse> - 应用 Meta 信息
 */
export async function getDifyAppMeta(appId: string): Promise<DifyAppMetaResponse> {
  const slug = 'meta'; // Dify API 路径
  const apiUrl = `/api/dify/${appId}/${slug}`; // 指向后端代理

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 不需要 Authorization 头，这是代理的职责
    });

    if (!response.ok) {
      // 尝试解析错误响应
      let errorData: DifyApiError;
      try {
        errorData = await response.json();
      } catch {
        // 如果无法解析JSON，使用默认错误格式
        errorData = {
          status: response.status,
          code: response.status.toString(),
          message: response.statusText || '获取应用 Meta 信息失败'
        };
      }
      
      console.error('[Dify App Service] 获取应用 Meta 信息失败:', errorData);
      throw new Error(`获取应用 Meta 信息失败: ${errorData.message}`);
    }

    const result: DifyAppMetaResponse = await response.json();
    
    console.log('[Dify App Service] 成功获取应用 Meta 信息:', {
      appId,
      toolIconsCount: Object.keys(result.tool_icons).length
    });
    
    return result;

  } catch (error) {
    console.error('[Dify App Service] 获取应用 Meta 信息时发生错误:', error);
    
    // 重新抛出错误，保持错误信息
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('获取应用 Meta 信息时发生未知错误');
  }
}

/**
 * 使用指定的API配置获取Dify应用参数（用于表单同步）
 * 
 * @param appId - 应用ID
 * @param apiConfig - API配置（URL和密钥）
 * @returns Promise<DifyAppParametersResponse> - 应用参数
 */
export async function getDifyAppParametersWithConfig(
  appId: string, 
  apiConfig: { apiUrl: string; apiKey: string }
): Promise<DifyAppParametersResponse> {
  const { apiUrl, apiKey } = apiConfig;
  
  if (!apiUrl || !apiKey) {
    throw new Error('API URL 和 API Key 都是必需的');
  }
  
  // --- BEGIN COMMENT ---
  // 🎯 架构修复：通过临时代理方式调用，避免直接调用外部API
  // 创建一个临时的服务实例配置，通过代理服务器调用
  // --- END COMMENT ---
  
  try {
    console.log(`[Dify App Service] 使用表单配置通过代理同步参数: ${appId}`);
    
    // 通过代理服务器调用，但使用特殊的临时配置方式
    const slug = 'parameters';
    const proxyUrl = `/api/dify/${appId}/${slug}`;
    
    const response = await fetch(proxyUrl, {
      method: 'POST', // 使用POST传递临时配置
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _temp_config: {
          apiUrl,
          apiKey
        }
      })
    });

    if (!response.ok) {
      // 尝试解析错误响应
      let errorData: DifyApiError;
      try {
        errorData = await response.json();
      } catch {
        // 如果无法解析JSON，使用默认错误格式
        errorData = {
          status: response.status,
          code: response.status.toString(),
          message: response.statusText || '获取应用参数失败'
        };
      }
      
      console.error('[Dify App Service] 使用表单配置获取应用参数失败:', errorData);
      throw new Error(`获取应用参数失败: ${errorData.message}`);
    }

    const result: DifyAppParametersResponse = await response.json();
    
    console.log('[Dify App Service] 使用表单配置成功获取应用参数:', {
      appId,
      hasOpeningStatement: !!result.opening_statement,
      suggestedQuestionsCount: result.suggested_questions?.length || 0,
      userInputFormCount: result.user_input_form?.length || 0,
      textToSpeechEnabled: result.text_to_speech?.enabled || false
    });
    
    return result;

  } catch (error) {
    console.error('[Dify App Service] 使用表单配置获取应用参数时发生错误:', error);
    
    // 重新抛出错误，保持错误信息
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('使用表单配置获取应用参数时发生未知错误');
  }
}

/**
 * 使用指定的API配置获取Dify应用基本信息（用于表单同步）
 * 
 * @param appId - 应用ID
 * @param apiConfig - API配置（URL和密钥）
 * @returns Promise<DifyAppInfoResponse> - 应用基本信息
 */
export async function getDifyAppInfoWithConfig(
  appId: string, 
  apiConfig: { apiUrl: string; apiKey: string }
): Promise<DifyAppInfoResponse> {
  const { apiUrl, apiKey } = apiConfig;
  
  if (!apiUrl || !apiKey) {
    throw new Error('API URL 和 API Key 都是必需的');
  }
  
  // --- BEGIN COMMENT ---
  // 🎯 架构修复：通过临时代理方式调用，避免直接调用外部API
  // 创建一个临时的服务实例配置，通过代理服务器调用
  // --- END COMMENT ---
  
  try {
    console.log(`[Dify App Service] 使用表单配置通过代理同步基本信息: ${appId}`);
    
    // 通过代理服务器调用，但使用特殊的临时配置方式
    const slug = 'info';
    const proxyUrl = `/api/dify/${appId}/${slug}`;
    
    const response = await fetch(proxyUrl, {
      method: 'POST', // 使用POST传递临时配置
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _temp_config: {
          apiUrl,
          apiKey
        }
      })
    });

    if (!response.ok) {
      // 尝试解析错误响应
      let errorData: DifyApiError;
      try {
        errorData = await response.json();
      } catch {
        // 如果无法解析JSON，使用默认错误格式
        errorData = {
          status: response.status,
          code: response.status.toString(),
          message: response.statusText || '获取应用基本信息失败'
        };
      }
      
      console.error('[Dify App Service] 使用表单配置获取应用基本信息失败:', errorData);
      throw new Error(`获取应用基本信息失败: ${errorData.message}`);
    }

    const result: DifyAppInfoResponse = await response.json();
    
    console.log('[Dify App Service] 使用表单配置成功获取应用基本信息:', {
      appId,
      name: result.name,
      description: result.description,
      tagsCount: result.tags?.length || 0
    });
    
    return result;

  } catch (error) {
    console.error('[Dify App Service] 使用表单配置获取应用基本信息时发生错误:', error);
    
    // 重新抛出错误，保持错误信息
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('使用表单配置获取应用基本信息时发生未知错误');
  }
} 