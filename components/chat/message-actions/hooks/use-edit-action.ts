"use client"

import { useCallback } from "react"

/**
 * 编辑功能的Hook
 * 
 * @param onEdit 编辑回调函数
 * @returns 处理编辑操作的函数
 */
export function useEditAction(onEdit: () => void) {
  // 处理编辑操作
  const handleEdit = useCallback(() => {
    if (typeof onEdit === 'function') {
      onEdit()
    }
  }, [onEdit])
  
  return { handleEdit }
}
