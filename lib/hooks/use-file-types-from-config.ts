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
  maxSize: string // 添加文件大小限制
}

// 定义文件上传配置接口
export interface FileUploadConfig {
  enabled: boolean // 是否启用文件上传
  maxFiles: number // 最大文件数量
  supportedMethods: ('local_file' | 'remote_url')[] // 支持的上传方式
  hasFileTypes: boolean // 是否有启用的文件类型
}

// 生成文件选择器接受的格式字符串
const generateAcceptString = (extensions: string[]): string => {
  return extensions.map(ext => `.${ext}`).join(",")
}

// 从配置获取文件类型的钩子
export function useFileTypesFromConfig() {
  const { currentAppInstance } = useCurrentAppStore()

  const { fileTypes, uploadConfig } = useMemo(() => {
    // 如果没有当前应用实例，返回默认禁用状态
    if (!currentAppInstance?.config?.dify_parameters?.file_upload) {
      return {
        fileTypes: [],
        uploadConfig: {
          enabled: false,
          maxFiles: 0,
          supportedMethods: [],
          hasFileTypes: false
        }
      }
    }

    const fileUploadConfig = currentAppInstance.config.dify_parameters.file_upload
    const enabledTypes: FileType[] = []
    let maxFiles = 0
    let supportedMethods: ('local_file' | 'remote_url')[] = []

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
        acceptString: generateAcceptString(config.extensions),
        maxSize: config.maxSize
      })
      
      // 获取配置信息（所有类型使用相同配置）
      if (maxFiles === 0) {
        maxFiles = fileUploadConfig.image.number_limits || 0
        supportedMethods = [...(fileUploadConfig.image.transfer_methods || [])]
      }
    }

    // 检查文档类型
    if (fileUploadConfig.document?.enabled) {
      const config = FILE_TYPE_CONFIG["文档"]
      enabledTypes.push({
        title: "文档",
        extensions: [...config.extensions], // 转换为可变数组
        icon: React.createElement(config.icon, { className: "h-4 w-4" }),
        acceptString: generateAcceptString(config.extensions),
        maxSize: config.maxSize
      })
      
      // 获取配置信息
      if (maxFiles === 0) {
        maxFiles = fileUploadConfig.document.number_limits || 0
        supportedMethods = [...(fileUploadConfig.document.transfer_methods || [])]
      }
    }

    // 检查音频类型
    if (fileUploadConfig.audio?.enabled) {
      const config = FILE_TYPE_CONFIG["音频"]
      enabledTypes.push({
        title: "音频",
        extensions: [...config.extensions], // 转换为可变数组
        icon: React.createElement(config.icon, { className: "h-4 w-4" }),
        acceptString: generateAcceptString(config.extensions),
        maxSize: config.maxSize
      })
      
      // 获取配置信息
      if (maxFiles === 0) {
        maxFiles = fileUploadConfig.audio.number_limits || 0
        supportedMethods = [...(fileUploadConfig.audio.transfer_methods || [])]
      }
    }

    // 检查视频类型
    if (fileUploadConfig.video?.enabled) {
      const config = FILE_TYPE_CONFIG["视频"]
      enabledTypes.push({
        title: "视频",
        extensions: [...config.extensions], // 转换为可变数组
        icon: React.createElement(config.icon, { className: "h-4 w-4" }),
        acceptString: generateAcceptString(config.extensions),
        maxSize: config.maxSize
      })
      
      // 获取配置信息
      if (maxFiles === 0) {
        maxFiles = fileUploadConfig.video.number_limits || 0
        supportedMethods = [...(fileUploadConfig.video.transfer_methods || [])]
      }
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
        acceptString: generateAcceptString(fileUploadConfig.other.custom_extensions),
        maxSize: config.maxSize
      })
      
      // 获取配置信息
      if (maxFiles === 0) {
        maxFiles = fileUploadConfig.other.number_limits || 0
        supportedMethods = [...(fileUploadConfig.other.transfer_methods || [])]
      }
    }
    */

    // 生成上传配置对象
    const uploadConfig: FileUploadConfig = {
      enabled: enabledTypes.length > 0 && maxFiles > 0, // 有启用的类型且数量大于0才算启用
      maxFiles,
      supportedMethods,
      hasFileTypes: enabledTypes.length > 0
    }

    return { fileTypes: enabledTypes, uploadConfig }
  }, [currentAppInstance])

  return {
    fileTypes,
    uploadConfig,
    isLoading: false, // 不需要异步加载，直接从store获取
    error: null
  }
} 