import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * 全局单例 Supabase 客户端实例
 * 用于避免创建多个客户端实例
 */
let supabaseInstance: SupabaseClient | null = null

/**
 * 创建或获取 Supabase 浏览器客户端
 * 使用单例模式，确保整个应用只创建一个客户端实例
 * 用于客户端组件中访问 Supabase 服务
 */
export const createClient = () => {
  // 如果实例已存在，直接返回
  if (supabaseInstance) {
    return supabaseInstance
  }
  
  // 如果实例不存在，创建新实例
  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return supabaseInstance
}
