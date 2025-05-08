import { create } from 'zustand';
import { createClient } from '@lib/supabase/client';

// 类型定义
export interface Provider {
  id: string;
  name: string;
  type: string;
  base_url: string;
  auth_type?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ServiceInstance {
  id: string;
  provider_id: string;
  name: string;
  display_name?: string;
  description?: string;
  instance_id: string;
  api_path?: string;
  is_default: boolean;
  config?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface ApiKey {
  id: string;
  provider_id?: string;
  service_instance_id: string;
  key_value: string;
  is_default: boolean;
  usage_count?: number;
  last_used_at?: string;
  created_at: string;
  updated_at?: string;
}

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
    const supabase = createClient();
    
    try {
      // 验证必要字段
      if (!instance.provider_id) {
        throw new Error('提供商 ID 不能为空');
      }
      
      if (!instance.instance_id) {
        throw new Error('应用 ID 不能为空');
      }
      
      // 检查应用 ID 是否已存在
      const { data: existingInstance } = await supabase
        .from('service_instances')
        .select('id')
        .eq('instance_id', instance.instance_id)
        .maybeSingle();
        
      if (existingInstance) {
        throw new Error(`应用 ID "${instance.instance_id}" 已存在`);
      }
      
      // 创建服务实例
      const { data: newInstance, error: instanceError } = await supabase
        .from('service_instances')
        .insert({
          provider_id: instance.provider_id,
          name: instance.name || instance.display_name,
          display_name: instance.display_name,
          description: instance.description,
          instance_id: instance.instance_id,
          api_path: instance.api_path,
          is_default: instance.is_default || false
        })
        .select()
        .single();
        
      if (instanceError) throw instanceError;
      
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
        
        // 创建 API 密钥
        const { error: keyError } = await supabase
          .from('api_keys')
          .insert({
            service_instance_id: newInstance.id,
            provider_id: instance.provider_id,
            key_value: encryptedKey,
            is_default: true
          });
          
        if (keyError) throw keyError;
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
    const supabase = createClient();
    
    try {
      // 更新服务实例
      const { data: updatedInstance, error: instanceError } = await supabase
        .from('service_instances')
        .update({
          name: instance.name || instance.display_name,
          display_name: instance.display_name,
          description: instance.description,
          api_path: instance.api_path,
          is_default: instance.is_default
        })
        .eq('id', id)
        .select()
        .single();
        
      if (instanceError) throw instanceError;
      
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
        const { data: existingKeys } = await supabase
          .from('api_keys')
          .select('id')
          .eq('service_instance_id', id);
          
        if (existingKeys && existingKeys.length > 0) {
          // 更新现有密钥
          const { error: keyError } = await supabase
            .from('api_keys')
            .update({ key_value: encryptedKey })
            .eq('id', existingKeys[0].id);
            
          if (keyError) throw keyError;
        } else {
          // 创建新密钥
          const { error: keyError } = await supabase
            .from('api_keys')
            .insert({
              service_instance_id: id,
              provider_id: instance.provider_id,
              key_value: encryptedKey,
              is_default: true
            });
            
          if (keyError) throw keyError;
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
    const supabase = createClient();
    
    try {
      // 先删除相关的 API 密钥
      const { error: keyError } = await supabase
        .from('api_keys')
        .delete()
        .eq('service_instance_id', id);
        
      if (keyError) throw keyError;
      
      // 再删除服务实例
      const { error: instanceError } = await supabase
        .from('service_instances')
        .delete()
        .eq('id', id);
        
      if (instanceError) throw instanceError;
      
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
    const supabase = createClient();
    
    console.log('[调试] 开始加载 API 配置数据');
    
    try {
      set({ isLoading: true, error: null });
      
      // 加载提供商
      const { data: providersData, error: providersError } = await supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('[调试] 提供商数据:', {
        数量: providersData?.length || 0,
        错误: providersError ? providersError.message : null,
        数据样本: providersData?.slice(0, 2).map(p => ({
          id: p.id,
          name: p.name,
          base_url: p.base_url
        }))
      });
        
      if (providersError) throw providersError;
      
      // 加载服务实例
      const { data: instancesData, error: instancesError } = await supabase
        .from('service_instances')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('[调试] 服务实例数据:', {
        数量: instancesData?.length || 0,
        错误: instancesError ? instancesError.message : null,
        数据样本: instancesData?.slice(0, 2).map(i => ({
          id: i.id,
          provider_id: i.provider_id,
          instance_id: i.instance_id,
          name: i.name,
          display_name: i.display_name,
          is_default: i.is_default
        }))
      });
        
      if (instancesError) throw instancesError;
      
      // 加载 API 密钥
      const { data: keysData, error: keysError } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('[调试] API 密钥数据:', {
        数量: keysData?.length || 0,
        错误: keysError ? keysError.message : null,
        数据样本: keysData?.slice(0, 2).map(k => ({
          id: k.id,
          service_instance_id: k.service_instance_id,
          provider_id: k.provider_id,
          is_default: k.is_default,
          有密钥值: !!k.key_value
        }))
      });
        
      if (keysError) throw keysError;
      
      // 更新状态
      set({ 
        providers: providersData || [], 
        serviceInstances: instancesData || [], 
        apiKeys: keysData || [],
        isLoading: false 
      });
      
      // 设置默认 Dify URL
      const difyProvider = providersData?.find(p => p.name === 'Dify');
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
    const supabase = createClient();
    
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
        const { data: newProvider, error: providerError } = await supabase
          .from('providers')
          .insert({
            name: 'Dify',
            type: 'llm',
            base_url: newApiUrl,
          })
          .select()
          .single();
          
        if (providerError) throw providerError;
        difyProvider = newProvider;
        
        // 更新提供商列表
        set({ providers: [...providers, newProvider] });
      } else if (difyProvider && newApiUrl && difyProvider.base_url !== newApiUrl) {
        // 更新 URL
        const { error: updateError } = await supabase
          .from('providers')
          .update({ base_url: newApiUrl })
          .eq('id', difyProvider.id);
          
        if (updateError) throw updateError;
        
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
          const { data: newInstance, error: instanceError } = await supabase
            .from('service_instances')
            .insert({
              provider_id: difyProvider.id,
              name: 'default',
              display_name: 'Default Dify Application',
              description: '默认 Dify 应用实例',
              instance_id: 'default',
              is_default: true,
            })
            .select()
            .single();
            
          if (instanceError) throw instanceError;
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
          // 更新现有密钥
          const { error: updateKeyError } = await supabase
            .from('api_keys')
            .update({ key_value: encryptedKey })
            .eq('id', defaultKey.id);
            
          if (updateKeyError) throw updateKeyError;
          
          // 更新本地状态
          set({
            apiKeys: apiKeys.map(k => 
              k.id === defaultKey.id ? { ...k, key_value: encryptedKey } : k
            )
          });
        } else if (defaultInstance) {
          // 创建新密钥
          const { data: newKey, error: keyError } = await supabase
            .from('api_keys')
            .insert({
              service_instance_id: defaultInstance.id,
              provider_id: difyProvider.id,
              key_value: encryptedKey,
              is_default: true,
            })
            .select()
            .single();
            
          if (keyError) throw keyError;
          
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
