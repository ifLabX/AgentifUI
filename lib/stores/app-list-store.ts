import { create } from 'zustand';
import type { DifyAppParametersResponse } from '@lib/services/dify/types';
import type { ServiceInstanceConfig } from '@lib/types/database';

interface AppInfo {
  id: string;
  name: string;
  instance_id: string;
  display_name?: string;
  description?: string;
  config?: ServiceInstanceConfig;
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
  
  // 🎯 添加请求锁，防止同一应用的并发请求
  fetchingApps: Set<string>; // 正在请求中的应用ID集合

  fetchApps: () => Promise<void>;
  clearCache: () => void;
  
  // 🎯 新增：应用参数相关方法
  fetchAllAppParameters: () => Promise<void>;
  fetchAppParameters: (appId: string) => Promise<void>;
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

  // 🎯 添加请求锁，防止同一应用的并发请求
  fetchingApps: new Set(),

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
      
      console.log(`[AppListStore] 成功获取 ${apps.length} 个应用列表`);
      
      // 🎯 后台同步：更新常用应用信息
      try {
        const { useFavoriteAppsStore } = await import('./favorite-apps-store');
        useFavoriteAppsStore.getState().syncWithAppList(apps);
      } catch (error) {
        console.warn('[AppListStore] 同步常用应用信息失败:', error);
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
          const parameters = await getDifyAppParameters(app.instance_id); // 使用instance_id调用API
          newParametersCache[app.id] = { // 但用id作为缓存key
            data: parameters,
            timestamp: now
          };
          console.log(`[AppListStore] 成功获取应用 ${app.instance_id} 的参数`);
        } catch (error) {
          console.warn(`[AppListStore] 获取应用 ${app.instance_id} 参数失败:`, error);
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
      parametersError: null,
      fetchingApps: new Set()
    });
  },

  clearCache: () => {
    set({ 
      apps: [], 
      lastFetchTime: 0,
      error: null,
      parametersCache: {},
      lastParametersFetchTime: 0,
      parametersError: null,
      fetchingApps: new Set()
    });
  },

  // 🎯 新增：获取单个应用的参数
  fetchAppParameters: async (appId: string) => {
    const now = Date.now();
    const state = get();
    const cached = state.parametersCache[appId];
    
    // 🎯 检查是否正在请求中，防止并发请求
    if (state.fetchingApps.has(appId)) {
      console.log(`[AppListStore] 应用 ${appId} 正在请求中，跳过重复请求`);
      return;
    }
    
    // 检查缓存是否仍然有效
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      console.log(`[AppListStore] 应用 ${appId} 参数缓存仍然有效，跳过获取`);
      return;
    }
    
    // 🎯 添加到请求锁中
    const newFetchingApps = new Set(state.fetchingApps);
    newFetchingApps.add(appId);
    set({ fetchingApps: newFetchingApps });
    
    try {
      console.log(`[AppListStore] 开始获取应用 ${appId} 的参数`);
      
      const { getDifyAppParameters } = await import('@lib/services/dify/app-service');
      const parameters = await getDifyAppParameters(appId);
      
      // 更新缓存
      const currentState = get();
      set({
        parametersCache: {
          ...currentState.parametersCache,
          [appId]: {
            data: parameters,
            timestamp: now
          }
        }
      });
      
      console.log(`[AppListStore] 成功获取应用 ${appId} 的参数`);
      
    } catch (error: any) {
      console.error(`[AppListStore] 获取应用 ${appId} 参数失败:`, error);
      // 单个应用失败不影响其他操作，不设置全局错误状态
      throw error;
    } finally {
      // 🎯 从请求锁中移除，无论成功还是失败
      const currentState = get();
      const updatedFetchingApps = new Set(currentState.fetchingApps);
      updatedFetchingApps.delete(appId);
      set({ fetchingApps: updatedFetchingApps });
    }
  }
})); 