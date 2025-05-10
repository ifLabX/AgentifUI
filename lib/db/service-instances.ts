/**
 * 服务实例相关的数据库查询函数
 * 
 * 本文件包含与服务实例表(service_instances)相关的所有数据库操作
 */

import { createClient } from '../supabase/client';
import { ServiceInstance } from '../types/database';

// 使用单例模式的Supabase客户端
const supabase = createClient();

/**
 * 获取指定提供商的所有服务实例
 * @param providerId 提供商ID
 * @returns 服务实例列表
 */
export async function getServiceInstancesByProvider(providerId: string): Promise<ServiceInstance[]> {
  const { data, error } = await supabase
    .from('service_instances')
    .select('*')
    .eq('provider_id', providerId)
    .order('name');

  if (error) {
    console.error('获取服务实例失败:', error);
    return [];
  }

  return data as ServiceInstance[];
}

/**
 * 获取默认服务实例
 * @param providerId 提供商ID
 * @returns 默认服务实例，如果未找到则返回null
 */
export async function getDefaultServiceInstance(providerId: string): Promise<ServiceInstance | null> {
  const { data, error } = await supabase
    .from('service_instances')
    .select('*')
    .eq('provider_id', providerId)
    .eq('is_default', true)
    .single();

  if (error || !data) {
    console.error('获取默认服务实例失败:', error);
    return null;
  }

  return data as ServiceInstance;
}

/**
 * 根据ID获取服务实例
 * @param id 服务实例ID
 * @returns 服务实例对象，如果未找到则返回null
 */
export async function getServiceInstanceById(id: string): Promise<ServiceInstance | null> {
  const { data, error } = await supabase
    .from('service_instances')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('获取服务实例失败:', error);
    return null;
  }

  return data as ServiceInstance;
}

/**
 * 根据实例ID获取服务实例
 * @param providerId 提供商ID
 * @param instanceId 实例ID
 * @returns 服务实例对象，如果未找到则返回null
 */
export async function getServiceInstanceByInstanceId(
  providerId: string,
  instanceId: string
): Promise<ServiceInstance | null> {
  const { data, error } = await supabase
    .from('service_instances')
    .select('*')
    .eq('provider_id', providerId)
    .eq('instance_id', instanceId)
    .single();

  if (error || !data) {
    console.error('获取服务实例失败:', error);
    return null;
  }

  return data as ServiceInstance;
}

/**
 * 创建新的服务实例
 * @param serviceInstance 服务实例对象
 * @returns 创建的服务实例对象，如果创建失败则返回null
 */
export async function createServiceInstance(
  serviceInstance: Omit<ServiceInstance, 'id' | 'created_at' | 'updated_at'>
): Promise<ServiceInstance | null> {
  // 如果是默认实例，需要先将其他实例设为非默认
  if (serviceInstance.is_default) {
    await supabase
      .from('service_instances')
      .update({ is_default: false })
      .eq('provider_id', serviceInstance.provider_id)
      .eq('is_default', true);
  }

  const { data, error } = await supabase
    .from('service_instances')
    .insert(serviceInstance)
    .select()
    .single();

  if (error || !data) {
    console.error('创建服务实例失败:', error);
    return null;
  }

  return data as ServiceInstance;
}

/**
 * 更新服务实例
 * @param id 服务实例ID
 * @param updates 需要更新的字段
 * @returns 更新后的服务实例对象，如果更新失败则返回null
 */
export async function updateServiceInstance(
  id: string,
  updates: Partial<Omit<ServiceInstance, 'id' | 'created_at' | 'updated_at'>>
): Promise<ServiceInstance | null> {
  // 如果是设置为默认实例，需要先将其他实例设为非默认
  if (updates.is_default) {
    const currentInstance = await getServiceInstanceById(id);
    if (currentInstance) {
      await supabase
        .from('service_instances')
        .update({ is_default: false })
        .eq('provider_id', currentInstance.provider_id)
        .eq('is_default', true);
    }
  }

  const { data, error } = await supabase
    .from('service_instances')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('更新服务实例失败:', error);
    return null;
  }

  return data as ServiceInstance;
}

/**
 * 删除服务实例
 * @param id 服务实例ID
 * @returns 是否删除成功
 */
export async function deleteServiceInstance(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('service_instances')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除服务实例失败:', error);
    return false;
  }

  return true;
}
