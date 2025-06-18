import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 创建 Supabase 服务器客户端
 * 用于服务器组件中访问 Supabase 服务
 * 注意：必须在服务器组件中使用此函数
 */
export const createClient = async () => {
  // 根据Next.js 15要求，cookies()需要被await
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

/**
 * 创建 Supabase 管理员客户端（Service Role）
 * 用于需要管理员权限的操作，如创建用户、绕过RLS等
 * ⚠️ 仅在服务器端使用，具有完全数据库访问权限
 */
export const createAdminClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
