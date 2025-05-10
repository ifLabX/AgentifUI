"use client"

import { useState, useCallback } from "react"

/**
 * 管理反馈按钮的Hook，实现排他性选择
 * 
 * @param onFeedback 反馈回调函数
 * @returns 反馈状态和处理函数
 */
export function useFeedbackManager(onFeedback: (isPositive: boolean) => void) {
  // 当前选择的反馈类型：null(未选择)、true(点赞)、false(点踩)
  const [selectedFeedback, setSelectedFeedback] = useState<boolean | null>(null)
  
  // 处理反馈操作
  const handleFeedback = useCallback((isPositive: boolean) => {
    if (typeof onFeedback === 'function') {
      // 调用外部回调
      onFeedback(isPositive)
      // 设置当前选择
      setSelectedFeedback(isPositive)
    }
  }, [onFeedback])
  
  return {
    // 当前选择的反馈类型
    selectedFeedback,
    // 处理反馈操作
    handleFeedback,
    // 判断按钮是否应该显示
    shouldShowButton: (isPositive: boolean) => 
      selectedFeedback === null || selectedFeedback === isPositive
  }
}
