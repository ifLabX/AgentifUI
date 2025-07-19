'use client';

import {
  CodeBlock,
  InlineCode,
  MarkdownBlockquote,
  MarkdownTableContainer,
} from '@components/chat/markdown-block';
import { TooltipWrapper } from '@components/ui/tooltip-wrapper';
import {
  DateFormatPresets,
  useDateFormatter,
} from '@lib/hooks/use-date-formatter';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import 'katex/dist/katex.min.css';
import { Check, Copy, Download, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import React, { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

interface TextGenerationResultViewerProps {
  result: any;
  execution: any;
  onClose: () => void;
}

/**
 * 文本生成结果查看器
 *
 * 专门用于展示文本生成的历史记录结果
 * 模仿工作流的ResultViewer组件样式和功能
 */
export function TextGenerationResultViewer({
  result,
  execution,
  onClose,
}: TextGenerationResultViewerProps) {
  const { isDark } = useTheme();
  const { formatDate } = useDateFormatter();
  const t = useTranslations('components.text-generation.resultViewer');
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // --- Animation control ---
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // --- Reuse the Markdown component configuration of the assistant message ---
  const markdownComponents: Components = {
    code({ node, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      if (language) {
        return (
          <CodeBlock language={language} className={className} {...props}>
            {String(children).replace(/\n$/, '')}
          </CodeBlock>
        );
      }

      return <InlineCode {...props}>{children}</InlineCode>;
    },
    table({ children, ...props }: any) {
      return <MarkdownTableContainer>{children}</MarkdownTableContainer>;
    },
    blockquote({ children, ...props }: any) {
      return <MarkdownBlockquote>{children}</MarkdownBlockquote>;
    },
    p({ children, ...props }: any) {
      return (
        <p className="font-serif" {...props}>
          {children}
        </p>
      );
    },
    h1({ children, ...props }: any) {
      return (
        <h1 className="font-serif" {...props}>
          {children}
        </h1>
      );
    },
    h2({ children, ...props }: any) {
      return (
        <h2 className="font-serif" {...props}>
          {children}
        </h2>
      );
    },
    h3({ children, ...props }: any) {
      return (
        <h3 className="font-serif" {...props}>
          {children}
        </h3>
      );
    },
    h4({ children, ...props }: any) {
      return (
        <h4 className="font-serif" {...props}>
          {children}
        </h4>
      );
    },
    ul({ children, ...props }: any) {
      return (
        <ul className="font-serif" {...props}>
          {children}
        </ul>
      );
    },
    ol({ children, ...props }: any) {
      return (
        <ol className="font-serif" {...props}>
          {children}
        </ol>
      );
    },
    li({ children, ...props }: any) {
      return (
        <li className="font-serif" {...props}>
          {children}
        </li>
      );
    },
  };

  // --- Format content ---
  const formatContent = (data: any): string => {
    // If the result contains the generated text content
    if (typeof data === 'string') {
      try {
        // Try to parse the JSON string
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          return extractTextFromObject(parsed);
        }
      } catch {
        // If it is not a JSON string, return directly
        return data;
      }
    }

    // If it is an object, extract the text content
    if (data && typeof data === 'object') {
      return extractTextFromObject(data);
    }

    return String(data || t('content.noContent'));
  };

  // --- Extract text content from an object ---
  const extractTextFromObject = (obj: any): string => {
    // First look for the generated_text field (the main output of text generation)
    if (obj.generated_text && typeof obj.generated_text === 'string') {
      return obj.generated_text;
    }

    // Find other common text fields
    const textFields = [
      'text',
      'content',
      'output',
      'result',
      'answer',
      'response',
    ];
    for (const field of textFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        return obj[field];
      }
    }

    // If no text field is found, return JSON format
    return JSON.stringify(obj, null, 2);
  };

  const formattedContent = formatContent(result);

  // --- Copy function ---
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedContent);
      setIsCopied(true);

      // Reset state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('[Text generation result viewer] Copy failed:', error);
    }
  };

  // --- Download function ---
  const handleDownload = () => {
    const blob = new Blob([formattedContent], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `text-generation-result-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Background click to close ---
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // --- Keyboard event listening ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Background mask */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleBackdropClick}
      />

      {/* Popup content */}
      <div className="fixed inset-4 z-50 flex items-center justify-center">
        <div
          className={cn(
            'max-h-full w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl transition-all duration-300',
            isDark
              ? 'border border-stone-700 bg-stone-900'
              : 'border border-stone-200 bg-white',
            isVisible ? 'animate-scale-in' : 'scale-95 opacity-0'
          )}
        >
          {/* Header */}
          <div
            className={cn(
              'flex items-center justify-between border-b p-6',
              isDark ? 'border-stone-700' : 'border-stone-200'
            )}
          >
            <div>
              <h2
                className={cn(
                  'font-serif text-xl font-bold',
                  isDark ? 'text-stone-100' : 'text-stone-900'
                )}
              >
                {t('title')}
              </h2>
              <p
                className={cn(
                  'mt-1 font-serif text-sm',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                {execution?.title || t('defaultTitle')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Copy button */}
              <TooltipWrapper
                content={isCopied ? t('actions.copied') : t('actions.copy')}
                id="text-result-viewer-copy-btn"
                placement="bottom"
                size="sm"
                showArrow={false}
                _desktopOnly={true}
              >
                <button
                  onClick={handleCopy}
                  className={cn(
                    'flex items-center justify-center rounded-lg p-2 transition-colors',
                    isDark ? 'text-stone-400' : 'text-stone-500',
                    isDark ? 'hover:text-stone-300' : 'hover:text-stone-700',
                    isDark ? 'hover:bg-stone-600/40' : 'hover:bg-stone-300/40',
                    'focus:outline-none'
                  )}
                  style={{ transform: 'translateZ(0)' }}
                  aria-label={
                    isCopied ? t('actions.copied') : t('actions.copy')
                  }
                >
                  {isCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </TooltipWrapper>

              {/* Download button */}
              <TooltipWrapper
                content={t('actions.download')}
                id="text-result-viewer-download-btn"
                placement="bottom"
                size="sm"
                showArrow={false}
                _desktopOnly={true}
              >
                <button
                  onClick={handleDownload}
                  className={cn(
                    'rounded-lg p-2 transition-colors',
                    isDark
                      ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-300'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-700'
                  )}
                  aria-label={t('actions.download')}
                >
                  <Download className="h-4 w-4" />
                </button>
              </TooltipWrapper>

              {/* Close button */}
              <button
                onClick={onClose}
                className={cn(
                  'rounded-lg p-2 transition-colors',
                  isDark
                    ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-300'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-700'
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Execution information */}
              {execution && (
                <div
                  className={cn(
                    'rounded-lg border p-4',
                    isDark
                      ? 'border-stone-700 bg-stone-800/50'
                      : 'border-stone-200 bg-stone-50'
                  )}
                >
                  <h3
                    className={cn(
                      'mb-2 font-serif text-sm font-semibold',
                      isDark ? 'text-stone-200' : 'text-stone-800'
                    )}
                  >
                    {t('executionInfo.title')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 font-serif text-sm">
                    <div>
                      <span
                        className={cn(
                          'font-medium',
                          isDark ? 'text-stone-300' : 'text-stone-700'
                        )}
                      >
                        {t('executionInfo.status')}
                      </span>
                      <span
                        className={cn(
                          'ml-2',
                          execution.status === 'completed' &&
                            (isDark ? 'text-green-400' : 'text-green-600'),
                          execution.status === 'failed' &&
                            (isDark ? 'text-red-400' : 'text-red-600'),
                          execution.status === 'stopped' &&
                            (isDark ? 'text-yellow-400' : 'text-yellow-600')
                        )}
                      >
                        {execution.status === 'completed'
                          ? t('executionInfo.statusValues.completed')
                          : execution.status === 'failed'
                            ? t('executionInfo.statusValues.failed')
                            : execution.status === 'stopped'
                              ? t('executionInfo.statusValues.stopped')
                              : execution.status}
                      </span>
                    </div>
                    {execution.created_at && (
                      <div>
                        <span
                          className={cn(
                            'font-medium',
                            isDark ? 'text-stone-300' : 'text-stone-700'
                          )}
                        >
                          {t('executionInfo.createdAt')}
                        </span>
                        <span
                          className={cn(
                            'ml-2',
                            isDark ? 'text-stone-400' : 'text-stone-600'
                          )}
                        >
                          {formatDate(
                            execution.created_at,
                            DateFormatPresets.dateTime
                          )}
                        </span>
                      </div>
                    )}
                    {execution.elapsed_time && (
                      <div>
                        <span
                          className={cn(
                            'font-medium',
                            isDark ? 'text-stone-300' : 'text-stone-700'
                          )}
                        >
                          {t('executionInfo.elapsedTime')}
                        </span>
                        <span
                          className={cn(
                            'ml-2',
                            isDark ? 'text-stone-400' : 'text-stone-600'
                          )}
                        >
                          {execution.elapsed_time}s
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Generated content */}
              <div>
                <h3
                  className={cn(
                    'mb-3 font-serif text-sm font-semibold',
                    isDark ? 'text-stone-200' : 'text-stone-800'
                  )}
                >
                  {t('content.title')}
                </h3>
                <div
                  className={cn(
                    'assistant-message-content rounded-lg border p-4 font-serif',
                    isDark
                      ? 'border-stone-700 bg-stone-800 text-stone-200'
                      : 'border-stone-200 bg-white text-stone-900'
                  )}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={markdownComponents}
                  >
                    {formattedContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
