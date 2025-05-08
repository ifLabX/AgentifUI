'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthFormProps {
  view?: 'sign_in' | 'sign_up' | 'forgotten_password'
  redirectTo?: string
}

/**
 * Supabase 认证组件
 * 提供登录、注册和密码重置功能
 */
export function SupabaseAuth({ view = 'sign_in', redirectTo = '/' }: AuthFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${redirectTo}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage('请查看您的邮箱以完成注册')
    setLoading(false)
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage('密码重置链接已发送到您的邮箱')
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {message}
        </div>
      )}

      <form onSubmit={
        view === 'sign_in' 
          ? handleSignIn 
          : view === 'sign_up' 
            ? handleSignUp 
            : handlePasswordReset
      } className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            邮箱
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {view !== 'forgotten_password' && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? '处理中...' : 
              view === 'sign_in' 
                ? '登录' 
                : view === 'sign_up' 
                  ? '注册' 
                  : '重置密码'
            }
          </button>
        </div>
      </form>

      <div className="text-center text-sm">
        {view === 'sign_in' && (
          <>
            <button 
              onClick={() => router.push('/register')} 
              className="text-indigo-600 hover:text-indigo-500"
            >
              没有账号？注册
            </button>
            <span className="px-2 text-gray-400">|</span>
            <button 
              onClick={() => router.push('/forgot-password')} 
              className="text-indigo-600 hover:text-indigo-500"
            >
              忘记密码？
            </button>
          </>
        )}
        
        {view === 'sign_up' && (
          <button 
            onClick={() => router.push('/login')} 
            className="text-indigo-600 hover:text-indigo-500"
          >
            已有账号？登录
          </button>
        )}
        
        {view === 'forgotten_password' && (
          <button 
            onClick={() => router.push('/login')} 
            className="text-indigo-600 hover:text-indigo-500"
          >
            返回登录
          </button>
        )}
      </div>
    </div>
  )
}
