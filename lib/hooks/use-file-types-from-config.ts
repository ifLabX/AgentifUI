'use client';

import { FILE_TYPE_CONFIG, FileTypeKey } from '@lib/constants/file-types';
import { useCurrentAppStore } from '@lib/stores/current-app-store';

import React from 'react';
import { useMemo } from 'react';

// File type interface definition
export interface FileType {
  title: string;
  extensions: string[];
  icon: React.ReactNode;
  acceptString: string;
  maxSize: string; // File size limit
}

// File upload config interface definition
export interface FileUploadConfig {
  enabled: boolean; // Whether file upload is enabled
  maxFiles: number; // Maximum number of files
  supportedMethods: ('local_file' | 'remote_url')[]; // Supported upload methods
  hasFileTypes: boolean; // Whether there are enabled file types
  allowedExtensions: string[]; // Supported file extensions from database
}

// Generate accept string for file picker
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

// Hook to get file types from config - fixes field parsing logic
// Adapts to actual database config structure: file_upload.enabled + allowed_file_types array
export function useFileTypesFromConfig() {
  const { currentAppInstance } = useCurrentAppStore();

  const { fileTypes, uploadConfig } = useMemo(() => {
    // Debug log: help trace config passing issues
    console.log(
      '[useFileTypesFromConfig] current app instance:',
      currentAppInstance
    );
    console.log(
      '[useFileTypesFromConfig] file upload config:',
      currentAppInstance?.config?.dify_parameters?.file_upload
    );

    // If no current app instance, return default disabled state
    if (!currentAppInstance?.config?.dify_parameters?.file_upload) {
      console.log(
        '[useFileTypesFromConfig] file upload config not found, returning disabled state'
      );
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

    // Key fix: check new config structure
    // file_upload.enabled + allowed_file_types array, not separate image/document/audio/video objects
    // Use type assertion to access actual database structure fields
    const actualConfig = fileUploadConfig as any; // Type assertion since actual structure may not match type

    if (!actualConfig.enabled) {
      console.log('[useFileTypesFromConfig] file upload not enabled');
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

    console.log('[useFileTypesFromConfig] parsed config:', {
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

    // Generate upload config object
    const uploadConfig: FileUploadConfig = {
      enabled: enabledTypes.length > 0 && maxFiles > 0, // Only enabled if there are types and maxFiles > 0
      maxFiles,
      supportedMethods,
      hasFileTypes: enabledTypes.length > 0,
      allowedExtensions,
    };

    console.log('[useFileTypesFromConfig] final config:', {
      fileTypesCount: enabledTypes.length,
      uploadConfig,
    });

    return { fileTypes: enabledTypes, uploadConfig };
  }, [currentAppInstance]);

  return {
    fileTypes,
    uploadConfig,
    isLoading: false, // No async loading needed, get directly from store
    error: null,
  };
}
