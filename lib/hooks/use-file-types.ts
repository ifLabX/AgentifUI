'use client';

// Compatibility wrapper for file type hook
// Re-export the new config-driven file type hook for backward compatibility
export { useFileTypesFromConfig as useFileTypes } from './use-file-types-from-config';
export type { FileType, FileUploadConfig } from './use-file-types-from-config';
