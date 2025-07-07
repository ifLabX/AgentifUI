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

const extractThinkContent = (
  rawContent: string
): {
  hasThinkBlock: boolean;
  thinkContent: string;
  mainContent: string;
  thinkClosed: boolean;
} => {
  // Debug: Check position and format of details tags
  if (rawContent.includes('<details')) {
    console.log('[AssistantMessage] Details tag detected:', {
      content: rawContent.substring(0, 200) + '...',
      startsWithDetails: rawContent.indexOf('<details') === 0,
      detailsPosition: rawContent.indexOf('<details'),
      firstLine: rawContent.split('\n')[0],
    });
  }

  // Fix: Support both <think> and <details> tags
  // Priority check <think> tags first, then <details> tags if not found
  // New: Allow a small amount of whitespace or very short content before tags
  // Preprocessing: Remove leading whitespace but preserve original content for subsequent processing
  const trimmedContent = rawContent.trim();

  // Check <think> tags
  const thinkStartTag = '<think>';
  const thinkEndTag = '</think>';

  // New logic: Check if think tag is at the beginning or near the beginning
  // Allow small amount of whitespace or short non-important content before
  const thinkStartIndex = rawContent.indexOf(thinkStartTag);
  if (thinkStartIndex !== -1) {
    // Check if content before think tag can be ignored (whitespace or very short content)
    const contentBeforeThink = rawContent.substring(0, thinkStartIndex).trim();
    const isThinkAtEffectiveStart =
      thinkStartIndex === 0 ||
      contentBeforeThink.length === 0 ||
      contentBeforeThink.length <= 10; // Allow up to 10 characters of content before

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

      // Unclosed think tag
      const thinkContent = rawContent.substring(thinkContentStart);
      return {
        hasThinkBlock: true,
        thinkContent,
        mainContent: '',
        thinkClosed: false,
      };
    }
  }

  // Check <details> tags
  const detailsStartRegex = /<details(?:\s[^>]*)?>/i;
  const detailsMatch = rawContent.match(detailsStartRegex);

  if (detailsMatch) {
    const detailsStartIndex = rawContent.indexOf(detailsMatch[0]);

    // New logic: Check if details tag is at the beginning or near the beginning
    // Allow small amount of whitespace or short non-important content before
    const contentBeforeDetails = rawContent
      .substring(0, detailsStartIndex)
      .trim();
    const isDetailsAtEffectiveStart =
      detailsStartIndex === 0 ||
      contentBeforeDetails.length === 0 ||
      contentBeforeDetails.length <= 10; // Allow up to 10 characters of content before

    if (isDetailsAtEffectiveStart) {
      const detailsStartTag = detailsMatch[0];
      const detailsEndTag = '</details>';
      const detailsContentStart = detailsStartIndex + detailsStartTag.length;
      const endTagIndex = rawContent.indexOf(
        detailsEndTag,
        detailsContentStart
      );

      if (endTagIndex !== -1) {
        // Extract details content, remove summary part
        let detailsContent = rawContent.substring(
          detailsContentStart,
          endTagIndex
        );

        // Remove <summary>...</summary> part, keep only actual content
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

      // Unclosed details tag
      let detailsContent = rawContent.substring(detailsContentStart);

      // Remove <summary>...</summary> part if exists
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

  return {
    hasThinkBlock: false,
    thinkContent: '',
    mainContent: rawContent,
    thinkClosed: false,
  };
};

// Extract clean main content for copy functionality
const extractMainContentForCopy = (rawContent: string): string => {
  // Check for unclosed key tags (both think and details are handled by Think Block)
  const openThinkCount = (rawContent.match(/<think(?:\s[^>]*)?>/gi) || [])
    .length;
  const closeThinkCount = (rawContent.match(/<\/think>/gi) || []).length;
  const openDetailsCount = (rawContent.match(/<details(?:\s[^>]*)?>/gi) || [])
    .length;
  const closeDetailsCount = (rawContent.match(/<\/details>/gi) || []).length;

  // If there are unclosed tags, content is still being generated, return empty string
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

  // Remove all <details>...</details> blocks (now handled by Think Block)
  const detailsRegex = /<details(?:\s[^>]*)?>[\s\S]*?<\/details>/gi;
  cleanContent = cleanContent.replace(detailsRegex, '');

  // Clean up excess whitespace
  return cleanContent.replace(/\n\s*\n/g, '\n').trim();
};

interface AssistantMessageProps {
  id: string;
  content: string;
  isStreaming: boolean;
  wasManuallyStopped: boolean;
  metadata?: Record<string, any>; // New: Receive message metadata
  className?: string;
}

/**
 * Assistant Message Component
 * @description Renders assistant messages with streaming support, think blocks, and markdown content
 *
 * @features
 * - Streaming text display with typewriter effect
 * - Think block extraction and rendering
 * - Markdown content processing
 * - Reference sources display
 * - Message actions (copy, regenerate, feedback)
 *
 * Uses React.memo for performance optimization - only re-renders when props actually change
 */
export const AssistantMessage: React.FC<AssistantMessageProps> = React.memo(
  ({ id, content, isStreaming, wasManuallyStopped, metadata, className }) => {
    const { isDark } = useTheme();
    const t = useTranslations('pages.chat');

    const { hasThinkBlock, thinkContent, mainContent, thinkClosed } = useMemo(
      () => extractThinkContent(content),
      [content]
    );

    const [isOpen, setIsOpen] = useState(true);

    const toggleOpen = () => {
      setIsOpen(prev => !prev);
    };

    // Preprocess main content, escape custom HTML tags to avoid browser parsing errors
    // Uses same processing logic as Think Block Content
    const preprocessMainContent = (content: string): string => {
      // Key fix: Ensure details tags have enough blank lines after them to separate markdown content
      // This prevents rehypeRaw plugin from affecting subsequent markdown parsing
      let processedContent = content
        // Ensure details closing tag has two newlines after it
        .replace(/(<\/details>)(\s*)([^\s])/g, '$1\n\n$3')
        // Ensure details opening tag has newline before it (if there's content before)
        .replace(/([^\n])(\s*)(<details[^>]*>)/g, '$1\n\n$3');

      // Define whitelist of known safe HTML tags
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

      // Escape HTML tags not in whitelist, make them display as text
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

    const mainMarkdownComponents: Components = {
      // Use atomic components to render code blocks and inline code
      code({ node, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : null;

        if (node.position?.start.line !== node.position?.end.line || language) {
          // Multi-line code or specified language -> code block
          // Pass AssistantMessage's isStreaming prop to CodeBlock
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
        // Single line code -> inline code
        return <InlineCode {...props}>{children}</InlineCode>;
      },

      // Use atomic components to render table container, define modern th and td styles directly here
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
              isDark ? 'border-gray-600' : 'border-gray-300'
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
      a({ children, href, node, ...props }: any) {
        // Ensure href is string type
        const linkUrl = typeof href === 'string' ? href : '';

        // Image link handling: if link contains image, render as image link
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

          const imageSrc = (imageChild?.props as any)?.src || linkUrl;
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

        // Regular link handling
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
      // Image handling: Render images as links to avoid loading jitter issues
      // If image is inside a link, handled by a component uniformly, return null here to avoid duplicate rendering
      img({ src, alt, node, ...props }: any) {
        // Ensure src is string type
        const imageUrl = typeof src === 'string' ? src : '';

        // Check if inside a link (handled by parent a component)
        const isInsideLink = node?.parent?.tagName === 'a';

        if (isInsideLink) {
          // If inside a link, return null, handled by parent a component
          return null;
        }

        // Independent image, create image link
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
          /**
           * Assistant message main content area style configuration
           *
           * New streaming rendering support:
           * - Uses StreamingMarkdown component for smooth typewriter effect
           * - Maintains original Markdown rendering capabilities and styles
           * - Automatically switches rendering modes based on isStreaming state
           */
          <div
            className={cn(
              'markdown-body main-content-area assistant-message-content w-full text-base',
              isDark ? 'text-stone-200' : 'text-stone-800', // Switch text color based on theme for consistency
              !hasThinkBlock ? 'py-2' : 'pt-1 pb-2' // Adjust vertical spacing based on think block presence
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

            {/* Reference sources and attribution component */}
            <ReferenceSources
              retrieverResources={
                metadata?.dify_retriever_resources ||
                metadata?.dify_metadata?.retriever_resources
              }
              isDark={isDark}
              className="mt-4 mb-2"
              animationDelay={isStreaming ? 0 : 300} // Delay 300ms display after streaming response ends
            />

            {/* Assistant message action buttons - Add -ml-2 for left alignment, adjust spacing */}
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
              } // Will modify feedback functionality later
              isRegenerating={isStreaming}
              className={cn(
                '-ml-2',
                // Adjust button top margin based on reference presence
                (
                  metadata?.dify_retriever_resources ||
                  metadata?.dify_metadata?.retriever_resources
                )?.length > 0
                  ? 'mt-0' // Normal spacing when references exist
                  : '-mt-4' // Maintain original negative spacing when no references
              )}
            />
          </div>
        )}
      </div>
    );
  }
);

// Add displayName property for React DevTools debugging
AssistantMessage.displayName = 'AssistantMessage';
