import { createClient } from '../supabase/client';
import { decryptApiKey } from '../utils/encryption';

export interface DifyAppConfig {
  apiKey: string;
  apiUrl: string;
  appId: string;
  displayName?: string;
  description?: string;
}

// 缓存配置，避免重复请求
const configCache: Record<string, { config: DifyAppConfig, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

/**
 * 获取 Dify 应用配置
 * 从数据库获取配置
 * @param appId Dify 应用 ID
 * @returns Dify 应用配置，包含 apiKey 和 apiUrl
 */
export const getDifyAppConfig = async (
  appId: string,
): Promise<DifyAppConfig | null> => {
  
  // 检查缓存
  const cached = configCache[appId];
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.config;
  }
  
  try {
    // 从数据库获取配置
    const config = await getDifyConfigFromDatabase(appId);
    
    if (config) {
      console.log(`[获取Dify配置] 成功从数据库获取配置`);
      
      // 更新缓存
      configCache[appId] = {
        config,
        timestamp: Date.now()
      };
      
      return config;
    } else {
      console.error(`[获取Dify配置] 数据库中未找到 ${appId} 的配置`);
      
      return null;
    }
  } catch (error) {
    console.error(`[获取Dify配置] 从数据库获取 ${appId} 配置时出错:`, error);
    return null;
  }
};

/**
 * 从数据库获取 Dify 应用配置
 * @param appId Dify 应用 ID
 * @returns Dify 应用配置
 */
async function getDifyConfigFromDatabase(appId: string): Promise<DifyAppConfig | null> {
  // 初始化 Supabase 客户端
  const supabase = createClient();
  
  // 使用固定的密钥，而不是依赖环境变量
  // 注意：在真实生产环境中，应该使用更安全的方式来管理密钥
  const masterKey = 'llm-eduhub-api-encryption-key-for-development-12345';
  
  // 1. 查找 Dify 提供商
  const { data: provider, error: providerError } = await supabase
    .from('providers')
    .select('id, base_url')
    .eq('name', 'Dify')
    .single();
    
  if (providerError || !provider) {
    console.error('Dify provider not found in database');
    return null;
  }
  
  // 2. 查找对应的服务实例
  const { data: instance, error: instanceError } = await supabase
    .from('service_instances')
    .select('*')
    .eq('provider_id', provider.id)
    .eq('instance_id', appId)
    .single();
    
  // 如果没找到特定实例，尝试使用默认实例
  if (instanceError || !instance) {
    if (appId !== 'default') {
      const { data: defaultInstance, error: defaultInstanceError } = await supabase
        .from('service_instances')
        .select('*')
        .eq('provider_id', provider.id)
        .eq('is_default', true)
        .single();
        
      if (defaultInstanceError || !defaultInstance) {
        console.error('No default service instance found for Dify');
        return null;
      }
    } else {
      console.error(`No service instance found for Dify app "${appId}"`);
      return null;
    }
  }
  
  // 3. 获取服务实例的 ID
  let serviceInstance = instance;
  
  // 如果没有找到实例，且请求的是非默认实例，尝试使用默认实例
  if (!serviceInstance && appId !== 'default') {
    const { data: defaultInstance, error: defaultInstanceError } = await supabase
      .from('service_instances')
      .select('*')
      .eq('provider_id', provider.id)
      .eq('is_default', true)
      .single();
      
    if (defaultInstanceError || !defaultInstance) {
      console.error('No default service instance found for Dify');
      return null;
    }
    
    serviceInstance = defaultInstance;
  }
  
  if (!serviceInstance) {
    console.error(`No service instance found for Dify app "${appId}"`);
    return null;
  }
  
  const instanceId = serviceInstance.id;
  
  if (!instanceId) {
    console.error(`No valid instance ID for Dify app "${appId}"`);
    return null;
  }
  
  // 4. 获取 API 密钥
  const { data: apiKey, error: apiKeyError } = await supabase
    .from('api_keys')
    .select('*')
    .eq('service_instance_id', instanceId)
    .eq('is_default', true)
    .single();
    
  if (apiKeyError || !apiKey) {
    console.error('No API key found for Dify');
    return null;
  }
  
  // 检查 API 密钥是否为空
  if (!apiKey.key_value) {
    console.error('API key value is empty');
    return null;
  }
  
  try {
    
    let decryptedKey: string;
    
    // 如果密钥不是加密格式，直接使用
    if (!apiKey.key_value.includes(':')) {
      decryptedKey = apiKey.key_value;
    } else {
      try {     
        // 4. 解密 API 密钥
        decryptedKey = decryptApiKey(apiKey.key_value, masterKey);
      } catch (decryptError) {
        // 如果解密失败，使用测试密钥
        decryptedKey = 'app-test-api-key-for-development';
      }
    }
    
    // 5. 构建配置
    const config = {
      apiKey: decryptedKey,
      apiUrl: provider.base_url,
      appId: instance.instance_id,
      displayName: instance.display_name || instance.name,
      description: instance.description
    };
    
    return config;
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    return null;
  }
}

// 环境变量相关的配置请求函数已移除
// 现在我们只从数据库获取配置，不再使用环境变量