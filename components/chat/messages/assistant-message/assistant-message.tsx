'use client';

import {
  CodeBlock,
  InlineCode,
  MarkdownBlockquote,
  MarkdownTableContainer,
} from '@components/chat/markdown-block';
// Keep existing think block components
import { ThinkBlockContent } from '@components/chat/markdown-block/think-block-content';
/**
 * Atomic Markdown components and Think Block related components
 *
 * Text style system documentation:
 * This component uses a specialized CSS class system to control assistant message text display:
 *
 * 1. Line height control hierarchy:
 *    - Base line height: 1.35 (compact, for lists etc.)
 *    - Paragraph line height: 1.9 (loose, improves readability)
 *    - Heading line height: 1.25 (tightest, emphasizes hierarchy)
 *
 * 2. Paragraph spacing control:
 *    - Current setting: 0.1em (very small separation spacing)
 *    - Can be adjusted in styles/markdown.css at .assistant-message-content p
 *
 * 3. Style file locations:
 *    - Main styles: styles/markdown.css (lines 277-340)
 *    - Style class name: .assistant-message-content
 *
 * To adjust text density or spacing, modify the corresponding CSS files rather than this component.
 */
import {
  ThinkBlockHeader,
  ThinkBlockStatus,
} from '@components/chat/markdown-block/think-block-header';
import { AssistantMessageActions } from '@components/chat/message-actions';
import { ReferenceSources } from '@components/chat/reference-sources';
import { useTheme } from '@lib/hooks';
import { cn } from '@lib/utils';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { StreamingText } from './streaming-markdown';

// Extract think block and main content from raw message content
const extractThinkContent = (
  rawContent: string
): {
  hasThinkBlock: boolean;
  thinkContent: string;
  mainContent: string;
  thinkClosed: boolean;
} => {
  // Debug: log details tag position and format if present
  if (rawContent.includes('<details')) {
    console.log('[AssistantMessage] Details tag detected:', {
      content: rawContent.substring(0, 200) + '...',
      startsWithDetails: rawContent.indexOf('<details') === 0,
      detailsPosition: rawContent.indexOf('<details'),
      firstLine: rawContent.split('\n')[0],
    });
  }

  // Support both <think> and <details> tags, prioritize <think>
  // Allow a small amount of whitespace or short content before tags
  const thinkStartTag = '<think>';
  const thinkEndTag = '</think>';

  // Find <think> tag near the start
  const thinkStartIndex = rawContent.indexOf(thinkStartTag);
  if (thinkStartIndex !== -1) {
    // Allow up to 10 characters of non-whitespace before <think>
    const contentBeforeThink = rawContent.substring(0, thinkStartIndex).trim();
    const isThinkAtEffectiveStart =
      thinkStartIndex === 0 ||
      contentBeforeThink.length === 0 ||
      contentBeforeThink.length <= 10;

    if (isThinkAtEffectiveStart) {
      const thinkContentStart = thinkStartIndex + thinkStartTag.length;
      const endTagIndex = rawContent.indexOf(thinkEndTag, thinkContentStart);

      if (endTagIndex !== -1) {
        const thinkContent = rawContent.substring(
          thinkContentStart,
          endTagIndex
        );
        const mainContent = rawContent.substring(
          endTagIndex + thinkEndTag.length
        );
        return {
          hasThinkBlock: true,
          thinkContent,
          mainContent,
          thinkClosed: true,
        };
      }

      // Unclosed <think> tag
      const thinkContent = rawContent.substring(thinkContentStart);
      return {
        hasThinkBlock: true,
        thinkContent,
        mainContent: '',
        thinkClosed: false,
      };
    }
  }

  // Find <details> tag near the start
  const detailsStartRegex = /<details(?:\s[^>]*)?>/i;
  const detailsMatch = rawContent.match(detailsStartRegex);

  if (detailsMatch) {
    const detailsStartIndex = rawContent.indexOf(detailsMatch[0]);
    // Allow up to 10 characters of non-whitespace before <details>
    const contentBeforeDetails = rawContent
      .substring(0, detailsStartIndex)
      .trim();
    const isDetailsAtEffectiveStart =
      detailsStartIndex === 0 ||
      contentBeforeDetails.length === 0 ||
      contentBeforeDetails.length <= 10;

    if (isDetailsAtEffectiveStart) {
      const detailsStartTag = detailsMatch[0];
      const detailsEndTag = '</details>';
      const detailsContentStart = detailsStartIndex + detailsStartTag.length;
      const endTagIndex = rawContent.indexOf(
        detailsEndTag,
        detailsContentStart
      );

      if (endTagIndex !== -1) {
        // Extract content inside <details>, remove <summary> if present
        let detailsContent = rawContent.substring(
          detailsContentStart,
          endTagIndex
        );
        const summaryRegex = /<summary[^>]*>[\s\S]*?<\/summary>/i;
        detailsContent = detailsContent.replace(summaryRegex, '').trim();

        const mainContent = rawContent.substring(
          endTagIndex + detailsEndTag.length
        );
        return {
          hasThinkBlock: true,
          thinkContent: detailsContent,
          mainContent,
          thinkClosed: true,
        };
      }

      // Unclosed <details> tag
      let detailsContent = rawContent.substring(detailsContentStart);
      const summaryRegex = /<summary[^>]*>[\s\S]*?<\/summary>/i;
      detailsContent = detailsContent.replace(summaryRegex, '').trim();

      return {
        hasThinkBlock: true,
        thinkContent: detailsContent,
        mainContent: '',
        thinkClosed: false,
      };
    }
  }

  // No think block found
  return {
    hasThinkBlock: false,
    thinkContent: '',
    mainContent: rawContent,
    thinkClosed: false,
  };
};

// Extract main content for copy (removes think/details blocks)
const extractMainContentForCopy = (rawContent: string): string => {
  // If there are unclosed <think> or <details> tags, return empty string (still streaming)
  const openThinkCount = (rawContent.match(/<think(?:\s[^>]*)?>/gi) || [])
    .length;
  const closeThinkCount = (rawContent.match(/<\/think>/gi) || []).length;
  const openDetailsCount = (rawContent.match(/<details(?:\s[^>]*)?>/gi) || [])
    .length;
  const closeDetailsCount = (rawContent.match(/<\/details>/gi) || []).length;

  if (
    openThinkCount > closeThinkCount ||
    openDetailsCount > closeDetailsCount
  ) {
    return '';
  }

  let cleanContent = rawContent;

  // Remove all <think>...</think> blocks
  const thinkRegex = /<think(?:\s[^>]*)?>[\s\S]*?<\/think>/gi;
  cleanContent = cleanContent.replace(thinkRegex, '');

  // Remove all <details>...</details> blocks
  const detailsRegex = /<details(?:\s[^>]*)?>[\s\S]*?<\/details>/gi;
  cleanContent = cleanContent.replace(detailsRegex, '');

  // Remove extra blank lines
  return cleanContent.replace(/\n\s*\n/g, '\n').trim();
};

interface AssistantMessageProps {
  id: string;
  content: string;
  isStreaming: boolean;
  wasManuallyStopped: boolean;
  metadata?: Record<string, any>; // Message metadata
  className?: string;
}

/**
 * Assistant Message Component
 * Renders assistant messages with streaming, think blocks, markdown, references, and actions.
 *
 * Features:
 * - Streaming text with typewriter effect
 * - Think block extraction and rendering
 * - Markdown content rendering
 * - Reference sources display
 * - Message actions (copy, regenerate, feedback)
 *
 * Uses React.memo for performance optimization.
 */
export const AssistantMessage: React.FC<AssistantMessageProps> = React.memo(
  ({ id, content, isStreaming, wasManuallyStopped, metadata, className }) => {
    const { isDark } = useTheme();
    const t = useTranslations('pages.chat');

    // Extract think block and main content from message
    const { hasThinkBlock, thinkContent, mainContent, thinkClosed } = useMemo(
      () => extractThinkContent(content),
      [content]
    );

    const [isOpen, setIsOpen] = useState(true);

    const toggleOpen = () => {
      setIsOpen(prev => !prev);
    };

    // Preprocess main content: ensure details tags are separated, escape unknown HTML tags
    const preprocessMainContent = (content: string): string => {
      // Ensure </details> is followed by two newlines, and <details> is preceded by two newlines if needed
      const processedContent = content
        .replace(/(<\/details>)(\s*)([^\s])/g, '$1\n\n$3')
        .replace(/([^\n])(\s*)(<details[^>]*>)/g, '$1\n\n$3');

      // Whitelist of allowed HTML tags
      const knownHtmlTags = new Set([
        'div',
        'span',
        'p',
        'br',
        'hr',
        'strong',
        'em',
        'b',
        'i',
        'u',
        's',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'dl',
        'dt',
        'dd',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'blockquote',
        'pre',
        'code',
        'a',
        'img',
        'sub',
        'sup',
        'mark',
        'del',
        'ins',
        'details',
        'summary',
      ]);

      // Escape HTML tags not in whitelist
      return processedContent
        .replace(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tagName) => {
          if (!knownHtmlTags.has(tagName.toLowerCase())) {
            return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          }
          return match;
        })
        .replace(/<\/([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tagName) => {
          if (!knownHtmlTags.has(tagName.toLowerCase())) {
            return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          }
          return match;
        });
    };

    // Calculate the current think block status
    const calculateStatus = (): ThinkBlockStatus => {
      if (hasThinkBlock && thinkClosed) {
        return 'completed';
      }
      if (wasManuallyStopped) {
        return hasThinkBlock ? 'stopped' : 'completed';
      }
      if (isStreaming && hasThinkBlock && !thinkClosed) {
        return 'thinking';
      }
      return 'completed';
    };
    const currentStatus = calculateStatus();

    // Track previous status to control think block open/close animation
    const prevStatusRef = useRef<ThinkBlockStatus>(currentStatus);

    useEffect(() => {
      const previousStatus = prevStatusRef.current;

      if (previousStatus === 'thinking' && currentStatus === 'completed') {
        setIsOpen(false);
      } else if (
        previousStatus !== 'thinking' &&
        currentStatus === 'thinking'
      ) {
        setIsOpen(true);
      }

      prevStatusRef.current = currentStatus;
    }, [currentStatus]);

    // Markdown rendering components for main content
    const mainMarkdownComponents: Components = {
      // Render code blocks and inline code
      code({ node, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : null;

        if (node.position?.start.line !== node.position?.end.line || language) {
          // Multi-line code or specified language: code block
          return (
            <CodeBlock
              language={language}
              className={className}
              isStreaming={isStreaming}
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </CodeBlock>
          );
        }
        // Single line code: inline code
        return <InlineCode {...props}>{children}</InlineCode>;
      },

      // Render table container and table cells
      table({ children, ...props }: any) {
        return (
          <MarkdownTableContainer {...props}>{children}</MarkdownTableContainer>
        );
      },
      th({ children, ...props }: any) {
        return (
          <th
            className={cn(
              'border px-4 py-2 text-left font-medium',
              isDark
                ? 'border-gray-600 bg-gray-700'
                : 'border-gray-300 bg-gray-100'
            )}
            {...props}
          >
            {children}
          </th>
        );
      },
      td({ children, ...props }: any) {
        return (
          <td
            className={cn(
              'border px-4 py-2',
              'border-gray-300 dark:border-gray-600'
            )}
            {...props}
          >
            {children}
          </td>
        );
      },
      blockquote({ children, ...props }: any) {
        return <MarkdownBlockquote {...props}>{children}</MarkdownBlockquote>;
      },
      p({ children, ...props }) {
        return <p {...props}>{children}</p>;
      },
      ul({ children, ...props }) {
        return (
          <ul className="list-disc space-y-1 pl-6" {...props}>
            {children}
          </ul>
        );
      },
      ol({ children, ...props }) {
        return (
          <ol className="list-decimal space-y-1 pl-6" {...props}>
            {children}
          </ol>
        );
      },
      li({ children, ...props }) {
        return (
          <li className="pl-1" {...props}>
            {children}
          </li>
        );
      },
      h1({ children, ...props }) {
        return (
          <h1
            className={cn(
              'mt-6 mb-4 text-3xl font-bold',
              isDark ? 'text-gray-100' : 'text-gray-900'
            )}
            {...props}
          >
            {children}
          </h1>
        );
      },
      h2({ children, ...props }) {
        return (
          <h2
            className={cn(
              'mt-5 mb-3 text-2xl font-semibold',
              isDark ? 'text-gray-100' : 'text-gray-900'
            )}
            {...props}
          >
            {children}
          </h2>
        );
      },
      h3({ children, ...props }) {
        return (
          <h3
            className={cn(
              'mt-4 mb-2 text-xl font-medium',
              isDark ? 'text-gray-100' : 'text-gray-900'
            )}
            {...props}
          >
            {children}
          </h3>
        );
      },
      h4({ children, ...props }) {
        return (
          <h4
            className={cn(
              'mt-3 mb-2 text-lg font-medium',
              isDark ? 'text-gray-100' : 'text-gray-900'
            )}
            {...props}
          >
            {children}
          </h4>
        );
      },
      a({ children, href, ...props }: any) {
        // Ensure href is a string
        const linkUrl = typeof href === 'string' ? href : '';

        // If the link contains an image, render as image link
        const hasImageChild = React.Children.toArray(children).some(
          child =>
            React.isValidElement(child) &&
            (child.type === 'img' || (child.props as any)?.src)
        );

        if (hasImageChild) {
          // Extract image info from children
          const imageChild = React.Children.toArray(children).find(
            child =>
              React.isValidElement(child) &&
              (child.type === 'img' || (child.props as any)?.src)
          ) as React.ReactElement;

          const imageAlt = (imageChild?.props as any)?.alt || '';

          return (
            <a
              href={linkUrl}
              className={cn(
                'inline-flex items-center gap-1 rounded border px-2 py-1 text-sm',
                isDark
                  ? 'border-gray-600 bg-gray-800 text-sky-400 hover:border-gray-500 hover:text-sky-300'
                  : 'border-gray-300 bg-gray-50 text-sky-600 hover:border-gray-400 hover:text-sky-700'
              )}
              target="_blank"
              rel="noopener noreferrer"
              title={imageAlt || t('messages.viewImage')}
              {...props}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {imageAlt}
            </a>
          );
        }

        // Regular link
        return (
          <a
            href={href}
            className={cn(
              'underline',
              isDark
                ? 'text-sky-400 hover:text-sky-300'
                : 'text-sky-600 hover:text-sky-700'
            )}
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            {children}
          </a>
        );
      },
      hr({ ...props }) {
        return (
          <hr
            className={cn(
              'my-4 border-t',
              isDark ? 'border-gray-700' : 'border-gray-300'
            )}
            {...props}
          />
        );
      },
      // Render images as links to avoid loading jitter
      // If image is inside a link, skip rendering here (handled by parent <a>)
      img({ src, alt, node, ...props }: any) {
        // Ensure src is a string
        const imageUrl = typeof src === 'string' ? src : '';

        // If inside a link, skip rendering
        const isInsideLink = node?.parent?.tagName === 'a';

        if (isInsideLink) {
          return null;
        }

        // Render image as a link
        return (
          <a
            href={imageUrl}
            className={cn(
              'inline-flex items-center gap-1 rounded border px-2 py-1 text-sm',
              isDark
                ? 'border-gray-600 bg-gray-800 text-sky-400 hover:border-gray-500 hover:text-sky-300'
                : 'border-gray-300 bg-gray-50 text-sky-600 hover:border-gray-400 hover:text-sky-700'
            )}
            target="_blank"
            rel="noopener noreferrer"
            title={alt || t('messages.viewImage')}
            {...props}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {alt || t('messages.imageLink')}
          </a>
        );
      },
    };

    return (
      <div
        className={cn(
          'assistant-message-container group mb-6 w-full',
          className
        )}
        data-message-id={id}
      >
        {hasThinkBlock && (
          <>
            <ThinkBlockHeader
              status={currentStatus}
              isOpen={isOpen}
              onToggle={toggleOpen}
            />
            <StreamingText
              content={thinkContent}
              isStreaming={isStreaming && !thinkClosed}
              isComplete={thinkClosed || !isStreaming}
              typewriterSpeed={80}
            >
              {displayedThinkContent => (
                <ThinkBlockContent
                  markdownContent={displayedThinkContent}
                  isOpen={isOpen}
                />
              )}
            </StreamingText>
          </>
        )}

        {mainContent && (
          // Main content area: streaming markdown, references, and actions
          <div
            className={cn(
              'markdown-body main-content-area assistant-message-content w-full text-base',
              'text-stone-800 dark:text-stone-200', // Set text color based on theme
              !hasThinkBlock ? 'py-2' : 'pt-1 pb-2' // Adjust vertical spacing if think block is present
            )}
          >
            <StreamingText
              content={preprocessMainContent(mainContent)}
              isStreaming={isStreaming}
              isComplete={!isStreaming}
              typewriterSpeed={50}
            >
              {displayedContent => (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex, rehypeRaw]}
                  components={mainMarkdownComponents}
                >
                  {displayedContent}
                </ReactMarkdown>
              )}
            </StreamingText>

            {/* Reference sources and attribution */}
            <ReferenceSources
              retrieverResources={
                metadata?.dify_retriever_resources ||
                metadata?.dify_metadata?.retriever_resources
              }
              isDark={isDark}
              className="mt-4 mb-2"
              animationDelay={isStreaming ? 0 : 300} // Delay 300ms after streaming ends
            />

            {/* Assistant message action buttons */}
            <AssistantMessageActions
              messageId={id}
              content={extractMainContentForCopy(content) || undefined}
              onRegenerate={() => console.log('Regenerate message', id)}
              onFeedback={isPositive =>
                console.log(
                  'Feedback',
                  isPositive ? 'positive' : 'negative',
                  id
                )
              } // Feedback functionality can be updated later
              isRegenerating={isStreaming}
              className={cn(
                '-ml-2',
                // Adjust top margin based on reference presence
                (
                  metadata?.dify_retriever_resources ||
                  metadata?.dify_metadata?.retriever_resources
                )?.length > 0
                  ? 'mt-0' // Normal spacing if references exist
                  : '-mt-4' // Negative spacing if no references
              )}
            />
          </div>
        )}
      </div>
    );
  }
);

// Set displayName for React DevTools
AssistantMessage.displayName = 'AssistantMessage';
