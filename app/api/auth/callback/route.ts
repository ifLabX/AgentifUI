import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    // 使用类型断言解决 cookies() 的类型问题
    const cookieStore = cookies() as any
    const supabase = createServerClient(
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
    
    // 使用授权码交换会话
    await supabase.auth.exchangeCodeForSession(code)
  }
  
  // 获取重定向目标，如果没有指定，则重定向到聊天页面
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/chat/new'
  
  // 重定向到指定页面
  return NextResponse.redirect(new URL(redirectTo, request.url))
}
