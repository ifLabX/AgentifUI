import { create } from 'zustand';

/**
 * 页面标识类型
 * 
 * 注意: 不需要直接修改这个类型定义，而是使用 registerPage 方法注册新页面
 * 例如: loadingStore.registerPage('new-page');
 */
export type PageKey = string;

interface LoadingState {
  // 页面加载状态
  pageLoading: Record<string, boolean>;
  
  // 设置特定页面的加载状态
  setPageLoading: (page: PageKey, isLoading: boolean) => void;
  
  // 获取特定页面的加载状态
  getPageLoading: (page: PageKey) => boolean;
  
  // 注册新页面
  registerPage: (page: PageKey) => void;
  
  // 检查页面是否已注册
  hasPage: (page: PageKey) => boolean;
  
  // 重置所有页面加载状态
  resetPageLoading: () => void;
}

// 预定义的页面列表
// 注意: 这只是初始页面列表，可以通过 registerPage 动态添加新页面
const DEFAULT_PAGES = ['settings', 'chat', 'about'];

// 初始状态
const createInitialState = () => {
  const state: Record<string, boolean> = {};
  DEFAULT_PAGES.forEach(page => {
    state[page] = false;
  });
  return state;
};

export const useLoadingStore = create<LoadingState>((set, get) => ({
  // 初始状态
  pageLoading: createInitialState(),
  
  // 设置特定页面的加载状态
  setPageLoading: (page, isLoading) => {
    // 如果页面不存在，先注册它
    if (!get().hasPage(page)) {
      get().registerPage(page);
    }
    
    set((state) => ({ 
      pageLoading: { ...state.pageLoading, [page]: isLoading } 
    }));
  },
  
  // 获取特定页面的加载状态
  getPageLoading: (page) => {
    // 如果页面不存在，返回 false
    if (!get().hasPage(page)) {
      return false;
    }
    return get().pageLoading[page];
  },
  
  // 注册新页面
  registerPage: (page) => {
    if (!get().hasPage(page)) {
      set((state) => ({
        pageLoading: { ...state.pageLoading, [page]: false }
      }));
    }
  },
  
  // 检查页面是否已注册
  hasPage: (page) => {
    return Object.prototype.hasOwnProperty.call(get().pageLoading, page);
  },
  
  // 重置所有页面加载状态
  resetPageLoading: () => {
    const currentPages = Object.keys(get().pageLoading);
    const resetState: Record<string, boolean> = {};
    
    currentPages.forEach(page => {
      resetState[page] = false;
    });
    
    set({ pageLoading: resetState });
  },
}));
