'use client';

import { useTheme } from '@lib/hooks/use-theme';
import type {
  ChatflowNode,
  ChatflowParallelBranch,
} from '@lib/stores/chatflow-execution-store';
import { useChatflowExecutionStore } from '@lib/stores/chatflow-execution-store';
import { cn } from '@lib/utils';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  GitBranch,
  Loader2,
  XCircle,
} from 'lucide-react';

import React, { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

interface ChatflowExecutionBarProps {
  node: ChatflowNode;
  index: number;
  delay?: number;
}

/**
 * Chatflow execution bar component - display long bar with node execution information
 *
 * Features:
 * - fade-in animation
 * - left status icon (spinner/completed/failed)
 * - middle display node name and status description
 * - right display execution time
 * - Adapt to chatflow visual style
 * - Temporary UI, disappear after refresh
 */
export function ChatflowExecutionBar({
  node,
  index,
  delay = 0,
}: ChatflowExecutionBarProps) {
  const { isDark } = useTheme();
  const t = useTranslations('pages.chatflow.executionBar');
  const [isVisible, setIsVisible] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 🎯 Use the expanded state in the store
  const {
    iterationExpandedStates,
    loopExpandedStates,
    toggleIterationExpanded,
    toggleLoopExpanded,
  } = useChatflowExecutionStore();
  const isExpanded =
    (node.isIterationNode
      ? iterationExpandedStates[node.id]
      : node.isLoopNode
        ? loopExpandedStates[node.id]
        : false) || false;

  // --- Delay display animation ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  // --- Timer ---
  useEffect(() => {
    if (node.status === 'running' && node.startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - node.startTime!);
      }, 100);

      return () => clearInterval(interval);
    } else if (node.status === 'completed' && node.startTime && node.endTime) {
      setElapsedTime(node.endTime - node.startTime);
    }
  }, [node.status, node.startTime, node.endTime]);

  // --- Automatic expansion logic has been moved to the iteration_started event handling in the store ---

  // --- 🎯 Debug: Listen to node changes ---
  useEffect(() => {
    if (node.isIterationNode) {
      console.log('[ChatflowExecutionBar] 🔍 Iteration node status updated:', {
        id: node.id,
        title: node.title,
        isIterationNode: node.isIterationNode,
        totalIterations: node.totalIterations,
        currentIteration: node.currentIteration,
        iterationsCount: node.iterations?.length || 0,
        status: node.status,
      });
    }
  }, [node]);

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  const getStatusIcon = () => {
    switch (node.status) {
      case 'running':
        return (
          <Loader2
            className={cn(
              'h-4 w-4 animate-spin',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          />
        );
      case 'completed':
        return (
          <CheckCircle
            className={cn(
              'h-4 w-4',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          />
        );
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return (
          <Clock
            className={cn(
              'h-4 w-4',
              isDark ? 'text-stone-500' : 'text-stone-400'
            )}
          />
        );
      default:
        return (
          <AlertCircle
            className={cn(
              'h-4 w-4',
              isDark ? 'text-stone-500' : 'text-stone-400'
            )}
          />
        );
    }
  };

  const getStatusText = () => {
    // 🎯 All status texts are unified to 4 characters, maintaining alignment
    if (node.isIterationNode) {
      switch (node.status) {
        case 'running':
          return t('status.iterating');
        case 'completed':
          return t('status.iterationCompleted');
        case 'failed':
          return t('status.iterationFailed');
        default:
          return t('status.waitingIteration');
      }
    }

    if (node.isLoopNode) {
      switch (node.status) {
        case 'running':
          return t('status.looping');
        case 'completed':
          return t('status.loopCompleted');
        case 'failed':
          return t('status.loopFailed');
        default:
          return t('status.waitingLoop');
      }
    }

    switch (node.status) {
      case 'running':
        return t('status.executing');
      case 'completed':
        return t('status.completed');
      case 'failed':
        return t('status.failed');
      case 'pending':
        return t('status.waiting');
      default:
        return t('status.unknown');
    }
  };

  const getNodeTitle = () => {
    // Return friendly name based on node type
    switch (node.type) {
      case 'start':
        return t('nodeTypes.start');
      case 'llm':
        return t('nodeTypes.llm');
      case 'knowledge-retrieval':
        return t('nodeTypes.knowledgeRetrieval');
      case 'question-classifier':
        return t('nodeTypes.questionClassifier');
      case 'if-else':
        return t('nodeTypes.ifElse');
      case 'code':
        return t('nodeTypes.code');
      case 'template-transform':
        return t('nodeTypes.templateTransform');
      case 'variable-assigner':
        return t('nodeTypes.variableAssigner');
      case 'variable-aggregator':
        return t('nodeTypes.variableAggregator');
      case 'document-extractor':
        return t('nodeTypes.documentExtractor');
      case 'parameter-extractor':
        return t('nodeTypes.parameterExtractor');
      case 'http-request':
        return t('nodeTypes.httpRequest');
      case 'list-operator':
        return t('nodeTypes.listOperator');
      case 'iteration':
      case 'loop':
        return t('nodeTypes.iteration');
      case 'end':
        return t('nodeTypes.end');
      default:
        return node.title || `${t('nodeTypes.node')} ${index + 1}`;
    }
  };

  // --- Remove node type icon, keep the original text display ---

  const getBarStyles = () => {
    const baseStyles = cn(
      'flex items-center gap-3 rounded-md border px-3 py-2 transition-all duration-300', // 🎯 Restore thin bar style
      'transform font-serif',
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
    );

    // 🎯 Optimization: Iteration/loop nodes use left indicator bar + connection point design, providing clear hierarchical visual indicators
    const nestedStyles =
      node.isInIteration || node.isInLoop
        ? cn(
            'relative ml-6 pl-4',
            // Use new indicator bar style
            node.isInIteration ? 'iteration-node' : 'loop-node',
            // Slight background color distinction
            isDark ? 'bg-stone-800/20' : 'bg-stone-50/40'
          )
        : '';

    const combinedBaseStyles = cn(baseStyles, nestedStyles);

    switch (node.status) {
      case 'running':
        return cn(
          combinedBaseStyles,
          isDark
            ? 'border-stone-600 bg-stone-700/50 shadow-lg shadow-stone-900/30'
            : 'border-stone-300 bg-stone-200/50 shadow-lg shadow-stone-200/50'
        );
      case 'completed':
        return cn(
          combinedBaseStyles,
          isDark
            ? 'border-stone-500 bg-stone-600/30'
            : 'border-stone-300 bg-stone-100'
        );
      case 'failed':
        return cn(
          combinedBaseStyles,
          isDark
            ? 'border-red-700/50 bg-red-900/20'
            : 'border-red-200 bg-red-50'
        );
      case 'pending':
        return cn(
          combinedBaseStyles,
          isDark
            ? 'border-stone-700/50 bg-stone-800/50'
            : 'border-stone-200 bg-stone-50'
        );
      default:
        return cn(
          combinedBaseStyles,
          isDark
            ? 'border-stone-700/50 bg-stone-800/50'
            : 'border-stone-200 bg-stone-50'
        );
    }
  };

  return (
    <div className="space-y-1">
      <div
        className={cn(
          getBarStyles(),
          // 🎯 All bars have hover effect, only iteration, parallel branch and loop nodes have cursor pointer
          'transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
          (node.isIterationNode || node.isParallelNode || node.isLoopNode) &&
            'cursor-pointer'
        )}
        onClick={
          node.isIterationNode || node.isParallelNode || node.isLoopNode
            ? () => {
                if (node.isIterationNode) {
                  toggleIterationExpanded(node.id);
                } else if (node.isLoopNode) {
                  toggleLoopExpanded(node.id);
                }
              }
            : undefined
        }
      >
        {/* Left: status icon */}
        <div className="flex-shrink-0">{getStatusIcon()}</div>

        {/* Middle: node information - compact layout */}
        <div className="min-w-0 flex-1">
          {/* Node title and status on the same line */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'flex-1 truncate font-serif text-sm font-medium',
                isDark ? 'text-stone-200' : 'text-stone-800'
              )}
            >
              {getNodeTitle()}
            </span>

            {/* Status label - simplified display */}
            <div className="flex flex-shrink-0 items-center gap-1">
              {/* Iteration/parallel branch/loop count */}
              {node.isIterationNode && node.totalIterations && (
                <span
                  className={cn(
                    'rounded bg-stone-200 px-1.5 py-0.5 text-xs text-stone-700',
                    isDark && 'bg-stone-700/50 text-stone-300'
                  )}
                >
                  {(node.currentIteration || 0) + 1}/{node.totalIterations}
                </span>
              )}
              {node.isParallelNode && node.totalBranches && (
                <span
                  className={cn(
                    'rounded bg-stone-200 px-1.5 py-0.5 text-xs text-stone-700',
                    isDark && 'bg-stone-700/50 text-stone-300'
                  )}
                >
                  {node.completedBranches || 0}/{node.totalBranches}
                </span>
              )}
              {node.isLoopNode && (
                <span
                  className={cn(
                    'rounded bg-stone-200 px-1.5 py-0.5 text-xs text-stone-700',
                    isDark && 'bg-stone-700/50 text-stone-300'
                  )}
                >
                  {node.maxLoops
                    ? `${(node.currentLoop || 0) + 1}/${node.maxLoops}`
                    : `${(node.currentLoop || 0) + 1}`}
                </span>
              )}

              <span
                className={cn(
                  'rounded px-1.5 py-0.5 font-serif text-xs transition-all duration-300',
                  node.status === 'running'
                    ? cn(
                        // Base style
                        isDark
                          ? 'bg-stone-600/40 text-stone-200'
                          : 'bg-stone-300/60 text-stone-700',
                        // Subtle pulse effect
                        'animate-pulse'
                      )
                    : node.status === 'completed'
                      ? isDark
                        ? 'bg-stone-500/40 text-stone-100'
                        : 'bg-stone-200 text-stone-800'
                      : node.status === 'failed'
                        ? isDark
                          ? 'bg-red-700/30 text-red-200'
                          : 'bg-red-100 text-red-700'
                        : isDark
                          ? 'bg-stone-700/50 text-stone-400'
                          : 'bg-stone-200/80 text-stone-600'
                )}
              >
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>

        {/* Right: timing information - more compact */}
        <div className="w-12 flex-shrink-0 text-right">
          {(node.status === 'running' || node.status === 'completed') &&
            elapsedTime > 0 && (
              <div
                className={cn(
                  'font-serif text-xs',
                  isDark ? 'text-stone-400' : 'text-stone-500'
                )}
              >
                {formatTime(elapsedTime)}
              </div>
            )}
        </div>
      </div>

      {/* 🎯 Expand state explanation: expand/collapse controls the display of child nodes in iteration */}
      {/* The actual child node display is controlled by the parent component based on the isExpanded state */}

      {/* 🎯 New: expanded parallel branch list */}
      <CollapsibleContent
        isExpanded={isExpanded}
        show={
          !!(
            node.isParallelNode &&
            node.parallelBranches &&
            node.parallelBranches.length > 0
          )
        }
      >
        <div className="ml-4 space-y-2">
          {/* Parallel branch progress bar */}
          {node.totalBranches && (
            <div className="px-3 py-2">
              <ProgressBar
                current={node.completedBranches || 0}
                total={node.totalBranches}
                type="branch"
                isDark={isDark}
              />
            </div>
          )}

          {/* Branch list */}
          <div className="space-y-1">
            {node.parallelBranches?.map(branch => (
              <ParallelBranchItem
                key={branch.id}
                branch={branch}
                isDark={isDark}
              />
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </div>
  );
}

// --- 🎯 New: collapsible content component with exit animation ---
interface CollapsibleContentProps {
  isExpanded: boolean;
  show: boolean;
  children: React.ReactNode;
}

function CollapsibleContent({
  isExpanded,
  show,
  children,
}: CollapsibleContentProps) {
  // 🎯 Simplify: only render when expanded, disappear immediately when closed
  if (!show || !isExpanded) {
    return null;
  }

  return (
    <div className="animate-in slide-in-from-top-2 fade-in duration-250">
      {children}
    </div>
  );
}

// --- Iteration item component has been removed, replaced with simplified expanded information display ---

// --- 🎯 New: parallel branch item component ---
interface ParallelBranchItemProps {
  branch: ChatflowParallelBranch;
  isDark: boolean;
}

function ParallelBranchItem({ branch, isDark }: ParallelBranchItemProps) {
  const t = useTranslations('pages.chatflow.executionBar');
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (branch.status === 'running' && branch.startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - branch.startTime);
      }, 100);
      return () => clearInterval(interval);
    } else if (
      branch.status === 'completed' &&
      branch.startTime &&
      branch.endTime
    ) {
      setElapsedTime(branch.endTime - branch.startTime);
    }
  }, [branch.status, branch.startTime, branch.endTime]);

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  const getBranchIcon = () => {
    switch (branch.status) {
      case 'running':
        return <Loader2 className="h-3 w-3 animate-spin text-stone-500" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-stone-600" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-stone-400" />;
    }
  };

  return (
    <div
      className={cn(
        'ml-4 flex items-center gap-2 rounded-md border-l-2 px-3 py-2 font-serif',
        branch.status === 'running' &&
          cn('border-l-stone-400', isDark ? 'bg-stone-800/20' : 'bg-stone-100'),
        branch.status === 'completed' &&
          cn('border-l-stone-500', isDark ? 'bg-stone-700/20' : 'bg-stone-50'),
        branch.status === 'failed' &&
          cn('border-l-red-500', isDark ? 'bg-red-900/20' : 'bg-red-50'),
        branch.status === 'pending' &&
          cn('border-l-stone-300', isDark ? 'bg-stone-800/20' : 'bg-stone-50')
      )}
    >
      <div className="flex-shrink-0">
        <GitBranch className="mr-1 h-3 w-3" />
        {getBranchIcon()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium',
              isDark ? 'text-stone-200' : 'text-stone-800'
            )}
          >
            {t('branch.label')} {String.fromCharCode(65 + branch.index)}
          </span>
          <span
            className={cn(
              'text-xs',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          >
            {branch.description || t('status.executing_')}
          </span>
        </div>
      </div>

      <div className="w-12 flex-shrink-0 text-right">
        {' '}
        {/* 🎯 Fixed width to avoid jitter */}
        {elapsedTime > 0 && (
          <span
            className={cn(
              'font-serif text-xs',
              isDark ? 'text-stone-400' : 'text-stone-500'
            )}
          >
            {formatTime(elapsedTime)}
          </span>
        )}
      </div>
    </div>
  );
}

// --- 🎯 New: progress bar component ---
interface ProgressBarProps {
  current: number;
  total: number;
  type: 'iteration' | 'branch';
  isDark: boolean;
}

function ProgressBar({ current, total, type, isDark }: ProgressBarProps) {
  const t = useTranslations('pages.chatflow.executionBar');
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between">
        <span
          className={cn(
            'font-serif text-xs font-medium',
            isDark ? 'text-stone-300' : 'text-stone-700'
          )}
        >
          {type === 'iteration'
            ? t('progressType.iteration')
            : t('progressType.branch')}
        </span>
        <span
          className={cn(
            'font-serif text-xs',
            isDark ? 'text-stone-400' : 'text-stone-500'
          )}
        >
          {current}/{total}
        </span>
      </div>

      <div
        className={cn(
          'h-2 w-full overflow-hidden rounded-full',
          isDark ? 'bg-stone-700' : 'bg-stone-200'
        )}
      >
        <div
          className={cn(
            'chatflow-progress-bar h-full rounded-full transition-all duration-500 ease-out',
            'bg-gradient-to-r from-stone-400 to-stone-500' // 🎯 Use stone color system
          )}
          style={
            {
              width: `${percentage}%`,
              '--progress-width': `${percentage}%`,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}
