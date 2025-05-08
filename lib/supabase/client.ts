import { createBrowserClient } from '@supabase/ssr'

/**
 * 创建 Supabase 浏览器客户端
 * 用于客户端组件中访问 Supabase 服务
 */
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
