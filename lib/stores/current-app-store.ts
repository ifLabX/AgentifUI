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
  setCurrentAppId: (appId: string, instance: ServiceInstance) => void;
  clearCurrentApp: () => void;
  initializeDefaultAppId: () => Promise<void>;
  refreshCurrentApp: () => Promise<void>;
  validateAndRefreshConfig: () => Promise<void>; // 新增：验证并刷新配置
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
      // 用于解决管理端配置变更后的同步问题
      // --- END COMMENT ---
      validateAndRefreshConfig: async () => {
        const currentState = get();
        
        // 如果没有当前配置，直接初始化
        if (!currentState.currentAppId || !currentState.currentAppInstance) {
          await get().initializeDefaultAppId();
          return;
        }
        
        // 检查是否需要验证（避免频繁验证）
        const now = Date.now();
        const lastValidated = currentState.lastValidatedAt || 0;
        const VALIDATION_INTERVAL = 30 * 1000; // 30秒验证间隔
        
        if (now - lastValidated < VALIDATION_INTERVAL) {
          console.log('[validateAndRefreshConfig] 验证间隔未到，跳过验证');
          return;
        }
        
        console.log('[validateAndRefreshConfig] 开始验证配置有效性...');
        
        try {
          // 重新获取默认服务实例，验证配置是否仍然有效
          const providerResult = await getProviderByName(DIFY_PROVIDER_NAME);
          
          if (!providerResult.success || !providerResult.data) {
            console.warn('[validateAndRefreshConfig] 提供商不存在，清除当前配置');
            get().clearCurrentApp();
            return;
          }
          
          const defaultInstanceResult = await getDefaultServiceInstance(providerResult.data.id);
          
          if (!defaultInstanceResult.success || !defaultInstanceResult.data) {
            console.warn('[validateAndRefreshConfig] 默认服务实例不存在，清除当前配置');
            get().clearCurrentApp();
            return;
          }
          
          const latestInstance = defaultInstanceResult.data;
          
          // 检查当前配置是否与最新配置一致
          if (currentState.currentAppId !== latestInstance.instance_id ||
              currentState.currentAppInstance?.id !== latestInstance.id) {
            console.log('[validateAndRefreshConfig] 配置已变更，更新为最新配置');
            
            // --- BEGIN COMMENT ---
            // 🎯 配置变更时清除Dify配置缓存，确保API调用使用最新配置
            // --- END COMMENT ---
            if (currentState.currentAppId) {
              clearDifyConfigCache(currentState.currentAppId);
            }
            if (latestInstance.instance_id !== currentState.currentAppId) {
              clearDifyConfigCache(latestInstance.instance_id);
            }
            
            set({
              currentAppId: latestInstance.instance_id,
              currentAppInstance: latestInstance,
              lastValidatedAt: now,
              errorLoadingAppId: null
            });
          } else {
            console.log('[validateAndRefreshConfig] 配置仍然有效，更新验证时间戳');
            set({ lastValidatedAt: now });
          }
          
        } catch (error) {
          console.error('[validateAndRefreshConfig] 验证配置时出错:', error);
          // 验证失败时不清除配置，只记录错误
          const errorMessage = error instanceof Error ? error.message : String(error);
          set({ 
            errorLoadingAppId: `配置验证失败: ${errorMessage}`,
            lastValidatedAt: now // 即使失败也更新时间戳，避免频繁重试
          });
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
