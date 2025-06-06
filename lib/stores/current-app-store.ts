// lib/stores/current-app-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getProviderByName, getDefaultServiceInstance } from '@lib/db';
import { Result } from '@lib/types/result';
import type { ServiceInstance, Provider } from '@lib/types/database';
import { clearDifyConfigCache } from '@lib/config/dify-config'; // 新增：导入缓存清除函数

interface CurrentAppState {
  currentAppId: string | null;
  currentAppInstance: ServiceInstance | null;
  isLoadingAppId: boolean;
  errorLoadingAppId: string | null;
  lastValidatedAt: number | null; // 新增：最后验证时间戳
  isValidating: boolean; // 新增：是否正在验证配置
  isValidatingForMessage: boolean; // 🎯 新增：专门用于消息发送时的验证状态
  setCurrentAppId: (appId: string, instance: ServiceInstance) => void;
  clearCurrentApp: () => void;
  initializeDefaultAppId: () => Promise<void>;
  refreshCurrentApp: () => Promise<void>;
  validateAndRefreshConfig: (targetAppId?: string, context?: 'message' | 'switch' | 'general') => Promise<void>; // 🎯 修改：添加上下文参数
  switchToApp: (appId: string) => Promise<void>; // 新增：切换到指定app
}

// --- BEGIN COMMENT ---
// 定义 Dify 提供商在数据库中的确切名称
// 这个值必须与 'providers' 表中的 'name' 字段匹配
// --- END COMMENT ---
const DIFY_PROVIDER_NAME = 'Dify'; 

export const useCurrentAppStore = create<CurrentAppState>()(
  persist(
    (set, get) => ({
      currentAppId: null,
      currentAppInstance: null,
      isLoadingAppId: false,
      errorLoadingAppId: null,
      lastValidatedAt: null, // 新增：最后验证时间戳
      isValidating: false, // 新增：是否正在验证配置
      isValidatingForMessage: false, // 🎯 新增：专门用于消息发送时的验证状态
      
      setCurrentAppId: (appId, instance) => {
        set({ 
          currentAppId: appId, 
          currentAppInstance: instance, 
          isLoadingAppId: false, 
          errorLoadingAppId: null,
          lastValidatedAt: Date.now() // 更新验证时间戳
        });
        // --- BEGIN COMMENT ---
        // TODO (后续): 当 appId 改变时，可能需要触发相关数据的重新加载，
        // 例如，对话列表 useConversations 可能需要根据新的 appId 刷新。
        // 这可以通过在 useConversations 中也订阅 currentAppId 来实现，
        // 或者在这里调用一个全局的刷新函数/事件。
        // --- END COMMENT ---
      },
      
      clearCurrentApp: () => {
        set({
          currentAppId: null,
          currentAppInstance: null,
          isLoadingAppId: false,
          errorLoadingAppId: null,
          lastValidatedAt: null, // 清除验证时间戳
          isValidating: false, // 🎯 清除验证状态
          isValidatingForMessage: false, // 🎯 清除消息验证状态
        });
      },
      
      initializeDefaultAppId: async () => {
        // 防止重复初始化或在已加载时再次加载
        if (get().currentAppId || get().isLoadingAppId) {
          return;
        }
        
        set({ isLoadingAppId: true, errorLoadingAppId: null });
        
        try {
          // --- BEGIN COMMENT ---
          // 使用新版本的数据库接口，支持Result类型和错误处理
          // --- END COMMENT ---
          const providerResult = await getProviderByName(DIFY_PROVIDER_NAME);
          
          if (!providerResult.success) {
            throw new Error(`获取提供商"${DIFY_PROVIDER_NAME}"失败: ${providerResult.error.message}`);
          }
          
          if (!providerResult.data) {
            throw new Error(`数据库中未找到提供商"${DIFY_PROVIDER_NAME}"`);
          }

          const defaultInstanceResult = await getDefaultServiceInstance(providerResult.data.id);
          
          if (!defaultInstanceResult.success) {
            throw new Error(`获取默认服务实例失败: ${defaultInstanceResult.error.message}`);
          }
          
          if (defaultInstanceResult.data && defaultInstanceResult.data.instance_id) {
            set({
              currentAppId: defaultInstanceResult.data.instance_id,
              currentAppInstance: defaultInstanceResult.data,
              isLoadingAppId: false,
              lastValidatedAt: Date.now(), // 设置验证时间戳
            });
          } else {
            // --- BEGIN COMMENT ---
            // 如果数据库中没有配置默认的 Dify 应用实例，这是一个需要处理的场景。
            // UI 层应该提示用户选择一个应用，或者管理员需要配置一个默认应用。
            // 当前我们将 appId 设为 null，并记录错误。
            // --- END COMMENT ---
            const errorMessage = `未找到提供商"${DIFY_PROVIDER_NAME}"的默认服务实例。请配置一个默认的 Dify 应用。`;
            console.warn(errorMessage);
            set({ 
              currentAppId: null, 
              currentAppInstance: null, 
              isLoadingAppId: false, 
              errorLoadingAppId: errorMessage 
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error("初始化默认应用ID失败:", errorMessage);
          set({ 
            isLoadingAppId: false, 
            errorLoadingAppId: errorMessage 
          });
        }
      },
      
      // --- BEGIN COMMENT ---
      // 新增刷新当前应用的方法，用于重新获取最新的应用实例信息
      // --- END COMMENT ---
      refreshCurrentApp: async () => {
        const currentState = get();
        
        if (!currentState.currentAppInstance) {
          // 如果没有当前应用，尝试初始化默认应用
          await get().initializeDefaultAppId();
          return;
        }
        
        set({ isLoadingAppId: true, errorLoadingAppId: null });
        
        try {
          const defaultInstanceResult = await getDefaultServiceInstance(
            currentState.currentAppInstance.provider_id
          );
          
          if (!defaultInstanceResult.success) {
            throw new Error(`刷新应用实例失败: ${defaultInstanceResult.error.message}`);
          }
          
          if (defaultInstanceResult.data && defaultInstanceResult.data.instance_id) {
            set({
              currentAppId: defaultInstanceResult.data.instance_id,
              currentAppInstance: defaultInstanceResult.data,
              isLoadingAppId: false,
              lastValidatedAt: Date.now(), // 设置验证时间戳
            });
          } else {
            const errorMessage = "未找到默认服务实例";
            set({ 
              isLoadingAppId: false, 
              errorLoadingAppId: errorMessage 
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error("刷新当前应用失败:", errorMessage);
          set({ 
            isLoadingAppId: false, 
            errorLoadingAppId: errorMessage 
          });
        }
      },

      // --- BEGIN COMMENT ---
      // 新增：验证并刷新配置方法
      // 检查当前配置是否仍然有效，如果无效则重新获取
      // 支持验证特定app或默认app
      // 用于解决管理端配置变更后的同步问题
      // --- END COMMENT ---
      validateAndRefreshConfig: async (targetAppId?: string, context: 'message' | 'switch' | 'general' = 'general') => {
        const currentState = get();
        
        // --- BEGIN COMMENT ---
        // 🎯 根据上下文设置不同的验证状态
        // --- END COMMENT ---
        if (context === 'message') {
          set({ isValidating: true, isValidatingForMessage: true });
        } else {
          set({ isValidating: true, isValidatingForMessage: false });
        }
        
        try {
          // 如果指定了targetAppId，则切换到该app
          if (targetAppId && targetAppId !== currentState.currentAppId) {
            console.log(`[validateAndRefreshConfig] 切换到指定app: ${targetAppId}`);
            await get().switchToApp(targetAppId);
            return;
          }
          
          // 如果没有当前配置，直接初始化
          if (!currentState.currentAppId || !currentState.currentAppInstance) {
            await get().initializeDefaultAppId();
            return;
          }
          
          // 检查是否需要验证（避免频繁验证）
          const now = Date.now();
          const lastValidated = currentState.lastValidatedAt || 0;
          const VALIDATION_INTERVAL = 30 * 1000; // 30秒验证间隔
          
          if (now - lastValidated < VALIDATION_INTERVAL && !targetAppId) {
            console.log('[validateAndRefreshConfig] 验证间隔未到，跳过验证');
            return;
          }
          
          console.log('[validateAndRefreshConfig] 开始验证配置有效性...');
          
          // 获取提供商信息
          const providerResult = await getProviderByName(DIFY_PROVIDER_NAME);
          
          if (!providerResult.success || !providerResult.data) {
            console.warn('[validateAndRefreshConfig] 提供商不存在，清除当前配置');
            get().clearCurrentApp();
            return;
          }
          
          // 🎯 修改：支持验证特定app实例，而不仅仅是默认app
          let targetInstance: any = null;
          
          if (targetAppId) {
            // 如果指定了targetAppId，查找该特定实例
            const { createClient } = await import('../supabase/client');
            const supabase = createClient();
            
            const { data: specificInstance, error: specificError } = await supabase
              .from('service_instances')
              .select('*')
              .eq('provider_id', providerResult.data.id)
              .eq('instance_id', targetAppId)
              .single();
              
            if (specificError || !specificInstance) {
              throw new Error(`未找到指定的app实例: ${targetAppId}`);
            }
            
            targetInstance = specificInstance;
          } else {
            // 如果没有指定targetAppId，验证当前app是否仍然存在
            const { createClient } = await import('../supabase/client');
            const supabase = createClient();
            
            const { data: currentInstance, error: currentError } = await supabase
              .from('service_instances')
              .select('*')
              .eq('provider_id', providerResult.data.id)
              .eq('instance_id', currentState.currentAppId)
              .single();
              
            if (currentError || !currentInstance) {
              // 当前app不存在，fallback到默认app
              console.warn(`[validateAndRefreshConfig] 当前app ${currentState.currentAppId} 不存在，fallback到默认app`);
              const defaultInstanceResult = await getDefaultServiceInstance(providerResult.data.id);
              
              if (!defaultInstanceResult.success || !defaultInstanceResult.data) {
                console.warn('[validateAndRefreshConfig] 默认服务实例也不存在，清除当前配置');
                get().clearCurrentApp();
                return;
              }
              
              targetInstance = defaultInstanceResult.data;
            } else {
              targetInstance = currentInstance;
            }
          }
          
          // 检查当前配置是否与目标配置一致
          // 🎯 修复：不仅检查ID，还要检查实例的详细信息是否有变化
          const hasInstanceChanged = (
            currentState.currentAppId !== targetInstance.instance_id ||
            currentState.currentAppInstance?.display_name !== targetInstance.display_name ||
            currentState.currentAppInstance?.description !== targetInstance.description ||
            currentState.currentAppInstance?.config !== targetInstance.config
          );
          
          if (hasInstanceChanged) {
            console.log('[validateAndRefreshConfig] 配置已变更，更新为最新配置');
            
            // --- BEGIN COMMENT ---
            // 🎯 配置变更时清除Dify配置缓存，确保API调用使用最新配置
            // --- END COMMENT ---
            if (currentState.currentAppId) {
              clearDifyConfigCache(currentState.currentAppId);
            }
            if (targetInstance.instance_id !== currentState.currentAppId) {
              clearDifyConfigCache(targetInstance.instance_id);
            }
            
            set({
              currentAppId: targetInstance.instance_id,
              currentAppInstance: targetInstance,
              lastValidatedAt: now,
              errorLoadingAppId: null
            });
          } else {
            console.log('[validateAndRefreshConfig] 配置仍然有效，更新验证时间戳');
            set({ lastValidatedAt: now });
          }
          
        } catch (error) {
          console.error('[validateAndRefreshConfig] 验证配置时出错:', error);
          // --- BEGIN COMMENT ---
          // 🎯 错误恢复机制：验证失败时不清除配置，只记录错误
          // 这确保即使数据库暂时不可用，用户仍能使用缓存的配置
          // --- END COMMENT ---
          const errorMessage = error instanceof Error ? error.message : String(error);
          set({ 
            errorLoadingAppId: `配置验证失败: ${errorMessage}。当前使用缓存配置，请检查网络连接。`,
            lastValidatedAt: Date.now() // 即使失败也更新时间戳，避免频繁重试
          });
        } finally {
          // --- BEGIN COMMENT ---
          // 🎯 清除所有验证状态
          // --- END COMMENT ---
          set({ isValidating: false, isValidatingForMessage: false });
        }
      },

      // --- BEGIN COMMENT ---
      // 新增：切换到指定app的方法
      // 支持切换到任意app，而不仅仅是默认app
      // --- END COMMENT ---
      switchToApp: async (appId: string) => {
        console.log(`[switchToApp] 开始切换到app: ${appId}`);
        
        set({ isLoadingAppId: true, errorLoadingAppId: null });
        
        try {
          // 获取提供商信息
          const providerResult = await getProviderByName(DIFY_PROVIDER_NAME);
          
          if (!providerResult.success || !providerResult.data) {
            throw new Error(`获取提供商"${DIFY_PROVIDER_NAME}"失败`);
          }
          
                // 查找指定的app实例
      const { createClient } = await import('../supabase/client');
      const supabase = createClient();
      
      const { data: targetInstance, error: targetError } = await supabase
        .from('service_instances')
        .select('*')
        .eq('provider_id', providerResult.data.id)
        .eq('instance_id', appId)  // 使用instance_id查找，因为传入的是业务标识符
        .single();
            
          if (targetError || !targetInstance) {
            throw new Error(`未找到app实例: ${appId}`);
          }
          
          // 清除旧的配置缓存
          const currentState = get();
          if (currentState.currentAppId) {
            clearDifyConfigCache(currentState.currentAppId);
          }
          clearDifyConfigCache(appId);
          
          // 更新状态
          set({
            currentAppId: targetInstance.instance_id,
            currentAppInstance: targetInstance,
            isLoadingAppId: false,
            errorLoadingAppId: null,
            lastValidatedAt: Date.now()
          });
          
          console.log(`[switchToApp] 成功切换到app: ${appId}`);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[switchToApp] 切换app失败:`, error);
          set({ 
            isLoadingAppId: false, 
            errorLoadingAppId: `切换app失败: ${errorMessage}` 
          });
          throw error; // 重新抛出错误，让调用者处理
        }
      },
    }),
    {
      name: 'current-app-storage', // localStorage 中的 key
      storage: createJSONStorage(() => localStorage),
      // 只持久化 appId 和 instance，其他状态是临时的
      partialize: (state) => ({ 
        currentAppId: state.currentAppId, 
        currentAppInstance: state.currentAppInstance 
      }), 
    }
  )
);

// --- BEGIN COMMENT ---
// 使用建议:
// 在应用的主布局组件 (例如 app/providers.tsx 或 app/layout.tsx) 的顶层，
// 使用 useEffect 来调用一次 initializeDefaultAppId，以确保应用加载时会尝试设置默认应用。
// 例如:
// import { useEffect } from 'react';
// import { useCurrentAppStore } from '@lib/stores/current-app-store';
//
// function AppProviders({ children }) { // 或者你的根布局组件
//   const initializeDefaultAppId = useCurrentAppStore(state => state.initializeDefaultAppId);
//   
//   useEffect(() => {
//     initializeDefaultAppId();
//   }, [initializeDefaultAppId]);
//   
//   return <>{children}</>;
// }
// --- END COMMENT ---
