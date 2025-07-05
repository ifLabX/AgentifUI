'use client';

import { FILE_TYPE_CONFIG, FileTypeKey } from '@lib/constants/file-types';
import { useCurrentAppStore } from '@lib/stores/current-app-store';

import React from 'react';
import { useMemo } from 'react';

// 定义文件类型接口
export interface FileType {
  title: string;
  extensions: string[];
  icon: React.ReactNode;
  acceptString: string;
  maxSize: string; // 添加文件大小限制
}

// 定义文件上传配置接口
export interface FileUploadConfig {
  enabled: boolean; // 是否启用文件上传
  maxFiles: number; // 最大文件数量
  supportedMethods: ('local_file' | 'remote_url')[]; // 支持的上传方式
  hasFileTypes: boolean; // 是否有启用的文件类型
  allowedExtensions: string[]; // 🎯 新增：数据库中实际支持的文件扩展名
}

// 生成文件选择器接受的格式字符串
const generateAcceptString = (extensions: string[]): string => {
  return extensions.map(ext => `.${ext}`).join(',');
};

// File type mapping - database stores English keys, map to FILE_TYPE_CONFIG keys
const FILE_TYPE_MAPPING: Record<string, FileTypeKey> = {
  document: 'document',
  image: 'image',
  audio: 'audio',
  video: 'video',
  custom: 'other',
};

// 从配置获取文件类型的钩子 - 修复字段解析逻辑
// 适配实际的数据库配置结构：file_upload.enabled + allowed_file_types数组
export function useFileTypesFromConfig() {
  const { currentAppInstance } = useCurrentAppStore();

  const { fileTypes, uploadConfig } = useMemo(() => {
    // 🎯 新增：调试日志，帮助排查配置传递问题
    console.log('[useFileTypesFromConfig] 当前应用实例:', currentAppInstance);
    console.log(
      '[useFileTypesFromConfig] 文件上传配置:',
      currentAppInstance?.config?.dify_parameters?.file_upload
    );

    // 如果没有当前应用实例，返回默认禁用状态
    if (!currentAppInstance?.config?.dify_parameters?.file_upload) {
      console.log('[useFileTypesFromConfig] 未找到文件上传配置，返回禁用状态');
      return {
        fileTypes: [],
        uploadConfig: {
          enabled: false,
          maxFiles: 0,
          supportedMethods: [],
          hasFileTypes: false,
          allowedExtensions: [],
        },
      };
    }

    const fileUploadConfig =
      currentAppInstance.config.dify_parameters.file_upload;

    // 🎯 关键修复：检查新的配置结构
    // file_upload.enabled + allowed_file_types数组，而不是分别的image/document/audio/video对象
    // 使用类型断言来访问实际的数据库结构字段
    const actualConfig = fileUploadConfig as any; // 类型断言，因为实际结构与类型定义不匹配

    if (!actualConfig.enabled) {
      console.log('[useFileTypesFromConfig] 文件上传未启用');
      return {
        fileTypes: [],
        uploadConfig: {
          enabled: false,
          maxFiles: 0,
          supportedMethods: [],
          hasFileTypes: false,
          allowedExtensions: [],
        },
      };
    }

    const enabledTypes: FileType[] = [];
    const maxFiles = actualConfig.number_limits || 0;
    const supportedMethods: ('local_file' | 'remote_url')[] = [
      ...(actualConfig.allowed_file_upload_methods || []),
    ];
    const allowedFileTypes = actualConfig.allowed_file_types || [];
    const allowedExtensions = actualConfig.allowed_file_extensions || [];

    console.log('[useFileTypesFromConfig] 解析配置:', {
      enabled: actualConfig.enabled,
      maxFiles,
      supportedMethods,
      allowedFileTypes,
      allowedExtensions,
    });

    // Generate enabled file types based on allowed_file_types array
    allowedFileTypes.forEach((fileTypeKey: string) => {
      const configKey = FILE_TYPE_MAPPING[fileTypeKey] || fileTypeKey;
      const config = FILE_TYPE_CONFIG[configKey as FileTypeKey];
      if (config) {
        enabledTypes.push({
          title: configKey, // Store the English key, translation will be handled by the component
          extensions: [...config.extensions],
          icon: React.createElement(config.icon, { className: 'h-4 w-4' }),
          acceptString: generateAcceptString(config.extensions),
          maxSize: config.maxSize,
        });
        console.log(
          `[useFileTypesFromConfig] Added file type: ${fileTypeKey} -> ${configKey}`
        );
      } else {
        console.warn(
          `[useFileTypesFromConfig] Unknown file type: ${fileTypeKey} (mapped to ${configKey})`
        );
      }
    });

    // 生成上传配置对象
    const uploadConfig: FileUploadConfig = {
      enabled: enabledTypes.length > 0 && maxFiles > 0, // 有启用的类型且数量大于0才算启用
      maxFiles,
      supportedMethods,
      hasFileTypes: enabledTypes.length > 0,
      allowedExtensions,
    };

    console.log('[useFileTypesFromConfig] 最终配置:', {
      fileTypesCount: enabledTypes.length,
      uploadConfig,
    });

    return { fileTypes: enabledTypes, uploadConfig };
  }, [currentAppInstance]);

  return {
    fileTypes,
    uploadConfig,
    isLoading: false, // 不需要异步加载，直接从store获取
    error: null,
  };
}
