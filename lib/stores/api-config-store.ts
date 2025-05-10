import { create } from 'zustand';
import { createClient } from '@lib/supabase/client';

// 导入类型定义
import { Provider, ServiceInstance, ApiKey } from '@lib/types/database';

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
  
  // 操作
  loadConfigData: () => Promise<void>;
  updateDifyConfig: () => Promise<void>;
  setNewApiKey: (key: string) => void;
  setNewApiUrl: (url: string) => void;
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
  
  // 创建新的应用实例
  createAppInstance: async (instance, apiKey) => {
    try {
      // 验证必要字段
      if (!instance.provider_id) {
        throw new Error('提供商 ID 不能为空');
      }
      
      if (!instance.instance_id) {
        throw new Error('应用 ID 不能为空');
      }
      
      // 检查应用 ID 是否已存在
      const existingInstance = await getServiceInstanceByInstanceId(instance.provider_id, instance.instance_id);
        
      if (existingInstance) {
        throw new Error(`应用 ID "${instance.instance_id}" 已存在`);
      }
      
      // 创建服务实例
      const newInstance = await createServiceInstance({
        provider_id: instance.provider_id,
        name: instance.name || instance.display_name || 'New Instance',
        display_name: instance.display_name || null,
        description: instance.description || null,
        instance_id: instance.instance_id,
        api_path: instance.api_path || '',
        is_default: instance.is_default || false,
        config: {}
      });
      
      if (!newInstance) {
        throw new Error('创建服务实例失败');
      }
      
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
        const newApiKey = await createApiKey({
          service_instance_id: newInstance.id,
          provider_id: instance.provider_id,
          key_value: encryptedKey,
          is_default: true,
          usage_count: 0,
          user_id: null,
          last_used_at: null
        }, true); // 标记密钥已加密
        
        if (!newApiKey) {
          throw new Error('创建 API 密钥失败');
        }
      }
      
      // 重新加载数据
      await get().loadConfigData();
      
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
      const existingInstance = await getServiceInstanceById(id);
      
      if (!existingInstance) {
        throw new Error('未找到要更新的应用实例');
      }
      
      // 更新服务实例
      const updatedInstance = await updateServiceInstance(id, {
        name: instance.name || instance.display_name || existingInstance.name,
        display_name: instance.display_name !== undefined ? instance.display_name : existingInstance.display_name,
        description: instance.description !== undefined ? instance.description : existingInstance.description,
        api_path: instance.api_path || existingInstance.api_path,
        is_default: instance.is_default !== undefined ? instance.is_default : existingInstance.is_default
      });
      
      if (!updatedInstance) {
        throw new Error('更新服务实例失败');
      }
      
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
        const existingKey = await getApiKeyByServiceInstance(id);
        
        if (existingKey) {
          // 更新现有密钥 - 使用更新后的 updateApiKey 函数
          // 传递 isEncrypted=true 表示密钥已经通过API端点加密
          const updatedKey = await updateApiKey(
            existingKey.id, 
            { key_value: encryptedKey },
            true // 标记密钥已加密
          );
          
          if (!updatedKey) {
            throw new Error('更新 API 密钥失败');
          }
        } else {
          // 创建新密钥 - 使用更新后的 createApiKey 函数
          // 传递 isEncrypted=true 表示密钥已经通过API端点加密
          const newKey = await createApiKey({
            service_instance_id: id,
            provider_id: existingInstance.provider_id,
            key_value: encryptedKey,
            is_default: true,
            usage_count: 0,
            user_id: null,
            last_used_at: null
          }, true); // 标记密钥已加密
          
          if (!newKey) {
            throw new Error('创建 API 密钥失败');
          }
        }
      }
      
      // 重新加载数据
      await get().loadConfigData();
      
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
      const existingInstance = await getServiceInstanceById(id);
      
      if (!existingInstance) {
        throw new Error('未找到要删除的应用实例');
      }
      
      // 查找并删除相关的 API 密钥
      const existingKey = await getApiKeyByServiceInstance(id);
      if (existingKey) {
        const deleted = await deleteApiKey(existingKey.id);
        if (!deleted) {
          throw new Error('删除 API 密钥失败');
        }
      }
      
      // 删除服务实例
      const deleted = await deleteServiceInstance(id);
      if (!deleted) {
        throw new Error('删除服务实例失败');
      }
      
      // 重新加载数据
      await get().loadConfigData();
    } catch (error) {
      console.error('删除应用实例时出错:', error);
      throw error;
    }
  },
  
  setNewApiKey: (key) => set({ newApiKey: key }),
  setNewApiUrl: (url) => set({ newApiUrl: url }),
  
  loadConfigData: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // 使用数据库函数获取所有提供商
      const providers = await getActiveProviders();
      
      // 获取每个提供商的服务实例
      const serviceInstances: ServiceInstance[] = [];
      for (const provider of providers) {
        const providerInstances = await getServiceInstancesByProvider(provider.id);
        serviceInstances.push(...providerInstances);
      }
      
      // 获取每个服务实例的API密钥
      const apiKeys: ApiKey[] = [];
      for (const instance of serviceInstances) {
        const apiKey = await getApiKeyByServiceInstance(instance.id);
        if (apiKey) {
          apiKeys.push(apiKey);
        }
      }
      
      // 更新状态
      set({ 
        providers, 
        serviceInstances, 
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
        const newProvider = await createProvider({
          name: 'Dify',
          type: 'llm',
          base_url: newApiUrl,
          auth_type: 'api_key',
          is_active: true
        });
          
        if (!newProvider) {
          throw new Error('创建提供商失败');
        }
        
        difyProvider = newProvider;
        
        // 更新提供商列表
        set({ providers: [...providers, newProvider] });
      } else if (difyProvider && newApiUrl && difyProvider.base_url !== newApiUrl) {
        // 更新 URL
        const updatedProvider = await updateProvider(difyProvider.id, { 
          base_url: newApiUrl 
        });
          
        if (!updatedProvider) {
          throw new Error('更新提供商失败');
        }
        
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
          const newInstance = await createServiceInstance({
            provider_id: difyProvider.id,
            name: 'default',
            display_name: 'Default Dify Application',
            description: '默认 Dify 应用实例',
            instance_id: 'default',
            api_path: '',
            is_default: true,
            config: {}
          });
            
          if (!newInstance) {
            throw new Error('创建服务实例失败');
          }
          
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
          const updatedKey = await updateApiKey(
            defaultKey.id, 
            { key_value: encryptedKey },
            true // 标记密钥已加密
          );
            
          if (!updatedKey) {
            throw new Error('更新 API 密钥失败');
          }
          
          // 更新本地状态
          set({
            apiKeys: apiKeys.map(k => 
              k.id === defaultKey.id ? { ...k, key_value: encryptedKey } : k
            )
          });
        } else if (defaultInstance) {
          // 创建新密钥 - 传递isEncrypted=true表示密钥已通过API端点加密
          const newKey = await createApiKey({
            service_instance_id: defaultInstance.id,
            provider_id: difyProvider.id,
            key_value: encryptedKey,
            is_default: true,
            usage_count: 0,
            user_id: null,
            last_used_at: null
          }, true); // 标记密钥已加密
            
          if (!newKey) {
            throw new Error('创建 API 密钥失败');
          }
          
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
