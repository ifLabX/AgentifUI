import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface FavoriteApp {
  instanceId: string
  displayName: string
  description?: string
  iconUrl?: string
  appType: 'model' | 'marketplace'
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
      // 🎯 修复：先获取Dify提供商的ID，然后使用providerId查询服务实例
      const { getProviderByName } = await import('@lib/db/providers')
      const providerResult = await getProviderByName('Dify')
      
      if (!providerResult.success || !providerResult.data) {
        console.error(`[addToFavorites] 未找到Dify提供商`)
        return
      }
      
      const providerId = providerResult.data.id
      
      // 获取应用信息
      const { getServiceInstanceByInstanceId } = await import('@lib/db/service-instances')
      const result = await getServiceInstanceByInstanceId(providerId, instanceId)
      
      if (result.success && result.data) {
        const instance = result.data
        const appMetadata = instance.config?.app_metadata

        const favoriteApp = {
          instanceId: instance.instance_id,
          displayName: instance.display_name || instance.instance_id,
          description: instance.description || appMetadata?.brief_description,
          iconUrl: appMetadata?.icon_url,
          appType: appMetadata?.app_type || 'marketplace'
        }
        
        addFavoriteApp(favoriteApp)
        
        console.log(`[addToFavorites] 成功添加到常用应用: ${instance.display_name || instanceId}`)
      } else {
        console.error(`[addToFavorites] 查询应用信息失败: ${instanceId}`)
      }
    } catch (error) {
      console.error(`[addToFavorites] 添加到常用应用失败:`, error instanceof Error ? error.message : String(error))
    }
  }

  return { addToFavorites, updateLastUsed }
} 