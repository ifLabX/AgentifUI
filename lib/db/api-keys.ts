/**
 * API密钥管理相关的数据库查询函数
 * 
 * 本文件包含与API密钥表(api_keys)相关的所有数据库操作
 */

import { createClient } from '@supabase/supabase-js';
import { ApiKey } from '../types/database';
import { encryptApiKey, decryptApiKey } from '../utils/encryption';

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * 获取指定服务实例的API密钥
 * @param serviceInstanceId 服务实例ID
 * @returns API密钥对象，如果未找到则返回null
 */
export async function getApiKeyByServiceInstance(serviceInstanceId: string): Promise<ApiKey | null> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('service_instance_id', serviceInstanceId)
    .eq('is_default', true)
    .single();

  if (error || !data) {
    console.error('获取API密钥失败:', error);
    return null;
  }

  return data as ApiKey;
}

/**
 * 创建新的API密钥
 * @param apiKey API密钥对象
 * @returns 创建的API密钥对象，如果创建失败则返回null
 */
export async function createApiKey(apiKey: Omit<ApiKey, 'id' | 'created_at' | 'updated_at'>): Promise<ApiKey | null> {
  // 加密API密钥值
  const masterKey = process.env.API_ENCRYPTION_KEY || '';
  if (!masterKey) {
    console.error('API_ENCRYPTION_KEY 环境变量未设置');
    return null;
  }
  const encryptedKeyValue = encryptApiKey(apiKey.key_value, masterKey);
  
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      ...apiKey,
      key_value: encryptedKeyValue,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('创建API密钥失败:', error);
    return null;
  }

  return data as ApiKey;
}

/**
 * 更新API密钥
 * @param id API密钥ID
 * @param updates 需要更新的字段
 * @returns 更新后的API密钥对象，如果更新失败则返回null
 */
export async function updateApiKey(
  id: string, 
  updates: Partial<Omit<ApiKey, 'id' | 'created_at' | 'updated_at'>>
): Promise<ApiKey | null> {
  // 如果包含密钥值，需要加密
  if (updates.key_value) {
    const masterKey = process.env.API_ENCRYPTION_KEY || '';
    if (!masterKey) {
      console.error('API_ENCRYPTION_KEY 环境变量未设置');
      return null;
    }
    updates.key_value = encryptApiKey(updates.key_value, masterKey);
  }
  
  const { data, error } = await supabase
    .from('api_keys')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('更新API密钥失败:', error);
    return null;
  }

  return data as ApiKey;
}

/**
 * 删除API密钥
 * @param id API密钥ID
 * @returns 是否删除成功
 */
export async function deleteApiKey(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除API密钥失败:', error);
    return false;
  }

  return true;
}

/**
 * 获取解密后的API密钥值
 * @param apiKeyId API密钥ID
 * @returns 解密后的API密钥值，如果获取失败则返回null
 */
export async function getDecryptedApiKey(apiKeyId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('key_value')
    .eq('id', apiKeyId)
    .single();

  if (error || !data) {
    console.error('获取API密钥失败:', error);
    return null;
  }

  try {
    const masterKey = process.env.API_ENCRYPTION_KEY || '';
    if (!masterKey) {
      console.error('API_ENCRYPTION_KEY 环境变量未设置');
      return null;
    }
    return decryptApiKey(data.key_value, masterKey);
  } catch (err) {
    console.error('解密API密钥失败:', err);
    return null;
  }
}

/**
 * 更新API密钥使用计数
 * @param id API密钥ID
 * @returns 是否更新成功
 */
export async function incrementApiKeyUsage(id: string): Promise<boolean> {
  const { error } = await supabase.rpc('increment_api_key_usage', { key_id: id });

  if (error) {
    console.error('更新API密钥使用计数失败:', error);
    return false;
  }

  return true;
}
