/**
 * API密钥管理相关的数据库查询函数
 * 
 * 本文件包含与API密钥表(api_keys)相关的所有数据库操作
 * 更新为使用统一的数据服务和Result类型
 */

import { dataService } from '@lib/services/data-service';
import { cacheService, CacheKeys } from '@lib/services/cache-service';
import { Result, success, failure } from '@lib/types/result';
import { createClient } from '../supabase/client';
import { ApiKey } from '../types/database';
import { encryptApiKey, decryptApiKey } from '../utils/encryption';

// 保持与现有代码的兼容性，同时使用新的数据服务
const supabase = createClient();

/**
 * 获取指定服务实例的API密钥（优化版本）
 * @param serviceInstanceId 服务实例ID
 * @returns API密钥对象的Result，如果未找到则返回null
 */
export async function getApiKeyByServiceInstance(serviceInstanceId: string): Promise<Result<ApiKey | null>> {
  return dataService.findOne<ApiKey>(
    'api_keys',
    { 
      service_instance_id: serviceInstanceId,
      is_default: true 
    },
    {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10分钟缓存
    }
  );
}

/**
 * 创建新的API密钥（优化版本）
 * @param apiKey API密钥对象
 * @param isEncrypted 密钥值是否已经加密，默认为false
 * @returns 创建的API密钥对象Result，如果创建失败则返回错误
 */
export async function createApiKey(
  apiKey: Omit<ApiKey, 'id' | 'created_at' | 'updated_at'>,
  isEncrypted: boolean = false
): Promise<Result<ApiKey>> {
  try {
    let keyValue = apiKey.key_value;
    
    // 如果密钥未加密，则进行加密
    if (!isEncrypted) {
      const masterKey = process.env.API_ENCRYPTION_KEY;
      if (!masterKey) {
        return failure(new Error('API_ENCRYPTION_KEY 环境变量未设置，无法加密 API 密钥'));
      }
      keyValue = encryptApiKey(apiKey.key_value, masterKey);
    }
    
    const result = await dataService.create<ApiKey>('api_keys', {
      ...apiKey,
      key_value: keyValue,
    });

    // 清除相关缓存
    if (result.success) {
      cacheService.deletePattern('api_keys:*');
    }

    return result;
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * 更新API密钥（优化版本）
 * @param id API密钥ID
 * @param updates 需要更新的字段
 * @param isEncrypted 密钥值是否已经加密，默认为false
 * @returns 更新后的API密钥对象Result，如果更新失败则返回错误
 */
export async function updateApiKey(
  id: string, 
  updates: Partial<Omit<ApiKey, 'id' | 'created_at' | 'updated_at'>>,
  isEncrypted: boolean = false
): Promise<Result<ApiKey>> {
  try {
    const processedUpdates = { ...updates };
    
    // 如果包含密钥值且未加密，需要加密
    if (updates.key_value && !isEncrypted) {
      const masterKey = process.env.API_ENCRYPTION_KEY;
      if (!masterKey) {
        return failure(new Error('API_ENCRYPTION_KEY 环境变量未设置，无法加密 API 密钥'));
      }
      processedUpdates.key_value = encryptApiKey(updates.key_value, masterKey);
    }
    
    const result = await dataService.update<ApiKey>('api_keys', id, processedUpdates);

    // 清除相关缓存
    if (result.success) {
      cacheService.deletePattern('api_keys:*');
    }

    return result;
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * 删除API密钥（优化版本）
 * @param id API密钥ID
 * @returns 是否删除成功的Result
 */
export async function deleteApiKey(id: string): Promise<Result<boolean>> {
  const result = await dataService.delete('api_keys', id);
  
  if (result.success) {
    // 清除相关缓存
    cacheService.deletePattern('api_keys:*');
    return success(true);
  } else {
    return success(false);
  }
}

/**
 * 获取解密后的API密钥值（优化版本）
 * @param apiKeyId API密钥ID
 * @returns 解密后的API密钥值Result，如果获取失败则返回错误
 */
export async function getDecryptedApiKey(apiKeyId: string): Promise<Result<string | null>> {
  try {
    const result = await dataService.findOne<{ key_value: string }>(
      'api_keys',
      { id: apiKeyId },
      {
        cache: true,
        cacheTTL: 5 * 60 * 1000, // 5分钟缓存
      }
    );

    if (!result.success) {
      return failure(result.error);
    }

    if (!result.data) {
      return success(null);
    }

    const masterKey = process.env.API_ENCRYPTION_KEY;
    if (!masterKey) {
      return failure(new Error('API_ENCRYPTION_KEY 环境变量未设置，无法解密 API 密钥'));
    }

    const decryptedKey = decryptApiKey(result.data.key_value, masterKey);
    return success(decryptedKey);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(`解密API密钥失败: ${String(error)}`));
  }
}

/**
 * 更新API密钥使用计数（优化版本）
 * @param id API密钥ID
 * @returns 是否更新成功的Result
 */
export async function incrementApiKeyUsage(id: string): Promise<Result<boolean>> {
  return dataService.query(async () => {
    const { error } = await supabase.rpc('increment_api_key_usage', { key_id: id });
    
    if (error) {
      throw error;
    }

    // 清除相关缓存
    cacheService.deletePattern('api_keys:*');
    
    return true;
  });
}

// --- BEGIN COMMENT ---
// 兼容性函数，保持与现有代码的兼容性
// 这些函数将逐步迁移到使用Result类型
// --- END COMMENT ---

/**
 * 获取指定服务实例的API密钥（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function getApiKeyByServiceInstanceLegacy(serviceInstanceId: string): Promise<ApiKey | null> {
  const result = await getApiKeyByServiceInstance(serviceInstanceId);
  return result.success ? result.data : null;
}

/**
 * 创建新的API密钥（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function createApiKeyLegacy(
  apiKey: Omit<ApiKey, 'id' | 'created_at' | 'updated_at'>,
  isEncrypted: boolean = false
): Promise<ApiKey | null> {
  const result = await createApiKey(apiKey, isEncrypted);
  return result.success ? result.data : null;
}

/**
 * 更新API密钥（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function updateApiKeyLegacy(
  id: string, 
  updates: Partial<Omit<ApiKey, 'id' | 'created_at' | 'updated_at'>>,
  isEncrypted: boolean = false
): Promise<ApiKey | null> {
  const result = await updateApiKey(id, updates, isEncrypted);
  return result.success ? result.data : null;
}

/**
 * 删除API密钥（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function deleteApiKeyLegacy(id: string): Promise<boolean> {
  const result = await deleteApiKey(id);
  return result.success ? result.data : false;
}

/**
 * 获取解密后的API密钥值（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function getDecryptedApiKeyLegacy(apiKeyId: string): Promise<string | null> {
  const result = await getDecryptedApiKey(apiKeyId);
  return result.success ? result.data : null;
}

/**
 * 更新API密钥使用计数（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function incrementApiKeyUsageLegacy(id: string): Promise<boolean> {
  const result = await incrementApiKeyUsage(id);
  return result.success ? result.data : false;
}
