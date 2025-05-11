import { useEffect, useState } from 'react'

/**
 * 返回组件是否已经完成挂载的Hook
 * 用于防止组件在挂载过程中出现闪烁
 */
export function useMounted() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  return isMounted
}
