/**
 * @jest-environment jsdom
 */
import type { MessageAttachment } from '@lib/stores/chat-store';
import { useFilePreviewStore } from '@lib/stores/ui/file-preview-store';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { FilePreviewCanvas } from '../file-preview-canvas';

// Mock the Dify service
jest.mock('@lib/services/dify', () => ({
  previewDifyFile: jest.fn(),
}));

// Mock the theme hook
jest.mock('@lib/hooks', () => ({
  useTheme: () => ({ isDark: false }),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations:
    (namespace: string) => (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, unknown> = {
        'filePreview.loading': 'Loading file content...',
        'filePreview.failed': 'Failed to load file',
        'filePreview.retryButton': 'Retry',
        'filePreview.dismissButton': 'Dismiss',
        'filePreview.downloadButton': 'Download File',
        'filePreview.noFileSelected': 'No file selected',
        'filePreview.previewNotSupported':
          'Preview not supported for this file type. You can download it to view the content.',
        'filePreview.fileInfo.title': 'File Information',
        'filePreview.fileInfo.name': 'Name:',
        'filePreview.fileInfo.type': 'Type:',
        'filePreview.fileInfo.size': 'Size:',
        'filePreview.textPreview.title': 'Text Preview',
        'filePreview.textPreview.copyButton': 'Copy',
        'filePreview.textPreview.copiedButton': 'Copied!',
        'filePreview.textPreview.downloadButton': 'Download',
        'filePreview.textPreview.charactersCount': `${params?.count} characters`,
        'filePreview.pdfPreview.title': 'PDF Preview',
        'filePreview.pdfPreview.openButton': 'Open',
        'filePreview.pdfPreview.downloadButton': 'Download',
        'filePreview.pdfPreview.fileSize': `${params?.size} MB`,
        'filePreview.markdownPreview.title': 'Markdown Preview',
        'filePreview.markdownPreview.renderedMode': 'Rendered',
        'filePreview.markdownPreview.rawMode': 'Raw',
        'filePreview.markdownPreview.downloadButton': 'Download',
        'filePreview.markdownPreview.charactersCount': `${params?.count} characters`,
        'common.ui.loading': 'Loading...',
      };
      return translations[`${namespace}.${key}`] || translations[key] || key;
    },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    div: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <div {...props}>{children}</div>,
  },
}));

// Mock file preview backdrop
jest.mock('../file-preview-backdrop', () => ({
  FilePreviewBackdrop: () => <div data-testid="file-preview-backdrop" />,
}));

const mockAttachment: MessageAttachment = {
  id: 'test-file-1',
  name: 'test-document.txt',
  size: 1024,
  type: 'text/plain',
  upload_file_id: 'dify-file-123',
  app_id: 'test-app-id',
};

describe('Document Preview Integration', () => {
  beforeEach(() => {
    // Reset store state before each test
    useFilePreviewStore.setState({
      isPreviewOpen: false,
      currentPreviewFile: null,
      isLoading: false,
      error: null,
      previewContent: null,
      contentHeaders: null,
    });

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Store Integration', () => {
    it('should handle openPreview with appId parameter', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { previewDifyFile } = require('@lib/services/dify');
      const mockContent = new Blob(['Hello, World!'], { type: 'text/plain' });

      previewDifyFile.mockResolvedValue({
        content: mockContent,
        headers: {
          contentType: 'text/plain',
          contentLength: 13,
        },
      });

      const { openPreview } = useFilePreviewStore.getState();
      await openPreview(mockAttachment, 'test-app-id');

      const state = useFilePreviewStore.getState();
      expect(state.isPreviewOpen).toBe(true);
      expect(state.currentPreviewFile).toEqual(mockAttachment);
      expect(state.previewContent).toEqual(mockContent);
      expect(previewDifyFile).toHaveBeenCalledWith(
        'test-app-id',
        'dify-file-123',
        { as_attachment: false }
      );
    });

    it('should handle error when appId is missing', async () => {
      const attachmentWithoutAppId = { ...mockAttachment, app_id: undefined };
      const { openPreview } = useFilePreviewStore.getState();

      await openPreview(attachmentWithoutAppId);

      const state = useFilePreviewStore.getState();
      expect(state.error).toBe('No application ID available for file preview');
      expect(state.isPreviewOpen).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { previewDifyFile } = require('@lib/services/dify');
      previewDifyFile.mockRejectedValue(new Error('API Error'));

      const { openPreview } = useFilePreviewStore.getState();
      await openPreview(mockAttachment, 'test-app-id');

      const state = useFilePreviewStore.getState();
      expect(state.error).toBe('API Error');
      expect(state.isLoading).toBe(false);
    });

    it('should clear state when closing preview', () => {
      // Set up state with content
      useFilePreviewStore.setState({
        isPreviewOpen: true,
        currentPreviewFile: mockAttachment,
        previewContent: new Blob(['test']),
        contentHeaders: { contentType: 'text/plain' },
        error: 'some error',
      });

      const { closePreview } = useFilePreviewStore.getState();
      closePreview();

      const state = useFilePreviewStore.getState();
      expect(state.isPreviewOpen).toBe(false);
      expect(state.currentPreviewFile).toBeNull();
      expect(state.previewContent).toBeNull();
      expect(state.contentHeaders).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('Component Rendering', () => {
    it('should show loading state when loading', () => {
      useFilePreviewStore.setState({
        isPreviewOpen: true,
        currentPreviewFile: mockAttachment,
        isLoading: true,
        error: null,
      });

      render(<FilePreviewCanvas />);
      expect(screen.getByText('Loading file content...')).toBeInTheDocument();
    });

    it('should show error state with retry option', () => {
      useFilePreviewStore.setState({
        isPreviewOpen: true,
        currentPreviewFile: mockAttachment,
        isLoading: false,
        error: 'Some custom error',
      });

      render(<FilePreviewCanvas />);
      expect(screen.getByText('Failed to load file')).toBeInTheDocument();
      expect(screen.getByText('Some custom error')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
      expect(screen.getByText('Dismiss')).toBeInTheDocument();
    });

    it('should show text preview for text files', () => {
      const textContent = new Blob(['Hello, World!'], { type: 'text/plain' });
      useFilePreviewStore.setState({
        isPreviewOpen: true,
        currentPreviewFile: mockAttachment,
        isLoading: false,
        error: null,
        previewContent: textContent,
        contentHeaders: {
          contentType: 'text/plain',
          contentLength: 13,
        },
      });

      render(<FilePreviewCanvas />);
      expect(screen.getByText('Text Preview')).toBeInTheDocument();
    });

    it('should show markdown preview for markdown files', () => {
      const markdownAttachment = {
        ...mockAttachment,
        name: 'README.md',
        type: 'text/markdown',
      };
      const markdownContent = new Blob(['# Hello World'], {
        type: 'text/markdown',
      });

      useFilePreviewStore.setState({
        isPreviewOpen: true,
        currentPreviewFile: markdownAttachment,
        isLoading: false,
        error: null,
        previewContent: markdownContent,
        contentHeaders: {
          contentType: 'text/markdown',
          contentLength: 13,
        },
      });

      render(<FilePreviewCanvas />);
      expect(screen.getByText('Markdown Preview')).toBeInTheDocument();
    });

    it('should show PDF preview for PDF files', () => {
      const pdfAttachment = {
        ...mockAttachment,
        name: 'document.pdf',
        type: 'application/pdf',
      };
      const pdfContent = new Blob(['PDF content'], { type: 'application/pdf' });

      useFilePreviewStore.setState({
        isPreviewOpen: true,
        currentPreviewFile: pdfAttachment,
        isLoading: false,
        error: null,
        previewContent: pdfContent,
        contentHeaders: {
          contentType: 'application/pdf',
          contentLength: 100,
        },
      });

      render(<FilePreviewCanvas />);
      expect(screen.getByText('PDF Preview')).toBeInTheDocument();
    });

    it('should show fallback for unsupported file types', () => {
      const binaryAttachment = {
        ...mockAttachment,
        name: 'data.bin',
        type: 'application/octet-stream',
      };
      const binaryContent = new Blob(['binary data'], {
        type: 'application/octet-stream',
      });

      useFilePreviewStore.setState({
        isPreviewOpen: true,
        currentPreviewFile: binaryAttachment,
        isLoading: false,
        error: null,
        previewContent: binaryContent,
        contentHeaders: {
          contentType: 'application/octet-stream',
          contentLength: 100,
        },
      });

      render(<FilePreviewCanvas />);
      expect(screen.getByText('File Information')).toBeInTheDocument();
      expect(screen.getByText('Download File')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle retry button click', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { previewDifyFile } = require('@lib/services/dify');
      previewDifyFile.mockResolvedValue({
        content: new Blob(['retry content']),
        headers: { contentType: 'text/plain' },
      });

      useFilePreviewStore.setState({
        isPreviewOpen: true,
        currentPreviewFile: mockAttachment,
        isLoading: false,
        error: 'Initial error',
      });

      render(<FilePreviewCanvas />);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(previewDifyFile).toHaveBeenCalledWith(
          'test-app-id',
          'dify-file-123',
          { as_attachment: false }
        );
      });
    });

    it('should handle clear error button click', () => {
      useFilePreviewStore.setState({
        isPreviewOpen: true,
        currentPreviewFile: mockAttachment,
        isLoading: false,
        error: 'Some error',
      });

      render(<FilePreviewCanvas />);

      const dismissButton = screen.getByText('Dismiss');
      fireEvent.click(dismissButton);

      const state = useFilePreviewStore.getState();
      expect(state.error).toBeNull();
    });

    it('should handle download file action', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { previewDifyFile } = require('@lib/services/dify');
      const mockDownloadContent = new Blob(['download content']);

      previewDifyFile.mockResolvedValue({
        content: mockDownloadContent,
        headers: {
          contentType: 'application/octet-stream',
          contentDisposition: 'attachment; filename="test-document.txt"',
        },
      });

      // Mock DOM methods
      const mockClick = jest.fn();
      const mockCreateElement = jest
        .spyOn(document, 'createElement')
        .mockReturnValue({
          click: mockClick,
          href: '',
          download: '',
          style: {},
        } as unknown as HTMLAnchorElement);
      const mockAppendChild = jest
        .spyOn(document.body, 'appendChild')
        .mockImplementation();
      const mockRemoveChild = jest
        .spyOn(document.body, 'removeChild')
        .mockImplementation();
      global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();

      useFilePreviewStore.setState({
        isPreviewOpen: true,
        currentPreviewFile: mockAttachment,
        previewContent: new Blob(['content']),
        contentHeaders: { contentType: 'text/plain' },
      });

      const { downloadFile } = useFilePreviewStore.getState();
      await downloadFile();

      await waitFor(() => {
        expect(previewDifyFile).toHaveBeenCalledWith(
          'test-app-id',
          'dify-file-123',
          { as_attachment: true }
        );
        expect(mockClick).toHaveBeenCalled();
      });

      // Cleanup
      mockCreateElement.mockRestore();
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
    });
  });
});
