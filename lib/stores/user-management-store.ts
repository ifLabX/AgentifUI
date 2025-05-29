/**
 * 用户管理状态管理
 * 
 * 使用Zustand管理用户管理界面的状态
 * 包括用户列表、筛选条件、分页、统计信息等
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  getUserList, 
  getUserStats, 
  getUserById,
  updateUserProfile,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  batchUpdateUserStatus,
  batchUpdateUserRole,
  type EnhancedUser,
  type UserStats,
  type UserFilters
} from '@lib/db/users';
import { Result } from '@lib/types/result';

// 加载状态
interface LoadingState {
  users: boolean;
  stats: boolean;
  userDetail: boolean;
  updating: boolean;
  deleting: boolean;
  batchOperating: boolean;
}

// 用户管理状态接口
interface UserManagementState {
  // 数据状态
  users: EnhancedUser[];
  stats: UserStats | null;
  selectedUser: EnhancedUser | null;
  selectedUserIds: string[];
  
  // 分页和筛选
  filters: UserFilters;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  
  // 加载状态
  loading: LoadingState;
  error: string | null;
  
  // UI状态
  showUserDetail: boolean;
  showBatchActions: boolean;
  
  // Actions
  loadUsers: () => Promise<void>;
  loadStats: () => Promise<void>;
  loadUserDetail: (userId: string) => Promise<void>;
  updateFilters: (filters: Partial<UserFilters>) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  selectUser: (user: EnhancedUser) => void;
  selectUsers: (userIds: string[]) => void;
  toggleUserSelection: (userId: string) => void;
  clearSelection: () => void;
  
  // 用户操作
  updateUser: (userId: string, updates: Partial<EnhancedUser>) => Promise<boolean>;
  changeUserRole: (userId: string, role: 'admin' | 'manager' | 'user') => Promise<boolean>;
  changeUserStatus: (userId: string, status: 'active' | 'suspended' | 'pending') => Promise<boolean>;
  removeUser: (userId: string) => Promise<boolean>;
  
  // 批量操作
  batchChangeStatus: (status: 'active' | 'suspended' | 'pending') => Promise<boolean>;
  batchChangeRole: (role: 'admin' | 'manager' | 'user') => Promise<boolean>;
  
  // UI操作
  showUserDetailModal: (user: EnhancedUser) => void;
  hideUserDetailModal: () => void;
  
  // 清理
  clearError: () => void;
  resetStore: () => void;
}

// 初始状态
const initialState = {
  users: [],
  stats: null,
  selectedUser: null,
  selectedUserIds: [],
  filters: {
    page: 1,
    pageSize: 20,
    sortBy: 'created_at' as const,
    sortOrder: 'desc' as const
  },
  pagination: {
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  },
  loading: {
    users: false,
    stats: false,
    userDetail: false,
    updating: false,
    deleting: false,
    batchOperating: false
  },
  error: null,
  showUserDetail: false,
  showBatchActions: false
};

export const useUserManagementStore = create<UserManagementState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // 加载用户列表
      loadUsers: async () => {
        const state = get();
        set((state) => ({
          loading: { ...state.loading, users: true },
          error: null
        }));
        
        try {
          const result = await getUserList(state.filters);
          
          if (result.success) {
            set((state) => ({
              users: result.data.users,
              pagination: {
                total: result.data.total,
                page: result.data.page,
                pageSize: result.data.pageSize,
                totalPages: result.data.totalPages
              },
              loading: { ...state.loading, users: false }
            }));
          } else {
            set((state) => ({
              error: result.error?.message || '加载用户列表失败',
              loading: { ...state.loading, users: false }
            }));
          }
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : '加载用户列表失败',
            loading: { ...state.loading, users: false }
          }));
        }
      },
      
      // 加载统计信息
      loadStats: async () => {
        set((state) => ({
          loading: { ...state.loading, stats: true },
          error: null
        }));
        
        try {
          const result = await getUserStats();
          
          if (result.success) {
            set((state) => ({
              stats: result.data,
              loading: { ...state.loading, stats: false }
            }));
          } else {
            set((state) => ({
              error: result.error?.message || '加载统计信息失败',
              loading: { ...state.loading, stats: false }
            }));
          }
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : '加载统计信息失败',
            loading: { ...state.loading, stats: false }
          }));
        }
      },
      
      // 加载用户详情
      loadUserDetail: async (userId: string) => {
        set((state) => ({
          loading: { ...state.loading, userDetail: true },
          error: null
        }));
        
        try {
          const result = await getUserById(userId);
          
          if (result.success && result.data) {
            set((state) => ({
              selectedUser: result.data,
              loading: { ...state.loading, userDetail: false }
            }));
          } else {
            set((state) => ({
              error: result.error?.message || '加载用户详情失败',
              loading: { ...state.loading, userDetail: false }
            }));
          }
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : '加载用户详情失败',
            loading: { ...state.loading, userDetail: false }
          }));
        }
      },
      
      // 更新筛选条件
      updateFilters: (newFilters: Partial<UserFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters, page: 1 }, // 重置到第一页
          selectedUserIds: [] // 清空选择
        }));
        
        // 自动重新加载数据
        get().loadUsers();
      },
      
      // 设置页码
      setPage: (page: number) => {
        set((state) => ({
          filters: { ...state.filters, page }
        }));
        
        // 自动重新加载数据
        get().loadUsers();
      },
      
      // 设置页面大小
      setPageSize: (pageSize: number) => {
        set((state) => ({
          filters: { ...state.filters, pageSize, page: 1 } // 重置到第一页
        }));
        
        // 自动重新加载数据
        get().loadUsers();
      },
      
      // 选择用户
      selectUser: (user: EnhancedUser) => {
        set({ selectedUser: user });
      },
      
      // 批量选择用户
      selectUsers: (userIds: string[]) => {
        set({ selectedUserIds: userIds });
      },
      
      // 切换用户选择状态
      toggleUserSelection: (userId: string) => {
        set((state) => {
          const selectedIds = state.selectedUserIds;
          const isSelected = selectedIds.includes(userId);
          
          return {
            selectedUserIds: isSelected
              ? selectedIds.filter(id => id !== userId)
              : [...selectedIds, userId]
          };
        });
      },
      
      // 清空选择
      clearSelection: () => {
        set({ selectedUserIds: [], selectedUser: null });
      },
      
      // 更新用户
      updateUser: async (userId: string, updates: Partial<EnhancedUser>) => {
        set((state) => ({
          loading: { ...state.loading, updating: true },
          error: null
        }));
        
        try {
          const result = await updateUserProfile(userId, updates);
          
          if (result.success) {
            // 更新本地状态
            set((state) => ({
              users: state.users.map(user => 
                user.id === userId ? { ...user, ...updates } : user
              ),
              selectedUser: state.selectedUser?.id === userId 
                ? { ...state.selectedUser, ...updates } 
                : state.selectedUser,
              loading: { ...state.loading, updating: false }
            }));
            
            return true;
          } else {
            set((state) => ({
              error: result.error?.message || '更新用户失败',
              loading: { ...state.loading, updating: false }
            }));
            return false;
          }
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : '更新用户失败',
            loading: { ...state.loading, updating: false }
          }));
          return false;
        }
      },
      
      // 修改用户角色
      changeUserRole: async (userId: string, role: 'admin' | 'manager' | 'user') => {
        const result = await get().updateUser(userId, { role });
        if (result) {
          // 重新加载统计数据
          get().loadStats();
        }
        return result;
      },
      
      // 修改用户状态
      changeUserStatus: async (userId: string, status: 'active' | 'suspended' | 'pending') => {
        const result = await get().updateUser(userId, { status });
        if (result) {
          // 重新加载统计数据
          get().loadStats();
        }
        return result;
      },
      
      // 删除用户
      removeUser: async (userId: string) => {
        set((state) => ({
          loading: { ...state.loading, deleting: true },
          error: null
        }));
        
        try {
          const result = await deleteUser(userId);
          
          if (result.success) {
            // 从本地状态中移除用户
            set((state) => ({
              users: state.users.filter(user => user.id !== userId),
              selectedUserIds: state.selectedUserIds.filter(id => id !== userId),
              selectedUser: state.selectedUser?.id === userId ? null : state.selectedUser,
              loading: { ...state.loading, deleting: false }
            }));
            
            // 重新加载统计数据
            get().loadStats();
            return true;
          } else {
            set((state) => ({
              error: result.error?.message || '删除用户失败',
              loading: { ...state.loading, deleting: false }
            }));
            return false;
          }
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : '删除用户失败',
            loading: { ...state.loading, deleting: false }
          }));
          return false;
        }
      },
      
      // 批量修改状态
      batchChangeStatus: async (status: 'active' | 'suspended' | 'pending') => {
        const state = get();
        const userIds = state.selectedUserIds;
        
        if (userIds.length === 0) return false;
        
        set((state) => ({
          loading: { ...state.loading, batchOperating: true },
          error: null
        }));
        
        try {
          const result = await batchUpdateUserStatus(userIds, status);
          
          if (result.success) {
            // 更新本地状态
            set((state) => ({
              users: state.users.map(user => 
                userIds.includes(user.id) ? { ...user, status } : user
              ),
              selectedUserIds: [], // 清空选择
              loading: { ...state.loading, batchOperating: false }
            }));
            
            // 重新加载统计数据
            get().loadStats();
            return true;
          } else {
            set((state) => ({
              error: result.error?.message || '批量更新状态失败',
              loading: { ...state.loading, batchOperating: false }
            }));
            return false;
          }
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : '批量更新状态失败',
            loading: { ...state.loading, batchOperating: false }
          }));
          return false;
        }
      },
      
      // 批量修改角色
      batchChangeRole: async (role: 'admin' | 'manager' | 'user') => {
        const state = get();
        const userIds = state.selectedUserIds;
        
        if (userIds.length === 0) return false;
        
        set((state) => ({
          loading: { ...state.loading, batchOperating: true },
          error: null
        }));
        
        try {
          const result = await batchUpdateUserRole(userIds, role);
          
          if (result.success) {
            // 更新本地状态
            set((state) => ({
              users: state.users.map(user => 
                userIds.includes(user.id) ? { ...user, role } : user
              ),
              selectedUserIds: [], // 清空选择
              loading: { ...state.loading, batchOperating: false }
            }));
            
            // 重新加载统计数据
            get().loadStats();
            return true;
          } else {
            set((state) => ({
              error: result.error?.message || '批量更新角色失败',
              loading: { ...state.loading, batchOperating: false }
            }));
            return false;
          }
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : '批量更新角色失败',
            loading: { ...state.loading, batchOperating: false }
          }));
          return false;
        }
      },
      
      // 显示用户详情模态框
      showUserDetailModal: (user: EnhancedUser) => {
        set({ 
          selectedUser: user, 
          showUserDetail: true 
        });
      },
      
      // 隐藏用户详情模态框
      hideUserDetailModal: () => {
        set({ 
          showUserDetail: false,
          selectedUser: null 
        });
      },
      
      // 清理错误
      clearError: () => {
        set({ error: null });
      },
      
      // 重置store
      resetStore: () => {
        set(initialState);
      }
    }),
    {
      name: 'user-management-store',
      partialize: (state: UserManagementState) => ({
        filters: state.filters // 只持久化筛选条件
      })
    }
  )
); 