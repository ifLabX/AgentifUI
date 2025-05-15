// lib/stores/current-app-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getDefaultServiceInstance, getProviderByName } from '@lib/db';
import type { ServiceInstance } from '@lib/types/database';

interface CurrentAppState {
  currentAppId: string | null;
  currentAppInstance: ServiceInstance | null;
  isLoadingAppId: boolean;
  errorLoadingAppId: string | null;
  setCurrentAppId: (appId: string, instance: ServiceInstance) => void;
  clearCurrentApp: () => void;
  initializeDefaultAppId: () => Promise<void>;
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
      initializeDefaultAppId: async () => {
        // 防止重复初始化或在已加载时再次加载
        if (get().currentAppId || get().isLoadingAppId) {
          return;
        }
        set({ isLoadingAppId: true, errorLoadingAppId: null });
        try {
          const difyProvider = await getProviderByName(DIFY_PROVIDER_NAME);
          if (!difyProvider) {
            throw new Error(`Provider "${DIFY_PROVIDER_NAME}" not found in database.`);
          }

          const defaultInstance = await getDefaultServiceInstance(difyProvider.id);
          if (defaultInstance && defaultInstance.instance_id) {
            set({
              currentAppId: defaultInstance.instance_id,
              currentAppInstance: defaultInstance,
              isLoadingAppId: false,
            });
          } else {
            // --- BEGIN COMMENT ---
            // 如果数据库中没有配置默认的 Dify 应用实例，这是一个需要处理的场景。
            // UI 层应该提示用户选择一个应用，或者管理员需要配置一个默认应用。
            // 当前我们将 appId 设为 null，并记录错误。
            // --- END COMMENT ---
            const errorMessage = `No default service instance found for provider "${DIFY_PROVIDER_NAME}". Please configure a default Dify app.`;
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
          console.error("Failed to initialize default app ID:", errorMessage);
          set({ isLoadingAppId: false, errorLoadingAppId: errorMessage });
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
//   useEffect(() => {
//     useCurrentAppStore.getState().initializeDefaultAppId();
//   }, []);
//   return <>{children}</>;
// }
// --- END COMMENT ---
