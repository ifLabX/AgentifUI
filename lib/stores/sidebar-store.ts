import { create } from "zustand"

// 选中项目类型
export type SelectedItemType = 'chat' | 'app' | null

interface SidebarState {
  // --- BEGIN COMMENT ---
  // 基础状态
  // --- END COMMENT ---
  isExpanded: boolean // 侧边栏是否展开
  // --- BEGIN COMMENT ---
  // 客户端挂载状态
  // --- END COMMENT ---
  isMounted: boolean // 组件是否已在客户端挂载
  // --- BEGIN COMMENT ---
  // 内容显示状态
  // --- END COMMENT ---
  contentVisible: boolean // 侧边栏内容是否可见
  // --- BEGIN COMMENT ---
  // 移动端状态管理
  // --- END COMMENT ---
  isMobileNavVisible: boolean // 移动端导航是否可见
  // --- BEGIN COMMENT ---
  // 动画状态管理
  // --- END COMMENT ---
  isAnimating: boolean // 侧边栏是否正在动画中
  // --- BEGIN COMMENT ---
  // 选中状态管理
  // --- END COMMENT ---
  selectedType: SelectedItemType // 选中的项目类型：'chat' 或 'app' 或 null
  selectedId: string | number | null // 选中项目的ID
  
  // --- BEGIN COMMENT ---
  // 方法
  // --- END COMMENT ---
  toggleSidebar: () => void
  // 客户端挂载方法
  setMounted: () => void
  // 内容显示方法
  showContent: () => void
  hideContent: () => void
  updateContentVisibility: (isMobile: boolean) => void
  // 宽度计算方法
  getSidebarWidth: (isMobile: boolean) => string
  // 移动端方法
  showMobileNav: () => void
  hideMobileNav: () => void
  toggleMobileNav: () => void
  // 选中状态管理方法
  selectItem: (type: SelectedItemType, id: string | number | null, keepCurrentExpandState?: boolean) => void
  clearSelection: () => void
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  // --- BEGIN COMMENT ---
  // 基础状态
  // --- END COMMENT ---
  isExpanded: false,
  // --- BEGIN COMMENT ---
  // 客户端挂载状态 - 初始为 false
  // --- END COMMENT ---
  isMounted: false, 
  // --- BEGIN COMMENT ---
  // 内容显示状态
  // --- END COMMENT ---
  contentVisible: false,
  // 移动端状态
  isMobileNavVisible: false,
  // 动画状态
  isAnimating: false,
  // 选中状态初始值
  selectedType: null,
  selectedId: null,

  // 客户端挂载方法
  setMounted: () => {
    set({ isMounted: true })
  },
  
  // 内容显示管理
  showContent: () => {
    set({ contentVisible: true })
  },
  
  hideContent: () => {
    set({ contentVisible: false })
  },
  
  // 根据设备类型和侧边栏状态更新内容可见性
  updateContentVisibility: (isMobile: boolean) => {
    const { isExpanded } = get()
    
    if (!isExpanded) {
      // 侧边栏折叠时直接隐藏内容
      set({ contentVisible: false })
      return
    }
    
    // 如果是移动设备，立即显示内容，否则依赖外部延迟设置
    if (isMobile) {
      set({ contentVisible: true })
    }
    // 桌面端由外部计时器延迟设置
  },

  // 宽度计算方法
  getSidebarWidth: (isMobile: boolean) => {
    const { isExpanded, isMounted } = get()
    
    // 未挂载前保持宽度为0防止闪烁
    if (!isMounted) return "w-0"
    
    // 根据设备类型和侧边栏状态返回不同宽度类名
    if (isMobile) {
      return isExpanded ? "w-64" : "w-0"
    } else {
      return isExpanded ? "w-64" : "w-16"
    }
  },

  toggleSidebar: () => {
    set((state) => {
      const newIsExpanded = !state.isExpanded;

      // 当收起侧边栏时，立即隐藏内容
      if (!newIsExpanded) {
        set({ contentVisible: false })
      }
      // 展开时不立即设置contentVisible，让updateContentVisibility处理

      // 设置动画状态
      set({ isAnimating: true })
      
      // 150ms后清除动画状态
      setTimeout(() => {
        set({ isAnimating: false })
      }, 150)

      return {
        isExpanded: newIsExpanded,
      }
    })
  },


  
  // --- BEGIN COMMENT ---
  // 移动端方法
  // --- END COMMENT ---
  showMobileNav: () => {
    set({ 
      isExpanded: true, 
      isMobileNavVisible: true,
      // --- BEGIN MODIFIED COMMENT ---
      // 移动端上立即显示内容
      // --- END MODIFIED COMMENT ---
      contentVisible: true 
    })
  },
  
  hideMobileNav: () => {
    set({ 
      isExpanded: false, 
      isMobileNavVisible: false,
      contentVisible: false
    })
  },
  
  toggleMobileNav: () => {
    const { isMobileNavVisible } = get()
    const newState = !isMobileNavVisible
    
    set({ 
      isExpanded: newState,
      isMobileNavVisible: newState,
      // --- BEGIN MODIFIED COMMENT ---
      // 同步内容显示状态
      // --- END MODIFIED COMMENT ---
      contentVisible: newState 
    })
  },

  // --- BEGIN COMMENT ---
  // 选中状态管理方法
  // --- END COMMENT ---
  selectItem: (type: SelectedItemType, id: string | number | null, keepCurrentExpandState: boolean = false) => {
    const currentState = get()
    
    // 更新选中状态
    const updates: Partial<SidebarState> = {
      selectedType: type,
      selectedId: id
    }
    
    // 如果需要保持当前展开状态，确保内容可见
    if (keepCurrentExpandState && currentState.isExpanded) {
      updates.contentVisible = true
    }
    
    set(updates)
  },

  clearSelection: () => {
    set({ 
      selectedType: null, 
      selectedId: null 
    })
  },
}))
