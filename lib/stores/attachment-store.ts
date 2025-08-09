import { create } from 'zustand';

/**
 * Single attachment file state interface
 * @description Defines the structure for file attachment data and upload state
 */
export interface AttachmentFile {
  /** Locally generated unique ID */
  id: string;
  /** Original File object */
  file: File;
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** File MIME type */
  type: string;
  /** Upload status */
  status: 'pending' | 'uploading' | 'success' | 'error';
  /** Error message if upload failed */
  error?: string;
  /** Dify-returned file ID after successful upload */
  uploadedId?: string;
}

/**
 * Attachment store state and actions interface
 * @description Defines the complete interface for attachment management store
 */
interface AttachmentStoreState {
  /** Array of attachment files */
  files: AttachmentFile[];
  /** Add multiple files to store */
  addFiles: (files: File[]) => void;
  /** Remove file by ID */
  removeFile: (id: string) => void;
  /** Update file status */
  updateFileStatus: (
    id: string,
    status: AttachmentFile['status'],
    error?: string
  ) => void;
  /** Update file's uploaded ID after successful upload */
  updateFileUploadedId: (id: string, uploadedId: string) => void;
  /** Clear all files */
  clearFiles: () => void;
  /** Set files (for restoration purposes) */
  setFiles: (files: AttachmentFile[]) => void;
}

/**
 * Attachment store
 * @description Zustand store for managing file attachments and upload states
 */
export const useAttachmentStore = create<AttachmentStoreState>(set => ({
  files: [],

  // Add one or more files to store
  addFiles: newFiles => {
    const newAttachments = newFiles.map(file => {
      const id = `${file.name}-${file.lastModified}-${file.size}`; // Generate relatively unique ID
      const attachment: AttachmentFile = {
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
      };
      return attachment;
    });

    set(state => ({
      // Filter out potentially duplicate files (based on ID)
      files: [
        ...state.files,
        ...newAttachments.filter(
          att => !state.files.some(f => f.id === att.id)
        ),
      ],
    }));
  },

  // Remove file by ID and release possible preview URLs
  removeFile: id => {
    set(state => {
      return {
        files: state.files.filter(f => f.id !== id),
      };
    });
  },

  // Update file status (may clear uploadedId and error)
  updateFileStatus: (id, status, error) => {
    set(state => ({
      files: state.files.map(f =>
        f.id === id
          ? {
              ...f,
              status,
              error: error ?? (status !== 'error' ? undefined : f.error), // Clear error for non-error status
              uploadedId: status !== 'success' ? undefined : f.uploadedId, // Clear uploadedId for non-success status
            }
          : f
      ),
    }));
  },

  // Update file's uploadedId (usually called after successful upload)
  updateFileUploadedId: (id, uploadedId) => {
    set(state => ({
      files: state.files.map(f =>
        f.id === id ? { ...f, uploadedId: uploadedId, status: 'success' } : f
      ),
    }));
  },

  // Clear all files and release preview URLs
  clearFiles: () => {
    set({ files: [] });
  },

  // Set files (for restoration purposes)
  setFiles: filesToRestore => {
    set({ files: filesToRestore });
  },
}));
