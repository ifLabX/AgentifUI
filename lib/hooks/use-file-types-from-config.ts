'use client';

import { FILE_TYPE_CONFIG, FileTypeKey } from '@lib/constants/file-types';
import { useCurrentAppStore } from '@lib/stores/current-app-store';
import { DifyFileUploadConfig } from '@lib/types/dify-parameters';

import React from 'react';
import { useMemo } from 'react';

export interface FileType {
  title: string;
  extensions: string[];
  icon: React.ReactNode;
  acceptString: string;
  maxSize: string; // File size limit
}

export interface FileUploadConfig {
  enabled: boolean; // Whether file upload is enabled
  maxFiles: number; // Maximum number of files
  supportedMethods: ('local_file' | 'remote_url')[]; // Supported upload methods
  hasFileTypes: boolean; // Whether there are enabled file types
  allowedExtensions: string[]; // Supported file extensions from database
}

const generateAcceptString = (extensions: string[]): string => {
  return extensions.map(ext => `.${ext}`).join(',');
};

const FILE_TYPE_MAPPING: Record<string, FileTypeKey> = {
  document: 'document',
  image: 'image',
  audio: 'audio',
  video: 'video',
  custom: 'other',
};

export function useFileTypesFromConfig() {
  const { currentAppInstance } = useCurrentAppStore();

  const { fileTypes, uploadConfig } = useMemo(() => {
    if (!currentAppInstance?.config?.dify_parameters?.file_upload) {
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

    const actualConfig = fileUploadConfig as DifyFileUploadConfig;

    if (!actualConfig.enabled) {
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
      ...((actualConfig.allowed_file_upload_methods as (
        | 'local_file'
        | 'remote_url'
      )[]) || []),
    ];
    const allowedFileTypes = actualConfig.allowed_file_types || [];
    const allowedExtensions = actualConfig.allowed_file_extensions || [];

    allowedFileTypes.forEach((fileTypeKey: string) => {
      const configKey = FILE_TYPE_MAPPING[fileTypeKey] || fileTypeKey;
      const config = FILE_TYPE_CONFIG[configKey as FileTypeKey];
      if (config) {
        enabledTypes.push({
          title: configKey,
          extensions: [...config.extensions],
          icon: React.createElement(config.icon, { className: 'h-4 w-4' }),
          acceptString: generateAcceptString(config.extensions),
          maxSize: config.maxSize,
        });
      } else {
      }
    });

    const uploadConfig: FileUploadConfig = {
      enabled: enabledTypes.length > 0 && maxFiles > 0,
      maxFiles,
      supportedMethods,
      hasFileTypes: enabledTypes.length > 0,
      allowedExtensions,
    };

    return { fileTypes: enabledTypes, uploadConfig };
  }, [currentAppInstance]);

  return {
    fileTypes,
    uploadConfig,
    isLoading: false,
    error: null,
  };
}
