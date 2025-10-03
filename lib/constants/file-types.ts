import { File, FileText, Image, Music, Video } from 'lucide-react';

/**
 * File type configuration constants.
 * Extracted from the admin panel, used for file upload functionality in the chat interface.
 */
export const FILE_TYPE_CONFIG = {
  document: {
    icon: FileText,
    extensions: [
      'txt',
      'md',
      'mdx',
      'markdown',
      'pdf',
      'html',
      'xlsx',
      'xls',
      'doc',
      'docx',
      'csv',
      'eml',
      'msg',
      'pptx',
      'ppt',
      'xml',
      'epub',
    ] as string[],
    maxSize: '15.00MB',
  },
  image: {
    icon: Image,
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] as string[],
    maxSize: '10.00MB',
  },
  audio: {
    icon: Music,
    extensions: ['mp3', 'm4a', 'wav', 'amr', 'mpga'] as string[],
    maxSize: '50.00MB',
  },
  video: {
    icon: Video,
    extensions: ['mp4', 'mov', 'mpeg', 'webm'] as string[],
    maxSize: '100.00MB',
  },
  other: {
    icon: File,
    extensions: [] as string[],
    maxSize: 'Custom file types',
  },
} as const;

/**
 * Type definition for file type keys.
 */
export type FileTypeKey = keyof typeof FILE_TYPE_CONFIG;
