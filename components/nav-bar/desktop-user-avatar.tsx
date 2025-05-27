"use client"

import React, { useState, useEffect, useRef } from "react"
import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { useLogout } from "@lib/hooks/use-logout"
import { useRouter } from "next/navigation"
import { 
  Settings, 
  LogOut, 
  Clock, 
  UserCircle,
  Info
} from "lucide-react"

// 直接从localStorage获取缓存的用户信息
const getUserFromCache = () => {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem('user_profile_cache')
    if (!cached) return null
    
    const cacheData = JSON.parse(cached)
    
    // 检查是否过期（5分钟）
    if (Date.now() - cacheData.timestamp > 5 * 60 * 1000) {
      return null
    }
    
    return cacheData.profile
  } catch {
    return null
  }
}

// 直接从localStorage获取主题设置
const getThemeFromCache = () => {
  if (typeof window === 'undefined') return false
  
  try {
    const theme = localStorage.getItem('theme')
    return theme === 'dark'
  } catch {
    return false
  }
}

/**
 * 桌面端用户头像菜单组件
 * 特点：
 * - 纯圆形头像设计，无外框
 * - 直接从localStorage读取缓存，避免闪烁
 * - 使用内联样式确保主题一致性
 * - 优化的渲染性能，减少重新渲染
 */
export function DesktopUserAvatar() {
  const { colors, isDark } = useThemeColors()
  const { logout } = useLogout()
  const router = useRouter()
  
  // 直接使用缓存数据，避免useProfile的loading状态
  const [profile, setProfile] = useState(() => getUserFromCache())
  const [currentTheme, setCurrentTheme] = useState(() => getThemeFromCache())
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  
  // 监听localStorage变化更新数据
  useEffect(() => {
    const handleStorageChange = () => {
      setProfile(getUserFromCache())
      setCurrentTheme(getThemeFromCache())
    }
    
    // 监听storage事件
    window.addEventListener('storage', handleStorageChange)
    
    // 定期检查缓存更新
    const interval = setInterval(handleStorageChange, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])
  
  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }
    
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])
  
  // 生成用户头像的首字母
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  
  // 根据用户名生成一致的石色系背景颜色
  const getAvatarBgColor = (name: string) => {
    const colors = [
      '#78716c', // stone-500
      '#57534e', // stone-600
      '#44403c', // stone-700
      '#64748b', // slate-500
      '#475569', // slate-600
      '#6b7280', // gray-500
      '#4b5563', // gray-600
      '#737373'  // neutral-500
    ]
    
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }
  
  // 切换下拉菜单
  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDropdownOpen(prev => !prev)
  }
  
  // 处理菜单项点击
  const handleMenuItemClick = (action: () => void) => {
    action()
    setIsDropdownOpen(false)
  }
  
  // 处理退出登录
  const handleLogout = async () => {
    await logout()
    setProfile(null)
    setIsDropdownOpen(false)
  }
  
  // 菜单项定义
  const menuItems = [
    {
      icon: Clock,
      label: "历史对话",
      action: () => router.push('/chat/recents')
    },
    {
      icon: Settings,
      label: "设置",
      action: () => router.push('/settings')
    },
    {
      icon: Info,
      label: "关于",
      action: () => router.push('/about')
    }
  ]
  
  const isLoggedIn = !!profile
  const userName = profile?.full_name || profile?.username || "用户"
  const userCompany = "无企业关联" // TODO: 从profile中获取企业信息
  const avatarUrl = profile?.avatar_url
  
  // 使用当前主题状态而不是hook，避免闪烁
  const effectiveTheme = currentTheme
  
  return (
    <div className="relative mr-2">
      {/* 纯圆形头像按钮 - 使用内联样式避免闪烁 */}
      <button
        ref={triggerRef}
        onClick={toggleDropdown}
        className="relative rounded-full transition-all duration-200 focus:outline-none"
        style={{
          padding: 0,
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label={isLoggedIn ? "用户菜单" : "登录"}
      >
        {isLoggedIn ? (
          <>
            {/* 纯圆形头像 - 无边框 */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${userName}的头像`}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  transition: 'transform 0.2s',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLImageElement).style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLImageElement).style.transform = 'scale(1)'
                }}
                onError={(e) => {
                  // 头像加载失败时隐藏图片
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '500',
                  fontSize: '14px',
                  backgroundColor: getAvatarBgColor(userName),
                  transition: 'transform 0.2s',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLDivElement).style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLDivElement).style.transform = 'scale(1)'
                }}
              >
                {getInitials(userName)}
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: effectiveTheme ? '#57534e' : '#f5f5f4',
              color: effectiveTheme ? '#e7e5e4' : '#57534e',
              border: `2px solid ${effectiveTheme ? '#44403c' : '#d6d3d1'}`,
              transition: 'all 0.2s'
            }}
          >
            <UserCircle size={16} />
          </div>
        )}
      </button>
      
      {/* 下拉菜单 */}
      {isDropdownOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-10 right-0 w-64 z-50 shadow-xl rounded-xl p-2 animate-slide-in-down"
          style={{
            backgroundColor: colors.mainBackground.rgb,
            border: `1px solid ${effectiveTheme ? '#44403c' : '#e7e5e4'}`
          }}
        >
          {isLoggedIn ? (
            <>
              {/* 用户信息头部 */}
              <div 
                className="p-3 mb-2 rounded-lg"
                style={{
                  backgroundColor: effectiveTheme ? 'rgba(120, 113, 108, 0.2)' : 'rgba(245, 245, 244, 1)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={`${userName}的头像`}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: 'none'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '500',
                          backgroundColor: getAvatarBgColor(userName),
                          border: 'none'
                        }}
                      >
                        {getInitials(userName)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm font-semibold truncate"
                      style={{
                        color: effectiveTheme ? '#f5f5f4' : '#1c1917'
                      }}
                    >
                      {userName}
                    </p>
                    <p 
                      className="text-xs truncate"
                      style={{
                        color: effectiveTheme ? '#a8a29e' : '#78716c'
                      }}
                    >
                      {userCompany}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 分割线 */}
              <div 
                className="h-px mb-2"
                style={{
                  backgroundColor: effectiveTheme ? '#44403c' : '#e7e5e4'
                }}
              />
              
              {/* 菜单项 */}
              <div className="space-y-1">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleMenuItemClick(item.action)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left cursor-pointer transition-colors duration-150 focus:outline-none"
                    style={{
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = effectiveTheme ? 'rgba(68, 64, 60, 0.5)' : 'rgba(245, 245, 244, 1)'
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'
                    }}
                  >
                    <item.icon 
                      className="h-4 w-4"
                      style={{
                        color: effectiveTheme ? '#a8a29e' : '#57534e'
                      }}
                    />
                    <span 
                      className="flex-1 text-sm"
                      style={{
                        color: effectiveTheme ? '#d6d3d1' : '#44403c'
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* 分割线 */}
              <div 
                className="h-px my-2"
                style={{
                  backgroundColor: effectiveTheme ? '#44403c' : '#e7e5e4'
                }}
              />
              
              {/* 退出登录 */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left cursor-pointer transition-colors duration-150 focus:outline-none"
                style={{
                  color: '#dc2626',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = effectiveTheme ? 'rgba(153, 27, 27, 0.2)' : 'rgba(254, 242, 242, 1)'
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'
                }}
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">退出登录</span>
              </button>
            </>
          ) : (
            <div className="p-4">
              {/* 未登录状态 */}
              <div 
                className="text-center mb-6 py-6 px-4 rounded-xl"
                style={{
                  backgroundColor: effectiveTheme ? 'rgba(120, 113, 108, 0.2)' : 'rgba(245, 245, 244, 1)',
                  color: effectiveTheme ? '#d6d3d1' : '#57534e'
                }}
              >
                <UserCircle 
                  className="w-16 h-16 mx-auto mb-3"
                  style={{
                    color: effectiveTheme ? '#a8a29e' : '#78716c'
                  }}
                />
                <p className="font-medium">登录以使用更多功能</p>
                <p className="text-sm mt-1 opacity-75">访问您的对话历史和个人设置</p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleMenuItemClick(() => router.push('/login'))}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-center text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  style={{
                    backgroundColor: '#57534e'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#44403c'
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#57534e'
                  }}
                >
                  登录
                </button>
                
                <button
                  onClick={() => handleMenuItemClick(() => router.push('/register'))}
                  className="w-full py-3 px-4 rounded-xl font-medium text-center shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
                  style={{
                    backgroundColor: effectiveTheme ? '#44403c' : '#f5f5f4',
                    color: effectiveTheme ? '#e7e5e4' : '#44403c',
                    border: `1px solid ${effectiveTheme ? '#57534e' : '#d6d3d1'}`
                  }}
                  onMouseEnter={(e) => {
                    const btn = e.target as HTMLButtonElement
                    btn.style.backgroundColor = effectiveTheme ? '#57534e' : '#e7e5e4'
                  }}
                  onMouseLeave={(e) => {
                    const btn = e.target as HTMLButtonElement
                    btn.style.backgroundColor = effectiveTheme ? '#44403c' : '#f5f5f4'
                  }}
                >
                  注册新账户
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 