"use client"

import React from "react"
import { useMemo } from "react"
import { FILE_TYPE_CONFIG, FileTypeKey } from "@lib/constants/file-types"
import { useCurrentAppStore } from "@lib/stores/current-app-store"

// 定义文件类型接口
export interface FileType {
  title: string
  extensions: string[]
  icon: React.ReactNode
  acceptString: string
}

// 生成文件选择器接受的格式字符串
const generateAcceptString = (extensions: string[]): string => {
  return extensions.map(ext => `.${ext}`).join(",")
}

// 从配置获取文件类型的钩子
export function useFileTypesFromConfig() {
  const { currentAppInstance } = useCurrentAppStore()

  const fileTypes = useMemo(() => {
    // 如果没有当前应用实例，返回空数组
    if (!currentAppInstance?.config?.dify_parameters?.file_upload) {
      return []
    }

    const fileUploadConfig = currentAppInstance.config.dify_parameters.file_upload
    const enabledTypes: FileType[] = []

    // --- BEGIN COMMENT ---
    // 根据当前应用的文件上传配置，生成可用的文件类型列表
    // 只有在管理界面中启用的文件类型才会显示在聊天界面中
    // --- END COMMENT ---

    // 检查图片类型
    if (fileUploadConfig.image?.enabled) {
      const config = FILE_TYPE_CONFIG["图片"]
      enabledTypes.push({
        title: "图片",
        extensions: [...config.extensions], // 转换为可变数组
        icon: React.createElement(config.icon, { className: "h-4 w-4" }),
        acceptString: generateAcceptString(config.extensions)
      })
    }

    // 检查文档类型
    if (fileUploadConfig.document?.enabled) {
      const config = FILE_TYPE_CONFIG["文档"]
      enabledTypes.push({
        title: "文档",
        extensions: [...config.extensions], // 转换为可变数组
        icon: React.createElement(config.icon, { className: "h-4 w-4" }),
        acceptString: generateAcceptString(config.extensions)
      })
    }

    // 检查音频类型
    if (fileUploadConfig.audio?.enabled) {
      const config = FILE_TYPE_CONFIG["音频"]
      enabledTypes.push({
        title: "音频",
        extensions: [...config.extensions], // 转换为可变数组
        icon: React.createElement(config.icon, { className: "h-4 w-4" }),
        acceptString: generateAcceptString(config.extensions)
      })
    }

    // 检查视频类型
    if (fileUploadConfig.video?.enabled) {
      const config = FILE_TYPE_CONFIG["视频"]
      enabledTypes.push({
        title: "视频",
        extensions: [...config.extensions], // 转换为可变数组
        icon: React.createElement(config.icon, { className: "h-4 w-4" }),
        acceptString: generateAcceptString(config.extensions)
      })
    }

    // --- BEGIN COMMENT ---
    // 注意：目前Dify配置中没有other类型，所以暂时注释掉
    // 如果将来需要支持自定义文件类型，可以在这里添加
    // --- END COMMENT ---
    /*
    // 检查其他文件类型
    if (fileUploadConfig.other?.enabled && fileUploadConfig.other.custom_extensions?.length) {
      const config = FILE_TYPE_CONFIG["其他文件类型"]
      enabledTypes.push({
        title: "其他",
        extensions: fileUploadConfig.other.custom_extensions,
        icon: React.createElement(config.icon, { className: "h-4 w-4" }),
        acceptString: generateAcceptString(fileUploadConfig.other.custom_extensions)
      })
    }
    */

    return enabledTypes
  }, [currentAppInstance])

  return {
    fileTypes,
    isLoading: false, // 不需要异步加载，直接从store获取
    error: null
  }
} 