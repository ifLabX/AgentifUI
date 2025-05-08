import { createClient } from '../supabase/client';
import { decryptApiKey } from '../utils/encryption';

export interface DifyAppConfig {
  apiKey: string;
  apiUrl: string;
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
  // 服务器端日志
  console.log(`[获取Dify配置] 开始获取 ${appId} 的配置`);
  
  // 浏览器端日志（如果在浏览器环境中）
  if (typeof window !== 'undefined') {
    console.log(`%c[数据库配置] 正在获取 Dify ${appId} 的配置...`, 'background: #4CAF50; color: white; padding: 2px 4px; border-radius: 2px;');
  }
  
  // 检查缓存
  const cached = configCache[appId];
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    console.log(`[获取Dify配置] 从缓存中获取配置`);
    
    // 浏览器端日志（缓存命中）
    if (typeof window !== 'undefined') {
      console.log(`%c[数据库配置] 从缓存中获取到 Dify 配置，上次从数据库加载时间: ${new Date(cached.timestamp).toLocaleTimeString()}`, 'background: #2196F3; color: white; padding: 2px 4px; border-radius: 2px;');
    }
    
    return cached.config;
  }
  
  console.log(`[获取Dify配置] 缓存未命中，从数据库获取`);
  
  try {
    // 从数据库获取配置
    const config = await getDifyConfigFromDatabase(appId);
    
    if (config) {
      console.log(`[获取Dify配置] 成功从数据库获取配置`);
      
      // 浏览器端日志（成功获取）
      if (typeof window !== 'undefined') {
        console.log(`%c[数据库配置] 成功从数据库获取 Dify 配置！`, 'background: #4CAF50; color: white; padding: 4px 8px; border-radius: 2px; font-weight: bold;');
        console.log(`%c配置详情: API URL=${config.apiUrl}, API Key=${config.apiKey.substring(0, 4)}...${config.apiKey.substring(config.apiKey.length - 4)}`, 'color: #4CAF50;');
      }
      
      // 更新缓存
      configCache[appId] = {
        config,
        timestamp: Date.now()
      };
      
      return config;
    } else {
      console.error(`[获取Dify配置] 数据库中未找到 ${appId} 的配置`);
      
      // 浏览器端日志（未找到配置）
      if (typeof window !== 'undefined') {
        console.log(`%c[数据库配置] 错误: 数据库中未找到 Dify ${appId} 的配置`, 'background: #F44336; color: white; padding: 2px 4px; border-radius: 2px;');
      }
      
      return null;
    }
  } catch (error) {
    console.error(`[获取Dify配置] 从数据库获取 ${appId} 配置时出错:`, error);
    
    // 浏览器端日志（出错）
    if (typeof window !== 'undefined') {
      console.log(`%c[数据库配置] 错误: 从数据库获取 Dify 配置时出错`, 'background: #F44336; color: white; padding: 2px 4px; border-radius: 2px;');
      console.error(error);
    }
    
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
  const masterKey = process.env.API_ENCRYPTION_KEY;
  
  if (!masterKey) {
    console.error('API_ENCRYPTION_KEY is missing in environment variables');
    return null;
  }
  
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
  
  // 3. 获取 API 密钥
  const { data: apiKey, error: apiKeyError } = await supabase
    .from('api_keys')
    .select('key_value')
    .eq('provider_id', provider.id)
    .eq('is_default', true)
    .is('user_id', null)
    .single();
    
  if (apiKeyError || !apiKey) {
    console.error('No API key found for Dify');
    return null;
  }
  
  try {
    // 4. 解密 API 密钥
    const decryptedKey = decryptApiKey(apiKey.key_value, masterKey);
    
    // 5. 构建配置
    return {
      apiKey: decryptedKey,
      apiUrl: provider.base_url
    };
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    return null;
  }
}

// 环境变量相关的配置请求函数已移除
// 现在我们只从数据库获取配置，不再使用环境变量