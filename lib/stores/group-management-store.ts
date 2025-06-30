import type { Group, GroupMember } from '@lib/db/group-permissions';
import {
  addGroupMember,
  createGroup,
  deleteGroup,
  getGroupMembers,
  getGroups,
  removeGroupMember,
  updateGroup,
} from '@lib/db/group-permissions';
import { create } from 'zustand';

interface GroupStats {
  totalGroups: number;
  totalMembers: number;
  activeGroups: number;
}

interface GroupManagementState {
  // 数据状态
  groups: Group[];
  currentGroup: Group | null;
  groupMembers: Record<string, GroupMember[]>;
  stats: GroupStats;

  // 加载状态
  loading: {
    groups: boolean;
    members: boolean;
    stats: boolean;
    creating: boolean;
    updating: boolean;
    deleting: boolean;
  };

  // 错误状态
  error: string | null;

  // 筛选状态
  searchTerm: string;

  // 操作方法
  loadGroups: () => Promise<void>;
  loadGroupMembers: (groupId: string) => Promise<void>;
  loadStats: () => Promise<void>;

  createGroup: (data: {
    name: string;
    description?: string;
  }) => Promise<boolean>;
  updateGroup: (
    groupId: string,
    data: { name?: string; description?: string }
  ) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<boolean>;

  addMember: (groupId: string, userId: string) => Promise<boolean>;
  removeMember: (groupId: string, userId: string) => Promise<boolean>;

  setCurrentGroup: (group: Group | null) => void;
  setSearchTerm: (term: string) => void;
  clearError: () => void;
}

export const useGroupManagementStore = create<GroupManagementState>(
  (set, get) => ({
    // 初始状态
    groups: [],
    currentGroup: null,
    groupMembers: {},
    stats: {
      totalGroups: 0,
      totalMembers: 0,
      activeGroups: 0,
    },

    loading: {
      groups: false,
      members: false,
      stats: false,
      creating: false,
      updating: false,
      deleting: false,
    },

    error: null,
    searchTerm: '',

    // 加载群组列表
    loadGroups: async () => {
      set(state => ({
        loading: { ...state.loading, groups: true },
        error: null,
      }));

      try {
        const result = await getGroups();

        if (result.success) {
          set(state => ({
            groups: result.data,
            loading: { ...state.loading, groups: false },
          }));
        } else {
          set(state => ({
            error: result.error.message,
            loading: { ...state.loading, groups: false },
          }));
        }
      } catch (error) {
        set(state => ({
          error: '加载群组列表失败',
          loading: { ...state.loading, groups: false },
        }));
      }
    },

    // 加载群组成员
    loadGroupMembers: async (groupId: string) => {
      set(state => ({
        loading: { ...state.loading, members: true },
        error: null,
      }));

      try {
        const result = await getGroupMembers(groupId);

        if (result.success) {
          set(state => ({
            groupMembers: {
              ...state.groupMembers,
              [groupId]: result.data,
            },
            loading: { ...state.loading, members: false },
          }));
        } else {
          set(state => ({
            error: result.error.message,
            loading: { ...state.loading, members: false },
          }));
        }
      } catch (error) {
        set(state => ({
          error: '加载群组成员失败',
          loading: { ...state.loading, members: false },
        }));
      }
    },

    // 加载统计数据
    loadStats: async () => {
      set(state => ({
        loading: { ...state.loading, stats: true },
        error: null,
      }));

      try {
        const groupsResult = await getGroups();

        if (groupsResult.success) {
          const groups = groupsResult.data;
          const totalGroups = groups.length;

          // 使用群组数据中的 member_count 字段计算总成员数
          // 避免对每个群组单独查询成员，防止新群组导致的查询失败
          const totalMembers = groups.reduce((sum, group) => {
            return sum + (group.member_count || 0);
          }, 0);

          const stats: GroupStats = {
            totalGroups,
            totalMembers,
            activeGroups: totalGroups, // 暂时所有群组都算活跃
          };

          set(state => ({
            stats,
            loading: { ...state.loading, stats: false },
          }));
        } else {
          set(state => ({
            error: groupsResult.error.message,
            loading: { ...state.loading, stats: false },
          }));
        }
      } catch (error) {
        set(state => ({
          error: '加载统计数据失败',
          loading: { ...state.loading, stats: false },
        }));
      }
    },

    // 创建群组
    createGroup: async data => {
      set(state => ({
        loading: { ...state.loading, creating: true },
        error: null,
      }));

      try {
        const result = await createGroup(data);

        if (result.success) {
          // 重新加载群组列表
          await get().loadGroups();
          await get().loadStats();

          set(state => ({ loading: { ...state.loading, creating: false } }));
          return true;
        } else {
          set(state => ({
            error: result.error.message,
            loading: { ...state.loading, creating: false },
          }));
          return false;
        }
      } catch (error) {
        set(state => ({
          error: '创建群组失败',
          loading: { ...state.loading, creating: false },
        }));
        return false;
      }
    },

    // 更新群组
    updateGroup: async (groupId, data) => {
      set(state => ({
        loading: { ...state.loading, updating: true },
        error: null,
      }));

      try {
        const result = await updateGroup(groupId, data);

        if (result.success) {
          // 更新本地状态
          set(state => ({
            groups: state.groups.map(group =>
              group.id === groupId ? { ...group, ...data } : group
            ),
            currentGroup:
              state.currentGroup?.id === groupId
                ? { ...state.currentGroup, ...data }
                : state.currentGroup,
            loading: { ...state.loading, updating: false },
          }));
          return true;
        } else {
          set(state => ({
            error: result.error.message,
            loading: { ...state.loading, updating: false },
          }));
          return false;
        }
      } catch (error) {
        set(state => ({
          error: '更新群组失败',
          loading: { ...state.loading, updating: false },
        }));
        return false;
      }
    },

    // 删除群组
    deleteGroup: async groupId => {
      set(state => ({
        loading: { ...state.loading, deleting: true },
        error: null,
      }));

      try {
        const result = await deleteGroup(groupId);

        if (result.success) {
          // 更新本地状态
          set(state => ({
            groups: state.groups.filter(group => group.id !== groupId),
            currentGroup:
              state.currentGroup?.id === groupId ? null : state.currentGroup,
            groupMembers: Object.fromEntries(
              Object.entries(state.groupMembers).filter(
                ([id]) => id !== groupId
              )
            ),
            loading: { ...state.loading, deleting: false },
          }));

          // 重新加载统计数据
          await get().loadStats();
          return true;
        } else {
          set(state => ({
            error: result.error.message,
            loading: { ...state.loading, deleting: false },
          }));
          return false;
        }
      } catch (error) {
        set(state => ({
          error: '删除群组失败',
          loading: { ...state.loading, deleting: false },
        }));
        return false;
      }
    },

    // 添加成员
    addMember: async (groupId, userId) => {
      try {
        const result = await addGroupMember(groupId, userId);

        if (result.success) {
          // 重新加载该群组的成员列表
          await get().loadGroupMembers(groupId);
          await get().loadStats();
          return true;
        } else {
          set({ error: result.error.message });
          return false;
        }
      } catch (error) {
        set({ error: '添加成员失败' });
        return false;
      }
    },

    // 移除成员
    removeMember: async (groupId, userId) => {
      try {
        const result = await removeGroupMember(groupId, userId);

        if (result.success) {
          // 重新加载该群组的成员列表
          await get().loadGroupMembers(groupId);
          await get().loadStats();
          return true;
        } else {
          set({ error: result.error.message });
          return false;
        }
      } catch (error) {
        set({ error: '移除成员失败' });
        return false;
      }
    },

    // 设置当前群组
    setCurrentGroup: group => {
      set({ currentGroup: group });
    },

    // 设置搜索词
    setSearchTerm: term => {
      set({ searchTerm: term });
    },

    // 清除错误
    clearError: () => {
      set({ error: null });
    },
  })
);
