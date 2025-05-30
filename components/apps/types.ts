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
  // 展示用的辅助信息
  isPopular?: boolean
  lastUsed?: string
}
