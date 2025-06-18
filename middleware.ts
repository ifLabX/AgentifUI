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

  // 检查是否为SSO登录成功回调，如果是则暂时跳过认证检查
  // 允许前端有时间处理SSO会话建立
  const ssoLoginSuccess = url.searchParams.get('sso_login') === 'success';
  const hasSsoUserCookie = request.cookies.get('sso_user_data');

  // 如果是SSO登录成功回调或者有SSO用户数据cookie，暂时跳过认证检查
  // 让前端组件有机会建立Supabase会话
  if (ssoLoginSuccess || hasSsoUserCookie) {
    console.log(`[Middleware] SSO session detected, allowing request to ${pathname}`);
    return response;
  }

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

  // 🔒 安全修复：使用 getUser() 替代 getSession()
  // getUser() 会向 Supabase Auth 服务器验证 JWT token 的真实性
  // 防止本地 cookie 被篡改导致的权限提升攻击
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  // 处理认证错误
  if (authError) {
    console.log(`[Middleware] Auth verification failed: ${authError.message}`)
  }

  // 基于用户会话状态的路由保护逻辑
  const isAuthRoute = pathname.startsWith('/auth')
  const isApiRoute = pathname.startsWith('/api')
  const isAdminRoute = pathname.startsWith('/admin')
  const isPublicRoute = pathname === '/' || 
                         pathname === '/login' || 
                         pathname === '/phone-login' || 
                         pathname === '/about' || 
                         pathname.startsWith('/register') ||
                         pathname === '/forgot-password' ||
                         pathname === '/reset-password';
  
  // 启用路由保护逻辑，确保未登录用户无法访问受保护的路由
  if (!user && !isAuthRoute && !isApiRoute && !isPublicRoute) {
    console.log(`[Middleware] User not authenticated, redirecting protected route ${pathname} to /login`)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 🔒 安全的管理员路由权限检查
  // 使用经过服务器验证的 user.id 而非可能被篡改的 session.user.id
  if (user && isAdminRoute) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)  // 🔒 使用安全验证过的 user.id
        .single()

      if (error || !profile || profile.role !== 'admin') {
        console.log(`[Middleware] Non-admin user attempting to access admin route ${pathname}, redirecting to /`)
        return NextResponse.redirect(new URL('/', request.url))
      }
      console.log(`[Middleware] Admin user accessing ${pathname}`)
    } catch (error) {
      console.error(`[Middleware] Error checking admin permissions:`, error)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (user && isAuthRoute) {
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
    '/admin/:path*', // 拦截所有 /admin/ 下的路径
  ],
} 