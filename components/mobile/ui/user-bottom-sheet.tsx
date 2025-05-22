"use client"

import React, { useEffect, useState } from "react"
import { BottomSheet } from "./bottom-sheet"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"
import { Settings, Sun, Moon, LogOut, User, MessageSquare, Shield, UserCircle } from "lucide-react"
import { useLogout } from "@lib/hooks/use-logout"
import { useRouter } from "next/navigation"
import { createClient } from "@lib/supabase/client"

interface UserBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  isLoggedIn: boolean
}

/**
 * 用户底部弹出框内容组件
 * 根据用户登录状态显示不同内容
 * 登录状态：显示用户信息和操作按钮（设置、主题切换、退出登录等）
 * 未登录状态：显示登录、注册按钮
 */
export function UserBottomSheet({
  isOpen,
  onClose,
  isLoggedIn
}: UserBottomSheetProps) {
  const { isDark, toggleTheme } = useTheme()
  const { logout } = useLogout()
  const router = useRouter()
  const supabase = createClient()
  const [userName, setUserName] = useState<string>("用户")
  const [userEmail, setUserEmail] = useState<string>("")
  
  // 获取用户信息
  useEffect(() => {
    if (!isLoggedIn) return
    
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // 设置邮箱
      if (user.email) {
        setUserEmail(user.email)
      }
      
      // 获取更多用户资料
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setUserName(profile.full_name || profile.username || "用户")
      }
    }
    
    fetchUserProfile()
  }, [isLoggedIn, supabase])
  
  // 处理登录
  const handleLogin = () => {
    router.push('/login')
    onClose()
  }
  
  // 处理注册
  const handleRegister = () => {
    router.push('/register')
    onClose()
  }
  
  // 处理退出登录
  const handleLogout = async () => {
    await logout()
    onClose()
  }
  
  // 渲染菜单项
  const renderMenuItem = (
    icon: React.ReactNode, 
    label: string, 
    onClick: () => void,
    danger: boolean = false
  ) => (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center w-full px-4 py-3 rounded-lg",
        // 亮色/暗色模式样式
        isDark 
          ? danger 
            ? "hover:bg-red-900/30 text-red-400 hover:text-red-300" 
            : "hover:bg-stone-700 text-stone-300 hover:text-stone-200" 
          : danger 
            ? "hover:bg-red-50 text-red-600 hover:text-red-700" 
            : "hover:bg-stone-100 text-stone-700 hover:text-stone-900",
        // 共用样式
        "transition-colors duration-200",
      )}
    >
      <span className="mr-3 flex-shrink-0">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  )
  
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isLoggedIn ? "用户菜单" : "账户"}
    >
      {isLoggedIn ? (
        <div className="flex flex-col">
          {/* 用户信息区域 */}
          <div className={cn(
            "flex items-center p-4 mb-3 rounded-lg",
            isDark ? "bg-stone-700/50" : "bg-stone-100",
            "shadow-sm"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              isDark ? "bg-stone-600" : "bg-stone-200",
              "shadow-md"
            )}>
              <UserCircle className={cn(
                "w-8 h-8",
                isDark ? "text-stone-300" : "text-stone-600"
              )} />
            </div>
            <div className="ml-4 overflow-hidden">
              <div className={cn(
                "font-medium truncate",
                isDark ? "text-white" : "text-stone-800"
              )}>
                {userName}
              </div>
              {userEmail && (
                <div className={cn(
                  "text-sm truncate max-w-[200px]",
                  isDark ? "text-stone-400" : "text-stone-500"
                )}>
                  {userEmail}
                </div>
              )}
            </div>
          </div>
          
          {/* 菜单选项 */}
          <div className={cn(
            "space-y-1 rounded-lg overflow-hidden", 
            isDark ? "bg-stone-800/50" : "bg-stone-50",
            "border",
            isDark ? "border-stone-700" : "border-stone-200",
            "mb-2"
          )}>
            {renderMenuItem(
              <MessageSquare className="w-5 h-5" />,
              "我的对话",
              () => {
                router.push('/chat')
                onClose()
              }
            )}
            
            {renderMenuItem(
              <Settings className="w-5 h-5" />,
              "设置",
              () => {
                router.push('/settings')
                onClose()
              }
            )}
            
            {renderMenuItem(
              isDark
                ? <Sun className="w-5 h-5 text-yellow-400" />
                : <Moon className="w-5 h-5" />,
              isDark ? "亮色模式" : "暗色模式",
              toggleTheme
            )}
            
            {renderMenuItem(
              <Shield className="w-5 h-5" />,
              "隐私政策",
              () => console.log("隐私政策")
            )}
          </div>
          
          {/* 退出登录按钮（单独分组） */}
          <div className={cn(
            "rounded-lg overflow-hidden", 
            isDark ? "bg-stone-800/50" : "bg-stone-50",
            "border",
            isDark ? "border-stone-700" : "border-stone-200"
          )}>
            {renderMenuItem(
              <LogOut className="w-5 h-5" />,
              "退出登录",
              handleLogout,
              true
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          <div className={cn(
            "text-center mb-4 py-4 px-4 rounded-lg",
            isDark ? "bg-stone-700/50 text-stone-300" : "bg-stone-100 text-stone-600"
          )}>
            <UserCircle className={cn(
              "w-16 h-16 mx-auto mb-3",
              isDark ? "text-stone-400" : "text-stone-500"
            )} />
            <p>登录以使用更多功能</p>
          </div>
          
          <button
            onClick={handleLogin}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-medium text-center",
              isDark 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-blue-500 hover:bg-blue-600 text-white",
              "shadow-sm transition-colors duration-200"
            )}
          >
            登录
          </button>
          
          <button
            onClick={handleRegister}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-medium text-center",
              isDark 
                ? "bg-stone-700 hover:bg-stone-600 text-stone-200" 
                : "bg-stone-200 hover:bg-stone-300 text-stone-700",
              "shadow-sm transition-colors duration-200"
            )}
          >
            注册新账户
          </button>
        </div>
      )}
    </BottomSheet>
  )
} 