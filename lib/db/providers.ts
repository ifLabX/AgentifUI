/**
 * 服务提供商相关的数据库查询函数
 * 
 * 本文件包含与服务提供商表(providers)相关的所有数据库操作
 */

import { createClient } from '@supabase/supabase-js';
import { Provider } from '../types/database';

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * 获取所有活跃的服务提供商
 * @returns 服务提供商列表
 */
export async function getActiveProviders(): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('获取服务提供商失败:', error);
    return [];
  }

  return data as Provider[];
}

/**
 * 根据ID获取服务提供商
 * @param id 服务提供商ID
 * @returns 服务提供商对象，如果未找到则返回null
 */
export async function getProviderById(id: string): Promise<Provider | null> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('获取服务提供商失败:', error);
    return null;
  }

  return data as Provider;
}

/**
 * 根据名称获取服务提供商
 * @param name 服务提供商名称
 * @returns 服务提供商对象，如果未找到则返回null
 */
export async function getProviderByName(name: string): Promise<Provider | null> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('name', name)
    .single();

  if (error || !data) {
    console.error('获取服务提供商失败:', error);
    return null;
  }

  return data as Provider;
}

/**
 * 创建新的服务提供商
 * @param provider 服务提供商对象
 * @returns 创建的服务提供商对象，如果创建失败则返回null
 */
export async function createProvider(
  provider: Omit<Provider, 'id' | 'created_at' | 'updated_at'>
): Promise<Provider | null> {
  const { data, error } = await supabase
    .from('providers')
    .insert(provider)
    .select()
    .single();

  if (error || !data) {
    console.error('创建服务提供商失败:', error);
    return null;
  }

  return data as Provider;
}

/**
 * 更新服务提供商
 * @param id 服务提供商ID
 * @param updates 需要更新的字段
 * @returns 更新后的服务提供商对象，如果更新失败则返回null
 */
export async function updateProvider(
  id: string,
  updates: Partial<Omit<Provider, 'id' | 'created_at' | 'updated_at'>>
): Promise<Provider | null> {
  const { data, error } = await supabase
    .from('providers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('更新服务提供商失败:', error);
    return null;
  }

  return data as Provider;
}

/**
 * 删除服务提供商
 * @param id 服务提供商ID
 * @returns 是否删除成功
 */
export async function deleteProvider(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('providers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除服务提供商失败:', error);
    return false;
  }

  return true;
}
