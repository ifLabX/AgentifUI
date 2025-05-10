"use client"

import { useState, useCallback } from "react"

/**
 * 重新生成功能的Hook
 * 
 * @param onRegenerate 重新生成回调函数
 * @param initialRegenerating 初始是否正在重新生成状态
 * @returns 重新生成状态和处理函数
 */
export function useRegenerateAction(
  onRegenerate: () => void, 
  initialRegenerating = false
) {
  // 是否正在重新生成
  const [isRegenerating, setIsRegenerating] = useState(initialRegenerating)
  
  // 处理重新生成操作
  const handleRegenerate = useCallback(() => {
    if (typeof onRegenerate === 'function' && !isRegenerating) {
      setIsRegenerating(true)
      
      // 调用回调函数
      onRegenerate()
      
      // 注意：实际应用中，重新生成完成后应该由外部调用方重置状态
      // 这里仅作为示例，实际使用时可能需要提供一个resetRegenerating方法
    }
  }, [onRegenerate, isRegenerating])
  
  // 重置重新生成状态
  const resetRegenerating = useCallback(() => {
    setIsRegenerating(false)
  }, [])
  
  return { 
    handleRegenerate, 
    isRegenerating,
    resetRegenerating
  }
}
