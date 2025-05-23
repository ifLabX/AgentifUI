import { create } from "zustand"

// 选中项目类型
export type SelectedItemType = 'chat' | 'app' | null

interface SidebarState {
  // --- BEGIN COMMENT ---
  // 基础状态
  // --- END COMMENT ---
  isExpanded: boolean // 侧边栏是否展开
  isLocked: boolean // 侧边栏是否被锁定（区别于悬停展开）
  isHovering: boolean // 鼠标是否悬停在侧边栏上
  hoverTimeoutId: number | null // 悬停展开/收起的计时器ID
  clickCooldown: boolean // 点击后防止悬停立即触发的冷却状态
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
  // 选中状态管理
  // --- END COMMENT ---
  selectedType: SelectedItemType // 选中的项目类型：'chat' 或 'app' 或 null
  selectedId: string | number | null // 选中项目的ID
  
  // --- BEGIN COMMENT ---
  // 方法
  // --- END COMMENT ---
  toggleSidebar: () => void
  setHovering: (hovering: boolean) => void
  lockExpanded: () => void
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
  // 选中状态管理方法 - 修改为可选是否改变展开状态
  selectItem: (type: SelectedItemType, id: string | number | null, keepCurrentExpandState?: boolean) => void
  clearSelection: () => void
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  // --- BEGIN COMMENT ---
  // 基础状态
  // --- END COMMENT ---
  isExpanded: false,
  isLocked: false, // 新增锁定状态
  isHovering: false,
  hoverTimeoutId: null,
  clickCooldown: false,
  // --- BEGIN MODIFIED COMMENT ---
  // 客户端挂载状态 - 初始为 false
  // --- END MODIFIED COMMENT ---
  isMounted: false, 
  // --- BEGIN COMMENT ---
  // 内容显示状态
  // --- END COMMENT ---
  contentVisible: false,
  // 移动端状态
  isMobileNavVisible: false,
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
    
    // 如果是移动设备，立即显示内容，否则依赖动画
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
      // --- BEGIN COMMENT ---
      // 清除任何待处理的悬停超时
      // --- END COMMENT ---
      if (state.hoverTimeoutId) {
        clearTimeout(state.hoverTimeoutId)
      }

      // --- BEGIN COMMENT ---
      // 重新设计锁定逻辑：
      // 1. 如果当前未锁定，则锁定并展开
      // 2. 如果当前已锁定且展开，则解锁并收起
      // 3. 如果当前已锁定且收起，则展开（保持锁定）
      // --- END COMMENT ---
      let newIsExpanded: boolean;
      let newIsLocked: boolean;

      if (!state.isLocked) {
        // 当前未锁定，锁定并展开
        newIsExpanded = true;
        newIsLocked = true;
      } else if (state.isExpanded) {
        // 当前已锁定且展开，解锁并收起
        newIsExpanded = false;
        newIsLocked = false;
      } else {
        // 当前已锁定且收起，展开（保持锁定）
        newIsExpanded = true;
        newIsLocked = true;
      }

      // --- BEGIN COMMENT ---
      // 设置点击冷却以防止悬停立即触发
      // --- END COMMENT ---
      if (newIsExpanded === false) {
        setTimeout(() => {
          set({ clickCooldown: false })
        }, 200) // 缩短冷却时间
      }

      // 当收起侧边栏时，立即隐藏内容
      if (!newIsExpanded) {
        set({ contentVisible: false })
      }

      return {
        isExpanded: newIsExpanded,
        isLocked: newIsLocked,
        isHovering: false,
        hoverTimeoutId: null,
        clickCooldown: !newIsExpanded, // 仅在收起时设置冷却
      }
    })
  },

  setHovering: (hovering) => {
    set((state) => {
      // 如果是移动设备上，忽略悬停事件
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        return { hoverTimeoutId: null }
      }
      
      // --- BEGIN COMMENT ---
      // 清除任何现有的超时
      // --- END COMMENT ---
      if (state.hoverTimeoutId) {
        clearTimeout(state.hoverTimeoutId)
      }

      // --- BEGIN COMMENT ---
      // 如果我们处于点击后的冷却模式，则不响应悬停
      // --- END COMMENT ---
      if (state.clickCooldown) {
        return { hoverTimeoutId: null }
      }

      // --- BEGIN COMMENT ---
      // 如果侧边栏已锁定，则悬停不改变状态
      // --- END COMMENT ---
      if (state.isLocked) {
        return { hoverTimeoutId: null }
      }

      // --- BEGIN COMMENT ---
      // 对于悬停进入，添加延迟
      // --- END COMMENT ---
      if (hovering && !state.isExpanded) {
        const timeoutId = window.setTimeout(() => {
          // --- BEGIN COMMENT ---
          // 仅当我们仍在悬停且不处于冷却状态且未锁定时才展开
          // --- END COMMENT ---
          if (!get().clickCooldown && !get().isLocked) {
            set({ isHovering: true, isExpanded: true, hoverTimeoutId: null })
          }
        }, 150) // 缩短悬停展开延迟

        return { hoverTimeoutId: timeoutId }
      }

      // --- BEGIN COMMENT ---
      // 对于悬停移出，只有在悬停展开状态下才折叠
      // --- END COMMENT ---
      if (!hovering && state.isHovering && !state.isLocked) {
        const timeoutId = window.setTimeout(() => {
          set({ 
            isHovering: false, 
            isExpanded: false, 
            hoverTimeoutId: null,
            contentVisible: false
          })
        }, 200) // 缩短悬停关闭延迟

        return { hoverTimeoutId: timeoutId }
      }

      return { isHovering: hovering, hoverTimeoutId: null }
    })
  },

  lockExpanded: () => {
    const state = get()
    // --- BEGIN COMMENT ---
    // 这个方法已废弃，锁定逻辑由 toggleSidebar 处理
    // --- END COMMENT ---
    if (state.hoverTimeoutId) {
      clearTimeout(state.hoverTimeoutId)
    }
    set({ isHovering: false, hoverTimeoutId: null })
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
  // 选中状态管理方法 - 支持保持当前展开状态
  // --- END COMMENT ---
  selectItem: (type: SelectedItemType, id: string | number | null, keepCurrentExpandState: boolean = false) => {
    const currentState = get()
    
    // 更新选中状态
    const updates: Partial<SidebarState> = {
      selectedType: type,
      selectedId: id
    }
    
    // 如果不保持当前状态，且不是锁定状态，则不改变展开状态
    if (!keepCurrentExpandState && !currentState.isLocked) {
      // 保持当前的展开/收起状态
    } else if (!keepCurrentExpandState && currentState.isLocked) {
      // 如果是锁定状态，确保展开并显示内容
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
