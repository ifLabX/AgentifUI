/**
 * 服务实例相关的数据库查询函数
 * 
 * 本文件包含与服务实例表(service_instances)相关的所有数据库操作
 * 更新为使用统一的数据服务和Result类型
 */

import { dataService } from '@lib/services/data-service';
import { cacheService, CacheKeys } from '@lib/services/cache-service';
import { realtimeService, SubscriptionKeys, SubscriptionConfigs } from '@lib/services/realtime-service';
import { Result, success, failure } from '@lib/types/result';
import { createClient } from '../supabase/client';
import { ServiceInstance } from '../types/database';

// 保持与现有代码的兼容性，同时使用新的数据服务
const supabase = createClient();

/**
 * 获取指定提供商的所有服务实例（优化版本）
 * @param providerId 提供商ID
 * @returns 服务实例列表的Result
 */
export async function getServiceInstancesByProvider(providerId: string): Promise<Result<ServiceInstance[]>> {
  return dataService.findMany<ServiceInstance>(
    'service_instances',
    { provider_id: providerId },
    { column: 'name', ascending: true },
    undefined,
    {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10分钟缓存
      subscribe: true,
      subscriptionKey: SubscriptionKeys.serviceInstances(),
      onUpdate: () => {
        // 服务实例更新时清除缓存
        cacheService.deletePattern('service_instances:*');
      }
    }
  );
}

/**
 * 获取默认服务实例（优化版本）
 * @param providerId 提供商ID
 * @returns 默认服务实例的Result，如果未找到则返回null
 */
export async function getDefaultServiceInstance(providerId: string): Promise<Result<ServiceInstance | null>> {
  return dataService.findOne<ServiceInstance>(
    'service_instances',
    { 
      provider_id: providerId,
      is_default: true 
    },
    {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10分钟缓存
    }
  );
}

/**
 * 根据ID获取服务实例（优化版本）
 * @param id 服务实例ID
 * @returns 服务实例对象的Result，如果未找到则返回null
 */
export async function getServiceInstanceById(id: string): Promise<Result<ServiceInstance | null>> {
  return dataService.findOne<ServiceInstance>(
    'service_instances',
    { id },
    {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10分钟缓存
    }
  );
}

/**
 * 根据实例ID获取服务实例（优化版本）
 * @param providerId 提供商ID
 * @param instanceId 实例ID
 * @returns 服务实例对象的Result，如果未找到则返回null
 */
export async function getServiceInstanceByInstanceId(
  providerId: string,
  instanceId: string
): Promise<Result<ServiceInstance | null>> {
  return dataService.findOne<ServiceInstance>(
    'service_instances',
    { 
      provider_id: providerId,
      instance_id: instanceId 
    },
    {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10分钟缓存
    }
  );
}

/**
 * 创建新的服务实例（优化版本）
 * @param serviceInstance 服务实例对象
 * @returns 创建的服务实例对象Result，如果创建失败则返回错误
 */
export async function createServiceInstance(
  serviceInstance: Omit<ServiceInstance, 'id' | 'created_at' | 'updated_at'>
): Promise<Result<ServiceInstance>> {
  return dataService.query(async () => {
    // 如果是默认实例，需要先将其他实例设为非默认
    if (serviceInstance.is_default) {
      const { error: updateError } = await supabase
        .from('service_instances')
        .update({ is_default: false })
        .eq('provider_id', serviceInstance.provider_id)
        .eq('is_default', true);
      
      if (updateError) {
        throw updateError;
      }
    }

    // 创建新实例
    const result = await dataService.create<ServiceInstance>('service_instances', serviceInstance);
    
    if (!result.success) {
      throw result.error;
    }

    // 清除相关缓存
    cacheService.deletePattern('service_instances:*');
    
    return result.data;
  });
}

/**
 * 更新服务实例（优化版本）
 * @param id 服务实例ID
 * @param updates 需要更新的字段
 * @returns 更新后的服务实例对象Result，如果更新失败则返回错误
 */
export async function updateServiceInstance(
  id: string,
  updates: Partial<Omit<ServiceInstance, 'id' | 'created_at' | 'updated_at'>>
): Promise<Result<ServiceInstance>> {
  return dataService.query(async () => {
    // 如果是设置为默认实例，需要先将其他实例设为非默认
    if (updates.is_default) {
      const currentInstanceResult = await getServiceInstanceById(id);
      if (currentInstanceResult.success && currentInstanceResult.data) {
        const { error: updateError } = await supabase
          .from('service_instances')
          .update({ is_default: false })
          .eq('provider_id', currentInstanceResult.data.provider_id)
          .eq('is_default', true);
        
        if (updateError) {
          throw updateError;
        }
      }
    }

    // 更新实例
    const result = await dataService.update<ServiceInstance>('service_instances', id, updates);
    
    if (!result.success) {
      throw result.error;
    }

    // 清除相关缓存
    cacheService.deletePattern('service_instances:*');
    
    return result.data;
  });
}

/**
 * 删除服务实例（优化版本）
 * @param id 服务实例ID
 * @returns 是否删除成功的Result
 */
export async function deleteServiceInstance(id: string): Promise<Result<boolean>> {
  const result = await dataService.delete('service_instances', id);

  if (result.success) {
    // 清除相关缓存
    cacheService.deletePattern('service_instances:*');
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
 * 获取指定提供商的所有服务实例（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function getServiceInstancesByProviderLegacy(providerId: string): Promise<ServiceInstance[]> {
  const result = await getServiceInstancesByProvider(providerId);
  return result.success ? result.data : [];
}

/**
 * 获取默认服务实例（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function getDefaultServiceInstanceLegacy(providerId: string): Promise<ServiceInstance | null> {
  const result = await getDefaultServiceInstance(providerId);
  return result.success ? result.data : null;
}

/**
 * 根据ID获取服务实例（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function getServiceInstanceByIdLegacy(id: string): Promise<ServiceInstance | null> {
  const result = await getServiceInstanceById(id);
  return result.success ? result.data : null;
}

/**
 * 根据实例ID获取服务实例（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function getServiceInstanceByInstanceIdLegacy(
  providerId: string,
  instanceId: string
): Promise<ServiceInstance | null> {
  const result = await getServiceInstanceByInstanceId(providerId, instanceId);
  return result.success ? result.data : null;
}

/**
 * 创建新的服务实例（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function createServiceInstanceLegacy(
  serviceInstance: Omit<ServiceInstance, 'id' | 'created_at' | 'updated_at'>
): Promise<ServiceInstance | null> {
  const result = await createServiceInstance(serviceInstance);
  return result.success ? result.data : null;
}

/**
 * 更新服务实例（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function updateServiceInstanceLegacy(
  id: string,
  updates: Partial<Omit<ServiceInstance, 'id' | 'created_at' | 'updated_at'>>
): Promise<ServiceInstance | null> {
  const result = await updateServiceInstance(id, updates);
  return result.success ? result.data : null;
}

/**
 * 删除服务实例（兼容版本）
 * @deprecated 请使用新版本并处理Result类型
 */
export async function deleteServiceInstanceLegacy(id: string): Promise<boolean> {
  const result = await deleteServiceInstance(id);
  return result.success ? result.data : false;
}
