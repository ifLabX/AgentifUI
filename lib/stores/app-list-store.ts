import type { UserAccessibleApp } from '@lib/db/group-permissions';
import type { DifyAppParametersResponse } from '@lib/services/dify/types';
import type { AppVisibility, ServiceInstanceConfig } from '@lib/types/database';
import { create } from 'zustand';

// --- BEGIN COMMENT ---
// 🎯 应用信息接口，包含应用的基本信息和配置
// 新增：provider_name 字段用于多提供商支持
// --- END COMMENT ---
export interface AppInfo {
  id: string;
  name: string;
  instance_id: string;
  display_name?: string;
  description?: string;
  config?: ServiceInstanceConfig;
  usage_quota?: number;
  used_count?: number;
  quota_remaining?: number;
  visibility?: AppVisibility;
  provider_name?: string; // 🎯 新增：提供商名称，用于多提供商支持
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

  // 🎯 应用参数相关状态
  parametersCache: AppParametersCache;
  isLoadingParameters: boolean;
  parametersError: string | null;
  lastParametersFetchTime: number;

  // 🎯 请求锁，防止同一应用的并发请求
  fetchingApps: Set<string>;

  // 🎯 用户状态（自动管理）
  currentUserId: string | null;

  // 🎯 核心方法
  fetchApps: () => Promise<void>;
  clearCache: () => void;

  // 🎯 应用参数相关方法
  fetchAllAppParameters: () => Promise<void>;
  fetchAppParameters: (appId: string) => Promise<void>;
  getAppParameters: (appId: string) => DifyAppParametersResponse | null;
  clearParametersCache: () => void;

  // 🎯 权限检查方法
  checkAppPermission: (appInstanceId: string) => Promise<boolean>;

  // 🎯 管理员专用方法（管理界面使用）
  fetchAllApps: () => Promise<void>;
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

  // 🎯 用户状态初始化
  currentUserId: null,

  fetchApps: async () => {
    const now = Date.now();
    const state = get();

    // --- BEGIN COMMENT ---
    // 🎯 修复缓存污染：先获取用户ID，检查用户变化
    // --- END COMMENT ---
    const { createClient } = await import('@lib/supabase/client');
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('用户未登录'); // 理论上不会发生，middleware会拦截
    }

    // 🔧 关键修复：如果用户ID变化，立即清除缓存
    if (state.currentUserId !== user.id) {
      // --- BEGIN COMMENT ---
      // 清理用户相关的应用缓存和参数缓存
      // --- END COMMENT ---
      set({
        apps: [],
        lastFetchTime: 0,
        currentUserId: user.id,
        isLoading: true,
        error: null,
        // 清理参数缓存
        parametersCache: {},
        lastParametersFetchTime: 0,
        parametersError: null,
        fetchingApps: new Set(),
      });
      console.log(
        `[AppListStore] 检测到用户变化 (${state.currentUserId} → ${user.id})，清除所有应用缓存`
      );
    }

    // 重新获取状态（可能已被清除）
    const currentState = get();

    // 5分钟内不重复获取（现在是用户隔离的）
    if (
      now - currentState.lastFetchTime < CACHE_DURATION &&
      currentState.apps.length > 0
    ) {
      console.log(`[AppListStore] 用户 ${user.id} 缓存仍然有效，跳过获取`);
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // 🎯 使用权限管理API获取用户可访问的应用
      const { getUserAccessibleApps } = await import(
        '@lib/db/group-permissions'
      );
      const result = await getUserAccessibleApps(user.id);

      if (!result.success) {
        throw new Error(result.error.message);
      }

      // --- BEGIN COMMENT ---
      // 🎯 转换UserAccessibleApp到AppInfo格式，使用去重逻辑
      // --- END COMMENT ---
      const appMap = new Map<string, AppInfo>();

      result.data.forEach((userApp: UserAccessibleApp) => {
        const appInfo: AppInfo = {
          id: userApp.service_instance_id,
          name: userApp.display_name || userApp.instance_id,
          instance_id: userApp.instance_id,
          display_name: userApp.display_name || undefined,
          description: userApp.description || undefined,
          config: userApp.config,
          usage_quota: userApp.usage_quota ?? undefined,
          used_count: userApp.used_count,
          quota_remaining: userApp.quota_remaining ?? undefined,
          visibility: userApp.visibility,
          // 🎯 暂时注释掉，等待数据库层面支持
          // provider_name: userApp.provider_name
        };

        // 🔧 使用service_instance_id作为唯一键去重
        if (!appMap.has(userApp.service_instance_id)) {
          appMap.set(userApp.service_instance_id, appInfo);
        }
      });

      const apps: AppInfo[] = Array.from(appMap.values());

      set({
        apps,
        isLoading: false,
        lastFetchTime: now,
        currentUserId: user.id,
      });

      console.log(
        `[AppListStore] 成功获取 ${apps.length} 个用户可访问应用（包含群组权限）`
      );

      // 🎯 后台同步：更新常用应用信息
      try {
        const { useFavoriteAppsStore } = await import('./favorite-apps-store');
        useFavoriteAppsStore.getState().syncWithAppList(apps);
      } catch (error) {
        console.warn('[AppListStore] 同步常用应用信息失败:', error);
      }
    } catch (error: any) {
      console.error('[AppListStore] 获取应用列表失败:', error);
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  // 🎯 新增：获取所有应用（管理员用）
  fetchAllApps: async () => {
    const now = Date.now();
    const state = get();

    // --- BEGIN COMMENT ---
    // 🔧 管理员函数也需要用户隔离，避免缓存污染
    // --- END COMMENT ---
    const { createClient } = await import('@lib/supabase/client');
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('用户未登录');
    }

    // 🔧 如果用户ID变化，清除缓存
    if (state.currentUserId !== user.id) {
      // --- BEGIN COMMENT ---
      // 管理员模式下也需要清理用户相关缓存
      // --- END COMMENT ---
      set({
        apps: [],
        lastFetchTime: 0,
        currentUserId: user.id,
        isLoading: true,
        error: null,
        // 清理参数缓存
        parametersCache: {},
        lastParametersFetchTime: 0,
        parametersError: null,
        fetchingApps: new Set(),
      });
      console.log(
        `[AppListStore] fetchAllApps检测到用户变化 (${state.currentUserId} → ${user.id})，清除所有应用缓存`
      );
    }

    // 重新获取状态
    const currentState = get();

    // 5分钟内不重复获取（现在是用户隔离的）
    if (
      now - currentState.lastFetchTime < CACHE_DURATION &&
      currentState.apps.length > 0
    ) {
      console.log(
        `[AppListStore] 管理员用户 ${user.id} 缓存仍然有效，跳过获取`
      );
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { getAllDifyApps } = await import('@lib/services/dify/app-service');
      const rawApps = await getAllDifyApps();

      // --- BEGIN COMMENT ---
      // 🎯 为所有应用列表添加visibility信息
      // --- END COMMENT ---
      const apps: AppInfo[] = rawApps.map(app => ({
        ...app,
        visibility: (app.visibility as AppVisibility) || 'public',
        // 🎯 暂时注释掉，等待数据库层面支持
        // provider_name: app.provider_name
      }));

      set({
        apps,
        isLoading: false,
        lastFetchTime: now,
        currentUserId: user.id,
      });

      console.log(`[AppListStore] 成功获取 ${apps.length} 个应用（包括私有）`);

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
        isLoading: false,
      });
    }
  },

  // 🎯 新增：获取用户可访问的应用（带权限过滤）
  fetchUserAccessibleApps: async (userId: string) => {
    const now = Date.now();
    const state = get();

    // 如果用户ID变化，清除缓存
    if (state.currentUserId !== userId) {
      set({
        apps: [],
        lastFetchTime: 0,
        currentUserId: userId,
      });
    }

    // 5分钟内不重复获取
    if (now - state.lastFetchTime < CACHE_DURATION && state.apps.length > 0) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { getUserAccessibleApps } = await import(
        '@lib/db/group-permissions'
      );
      const result = await getUserAccessibleApps(userId);

      if (!result.success) {
        throw new Error(result.error.message);
      }

      // 转换UserAccessibleApp到AppInfo格式，并去重
      const appMap = new Map<string, AppInfo>();

      result.data.forEach((app: UserAccessibleApp) => {
        const appInfo: AppInfo = {
          id: app.service_instance_id,
          name: app.display_name || app.instance_id,
          instance_id: app.instance_id,
          display_name: app.display_name || undefined,
          description: app.description || undefined,
          config: app.config,
          usage_quota: app.usage_quota ?? undefined,
          used_count: app.used_count,
          quota_remaining: app.quota_remaining ?? undefined,
          visibility: app.visibility,
          // 🎯 暂时注释掉，等待数据库层面支持
          // provider_name: app.provider_name
        };

        // 🔧 关键修复：使用service_instance_id作为唯一键去重
        // 如果用户在多个部门都有权限，只保留一条记录，避免React key重复错误
        if (!appMap.has(app.service_instance_id)) {
          appMap.set(app.service_instance_id, appInfo);
        }
      });

      const apps: AppInfo[] = Array.from(appMap.values());

      set({
        apps,
        isLoading: false,
        lastFetchTime: now,
        currentUserId: userId,
      });

      console.log(
        `[AppListStore] 成功获取用户 ${userId} 可访问的 ${apps.length} 个应用`
      );
    } catch (error: any) {
      console.error('[AppListStore] 获取用户可访问应用失败:', error);
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  // 🎯 检查用户对特定应用的访问权限
  checkAppPermission: async (appInstanceId: string) => {
    const state = get();

    if (!state.currentUserId) {
      console.warn('[AppListStore] 检查应用权限但未设置用户ID');
      return false;
    }

    try {
      const { checkUserAppPermission } = await import(
        '@lib/db/group-permissions'
      );
      const result = await checkUserAppPermission(
        state.currentUserId,
        appInstanceId
      );

      if (!result.success) {
        console.warn(
          `[AppListStore] 检查应用权限失败: ${result.error.message}`
        );
        return false;
      }

      return result.data.has_access;
    } catch (error) {
      console.error('[AppListStore] 检查应用权限异常:', error);
      return false;
    }
  },

  // 🎯 新增：批量获取所有应用的参数
  fetchAllAppParameters: async () => {
    const now = Date.now();
    const state = get();

    // 检查缓存是否仍然有效
    if (
      now - state.lastParametersFetchTime < CACHE_DURATION &&
      Object.keys(state.parametersCache).length > 0
    ) {
      console.log('[AppListStore] 应用参数缓存仍然有效，跳过获取');
      return;
    }

    // 如果没有应用列表，先获取应用列表
    if (state.apps.length === 0) {
      console.log('[AppListStore] 应用列表为空，先获取应用列表');

      // 🎯 直接使用fetchApps获取应用列表
      await get().fetchApps();
    }

    const currentApps = get().apps;
    if (currentApps.length === 0) {
      console.warn('[AppListStore] 无可用应用，跳过参数获取');
      return;
    }

    set({ isLoadingParameters: true, parametersError: null });

    try {
      const { getDifyAppParameters } = await import(
        '@lib/services/dify/app-service'
      );
      const newParametersCache: AppParametersCache = {};

      console.log(
        `[AppListStore] 开始批量获取 ${currentApps.length} 个应用的参数`
      );

      // 并发获取所有应用的参数
      const parameterPromises = currentApps.map(async app => {
        try {
          const parameters = await getDifyAppParameters(app.instance_id); // 使用instance_id调用API
          newParametersCache[app.id] = {
            // 但用id作为缓存key
            data: parameters,
            timestamp: now,
          };
          console.log(`[AppListStore] 成功获取应用 ${app.instance_id} 的参数`);
        } catch (error) {
          console.warn(
            `[AppListStore] 获取应用 ${app.instance_id} 参数失败:`,
            error
          );
          // 单个应用失败不影响其他应用
        }
      });

      await Promise.allSettled(parameterPromises);

      set({
        parametersCache: newParametersCache,
        isLoadingParameters: false,
        lastParametersFetchTime: now,
      });

      console.log(
        `[AppListStore] 批量获取应用参数完成，成功获取 ${Object.keys(newParametersCache).length} 个应用的参数`
      );
    } catch (error: any) {
      console.error('[AppListStore] 批量获取应用参数失败:', error);
      set({
        parametersError: error.message,
        isLoadingParameters: false,
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

  // 🎯 新增：获取指定应用的参数（单独请求）
  fetchAppParameters: async (appId: string) => {
    const state = get();

    // 防止重复请求
    if (state.fetchingApps.has(appId)) {
      console.log(`[AppListStore] 应用 ${appId} 正在请求中，跳过重复请求`);
      return;
    }

    // 检查缓存
    const cached = state.parametersCache[appId];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[AppListStore] 应用 ${appId} 参数缓存有效，跳过请求`);
      return;
    }

    // 找到对应的应用信息
    const app = state.apps.find(a => a.id === appId);
    if (!app) {
      console.warn(`[AppListStore] 未找到应用 ${appId}`);
      return;
    }

    // 添加到请求锁
    set({
      fetchingApps: new Set([...state.fetchingApps, appId]),
    });

    try {
      const { getDifyAppParameters } = await import(
        '@lib/services/dify/app-service'
      );
      const parameters = await getDifyAppParameters(app.instance_id);

      // 更新缓存
      const newCache = {
        ...get().parametersCache,
        [appId]: {
          data: parameters,
          timestamp: Date.now(),
        },
      };

      set({ parametersCache: newCache });
      console.log(`[AppListStore] 成功获取应用 ${app.instance_id} 的参数`);
    } catch (error) {
      console.error(
        `[AppListStore] 获取应用 ${app.instance_id} 参数失败:`,
        error
      );
    } finally {
      // 移除请求锁
      const currentState = get();
      const newFetchingApps = new Set(currentState.fetchingApps);
      newFetchingApps.delete(appId);
      set({ fetchingApps: newFetchingApps });
    }
  },

  // 🎯 新增：清理参数缓存
  clearParametersCache: () => {
    set({
      parametersCache: {},
      lastParametersFetchTime: 0,
      parametersError: null,
      fetchingApps: new Set(),
    });
  },

  clearCache: () => {
    set({
      apps: [],
      lastFetchTime: 0,
      error: null,
      // 🎯 清理用户状态
      currentUserId: null,
      // 清理参数缓存
      parametersCache: {},
      lastParametersFetchTime: 0,
      parametersError: null,
      fetchingApps: new Set(),
    });
  },
}));
