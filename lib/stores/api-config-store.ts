import { create } from 'zustand';
import { createClient } from '@lib/supabase/client';

// 类型定义
export interface Provider {
  id: string;
  name: string;
  type: string;
  base_url: string;
  created_at: string;
}

export interface ServiceInstance {
  id: string;
  provider_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

export interface ApiKey {
  id: string;
  service_instance_id: string;
  key_value: string;
  is_default: boolean;
  created_at: string;
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
  
  setNewApiKey: (key) => set({ newApiKey: key }),
  setNewApiUrl: (url) => set({ newApiUrl: url }),
  
  loadConfigData: async () => {
    const supabase = createClient();
    
    try {
      set({ isLoading: true, error: null });
      
      // 加载提供商
      const { data: providersData, error: providersError } = await supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (providersError) throw providersError;
      
      // 加载服务实例
      const { data: instancesData, error: instancesError } = await supabase
        .from('service_instances')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (instancesError) throw instancesError;
      
      // 加载 API 密钥
      const { data: keysData, error: keysError } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });
        
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
