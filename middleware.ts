import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// 这个中间件会拦截所有请求。
// 使用 Supabase 的认证逻辑处理路由保护。
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const url = new URL(request.url)
  const pathname = url.pathname

  // 优先级最高：如果用户直接访问 /chat，则重定向到 /chat/new
  // 这样确保总是从一个明确的新对话状态开始。
  if (pathname === '/chat') {
    const newChatUrl = new URL('/chat/new', request.url)
    console.log(`[Middleware] Exact /chat match. Redirecting to ${newChatUrl.toString()}`)
    return NextResponse.redirect(newChatUrl)
  }

  // 创建 Supabase 客户端
  const cookieStore = {
    get: (name: string) => {
      return request.cookies.get(name)?.value
    },
    set: (name: string, value: string, options: any) => {
      // 在中间件中设置 cookie 需要通过 response
      response.cookies.set(name, value, options)
    },
    remove: (name: string, options: any) => {
      // 在中间件中删除 cookie 需要通过 response
      response.cookies.set({
        name,
        value: '',
        ...options,
        maxAge: 0,
      })
    },
  }
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieStore
    }
  )

  // 获取用户会话
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 基于用户会话状态的路由保护逻辑
  const isAuthRoute = pathname.startsWith('/auth')
  const isApiRoute = pathname.startsWith('/api')
  const isPublicRoute = pathname === '/' || 
                         pathname === '/login' || 
                         pathname === '/about' || 
                         pathname.startsWith('/register');
  
  // 启用路由保护逻辑，确保未登录用户无法访问受保护的路由
  if (!session && !isAuthRoute && !isApiRoute && !isPublicRoute) {
    console.log(`[Middleware] User not logged in, redirecting protected route ${pathname} to /login`)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && isAuthRoute) {
    console.log(`[Middleware] User logged in, redirecting auth route ${pathname} to /`)
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

// 配置中间件匹配的路径
export const config = {
  matcher: [
    // 排除静态文件和服务器端API
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/chat', // 确保 /chat 被拦截以重定向
    '/chat/:path*', // 拦截所有 /chat/ 下的路径
  ],
} 