// 🎯 应用市场卡片显示的核心信息
// 只包含卡片中需要展示的必要字段
export interface AppInstance {
  instanceId: string
  displayName: string
  description?: string
  appType: 'model' | 'marketplace'
  iconUrl?: string
  category?: string
  tags?: string[]
  // 🎯 新增：Dify应用类型，用于分类和路由
  difyAppType?: string
  // 展示用的辅助信息
  isPopular?: boolean
  lastUsed?: string
  // 🎯 新增：配置信息，用于获取Dify应用类型等元数据
  config?: {
    app_metadata?: {
      dify_apptype?: string
      [key: string]: any
    }
    [key: string]: any
  }
}
