import { create } from 'zustand';
import type { DifyAppParametersResponse } from '@lib/services/dify/types';

interface AppInfo {
  id: string;
  name: string;
}

// 🎯 新增：应用参数缓存接口
interface AppParametersCache {
  [appId: string]: {
    data: DifyAppParametersResponse;
    timestamp: number;
  };
}

interface AppListState {
  apps: AppInfo[];
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number;

  // 🎯 新增：应用参数相关状态
  parametersCache: AppParametersCache;
  isLoadingParameters: boolean;
  parametersError: string | null;
  lastParametersFetchTime: number;

  fetchApps: () => Promise<void>;
  clearCache: () => void;
  
  // 🎯 新增：应用参数相关方法
  fetchAllAppParameters: () => Promise<void>;
  getAppParameters: (appId: string) => DifyAppParametersResponse | null;
  clearParametersCache: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

export const useAppListStore = create<AppListState>((set, get) => ({
  apps: [],
  isLoading: false,
  error: null,
  lastFetchTime: 0,

  // 🎯 新增：应用参数相关状态初始化
  parametersCache: {},
  isLoadingParameters: false,
  parametersError: null,
  lastParametersFetchTime: 0,

  fetchApps: async () => {
    const now = Date.now();
    const state = get();
  
    // 5分钟内不重复获取
    if (now - state.lastFetchTime < CACHE_DURATION && state.apps.length > 0) {
      return;
    }
  
    set({ isLoading: true, error: null });
  
    try {
      const { getAllDifyApps } = await import('@lib/services/dify/app-service');
      const apps = await getAllDifyApps();
      set({ 
        apps, 
        isLoading: false, 
        lastFetchTime: now 
      });
      
      // 🎯 获取应用列表成功后，自动获取所有应用的参数
      const updatedState = get();
      if (apps.length > 0) {
        // 异步获取参数，不阻塞应用列表的返回
        updatedState.fetchAllAppParameters().catch(error => {
          console.warn('[AppListStore] 批量获取应用参数失败:', error);
        });
      }
    } catch (error: any) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },

  // 🎯 新增：批量获取所有应用的参数
  fetchAllAppParameters: async () => {
    const now = Date.now();
    const state = get();
    
    // 检查缓存是否仍然有效
    if (now - state.lastParametersFetchTime < CACHE_DURATION && Object.keys(state.parametersCache).length > 0) {
      console.log('[AppListStore] 应用参数缓存仍然有效，跳过获取');
      return;
    }
    
    // 如果没有应用列表，先获取应用列表
    if (state.apps.length === 0) {
      console.log('[AppListStore] 应用列表为空，先获取应用列表');
      await get().fetchApps();
    }
    
    const currentApps = get().apps;
    if (currentApps.length === 0) {
      console.warn('[AppListStore] 无可用应用，跳过参数获取');
      return;
    }
    
    set({ isLoadingParameters: true, parametersError: null });
    
    try {
      const { getDifyAppParameters } = await import('@lib/services/dify/app-service');
      const newParametersCache: AppParametersCache = {};
      
      console.log(`[AppListStore] 开始批量获取 ${currentApps.length} 个应用的参数`);
      
      // 并发获取所有应用的参数
      const parameterPromises = currentApps.map(async (app) => {
        try {
          const parameters = await getDifyAppParameters(app.id);
          newParametersCache[app.id] = {
            data: parameters,
            timestamp: now
          };
          console.log(`[AppListStore] 成功获取应用 ${app.id} 的参数`);
        } catch (error) {
          console.warn(`[AppListStore] 获取应用 ${app.id} 参数失败:`, error);
          // 单个应用失败不影响其他应用
        }
      });
      
      await Promise.allSettled(parameterPromises);
      
      set({
        parametersCache: newParametersCache,
        isLoadingParameters: false,
        lastParametersFetchTime: now
      });
      
      console.log(`[AppListStore] 批量获取应用参数完成，成功获取 ${Object.keys(newParametersCache).length} 个应用的参数`);
      
    } catch (error: any) {
      console.error('[AppListStore] 批量获取应用参数失败:', error);
      set({
        parametersError: error.message,
        isLoadingParameters: false
      });
    }
  },

  // 🎯 新增：获取指定应用的参数（从缓存）
  getAppParameters: (appId: string) => {
    const state = get();
    const cached = state.parametersCache[appId];
    
    if (!cached) return null;
    
    // 检查缓存是否过期
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) {
      // 清理过期缓存
      const newCache = { ...state.parametersCache };
      delete newCache[appId];
      set({ parametersCache: newCache });
      return null;
    }
    
    return cached.data;
  },

  // 🎯 新增：清理参数缓存
  clearParametersCache: () => {
    set({
      parametersCache: {},
      lastParametersFetchTime: 0,
      parametersError: null
    });
  },

  clearCache: () => {
    set({ 
      apps: [], 
      lastFetchTime: 0,
      error: null,
      // 🎯 同时清理参数缓存
      parametersCache: {},
      lastParametersFetchTime: 0,
      parametersError: null
    });
  }
})); 