'use client';

import {
  CodeBlock,
  InlineCode,
  MarkdownBlockquote,
  MarkdownTableContainer,
} from '@components/chat/markdown-block';
import { TooltipWrapper } from '@components/ui/tooltip-wrapper';
import { UnifiedStatusPanel } from '@components/workflow/workflow-tracker/unified-status-panel';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import 'katex/dist/katex.min.css';
import { Check, Copy, Download, FileText, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import React, { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

interface TextGenerationTrackerProps {
  isExecuting: boolean;
  isStreaming: boolean;
  generatedText: string;
  currentExecution: any;
  onStop?: () => void;
  onRetry?: () => void;
  onReset?: () => void;
}

/**
 * 文本生成跟踪器组件
 *
 * 功能特点：
 * - 实时显示文本生成状态
 * - 流式文本展示
 * - 统一的状态面板
 * - 文本操作功能（复制、下载）
 * - 与WorkflowTracker保持一致的布局结构
 */
export function TextGenerationTracker({
  isExecuting,
  isStreaming,
  generatedText,
  currentExecution,
  onStop,
  onRetry,
  onReset,
}: TextGenerationTrackerProps) {
  const { isDark } = useTheme();
  const markdownContainerRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const t = useTranslations('pages.textGeneration');

  // --- 自动滚动到底部 ---
  useEffect(() => {
    if (markdownContainerRef.current && isStreaming) {
      markdownContainerRef.current.scrollTop =
        markdownContainerRef.current.scrollHeight;
    }
  }, [generatedText, isStreaming]);

  // --- 复用助手消息的Markdown组件配置 ---
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

  // --- 复制文本 ---
  const handleCopyText = async () => {
    if (generatedText) {
      try {
        await navigator.clipboard.writeText(generatedText);
        setIsCopied(true);
        console.log('[文本生成跟踪器] 文本已复制到剪贴板');

        // 2秒后重置状态
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      } catch (error) {
        console.error('[文本生成跟踪器] 复制失败:', error);
      }
    }
  };

  // --- 下载文本 ---
  const handleDownloadText = () => {
    if (generatedText) {
      const blob = new Blob([generatedText], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-text-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* --- 统一状态面板 --- */}
      {(onStop || onRetry || onReset) && (
        <UnifiedStatusPanel
          isExecuting={isExecuting}
          progress={0} // 文本生成不显示具体进度
          error={null} // 错误由外层处理
          canRetry={false} // 重试由外层处理
          currentExecution={currentExecution}
          onStop={onStop || (() => {})}
          onRetry={onRetry || (() => {})}
          onReset={onReset || (() => {})}
          onShowResult={() => {}} // 文本生成不需要单独的结果查看器
          showResultButton={false} // 文本生成不显示查看结果按钮
        />
      )}

      {/* --- 文本生成区域 --- */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        {!isExecuting && !currentExecution && !generatedText ? (
          // 空状态
          <div className="flex h-full items-center justify-center">
            <div className="space-y-4 text-center">
              <div
                className={cn(
                  'mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed',
                  isDark ? 'border-stone-600' : 'border-stone-300'
                )}
              >
                <FileText
                  className={cn(
                    'h-6 w-6',
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  )}
                />
              </div>
              <div className="space-y-2">
                <h3
                  className={cn(
                    'font-serif text-lg font-semibold',
                    isDark ? 'text-stone-200' : 'text-stone-800'
                  )}
                >
                  {t('emptyState.title')}
                </h3>
                <p
                  className={cn(
                    'font-serif text-sm',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                >
                  {t('emptyState.description')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // 文本生成内容
          <div className="flex h-full flex-col space-y-4">
            {/* 状态标题 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3
                  className={cn(
                    'font-serif text-lg font-semibold',
                    isDark ? 'text-stone-200' : 'text-stone-800'
                  )}
                >
                  {isExecuting || isStreaming
                    ? t('status.generating')
                    : t('status.result')}
                </h3>
              </div>

              {/* 操作按钮 */}
              {generatedText && !isExecuting && (
                <div className="flex items-center gap-2">
                  {/* 复制按钮 */}
                  <TooltipWrapper
                    content={isCopied ? t('buttons.copied') : t('buttons.copy')}
                    id="text-generation-copy-btn"
                    placement="bottom"
                    size="sm"
                    showArrow={false}
                    desktopOnly={true}
                  >
                    <button
                      onClick={handleCopyText}
                      className={cn(
                        'flex items-center justify-center rounded-lg p-2 transition-colors',
                        isDark ? 'text-stone-400' : 'text-stone-500',
                        isDark
                          ? 'hover:text-stone-300'
                          : 'hover:text-stone-700',
                        isDark
                          ? 'hover:bg-stone-600/40'
                          : 'hover:bg-stone-300/40',
                        'focus:outline-none'
                      )}
                      style={{ transform: 'translateZ(0)' }}
                      aria-label={
                        isCopied ? t('buttons.copied') : t('buttons.copy')
                      }
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </TooltipWrapper>

                  {/* 下载按钮 */}
                  <TooltipWrapper
                    content={t('buttons.download')}
                    id="text-generation-download-btn"
                    placement="bottom"
                    size="sm"
                    showArrow={false}
                    desktopOnly={true}
                  >
                    <button
                      onClick={handleDownloadText}
                      className={cn(
                        'flex items-center justify-center rounded-lg p-2 transition-colors',
                        isDark ? 'text-stone-400' : 'text-stone-500',
                        isDark
                          ? 'hover:text-stone-300'
                          : 'hover:text-stone-700',
                        isDark
                          ? 'hover:bg-stone-600/40'
                          : 'hover:bg-stone-300/40',
                        'focus:outline-none'
                      )}
                      style={{ transform: 'translateZ(0)' }}
                      aria-label={t('buttons.download')}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </TooltipWrapper>
                </div>
              )}
            </div>

            {/* 文本显示区域 */}
            <div className="relative flex-1 overflow-hidden">
              {isExecuting && !generatedText ? (
                // 加载状态
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed',
                    isDark
                      ? 'border-stone-600 bg-stone-800/50'
                      : 'border-stone-300 bg-stone-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Loader2
                      className={cn(
                        'h-5 w-5 animate-spin',
                        isDark ? 'text-stone-400' : 'text-stone-600'
                      )}
                    />
                    <div>
                      <div
                        className={cn(
                          'font-serif font-medium',
                          isDark ? 'text-stone-200' : 'text-stone-800'
                        )}
                      >
                        {t('loadingState.title')}
                      </div>
                      <div
                        className={cn(
                          'font-serif text-sm',
                          isDark ? 'text-stone-400' : 'text-stone-600'
                        )}
                      >
                        {t('loadingState.description')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Markdown渲染内容
                <div
                  ref={markdownContainerRef}
                  className={cn(
                    'absolute inset-0 overflow-y-auto overscroll-contain rounded-lg border p-4 font-serif',
                    'focus:border-transparent focus:ring-2 focus:ring-stone-500 focus:outline-none',
                    'assistant-message-content', // 复用助手消息的样式类
                    isDark
                      ? 'border-stone-600 bg-stone-800 text-stone-200'
                      : 'border-stone-300 bg-white text-stone-900'
                  )}
                  style={{
                    scrollBehavior: 'auto',
                  }}
                >
                  {generatedText ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={markdownComponents}
                    >
                      {generatedText}
                    </ReactMarkdown>
                  ) : (
                    <div
                      className={cn(
                        'flex h-full items-center justify-center font-serif',
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      )}
                    >
                      {isExecuting
                        ? t('placeholder.generating')
                        : t('placeholder.result')}
                    </div>
                  )}
                </div>
              )}

              {/* 流式生成指示器 */}
              {isStreaming && (
                <div
                  className={cn(
                    'absolute right-4 bottom-4 flex items-center gap-2 rounded-full px-3 py-1 text-xs',
                    isDark
                      ? 'bg-stone-700 text-stone-300'
                      : 'bg-stone-100 text-stone-600'
                  )}
                >
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  <span className="font-serif">{t('streamingIndicator')}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
