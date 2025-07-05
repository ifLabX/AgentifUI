// 导入数据库操作函数
import {
  createApiKey,
  createProvider,
  createServiceInstance,
  deleteApiKey,
  deleteProvider,
  deleteServiceInstance,
  getActiveProviders,
  getApiKeyByServiceInstance,
  getDecryptedApiKey,
  getDefaultServiceInstance,
  getProviderById,
  getProviderByName,
  getServiceInstanceById,
  getServiceInstanceByInstanceId,
  getServiceInstancesByProvider,
  setDefaultServiceInstance,
  updateApiKey,
  updateProvider,
  updateServiceInstance,
} from '@lib/db';
import { createClient } from '@lib/supabase/client';
// 导入类型定义
import { ApiKey, Provider, ServiceInstance } from '@lib/types/database';
import { Result } from '@lib/types/result';
import { create } from 'zustand';

// 重新导出类型定义，供其他组件使用
export type { Provider, ServiceInstance, ApiKey } from '@lib/types/database';

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
  createAppInstance: (
    instance: Partial<ServiceInstance>,
    apiKey?: string
  ) => Promise<ServiceInstance>;
  updateAppInstance: (
    id: string,
    instance: Partial<ServiceInstance>,
    apiKey?: string
  ) => Promise<ServiceInstance>;
  deleteAppInstance: (id: string) => Promise<void>;
  setDefaultInstance: (instanceId: string) => Promise<void>;

  // 操作
  loadConfigData: () => Promise<void>;
  updateDifyConfig: () => Promise<void>;
  setNewApiKey: (key: string) => void;
  setNewApiUrl: (url: string) => void;
}

// 辅助函数：处理Result类型的返回值
function handleResult<T>(result: Result<T>, operation: string): T {
  if (!result.success) {
    throw new Error(`${operation} failed: ${result.error.message}`);
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
        visibility: instance.visibility || 'public', // 默认为公开应用
        config: instance.config || {},
      });

      const newInstance = handleResult(
        newInstanceResult,
        'Create service instance'
      );

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
          throw new Error('Encryption failed');
        }

        const { encryptedKey } = await response.json();

        // 创建 API 密钥 - 传递isEncrypted=true表示密钥已通过API端点加密
        const newApiKeyResult = await createApiKey(
          {
            service_instance_id: newInstance.id,
            provider_id: newInstance.provider_id,
            key_value: encryptedKey,
            is_default: true,
            usage_count: 0,
            user_id: null,
            last_used_at: null,
          },
          true
        ); // 标记密钥已加密

        const newApiKey = handleResult(newApiKeyResult, 'Create API key');

        // 更新本地状态 - 添加新密钥到列表
        const { apiKeys } = get();
        set({ apiKeys: [...apiKeys, newApiKey] });
      }

      return newInstance;
    } catch (error) {
      console.error('Error creating app instance:', error);
      throw error;
    }
  },

  // 更新应用实例
  updateAppInstance: async (id, instance, apiKey) => {
    try {
      // 获取现有实例信息
      const existingInstanceResult = await getServiceInstanceById(id);
      const existingInstance = handleResult(
        existingInstanceResult,
        'Get app instance'
      );

      if (!existingInstance) {
        throw new Error('App instance not found for update');
      }

      // 🎯 修复：正确处理config字段的更新
      const configToSave =
        instance.config !== undefined
          ? instance.config
          : existingInstance.config;

      // 更新服务实例
      const updatedInstanceResult = await updateServiceInstance(id, {
        display_name:
          instance.display_name !== undefined
            ? instance.display_name
            : existingInstance.display_name,
        description:
          instance.description !== undefined
            ? instance.description
            : existingInstance.description,
        api_path: instance.api_path || existingInstance.api_path,
        is_default:
          instance.is_default !== undefined
            ? instance.is_default
            : existingInstance.is_default,
        config: configToSave, // 🎯 修复：正确更新config字段
      });

      const updatedInstance = handleResult(
        updatedInstanceResult,
        'Update service instance'
      );

      // 更新本地状态 - 更新实例列表中的对应项
      const { serviceInstances } = get();
      set({
        serviceInstances: serviceInstances.map(si =>
          si.id === id ? updatedInstance : si
        ),
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
          throw new Error('Encryption failed');
        }

        const { encryptedKey } = await response.json();

        // 查找现有 API 密钥
        const existingKeyResult = await getApiKeyByServiceInstance(id);
        const existingKey = handleResult(existingKeyResult, 'Get API key');

        if (existingKey) {
          // 更新现有密钥 - 使用更新后的 updateApiKey 函数
          // 传递 isEncrypted=true 表示密钥已经通过API端点加密
          const updatedKeyResult = await updateApiKey(
            existingKey.id,
            { key_value: encryptedKey },
            true // 标记密钥已加密
          );

          const updatedKey = handleResult(updatedKeyResult, 'Update API key');

          // 更新本地状态 - 更新密钥列表中的对应项
          const { apiKeys } = get();
          set({
            apiKeys: apiKeys.map(k =>
              k.id === existingKey.id ? updatedKey : k
            ),
          });
        } else {
          // 创建新密钥 - 使用更新后的 createApiKey 函数
          // 传递 isEncrypted=true 表示密钥已经通过API端点加密
          const newKeyResult = await createApiKey(
            {
              service_instance_id: id,
              provider_id: existingInstance.provider_id,
              key_value: encryptedKey,
              is_default: true,
              usage_count: 0,
              user_id: null,
              last_used_at: null,
            },
            true
          ); // 标记密钥已加密

          const newKey = handleResult(newKeyResult, 'Create API key');

          // 更新本地状态 - 添加新密钥到列表
          const { apiKeys } = get();
          set({ apiKeys: [...apiKeys, newKey] });
        }
      }

      return updatedInstance;
    } catch (error) {
      console.error('Error updating app instance:', error);
      throw error;
    }
  },

  // 删除应用实例
  deleteAppInstance: async id => {
    try {
      // 获取现有实例信息
      const existingInstanceResult = await getServiceInstanceById(id);
      const existingInstance = handleResult(
        existingInstanceResult,
        'Get app instance'
      );

      if (!existingInstance) {
        throw new Error('App instance not found for deletion');
      }

      // 🎯 新增：删除应用实例时同步从常用应用存储中移除
      const instanceId = existingInstance.instance_id;

      // 查找并删除相关的 API 密钥
      const existingKeyResult = await getApiKeyByServiceInstance(id);
      const existingKey = handleResult(existingKeyResult, 'Get API key');

      if (existingKey) {
        const deletedResult = await deleteApiKey(existingKey.id);
        handleResult(deletedResult, 'Delete API key');

        // 更新本地状态 - 从密钥列表中移除
        const { apiKeys } = get();
        set({ apiKeys: apiKeys.filter(k => k.id !== existingKey.id) });
      }

      // 删除服务实例
      const deletedResult = await deleteServiceInstance(id);
      handleResult(deletedResult, 'Delete service instance');

      // 更新本地状态 - 从实例列表中移除
      const { serviceInstances } = get();
      set({ serviceInstances: serviceInstances.filter(si => si.id !== id) });

      // 🎯 新增：从常用应用存储中移除被删除的应用
      try {
        const { useFavoriteAppsStore } = await import('./favorite-apps-store');
        const { removeFavoriteApp } = useFavoriteAppsStore.getState();
        removeFavoriteApp(instanceId);
        console.log(`[删除应用] 已从常用应用中移除: ${instanceId}`);
      } catch (favoriteError) {
        console.warn(
          `[删除应用] 从常用应用中移除失败: ${instanceId}`,
          favoriteError
        );
        // 不抛出错误，因为这不应该阻止主要的删除操作
      }
    } catch (error) {
      console.error('Error deleting app instance:', error);
      throw error;
    }
  },

  // 设置默认应用实例
  setDefaultInstance: async instanceId => {
    try {
      // 调用数据库函数设置默认实例
      const result = await setDefaultServiceInstance(instanceId);
      const updatedInstance = handleResult(result, 'Set default app instance');

      // 更新本地状态 - 更新所有相关实例的is_default状态
      const { serviceInstances } = get();
      set({
        serviceInstances: serviceInstances.map(si => ({
          ...si,
          is_default:
            si.id === instanceId
              ? true
              : si.provider_id === updatedInstance.provider_id
                ? false
                : si.is_default,
        })),
      });
    } catch (error) {
      console.error('Error setting default app instance:', error);
      throw error;
    }
  },

  setNewApiKey: key => set({ newApiKey: key }),
  setNewApiUrl: url => set({ newApiUrl: url }),

  loadConfigData: async () => {
    try {
      set({ isLoading: true, error: null });

      console.time('[API Config] 总加载时间');

      // 使用数据库函数获取所有提供商
      console.time('[API Config] 获取提供商');
      const providersResult = await getActiveProviders();
      const providers = handleResult(providersResult, 'Get active providers');
      console.timeEnd('[API Config] 获取提供商');

      // 🚀 优化：并行获取每个提供商的服务实例
      // 从串行查询改为并行查询，显著提升性能
      console.time('[API Config] 并行获取服务实例');
      const instancePromises = providers.map(provider =>
        getServiceInstancesByProvider(provider.id)
          .then(result => ({
            provider,
            result,
            instances: result.success ? result.data : [],
          }))
          .catch(error => {
            console.warn(
              `Failed to get service instances for provider ${provider.name}:`,
              error
            );
            return {
              provider,
              result: { success: false, error },
              instances: [],
            };
          })
      );

      const instanceResults = await Promise.all(instancePromises);
      console.timeEnd('[API Config] 并行获取服务实例');

      // 合并所有服务实例并处理错误
      const serviceInstances: ServiceInstance[] = [];
      for (const { provider, result, instances } of instanceResults) {
        if (result.success) {
          serviceInstances.push(...instances);
        } else {
          console.error(
            `Failed to get service instances for provider ${provider.name}:`,
            result.error
          );
        }
      }

      // 按显示名称排序
      const sortedServiceInstances = serviceInstances.sort((a, b) =>
        (a.display_name || a.instance_id).localeCompare(
          b.display_name || b.instance_id
        )
      );

      // 🚀 优化：并行获取每个服务实例的API密钥
      // 从串行查询改为并行查询，显著提升性能
      console.time('[API Config] 并行获取API密钥');
      const keyPromises = sortedServiceInstances.map(instance =>
        getApiKeyByServiceInstance(instance.id)
          .then(result => ({
            instance,
            result,
            apiKey: result.success ? result.data : null,
          }))
          .catch(error => {
            console.warn(
              `Failed to get API key for service instance ${instance.display_name || instance.instance_id}:`,
              error
            );
            return {
              instance,
              result: { success: false, error },
              apiKey: null,
            };
          })
      );

      const keyResults = await Promise.all(keyPromises);
      console.timeEnd('[API Config] 并行获取API密钥');

      // 筛选有效的API密钥并处理错误
      const apiKeys: ApiKey[] = [];
      for (const { instance, result, apiKey } of keyResults) {
        if (result.success && apiKey) {
          apiKeys.push(apiKey);
        } else if (!result.success) {
          console.error(
            `Failed to get API key for service instance ${instance.display_name || instance.instance_id}:`,
            result.error
          );
        }
        // 如果 result.success 为 true 但 apiKey 为 null，说明该实例没有配置API密钥，这是正常情况
      }

      console.timeEnd('[API Config] 总加载时间');
      console.log(
        `[API Config] 加载完成 - 提供商: ${providers.length}, 服务实例: ${sortedServiceInstances.length}, API密钥: ${apiKeys.length}`
      );

      // 更新状态
      set({
        providers,
        serviceInstances: sortedServiceInstances,
        apiKeys,
        isLoading: false,
        error: null,
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
        isLoading: false,
      });
    }
  },

  updateDifyConfig: async () => {
    const { newApiKey, newApiUrl, providers, serviceInstances, apiKeys } =
      get();

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
          is_active: true,
          is_default: false,
        });

        const newProvider = handleResult(
          newProviderResult,
          'Create Dify provider'
        );
        difyProvider = newProvider;

        // 更新提供商列表
        set({ providers: [...providers, newProvider] });
      } else if (
        difyProvider &&
        newApiUrl &&
        difyProvider.base_url !== newApiUrl
      ) {
        // 更新 URL
        const updatedProviderResult = await updateProvider(difyProvider.id, {
          base_url: newApiUrl,
        });

        const updatedProvider = handleResult(
          updatedProviderResult,
          'Update Dify provider'
        );

        // 更新本地状态
        set({
          providers: providers.map(p =>
            p.id === difyProvider?.id ? { ...p, base_url: newApiUrl } : p
          ),
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
            display_name: 'Default Dify Application',
            description: '默认 Dify 应用实例',
            instance_id: 'default',
            api_path: '',
            is_default: true,
            visibility: 'public', // 默认为公开应用
            config: {},
          });

          const newInstance = handleResult(
            newInstanceResult,
            'Create default service instance'
          );
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
          throw new Error('Encryption failed');
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

          const updatedKey = handleResult(
            updatedKeyResult,
            'Update default API key'
          );

          // 更新本地状态
          set({
            apiKeys: apiKeys.map(k =>
              k.id === defaultKey.id ? { ...k, key_value: encryptedKey } : k
            ),
          });
        } else if (defaultInstance) {
          // 创建新密钥 - 传递isEncrypted=true表示密钥已通过API端点加密
          const newKeyResult = await createApiKey(
            {
              service_instance_id: defaultInstance.id,
              provider_id: difyProvider.id,
              key_value: encryptedKey,
              is_default: true,
              usage_count: 0,
              user_id: null,
              last_used_at: null,
            },
            true
          ); // 标记密钥已加密

          const newKey = handleResult(newKeyResult, 'Create default API key');

          // 更新 API 密钥列表
          set({ apiKeys: [...apiKeys, newKey] });
        }
      }

      // 清空输入
      set({ newApiKey: '', isUpdating: false });
    } catch (error) {
      console.error('Error updating Dify config:', error);
      set({
        error:
          error instanceof Error ? error : new Error('更新 Dify 配置时出错'),
        isUpdating: false,
      });
    }
  },
}));
