import { create } from 'zustand';
import { createClient } from '@lib/supabase/client';

// 导入类型定义
import { Provider, ServiceInstance, ApiKey } from '@lib/types/database';
import { Result } from '@lib/types/result';

// --- BEGIN COMMENT ---
// 重新导出类型定义，供其他组件使用
// --- END COMMENT ---
export type { Provider, ServiceInstance, ApiKey } from '@lib/types/database';

// 导入数据库操作函数
import {
  getActiveProviders,
  getProviderById,
  getProviderByName,
  createProvider,
  updateProvider,
  deleteProvider,
  getServiceInstancesByProvider,
  getDefaultServiceInstance,
  getServiceInstanceById,
  getServiceInstanceByInstanceId,
  createServiceInstance,
  updateServiceInstance,
  deleteServiceInstance,
  setDefaultServiceInstance,
  getApiKeyByServiceInstance,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  getDecryptedApiKey
} from '@lib/db';

interface ApiConfigState {
  providers: Provider[];
  serviceInstances: ServiceInstance[];
  apiKeys: ApiKey[];
  isLoading: boolean;
  error: Error | null;
  
  // 新的配置值
  newApiKey: string;
  newApiUrl: string;
  isUpdating: boolean;
  
  // 应用实例管理
  createAppInstance: (instance: Partial<ServiceInstance>, apiKey?: string) => Promise<ServiceInstance>;
  updateAppInstance: (id: string, instance: Partial<ServiceInstance>, apiKey?: string) => Promise<ServiceInstance>;
  deleteAppInstance: (id: string) => Promise<void>;
  setDefaultInstance: (instanceId: string) => Promise<void>;
  
  // 操作
  loadConfigData: () => Promise<void>;
  updateDifyConfig: () => Promise<void>;
  setNewApiKey: (key: string) => void;
  setNewApiUrl: (url: string) => void;
}

// --- BEGIN COMMENT ---
// 辅助函数：处理Result类型的返回值
// --- END COMMENT ---
function handleResult<T>(result: Result<T>, operation: string): T {
  if (!result.success) {
    throw new Error(`${operation}失败: ${result.error.message}`);
  }
  return result.data;
}

export const useApiConfigStore = create<ApiConfigState>((set, get) => ({
  providers: [],
  serviceInstances: [],
  apiKeys: [],
  isLoading: false,
  error: null,
  
  newApiKey: '',
  newApiUrl: '',
  isUpdating: false,
  
  // 创建应用实例
  createAppInstance: async (instance, apiKey) => {
    try {
      // 创建服务实例
      const newInstanceResult = await createServiceInstance({
        provider_id: instance.provider_id || '1', // 默认提供商ID
        display_name: instance.display_name || '',
        description: instance.description || '',
        instance_id: instance.instance_id || '',
        api_path: instance.api_path || '',
        is_default: instance.is_default || false,
        config: instance.config || {}
      });
      
      const newInstance = handleResult(newInstanceResult, '创建服务实例');
      
      // 更新本地状态 - 添加新实例到列表
      const { serviceInstances } = get();
      set({ serviceInstances: [...serviceInstances, newInstance] });
      
      // 如果提供了 API 密钥，则加密并存储
      if (apiKey) {
        // 加密 API 密钥
        const response = await fetch('/api/admin/encrypt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKey }),
        });
        
        if (!response.ok) {
          throw new Error('加密失败');
        }
        
        const { encryptedKey } = await response.json();
        
        // 创建 API 密钥 - 传递isEncrypted=true表示密钥已通过API端点加密
        const newApiKeyResult = await createApiKey({
          service_instance_id: newInstance.id,
          provider_id: newInstance.provider_id,
          key_value: encryptedKey,
          is_default: true,
          usage_count: 0,
          user_id: null,
          last_used_at: null
        }, true); // 标记密钥已加密
        
        const newApiKey = handleResult(newApiKeyResult, '创建 API 密钥');
        
        // 更新本地状态 - 添加新密钥到列表
        const { apiKeys } = get();
        set({ apiKeys: [...apiKeys, newApiKey] });
      }
      
      return newInstance;
    } catch (error) {
      console.error('创建应用实例时出错:', error);
      throw error;
    }
  },
  
  // 更新应用实例
  updateAppInstance: async (id, instance, apiKey) => {
    try {
      // 获取现有实例信息
      const existingInstanceResult = await getServiceInstanceById(id);
      const existingInstance = handleResult(existingInstanceResult, '获取应用实例');
      
      if (!existingInstance) {
        throw new Error('未找到要更新的应用实例');
      }
      
      // 🎯 修复：正确处理config字段的更新
      const configToSave = instance.config !== undefined ? instance.config : existingInstance.config;
      
      // 更新服务实例
      const updatedInstanceResult = await updateServiceInstance(id, {
        display_name: instance.display_name !== undefined ? instance.display_name : existingInstance.display_name,
        description: instance.description !== undefined ? instance.description : existingInstance.description,
        api_path: instance.api_path || existingInstance.api_path,
        is_default: instance.is_default !== undefined ? instance.is_default : existingInstance.is_default,
        config: configToSave // 🎯 修复：正确更新config字段
      });
      
      const updatedInstance = handleResult(updatedInstanceResult, '更新服务实例');
      
      // 更新本地状态 - 更新实例列表中的对应项
      const { serviceInstances } = get();
      set({ 
        serviceInstances: serviceInstances.map(si => 
          si.id === id ? updatedInstance : si
        ) 
      });
      
      // 如果提供了 API 密钥，则加密并存储/更新
      if (apiKey) {
        // 加密 API 密钥
        const response = await fetch('/api/admin/encrypt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKey }),
        });
        
        if (!response.ok) {
          throw new Error('加密失败');
        }
        
        const { encryptedKey } = await response.json();
        
        // 查找现有 API 密钥
        const existingKeyResult = await getApiKeyByServiceInstance(id);
        const existingKey = handleResult(existingKeyResult, '获取 API 密钥');
        
        if (existingKey) {
          // 更新现有密钥 - 使用更新后的 updateApiKey 函数
          // 传递 isEncrypted=true 表示密钥已经通过API端点加密
          const updatedKeyResult = await updateApiKey(
            existingKey.id, 
            { key_value: encryptedKey },
            true // 标记密钥已加密
          );
          
          const updatedKey = handleResult(updatedKeyResult, '更新 API 密钥');
          
          // 更新本地状态 - 更新密钥列表中的对应项
          const { apiKeys } = get();
          set({
            apiKeys: apiKeys.map(k => 
              k.id === existingKey.id ? updatedKey : k
            )
          });
        } else {
          // 创建新密钥 - 使用更新后的 createApiKey 函数
          // 传递 isEncrypted=true 表示密钥已经通过API端点加密
          const newKeyResult = await createApiKey({
            service_instance_id: id,
            provider_id: existingInstance.provider_id,
            key_value: encryptedKey,
            is_default: true,
            usage_count: 0,
            user_id: null,
            last_used_at: null
          }, true); // 标记密钥已加密
          
          const newKey = handleResult(newKeyResult, '创建 API 密钥');
          
          // 更新本地状态 - 添加新密钥到列表
          const { apiKeys } = get();
          set({ apiKeys: [...apiKeys, newKey] });
        }
      }
      
      return updatedInstance;
    } catch (error) {
      console.error('更新应用实例时出错:', error);
      throw error;
    }
  },
  
  // 删除应用实例
  deleteAppInstance: async (id) => {
    try {
      // 获取现有实例信息
      const existingInstanceResult = await getServiceInstanceById(id);
      const existingInstance = handleResult(existingInstanceResult, '获取应用实例');
      
      if (!existingInstance) {
        throw new Error('未找到要删除的应用实例');
      }
      
      // 查找并删除相关的 API 密钥
      const existingKeyResult = await getApiKeyByServiceInstance(id);
      const existingKey = handleResult(existingKeyResult, '获取 API 密钥');
      
      if (existingKey) {
        const deletedResult = await deleteApiKey(existingKey.id);
        handleResult(deletedResult, '删除 API 密钥');
        
        // 更新本地状态 - 从密钥列表中移除
        const { apiKeys } = get();
        set({ apiKeys: apiKeys.filter(k => k.id !== existingKey.id) });
      }
      
      // 删除服务实例
      const deletedResult = await deleteServiceInstance(id);
      handleResult(deletedResult, '删除服务实例');
      
      // 更新本地状态 - 从实例列表中移除
      const { serviceInstances } = get();
      set({ serviceInstances: serviceInstances.filter(si => si.id !== id) });
    } catch (error) {
      console.error('删除应用实例时出错:', error);
      throw error;
    }
  },
  
  // 设置默认应用实例
  setDefaultInstance: async (instanceId) => {
    try {
      // 调用数据库函数设置默认实例
      const result = await setDefaultServiceInstance(instanceId);
      const updatedInstance = handleResult(result, '设置默认应用实例');
      
      // 更新本地状态 - 更新所有相关实例的is_default状态
      const { serviceInstances } = get();
      set({
        serviceInstances: serviceInstances.map(si => ({
          ...si,
          is_default: si.id === instanceId ? true : 
                     (si.provider_id === updatedInstance.provider_id ? false : si.is_default)
        }))
      });
    } catch (error) {
      console.error('设置默认应用实例时出错:', error);
      throw error;
    }
  },
  
  setNewApiKey: (key) => set({ newApiKey: key }),
  setNewApiUrl: (url) => set({ newApiUrl: url }),
  
  loadConfigData: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // 使用数据库函数获取所有提供商
      const providersResult = await getActiveProviders();
      const providers = handleResult(providersResult, '获取活跃提供商');
      
      // 获取每个提供商的服务实例
      const serviceInstances: ServiceInstance[] = [];
      for (const provider of providers) {
        const providerInstancesResult = await getServiceInstancesByProvider(provider.id);
        const providerInstances = handleResult(providerInstancesResult, `获取提供商 ${provider.name} 的服务实例`);
        serviceInstances.push(...providerInstances);
      }
      
      // 按显示名称排序
      const sortedServiceInstances = serviceInstances.sort((a, b) => 
        (a.display_name || a.instance_id).localeCompare(b.display_name || b.instance_id)
      );
      
      // 获取每个服务实例的API密钥
      const apiKeys: ApiKey[] = [];
      for (const instance of sortedServiceInstances) {
        const apiKeyResult = await getApiKeyByServiceInstance(instance.id);
        const apiKey = handleResult(apiKeyResult, `获取服务实例 ${instance.display_name || instance.instance_id} 的 API 密钥`);
        if (apiKey) {
          apiKeys.push(apiKey);
        }
      }
      
      // 更新状态
      set({ 
        providers, 
        serviceInstances: sortedServiceInstances, 
        apiKeys,
        isLoading: false,
        error: null
      });
      
      // 设置默认 Dify URL
      const difyProvider = providers.find(p => p.name === 'Dify');
      if (difyProvider) {
        set({ newApiUrl: difyProvider.base_url });
      }
    } catch (error) {
      console.error('加载配置数据时出错:', error);
      set({ 
        error: error instanceof Error ? error : new Error('加载配置数据时出错'), 
        isLoading: false 
      });
    }
  },
  
  updateDifyConfig: async () => {
    const { newApiKey, newApiUrl, providers, serviceInstances, apiKeys } = get();
    
    if (!newApiKey && !newApiUrl) {
      set({ error: new Error('请至少提供 API 密钥或 URL') });
      return;
    }
    
    set({ isUpdating: true, error: null });
    
    try {
      // 查找 Dify 提供商
      let difyProvider = providers.find(p => p.name === 'Dify');
      
      // 如果不存在，创建一个
      if (!difyProvider && newApiUrl) {
        const newProviderResult = await createProvider({
          name: 'Dify',
          type: 'llm',
          base_url: newApiUrl,
          auth_type: 'api_key',
          is_active: true
        });
          
        const newProvider = handleResult(newProviderResult, '创建 Dify 提供商');
        difyProvider = newProvider;
        
        // 更新提供商列表
        set({ providers: [...providers, newProvider] });
      } else if (difyProvider && newApiUrl && difyProvider.base_url !== newApiUrl) {
        // 更新 URL
        const updatedProviderResult = await updateProvider(difyProvider.id, { 
          base_url: newApiUrl 
        });
          
        const updatedProvider = handleResult(updatedProviderResult, '更新 Dify 提供商');
        
        // 更新本地状态
        set({
          providers: providers.map(p => 
            p.id === difyProvider?.id ? { ...p, base_url: newApiUrl } : p
          )
        });
      }
      
      // 如果有新的 API 密钥
      if (newApiKey && difyProvider) {
        // 查找默认服务实例
        let defaultInstance = serviceInstances.find(
          si => si.provider_id === difyProvider?.id && si.is_default
        );
        
        // 如果不存在，创建一个
        if (!defaultInstance) {
          const newInstanceResult = await createServiceInstance({
            provider_id: difyProvider.id,
            name: 'default',
            display_name: 'Default Dify Application',
            description: '默认 Dify 应用实例',
            instance_id: 'default',
            api_path: '',
            is_default: true,
            config: {}
          });
            
          const newInstance = handleResult(newInstanceResult, '创建默认服务实例');
          defaultInstance = newInstance;
          
          // 更新服务实例列表
          set({ serviceInstances: [...serviceInstances, newInstance] });
        }
        
        // 加密 API 密钥
        const response = await fetch('/api/admin/encrypt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKey: newApiKey }),
        });
        
        if (!response.ok) {
          throw new Error('加密失败');
        }
        
        const { encryptedKey } = await response.json();
        
        // 查找默认 API 密钥
        const defaultKey = apiKeys.find(
          k => k.service_instance_id === defaultInstance?.id && k.is_default
        );
        
        if (defaultKey) {
          // 更新现有密钥 - 传递isEncrypted=true表示密钥已通过API端点加密
          const updatedKeyResult = await updateApiKey(
            defaultKey.id, 
            { key_value: encryptedKey },
            true // 标记密钥已加密
          );
            
          const updatedKey = handleResult(updatedKeyResult, '更新默认 API 密钥');
          
          // 更新本地状态
          set({
            apiKeys: apiKeys.map(k => 
              k.id === defaultKey.id ? { ...k, key_value: encryptedKey } : k
            )
          });
        } else if (defaultInstance) {
          // 创建新密钥 - 传递isEncrypted=true表示密钥已通过API端点加密
          const newKeyResult = await createApiKey({
            service_instance_id: defaultInstance.id,
            provider_id: difyProvider.id,
            key_value: encryptedKey,
            is_default: true,
            usage_count: 0,
            user_id: null,
            last_used_at: null
          }, true); // 标记密钥已加密
            
          const newKey = handleResult(newKeyResult, '创建默认 API 密钥');
          
          // 更新 API 密钥列表
          set({ apiKeys: [...apiKeys, newKey] });
        }
      }
      
      // 清空输入
      set({ newApiKey: '', isUpdating: false });
    } catch (error) {
      console.error('更新 Dify 配置时出错:', error);
      set({ 
        error: error instanceof Error ? error : new Error('更新 Dify 配置时出错'), 
        isUpdating: false 
      });
    }
  }
}));
