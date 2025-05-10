"use client"

import { useState, useCallback } from "react"

/**
 * 复制功能的Hook
 * 
 * @param content 要复制的内容
 * @returns 复制状态和处理函数
 */
export function useCopyAction(content: string) {
  // 是否已复制状态
  const [isCopied, setIsCopied] = useState(false)
  
  // 处理复制操作
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      
      // 2秒后重置状态
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }, [content])
  
  return { handleCopy, isCopied }
}
