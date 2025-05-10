"use client"

import { useState, useCallback } from "react"

/**
 * 反馈功能的Hook
 * 
 * @param onFeedback 反馈回调函数，接收一个布尔值表示反馈是否为正面
 * @returns 反馈状态和处理函数
 */
export function useFeedbackAction(onFeedback: (isPositive: boolean) => void) {
  // 是否已提交反馈
  const [hasFeedback, setHasFeedback] = useState(false)
  // 反馈是否为正面
  const [isPositive, setIsPositive] = useState<boolean | null>(null)
  
  // 处理反馈操作
  const handleFeedback = useCallback((positive: boolean) => {
    if (typeof onFeedback === 'function') {
      onFeedback(positive)
      setHasFeedback(true)
      setIsPositive(positive)
    }
  }, [onFeedback])
  
  return { 
    handleFeedback, 
    hasFeedback, 
    isPositive 
  }
}
