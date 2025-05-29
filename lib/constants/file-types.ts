import { FileText, Image, Music, Video, File } from 'lucide-react';

// --- BEGIN COMMENT ---
// 文件类型配置常量
// 从管理界面提取，用于聊天界面的文件上传功能
// --- END COMMENT ---
export const FILE_TYPE_CONFIG = {
  "文档": {
    icon: FileText,
    extensions: ["txt", "md", "mdx", "markdown", "pdf", "html", "xlsx", "xls", "doc", "docx", "csv", "eml", "msg", "pptx", "ppt", "xml", "epub"] as string[],
    maxSize: "15.00MB"
  },
  "图片": {
    icon: Image,
    extensions: ["jpg", "jpeg", "png", "gif", "webp", "svg"] as string[],
    maxSize: "10.00MB"
  },
  "音频": {
    icon: Music,
    extensions: ["mp3", "m4a", "wav", "amr", "mpga"] as string[],
    maxSize: "50.00MB"
  },
  "视频": {
    icon: Video,
    extensions: ["mp4", "mov", "mpeg", "webm"] as string[],
    maxSize: "100.00MB"
  },
  "其他文件类型": {
    icon: File,
    extensions: [] as string[],
    maxSize: "指定其他文件类型"
  }
} as const;

// 文件类型键的类型定义
export type FileTypeKey = keyof typeof FILE_TYPE_CONFIG; 