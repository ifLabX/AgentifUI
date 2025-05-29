"use client"

// --- BEGIN COMMENT ---
// 文件类型hook的兼容性包装器
// 重新导出新的配置驱动的文件类型hook，保持向后兼容
// --- END COMMENT ---

export { useFileTypesFromConfig as useFileTypes } from './use-file-types-from-config'
export type { FileType } from './use-file-types-from-config' 