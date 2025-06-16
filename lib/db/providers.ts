/**
 * 服务提供商相关的数据库查询函数
 * 
 * 本文件包含与服务提供商表(providers)相关的所有数据库操作
 * 更新为使用统一的数据服务和Result类型
 */

import { dataService } from '@lib/services/db/data-service';
import { cacheService, CacheKeys } from '@lib/services/db/cache-service';
import { realtimeService, SubscriptionKeys, SubscriptionConfigs } from '@lib/services/db/realtime-service';
import { Result, success, failure } from '@lib/types/result';
import { createClient } from '../supabase/client';
import { Provider } from '../types/database';

// 保持与现有代码的兼容性，同时使用新的数据服务
const supabase = createClient();

/**
 * 获取所有服务提供商（优化版本）
 * @returns 服务提供商列表的Result
 */
export async function getAllProviders(): Promise<Result<Provider[]>> {
  return dataService.findMany<Provider>(
    'providers',
    {},
    { column: 'name', ascending: true },
    undefined,
    {
      cache: true,
      cacheTTL: 15 * 60 * 1000, // 15分钟缓存，提供商信息变化较少
      subscribe: true,
      subscriptionKey: SubscriptionKeys.providers(),
      onUpdate: () => {
        // 提供商信息更新时清除缓存
        cacheService.deletePattern('providers:*');
      }
    }
  );
}

/**
 * 获取所有活跃的服务提供商（优化版本）
 * @returns 服务提供商列表的Result
 */
export async function getActiveProviders(): Promise<Result<Provider[]>> {
  return dataService.findMany<Provider>(
    'providers',
    { is_active: true },
    { column: 'name', ascending: true },
    undefined,
    {
      cache: true,
      cacheTTL: 15 * 60 * 1000, // 15分钟缓存，提供商信息变化较少
      subscribe: true,
      subscriptionKey: SubscriptionKeys.providers(),
      onUpdate: () => {
        // 提供商信息更新时清除缓存
        cacheService.deletePattern('providers:*');
      }
    }
  );
}

/**
 * 根据ID获取服务提供商（优化版本）
 * @param id 服务提供商ID
 * @returns 服务提供商对象的Result，如果未找到则返回null
 */
export async function getProviderById(id: string): Promise<Result<Provider | null>> {
  return dataService.findOne<Provider>(
    'providers',
    { id },
    {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10分钟缓存
    }
  );
}

/**
 * 根据名称获取服务提供商（优化版本）
 * @param name 服务提供商名称
 * @returns 服务提供商对象的Result，如果未找到则返回null
 */
export async function getProviderByName(name: string): Promise<Result<Provider | null>> {
  return dataService.findOne<Provider>(
    'providers',
    { name },
    {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10分钟缓存
    }
  );
}

/**
 * 获取默认服务提供商（优化版本）
 * @returns 默认服务提供商对象的Result，如果未找到则返回null
 */
export async function getDefaultProvider(): Promise<Result<Provider | null>> {
  return dataService.findOne<Provider>(
    'providers',
    { 
      is_default: true,
      is_active: true 
    },
    {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10分钟缓存
    }
  );
}

/**
 * 创建新的服务提供商（优化版本）
 * @param provider 服务提供商对象
 * @returns 创建的服务提供商对象Result，如果创建失败则返回错误
 */
export async function createProvider(
  provider: Omit<Provider, 'id' | 'created_at' | 'updated_at'>
): Promise<Result<Provider>> {
  const result = await dataService.create<Provider>('providers', provider);

  // 清除相关缓存
  if (result.success) {
    cacheService.deletePattern('providers:*');
  }

  return result;
}

/**
 * 更新服务提供商（优化版本）
 * @param id 服务提供商ID
 * @param updates 需要更新的字段
 * @returns 更新后的服务提供商对象Result，如果更新失败则返回错误
 */
export async function updateProvider(
  id: string,
  updates: Partial<Omit<Provider, 'id' | 'created_at' | 'updated_at'>>
): Promise<Result<Provider>> {
  const result = await dataService.update<Provider>('providers', id, updates);

  // 清除相关缓存
  if (result.success) {
    cacheService.deletePattern('providers:*');
  }

  return result;
}

/**
 * 删除服务提供商（优化版本）
 * @param id 服务提供商ID
 * @returns 是否删除成功的Result
 */
export async function deleteProvider(id: string): Promise<Result<boolean>> {
  const result = await dataService.delete('providers', id);

  if (result.success) {
    // 清除相关缓存
    cacheService.deletePattern('providers:*');
    return success(true);
  } else {
    return success(false);
  }
}

// --- BEGIN COMMENT ---
// 兼容性函数，保持与现有代码的兼容性
// 这些函数将逐步迁移到使用Result类型
// --- END COMMENT ---

/**
 * 获取所有活跃的服务提供商（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function getActiveProvidersLegacy(): Promise<Provider[]> {
  const result = await getActiveProviders();
  return result.success ? result.data : [];
}

/**
 * 根据ID获取服务提供商（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function getProviderByIdLegacy(id: string): Promise<Provider | null> {
  const result = await getProviderById(id);
  return result.success ? result.data : null;
}

/**
 * 根据名称获取服务提供商（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function getProviderByNameLegacy(name: string): Promise<Provider | null> {
  const result = await getProviderByName(name);
  return result.success ? result.data : null;
}

/**
 * 获取默认服务提供商（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function getDefaultProviderLegacy(): Promise<Provider | null> {
  const result = await getDefaultProvider();
  return result.success ? result.data : null;
}

/**
 * 创建新的服务提供商（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function createProviderLegacy(
  provider: Omit<Provider, 'id' | 'created_at' | 'updated_at'>
): Promise<Provider | null> {
  const result = await createProvider(provider);
  return result.success ? result.data : null;
}

/**
 * 更新服务提供商（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function updateProviderLegacy(
  id: string,
  updates: Partial<Omit<Provider, 'id' | 'created_at' | 'updated_at'>>
): Promise<Provider | null> {
  const result = await updateProvider(id, updates);
  return result.success ? result.data : null;
}

/**
 * 删除服务提供商（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function deleteProviderLegacy(id: string): Promise<boolean> {
  const result = await deleteProvider(id);
  return result.success ? result.data : false;
}
