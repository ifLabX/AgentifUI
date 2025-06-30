'use client';

import type { Group } from '@lib/db/group-permissions';
import type { AppVisibility, ServiceInstance } from '@lib/types/database';
import { create } from 'zustand';

// --- BEGIN COMMENT ---
// 🎯 权限管理Store - 统一管理应用权限和群组分配
// --- END COMMENT ---

export interface AppWithPermissions extends ServiceInstance {
  // 当前应用的群组权限配置
  groupPermissions: Array<{
    group_id: string;
    group_name: string;
    is_enabled: boolean;
    usage_quota: number | null;
  }>;
}

interface PermissionManagementState {
  // 数据状态
  apps: AppWithPermissions[];
  groups: Group[];
  selectedApp: AppWithPermissions | null;

  // 加载状态
  loading: {
    apps: boolean;
    groups: boolean;
    updating: boolean;
  };

  // 错误状态
  error: string | null;

  // 搜索和筛选
  searchTerm: string;
  visibilityFilter: AppVisibility | 'all';
}

interface PermissionManagementActions {
  // 数据加载
  loadApps: () => Promise<void>;
  loadGroups: () => Promise<void>;
  loadAppPermissions: (appId: string) => Promise<void>;

  // 应用管理
  updateAppVisibility: (
    appId: string,
    visibility: AppVisibility
  ) => Promise<boolean>;
  selectApp: (app: AppWithPermissions | null) => void;

  // 群组权限管理
  setGroupPermission: (
    appId: string,
    groupId: string,
    enabled: boolean,
    quota?: number | null
  ) => Promise<boolean>;

  // 搜索和筛选
  setSearchTerm: (term: string) => void;
  setVisibilityFilter: (filter: AppVisibility | 'all') => void;

  // 工具方法
  getFilteredApps: () => AppWithPermissions[];
  reset: () => void;
}

type PermissionManagementStore = PermissionManagementState &
  PermissionManagementActions;

const initialState: PermissionManagementState = {
  apps: [],
  groups: [],
  selectedApp: null,
  loading: {
    apps: false,
    groups: false,
    updating: false,
  },
  error: null,
  searchTerm: '',
  visibilityFilter: 'all',
};

export const usePermissionManagementStore = create<PermissionManagementStore>(
  (set, get) => ({
    ...initialState,

    // --- BEGIN COMMENT ---
    // 🔄 数据加载函数
    // --- END COMMENT ---

    loadApps: async () => {
      set(state => ({
        loading: { ...state.loading, apps: true },
        error: null,
      }));

      try {
        // 使用现有的getAllDifyApps函数获取所有应用
        const { getAllDifyApps } = await import(
          '@lib/services/dify/app-service'
        );
        const appsData = await getAllDifyApps();

        // 转换为AppWithPermissions格式
        const apps: AppWithPermissions[] = appsData.map(app => ({
          id: app.id,
          provider_id: '', // 暂时为空，后续可扩展
          display_name: app.display_name || null,
          description: app.description || null,
          instance_id: app.instance_id,
          api_path: '', // 从config中获取
          is_default: false,
          visibility: (app.visibility as AppVisibility) || 'public',
          config: app.config || {},
          created_at: '',
          updated_at: '',
          groupPermissions: [], // 初始为空，需要单独加载
        }));

        set(state => ({
          apps,
          loading: { ...state.loading, apps: false },
        }));
      } catch (error: any) {
        console.error('加载应用列表失败:', error);
        set(state => ({
          error: error.message || '加载应用列表失败',
          loading: { ...state.loading, apps: false },
        }));
      }
    },

    loadGroups: async () => {
      set(state => ({
        loading: { ...state.loading, groups: true },
        error: null,
      }));

      try {
        const { getGroups } = await import('@lib/db/group-permissions');
        const result = await getGroups();

        if (result.success) {
          set(state => ({
            groups: result.data,
            loading: { ...state.loading, groups: false },
          }));
        } else {
          throw new Error(result.error.message);
        }
      } catch (error: any) {
        console.error('加载群组列表失败:', error);
        set(state => ({
          error: error.message || '加载群组列表失败',
          loading: { ...state.loading, groups: false },
        }));
      }
    },

    loadAppPermissions: async (appId: string) => {
      try {
        const { getGroupAppPermissions } = await import(
          '@lib/db/group-permissions'
        );
        const { groups } = get();

        // 为每个群组获取对该应用的权限
        const groupPermissions = await Promise.all(
          groups.map(async group => {
            const result = await getGroupAppPermissions(group.id);

            if (result.success) {
              const appPermission = result.data.find(
                p => p.service_instance_id === appId
              );

              return {
                group_id: group.id,
                group_name: group.name,
                is_enabled: appPermission?.is_enabled || false,
                usage_quota: appPermission?.usage_quota || null,
              };
            }

            return {
              group_id: group.id,
              group_name: group.name,
              is_enabled: false,
              usage_quota: null,
            };
          })
        );

        // 更新应用的群组权限信息
        set(state => ({
          apps: state.apps.map(app =>
            app.id === appId ? { ...app, groupPermissions } : app
          ),
          selectedApp:
            state.selectedApp?.id === appId
              ? { ...state.selectedApp, groupPermissions }
              : state.selectedApp,
        }));
      } catch (error: any) {
        console.error('加载应用权限失败:', error);
        set({ error: error.message || '加载应用权限失败' });
      }
    },

    // --- BEGIN COMMENT ---
    // 🎯 应用管理函数
    // --- END COMMENT ---

    updateAppVisibility: async (appId: string, visibility: AppVisibility) => {
      set(state => ({
        loading: { ...state.loading, updating: true },
        error: null,
      }));

      try {
        const { updateServiceInstance } = await import(
          '@lib/db/service-instances'
        );
        const result = await updateServiceInstance(appId, { visibility });

        if (result.success) {
          // --- BEGIN COMMENT ---
          // 🎯 权限切换后的数据清理逻辑
          // 当从group_only切换到其他权限时，清理组权限表中的相关记录
          // --- END COMMENT ---

          // 如果切换到非group_only权限，清理所有相关的组权限记录
          if (visibility !== 'group_only') {
            try {
              const { removeAllGroupAppPermissions } = await import(
                '@lib/db/group-permissions'
              );
              await removeAllGroupAppPermissions(appId);
            } catch (cleanupError) {
              console.warn('清理组权限记录时出现警告:', cleanupError);
              // 不阻断主流程，只记录警告
            }
          }

          // 更新本地状态
          set(state => ({
            apps: state.apps.map(app =>
              app.id === appId ? { ...app, visibility } : app
            ),
            selectedApp:
              state.selectedApp?.id === appId
                ? { ...state.selectedApp, visibility }
                : state.selectedApp,
            loading: { ...state.loading, updating: false },
          }));

          // 如果当前选中的应用就是被更新的应用，重新加载其权限信息
          if (get().selectedApp?.id === appId) {
            await get().loadAppPermissions(appId);
          }

          return true;
        } else {
          throw new Error(result.error.message);
        }
      } catch (error: any) {
        console.error('更新应用可见性失败:', error);
        set(state => ({
          error: error.message || '更新应用可见性失败',
          loading: { ...state.loading, updating: false },
        }));
        return false;
      }
    },

    selectApp: (app: AppWithPermissions | null) => {
      set({ selectedApp: app });

      // 如果选择了应用，加载其权限信息
      if (app) {
        get().loadAppPermissions(app.id);
      }
    },

    // --- BEGIN COMMENT ---
    // 👥 群组权限管理函数
    // --- END COMMENT ---

    setGroupPermission: async (
      appId: string,
      groupId: string,
      enabled: boolean,
      quota?: number | null
    ) => {
      set(state => ({
        loading: { ...state.loading, updating: true },
        error: null,
      }));

      try {
        const { setGroupAppPermission } = await import(
          '@lib/db/group-permissions'
        );
        const result = await setGroupAppPermission(groupId, appId, {
          is_enabled: enabled,
          usage_quota: quota,
        });

        if (result.success) {
          // 重新加载应用权限信息
          await get().loadAppPermissions(appId);

          set(state => ({ loading: { ...state.loading, updating: false } }));
          return true;
        } else {
          throw new Error(result.error.message);
        }
      } catch (error: any) {
        console.error('设置群组权限失败:', error);
        set(state => ({
          error: error.message || '设置群组权限失败',
          loading: { ...state.loading, updating: false },
        }));
        return false;
      }
    },

    // --- BEGIN COMMENT ---
    // 🔍 搜索和筛选函数
    // --- END COMMENT ---

    setSearchTerm: (term: string) => {
      set({ searchTerm: term });
    },

    setVisibilityFilter: (filter: AppVisibility | 'all') => {
      set({ visibilityFilter: filter });
    },

    getFilteredApps: () => {
      const { apps, searchTerm, visibilityFilter } = get();

      return apps.filter(app => {
        // 搜索过滤
        const matchesSearch =
          !searchTerm ||
          app.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.instance_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.description?.toLowerCase().includes(searchTerm.toLowerCase());

        // 可见性过滤
        const matchesVisibility =
          visibilityFilter === 'all' || app.visibility === visibilityFilter;

        return matchesSearch && matchesVisibility;
      });
    },

    reset: () => {
      set(initialState);
    },
  })
);
