// lib/stores/current-app-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getProviderByName, getDefaultServiceInstance } from '@lib/db';
import { Result } from '@lib/types/result';
import type { ServiceInstance, Provider } from '@lib/types/database';

interface CurrentAppState {
  currentAppId: string | null;
  currentAppInstance: ServiceInstance | null;
  isLoadingAppId: boolean;
  errorLoadingAppId: string | null;
  setCurrentAppId: (appId: string, instance: ServiceInstance) => void;
  clearCurrentApp: () => void;
  initializeDefaultAppId: (forceRefresh?: boolean) => Promise<void>;
  refreshCurrentApp: () => Promise<void>;
  forceRefreshDefaultApp: () => Promise<void>;
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
      
      setCurrentAppId: (appId, instance) => {
        set({ 
          currentAppId: appId, 
          currentAppInstance: instance, 
          isLoadingAppId: false, 
          errorLoadingAppId: null 
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
        });
      },
      
      initializeDefaultAppId: async (forceRefresh = false) => {
        // 防止重复初始化，除非强制刷新
        if (!forceRefresh && (get().currentAppId || get().isLoadingAppId)) {
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
      // 强制刷新默认应用，清除缓存并重新获取最新的默认应用
      // --- END COMMENT ---
      forceRefreshDefaultApp: async () => {
        // 清除当前应用状态
        set({
          currentAppId: null,
          currentAppInstance: null,
          isLoadingAppId: false,
          errorLoadingAppId: null,
        });
        
        // 强制重新初始化
        await get().initializeDefaultAppId(true);
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
