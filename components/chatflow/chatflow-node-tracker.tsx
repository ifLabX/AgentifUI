'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { useChatflowExecutionStore } from '@lib/stores/chatflow-execution-store';
import { cn } from '@lib/utils';
import { Loader2, Workflow } from 'lucide-react';

import React from 'react';

import { useTranslations } from 'next-intl';

import { ChatflowExecutionBar } from './chatflow-execution-bar';

interface ChatflowNodeTrackerProps {
  isVisible: boolean;
  className?: string;
}

/**
 * Chatflow node tracker component
 *
 * Features:
 * - Display node progress during chatflow execution
 * - Real-time update of node status
 * - Fade-in animation display
 * - Temporary UI, disappear after refresh
 * - Does not affect normal streaming response
 */
export function ChatflowNodeTracker({
  isVisible,
  className,
}: ChatflowNodeTrackerProps) {
  const { isDark } = useTheme();
  const t = useTranslations('pages.chatflow.nodeTracker');

  // Get node status from store
  const nodes = useChatflowExecutionStore(state => state.nodes);
  const isExecuting = useChatflowExecutionStore(state => state.isExecuting);
  const error = useChatflowExecutionStore(state => state.error);
  const iterationExpandedStates = useChatflowExecutionStore(
    state => state.iterationExpandedStates
  );
  const loopExpandedStates = useChatflowExecutionStore(
    state => state.loopExpandedStates
  );

  // 🎯 Filter and group nodes: control node display in iteration/loop based on expansion state
  const getVisibleNodes = () => {
    const visibleNodes = [];

    for (const node of nodes) {
      // 🎯 Fix: container nodes (iteration/loop/parallel branch) always display
      if (node.isIterationNode || node.isLoopNode || node.isParallelNode) {
        visibleNodes.push(node);
      }
      // Non-nested nodes always display
      else if (!node.isInIteration && !node.isInLoop) {
        visibleNodes.push(node);
      }
      // Sub-nodes in iteration: determine whether to display based on container expansion state
      else if (node.isInIteration) {
        // Nodes in iteration: need to find the corresponding iteration container node
        const iterationNode = nodes.find(
          n =>
            n.isIterationNode &&
            n.id !== node.id &&
            // Simple judgment: if the iteration node is before the current node, it is considered to be its container
            nodes.indexOf(n) < nodes.indexOf(node)
        );

        // If the iteration container node is found and expanded, display the node in this iteration
        if (iterationNode && iterationExpandedStates[iterationNode.id]) {
          visibleNodes.push(node);
        }
      }
      // Sub-nodes in loop: determine whether to display based on container expansion state
      else if (node.isInLoop) {
        // Nodes in loop: need to find the corresponding loop container node
        const loopNode = nodes.find(
          n =>
            n.isLoopNode &&
            n.id !== node.id &&
            // Simple judgment: if the loop node is before the current node, it is considered to be its container
            nodes.indexOf(n) < nodes.indexOf(node)
        );

        // If the loop container node is found and expanded, display the node in this loop
        if (loopNode && loopExpandedStates[loopNode.id]) {
          visibleNodes.push(node);
        }
      }
    }

    return visibleNodes;
  };

  const visibleNodes = getVisibleNodes();

  // If not visible, do not display
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'transform transition-all duration-300',
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
        className
      )}
    >
      <div
        className={cn(
          'space-y-3 rounded-lg border p-4',
          // Limit actual width to avoid conflict with chat content
          'max-w-[320px] min-w-[280px]',
          isDark
            ? 'border-stone-700/50 bg-stone-800/50 backdrop-blur-sm'
            : 'border-stone-200 bg-white/80 backdrop-blur-sm'
        )}
      >
        {/* Title bar */}
        <div
          className={cn(
            'flex items-center gap-2 border-b pb-2',
            isDark ? 'border-stone-700/50' : 'border-stone-200/50'
          )}
        >
          <Workflow
            className={cn(
              'h-4 w-4',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          />
          <span
            className={cn(
              'font-serif text-sm font-medium',
              isDark ? 'text-stone-200' : 'text-stone-800'
            )}
          >
            {t('title')}
          </span>
        </div>

        {/* Node list */}
        <div className="relative space-y-2">
          {' '}
          {/* 🎯 Add relative for vertical line positioning */}
          {nodes.length === 0 ? (
            // Display when there is no node data
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg border-2 border-dashed px-4 py-3',
                isDark
                  ? 'border-stone-600 bg-stone-800/30'
                  : 'border-stone-300 bg-stone-50'
              )}
            >
              {isExecuting ? (
                <Loader2
                  className={cn(
                    'h-4 w-4 animate-spin',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                />
              ) : (
                <Workflow
                  className={cn(
                    'h-4 w-4',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                />
              )}
              <div>
                <div
                  className={cn(
                    'font-serif text-sm font-medium',
                    isDark ? 'text-stone-200' : 'text-stone-800'
                  )}
                >
                  {isExecuting ? t('starting') : t('noRecords')}
                </div>
                <div
                  className={cn(
                    'font-serif text-xs',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                >
                  {isExecuting ? t('waitingUpdate') : t('showProgress')}
                </div>
              </div>
            </div>
          ) : (
            // 🎯 Display filtered node list
            visibleNodes.map((node, index) => (
              <ChatflowExecutionBar
                key={node.id}
                node={node}
                index={index}
                delay={index * 150} // Each bar appears after a delay of 150ms
              />
            ))
          )}
        </div>

        {/* Error information */}
        {error && (
          <div
            className={cn(
              'mt-3 rounded-lg border p-3',
              isDark
                ? 'border-red-700/50 bg-red-900/20 text-red-200'
                : 'border-red-200 bg-red-50 text-red-700'
            )}
          >
            <div className="font-serif text-sm">
              <strong>{t('executionError')}</strong> {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
