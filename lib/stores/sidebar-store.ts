import { create } from "zustand"

// 选中项目类型
export type SelectedItemType = 'chat' | 'app' | null

interface SidebarState {
  // --- BEGIN COMMENT ---
  // 基础状态
  // --- END COMMENT ---
  isExpanded: boolean // 侧边栏是否展开
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
  // 选中状态管理方法
  selectItem: (type: SelectedItemType, id: string | number | null) => void
  clearSelection: () => void
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  // --- BEGIN COMMENT ---
  // 基础状态
  // --- END COMMENT ---
  isExpanded: false,
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
      // 设置点击冷却以防止悬停立即触发
      // --- END COMMENT ---
      const willBeCollapsed = !state.isExpanded

      // --- BEGIN COMMENT ---
      // 如果我们正在折叠，设置一个冷却时间以防止立即悬停展开
      // --- END MODIFIED COMMENT ---
      if (state.isExpanded) {
        setTimeout(() => {
          set({ clickCooldown: false })
        }, 300) // --- BEGIN MODIFIED COMMENT ---
        // 点击关闭后 300 毫秒冷却时间
        // --- END MODIFIED COMMENT ---
      }

      // 当收起侧边栏时，立即隐藏内容
      if (state.isExpanded) {
        set({ contentVisible: false })
      }

      return {
        isExpanded: !state.isExpanded,
        isHovering: false,
        hoverTimeoutId: null,
        // --- BEGIN MODIFIED COMMENT ---
        // 仅在折叠时设置冷却
        // --- END MODIFIED COMMENT ---
        clickCooldown: state.isExpanded, 
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
      // 如果我们已经处于点击展开状态，则悬停时不改变任何东西
      // --- END COMMENT ---
      if (state.isExpanded && !state.isHovering) {
        return { hoverTimeoutId: null }
      }

      // --- BEGIN COMMENT ---
      // 对于悬停进入，添加延迟
      // --- END COMMENT ---
      if (hovering && !state.isExpanded) {
        const timeoutId = window.setTimeout(() => {
          // --- BEGIN COMMENT ---
          // 仅当我们仍在悬停且不处于冷却状态时才展开
          // --- END COMMENT ---
          if (!get().clickCooldown) {
            set({ isHovering: true, isExpanded: true, hoverTimeoutId: null })
          }
        }, 200) // --- BEGIN MODIFIED COMMENT ---
        // 展开前延迟 200 毫秒
        // --- END MODIFIED COMMENT ---

        return { hoverTimeoutId: timeoutId }
      }

      // --- BEGIN COMMENT ---
      // 对于悬停移出，添加更长的延迟
      // --- END COMMENT ---
      if (!hovering && state.isHovering) {
        const timeoutId = window.setTimeout(() => {
          set({ 
            isHovering: false, 
            isExpanded: false, 
            hoverTimeoutId: null,
            contentVisible: false // 当收起侧边栏时，隐藏内容
          })
        }, 300) // --- BEGIN MODIFIED COMMENT ---
        // 折叠前延迟 300 毫秒
        // --- END MODIFIED COMMENT ---

        return { hoverTimeoutId: timeoutId }
      }

      return { isHovering: hovering, hoverTimeoutId: null }
    })
  },

  lockExpanded: () => {
    const state = get()
    // --- BEGIN COMMENT ---
    // 清除任何待处理的悬停超时
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
  // 选中状态管理方法
  // --- END COMMENT ---
  selectItem: (type: SelectedItemType, id: string | number | null) => {
    set({ 
      selectedType: type, 
      selectedId: id,
      // --- BEGIN MODIFIED COMMENT ---
      // 确保侧边栏保持展开状态
      // --- END MODIFIED COMMENT ---
      isExpanded: true,
      isHovering: false,
      // --- BEGIN MODIFIED COMMENT ---
      // 确保选择项后内容可见
      // --- END MODIFIED COMMENT ---
      contentVisible: true 
    })
  },

  clearSelection: () => {
    set({ 
      selectedType: null, 
      selectedId: null 
    })
  },
}))
