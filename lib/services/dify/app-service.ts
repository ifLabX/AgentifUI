import { getProviderByName } from '@lib/db';
import type { DifyAppParametersResponse, DifyApiError, DifyAppInfoResponse, DifyWebAppSettingsResponse, DifyAppMetaResponse } from './types';
import type { ServiceInstanceConfig } from '@lib/types/database';

/**
 * 获取所有可用的Dify应用
 */
export async function getAllDifyApps(): Promise<Array<{
  id: string;
  name: string;
  instance_id: string;
  display_name?: string;
  description?: string;
  config?: ServiceInstanceConfig;
}>> {
  try {
    // 获取Dify提供商
    const providerResult = await getProviderByName('Dify');
    if (!providerResult.success || !providerResult.data) {
      throw new Error('未找到Dify提供商');
    }

    // 获取所有Dify服务实例
    const { createClient } = await import('@lib/supabase/client');
    const supabase = createClient();
    
    const { data: instances, error } = await supabase
      .from('service_instances')
      .select('instance_id, display_name, description, config')
      .eq('provider_id', providerResult.data.id)
      .order('display_name');
      
    if (error) {
      throw error;
    }
    
    return instances?.map(instance => ({
      id: instance.instance_id,
      name: instance.display_name || instance.instance_id,
      instance_id: instance.instance_id,
      display_name: instance.display_name,
      description: instance.description,
      config: instance.config as ServiceInstanceConfig
    })) || [];
    
  } catch (error) {
    console.error('获取Dify应用列表失败:', error);
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
      userInputFormCount: result.user_input_form?.length || 0
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