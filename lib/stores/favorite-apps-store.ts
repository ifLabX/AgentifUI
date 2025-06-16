import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface FavoriteApp {
  instanceId: string
  displayName: string
  description?: string
  iconUrl?: string
  appType: 'model' | 'marketplace'
  dify_apptype?: 'agent' | 'chatbot' | 'text-generation' | 'chatflow' | 'workflow'
  addedAt: string
  lastUsedAt: string
}

interface FavoriteAppsState {
  favoriteApps: FavoriteApp[]
  isLoading: boolean
  error: string | null

  // 操作方法
  addFavoriteApp: (app: Omit<FavoriteApp, 'addedAt' | 'lastUsedAt'>) => void
  removeFavoriteApp: (instanceId: string) => void
  updateLastUsed: (instanceId: string) => void
  loadFavoriteApps: () => Promise<void>
  clearFavoriteApps: () => void
  isFavorite: (instanceId: string) => boolean
  // --- BEGIN COMMENT ---
  // 🎯 新增：简单的后台同步方法，非阻塞更新
  // --- END COMMENT ---
  syncWithAppList: (apps: any[]) => void
}

export const useFavoriteAppsStore = create<FavoriteAppsState>()(
  persist(
    (set, get) => ({
      favoriteApps: [],
      isLoading: false,
      error: null,

      addFavoriteApp: (app) => {
        const now = new Date().toISOString()
        const newApp: FavoriteApp = {
          ...app,
          addedAt: now,
          lastUsedAt: now
        }

        set((state) => {
          // 检查是否已存在
          const exists = state.favoriteApps.some(
            existingApp => existingApp.instanceId === app.instanceId
          )

          if (exists) {
            // 如果已存在，更新最后使用时间
            return {
              favoriteApps: state.favoriteApps.map(existingApp =>
                existingApp.instanceId === app.instanceId
                  ? { ...existingApp, lastUsedAt: now }
                  : existingApp
              )
            }
          } else {
            // 如果不存在，添加新应用
            return {
              favoriteApps: [...state.favoriteApps, newApp]
                .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime())
                .slice(0, 10) // 最多保留10个常用应用
            }
          }
        })
      },

      removeFavoriteApp: (instanceId) => {
        set((state) => ({
          favoriteApps: state.favoriteApps.filter(
            app => app.instanceId !== instanceId
          )
        }))
      },

      updateLastUsed: (instanceId) => {
        const now = new Date().toISOString()
        set((state) => ({
          favoriteApps: state.favoriteApps
            .map(app =>
              app.instanceId === instanceId
                ? { ...app, lastUsedAt: now }
                : app
            )
            .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime())
        }))
      },

      loadFavoriteApps: async () => {
        set({ isLoading: true, error: null })
        
        try {
          // 这里可以从服务器加载用户的常用应用
          // 目前使用本地存储，所以直接设置加载完成
          set({ isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : '加载常用应用失败' 
          })
        }
      },

      clearFavoriteApps: () => {
        set({ favoriteApps: [] })
      },

      isFavorite: (instanceId) => {
        return get().favoriteApps.some(app => app.instanceId === instanceId)
      },

      syncWithAppList: (apps: any[]) => {
        const state = get()
        if (state.favoriteApps.length === 0) return
        
        // --- BEGIN COMMENT ---
        // 🎯 增强同步：既更新应用信息，也清理已删除的应用
        // --- END COMMENT ---
        const validFavoriteApps: FavoriteApp[] = []
        let hasRemovedApps = false
        
        state.favoriteApps.forEach(favoriteApp => {
          // --- BEGIN COMMENT ---
          // 🎯 修复：使用instance_id进行匹配，因为favoriteApp.instanceId存储的是instance_id
          // --- END COMMENT ---
          const matchedApp = apps.find(app => app.instance_id === favoriteApp.instanceId)
          
          if (matchedApp) {
            // 应用仍然存在，更新信息
            const appMetadata = matchedApp.config?.app_metadata
            validFavoriteApps.push({
              ...favoriteApp,
              displayName: matchedApp.display_name || matchedApp.name || favoriteApp.displayName,
              description: matchedApp.description || appMetadata?.brief_description || favoriteApp.description,
              iconUrl: appMetadata?.icon_url || favoriteApp.iconUrl,
              dify_apptype: appMetadata?.dify_apptype || favoriteApp.dify_apptype
            })
          } else {
            // 应用已被删除，不添加到新列表中
            hasRemovedApps = true
            console.log(`[FavoriteApps] 清理已删除的应用: ${favoriteApp.displayName} (${favoriteApp.instanceId})`)
          }
        })
        
        // 检查是否有变化（信息更新或应用删除）
        const hasInfoChanges = validFavoriteApps.length !== state.favoriteApps.length || 
          validFavoriteApps.some((updated, index) => {
            const original = state.favoriteApps[index]
            return !original || 
                   updated.displayName !== original.displayName || 
                   updated.description !== original.description || 
                   updated.iconUrl !== original.iconUrl
          })
        
        if (hasRemovedApps || hasInfoChanges) {
          console.log(`[FavoriteApps] 同步完成 - 更新信息: ${hasInfoChanges}, 清理应用: ${hasRemovedApps}`)
          set({ favoriteApps: validFavoriteApps })
        }
      }
    }),
    {
      name: 'favorite-apps-storage',
      storage: createJSONStorage(() => localStorage),
      // 只持久化favoriteApps数组
      partialize: (state) => ({ 
        favoriteApps: state.favoriteApps 
      })
    }
  )
)

// --- BEGIN COMMENT ---
// 🎯 导出便捷的hook用于在应用使用后自动添加到常用应用
// --- END COMMENT ---
export function useAutoAddFavoriteApp() {
  const { addFavoriteApp, updateLastUsed } = useFavoriteAppsStore()

  const addToFavorites = async (instanceId: string) => {
    console.log(`[addToFavorites] 添加应用到常用列表: ${instanceId}`)
    
    try {
      // --- BEGIN COMMENT ---
      // 🎯 重构：支持多提供商，在所有活跃提供商中查找应用实例
      // 不再硬编码只查找 Dify 提供商
      // --- END COMMENT ---
      const { createClient } = await import('@lib/supabase/client')
      const supabase = createClient()
      
      // 直接查找应用实例（包含提供商信息）
      const { data: instance, error: instanceError } = await supabase
        .from('service_instances')
        .select(`
          *,
          providers!inner(
            id,
            name,
            is_active
          )
        `)
        .eq('instance_id', instanceId)
        .eq('providers.is_active', true)
        .single()
      
      if (instanceError || !instance) {
        console.error(`[addToFavorites] 查询应用信息失败: ${instanceId}`, instanceError)
        return
      }
      
      // 处理查找到的应用实例
      const appMetadata = instance.config?.app_metadata
      console.log(`[addToFavorites] 找到应用实例: ${instanceId}，提供商: ${instance.providers?.name}`)
      
      // 🎯 关键修复：只添加marketplace类型的应用，跳过model类型
      const appType = appMetadata?.app_type || 'marketplace'
      
      if (appType !== 'marketplace') {
        console.log(`[addToFavorites] 跳过非marketplace应用: ${instance.display_name || instanceId} (类型: ${appType})`)
        return
      }

      const favoriteApp = {
        instanceId: instance.instance_id,
        displayName: instance.display_name || instance.instance_id,
        description: instance.description || appMetadata?.brief_description,
        iconUrl: appMetadata?.icon_url,
        appType: 'marketplace' as const,
        dify_apptype: appMetadata?.dify_apptype || 'chatflow'
      }
      
      addFavoriteApp(favoriteApp)
      
      console.log(`[addToFavorites] 成功添加到常用应用: ${instance.display_name || instanceId}`)
    } catch (error) {
      console.error(`[addToFavorites] 添加到常用应用失败:`, error instanceof Error ? error.message : String(error))
    }
  }

  return { addToFavorites, updateLastUsed }
} 