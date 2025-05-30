/**
 * 服务实例相关的数据库查询函数
 * 
 * 本文件包含与服务实例表(service_instances)相关的所有数据库操作
 * 更新为使用统一的数据服务和Result类型
 */

import { dataService } from '@lib/services/db/data-service';
import { cacheService, CacheKeys } from '@lib/services/db/cache-service';
import { realtimeService, SubscriptionKeys, SubscriptionConfigs } from '@lib/services/db/realtime-service';
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
    { column: 'display_name', ascending: true },
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
 * @param id 服务实例ID
 * @returns 是否删除成功
 */
export async function deleteServiceInstanceLegacy(id: string): Promise<boolean> {
  const result = await deleteServiceInstance(id);
  return result.success && result.data;
}

// --- BEGIN COMMENT ---
// 🎯 新增：应用参数相关的数据库操作接口
// 用于数据库优先的应用参数管理方案
// --- END COMMENT ---

/**
 * 从数据库获取应用参数配置
 * @param instanceId 应用实例ID
 * @returns 应用参数配置的Result，如果未配置则返回null
 */
export async function getAppParametersFromDb(instanceId: string): Promise<Result<any | null>> {
  return dataService.query(async () => {
    const result = await getServiceInstanceByInstanceId('dify', instanceId);
    
    if (!result.success || !result.data) {
      return null;
    }

    // 从config中提取dify_parameters
    const difyParameters = result.data.config?.dify_parameters;
    return difyParameters || null;
  });
}

/**
 * 更新应用参数到数据库
 * @param instanceId 应用实例ID
 * @param parameters 应用参数数据
 * @returns 更新操作的Result
 */
export async function updateAppParametersInDb(
  instanceId: string, 
  parameters: any
): Promise<Result<void>> {
  return dataService.query(async () => {
    // 先获取当前的服务实例
    const result = await getServiceInstanceByInstanceId('dify', instanceId);
    
    if (!result.success || !result.data) {
      throw new Error(`未找到实例ID为 ${instanceId} 的服务实例`);
    }

    // 更新config中的dify_parameters和sync_metadata
    const currentConfig = result.data.config || {};
    const updatedConfig = {
      ...currentConfig,
      dify_parameters: parameters,
      sync_metadata: {
        ...currentConfig.sync_metadata,
        last_sync_at: new Date().toISOString(),
        sync_status: 'success' as const,
        last_error: undefined
      }
    };

    // 执行更新
    const updateResult = await updateServiceInstance(result.data.id, {
      config: updatedConfig
    });

    if (!updateResult.success) {
      throw updateResult.error;
    }

    return undefined;
  });
}

/**
 * 批量同步应用参数到数据库
 * @param syncData 同步数据数组，包含instanceId和parameters
 * @returns 同步结果数组
 */
export async function batchUpdateAppParametersInDb(
  syncData: Array<{ instanceId: string; parameters: any; error?: string }>
): Promise<Result<Array<{ instanceId: string; success: boolean; error?: string }>>> {
  return dataService.query(async () => {
    const results: Array<{ instanceId: string; success: boolean; error?: string }> = [];

    for (const item of syncData) {
      try {
        if (item.error) {
          // 如果同步时就有错误，记录错误状态
          await updateAppParametersSyncStatus(item.instanceId, 'failed', item.error);
          results.push({
            instanceId: item.instanceId,
            success: false,
            error: item.error
          });
        } else {
          // 正常更新参数
          const updateResult = await updateAppParametersInDb(item.instanceId, item.parameters);
          results.push({
            instanceId: item.instanceId,
            success: updateResult.success,
            error: updateResult.success ? undefined : updateResult.error.message
          });
        }
      } catch (error) {
        results.push({
          instanceId: item.instanceId,
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    return results;
  });
}

/**
 * 更新应用参数同步状态
 * @param instanceId 应用实例ID
 * @param status 同步状态
 * @param error 错误信息（可选）
 * @returns 更新操作的Result
 */
export async function updateAppParametersSyncStatus(
  instanceId: string,
  status: 'success' | 'failed' | 'pending',
  error?: string
): Promise<Result<void>> {
  return dataService.query(async () => {
    const result = await getServiceInstanceByInstanceId('dify', instanceId);
    
    if (!result.success || !result.data) {
      throw new Error(`未找到实例ID为 ${instanceId} 的服务实例`);
    }

    const currentConfig = result.data.config || {};
    const updatedConfig = {
      ...currentConfig,
      sync_metadata: {
        ...currentConfig.sync_metadata,
        last_sync_at: new Date().toISOString(),
        sync_status: status,
        last_error: error
      }
    };

    const updateResult = await updateServiceInstance(result.data.id, {
      config: updatedConfig
    });

    if (!updateResult.success) {
      throw updateResult.error;
    }

    return undefined;
  });
}

/**
 * 获取需要同步的应用实例列表
 * @param maxAge 最大缓存时间（分钟），超过此时间的被认为需要同步
 * @returns 需要同步的服务实例列表
 */
export async function getAppInstancesForSync(maxAge: number = 60): Promise<Result<ServiceInstance[]>> {
  return dataService.query(async () => {
    // 获取所有dify类型的服务实例
    const result = await getServiceInstancesByProvider('dify');
    
    if (!result.success) {
      throw result.error;
    }

    const now = new Date();
    const maxAgeMs = maxAge * 60 * 1000;

    // 筛选需要同步的实例
    const needSyncInstances = result.data.filter(instance => {
      const syncMetadata = instance.config?.sync_metadata;
      
      // 如果没有同步元数据，需要同步
      if (!syncMetadata) {
        return true;
      }

      // 如果上次同步失败，需要重新同步
      if (syncMetadata.sync_status === 'failed') {
        return true;
      }

      // 如果超过最大缓存时间，需要同步
      if (syncMetadata.last_sync_at) {
        const lastSyncTime = new Date(syncMetadata.last_sync_at);
        const timeDiff = now.getTime() - lastSyncTime.getTime();
        return timeDiff > maxAgeMs;
      }

      // 默认需要同步
      return true;
    });

    return needSyncInstances;
  });
}

/**
 * 获取应用参数同步状态
 * @param instanceId 应用实例ID
 * @returns 同步状态信息
 */
export async function getAppParametersSyncStatus(instanceId: string): Promise<Result<{
  lastSyncAt?: string;
  syncStatus?: 'success' | 'failed' | 'pending';
  lastError?: string;
  hasParameters: boolean;
} | null>> {
  return dataService.query(async () => {
    const result = await getServiceInstanceByInstanceId('dify', instanceId);
    
    if (!result.success || !result.data) {
      return null;
    }

    const config = result.data.config || {};
    const syncMetadata = config.sync_metadata;
    const hasParameters = !!config.dify_parameters;

    return {
      lastSyncAt: syncMetadata?.last_sync_at,
      syncStatus: syncMetadata?.sync_status,
      lastError: syncMetadata?.last_error,
      hasParameters
    };
  });
}

/**
 * 设置默认服务实例（确保同一提供商只有一个默认实例）
 * @param instanceId 要设置为默认的实例ID
 * @returns 操作结果的Result
 */
export async function setDefaultServiceInstance(instanceId: string): Promise<Result<ServiceInstance>> {
  return dataService.query(async () => {
    // 首先获取要设置的实例信息
    const instanceResult = await getServiceInstanceById(instanceId);
    if (!instanceResult.success || !instanceResult.data) {
      throw new Error('找不到指定的服务实例');
    }
    
    const instance = instanceResult.data;
    
    // 在事务中执行：先将同一提供商的其他实例设为非默认，再设置当前实例为默认
    const { data, error } = await supabase.rpc('set_default_service_instance', {
      target_instance_id: instanceId,
      target_provider_id: instance.provider_id
    });
    
    if (error) {
      throw error;
    }
    
    // 清除相关缓存
    cacheService.deletePattern('service_instances:*');
    
    // 返回更新后的实例
    const updatedResult = await getServiceInstanceById(instanceId);
    if (!updatedResult.success) {
      throw updatedResult.error;
    }
    
    return updatedResult.data!;
  });
}
