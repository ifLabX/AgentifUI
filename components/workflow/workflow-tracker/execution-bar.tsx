'use client';

import type {
  WorkflowIteration,
  WorkflowLoop,
  WorkflowNode,
  WorkflowParallelBranch,
} from '@lib/stores/workflow-execution-store';
import { useWorkflowExecutionStore } from '@lib/stores/workflow-execution-store';
import { cn } from '@lib/utils';
import { CheckCircle, Clock, Loader2, Search, XCircle } from 'lucide-react';

import React, { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

interface ExecutionBarProps {
  node: WorkflowNode;
  index: number;
  delay?: number;
}

/**
 * Workflow execution bar component - supports fine-grained display of iterations and parallel branches
 *
 * Features:
 * - fade-in animation
 * - Left node type icon
 * - Middle display node information and status
 * - Right display timing information
 * - Support iteration expansion/collapse
 * - Support parallel branch display
 * - Hover effect and interaction
 */
export function ExecutionBar({ node, index, delay = 0 }: ExecutionBarProps) {
  const t = useTranslations('pages.workflow.nodeStatus');
  const tTypes = useTranslations('pages.workflow.nodeTypes');
  const tDetails = useTranslations('pages.workflow.iterationDetails');
  const [isVisible, setIsVisible] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 🎯 Use the expanded state and actions in the store
  const {
    iterationExpandedStates,
    loopExpandedStates,
    toggleIterationExpanded,
    toggleLoopExpanded,
  } = useWorkflowExecutionStore();

  const isExpanded =
    (node.isIterationNode && iterationExpandedStates[node.id]) ||
    (node.isLoopNode && loopExpandedStates[node.id]) ||
    false;

  // Delay display animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  // Timer
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

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  const getStatusIcon = () => {
    // 🎯 Keep workflow UI consistency: only use two icons - magnifying glass and spinner
    const getSimpleIcon = () => {
      if (node.status === 'running') {
        return <Loader2 className="h-4 w-4 animate-spin" />;
      }
      return <Search className="h-4 w-4" />;
    };

    const icon = getSimpleIcon();

    // Set color based on status
    const colorClass =
      node.status === 'running'
        ? 'text-stone-600 dark:text-stone-400'
        : node.status === 'completed'
          ? 'text-stone-600 dark:text-stone-400'
          : node.status === 'failed'
            ? 'text-red-500'
            : 'text-stone-400 dark:text-stone-500';

    return <div className={cn(colorClass)}>{icon}</div>;
  };

  const getStatusText = () => {
    // 🎯 Iteration node displays special status text
    if (node.isIterationNode) {
      switch (node.status) {
        case 'running':
          return t('iterating');
        case 'completed':
          return t('iterationCompleted');
        case 'failed':
          return t('iterationFailed');
        default:
          return t('waitingIteration');
      }
    }

    // 🎯 Loop node displays special status text
    if (node.isLoopNode) {
      switch (node.status) {
        case 'running':
          return t('looping');
        case 'completed':
          return t('loopCompleted');
        case 'failed':
          return t('loopFailed');
        default:
          return t('waitingLoop');
      }
    }

    // 🎯 Parallel branch node displays special status text
    if (node.isParallelNode) {
      switch (node.status) {
        case 'running':
          return t('parallelRunning');
        case 'completed':
          return t('parallelCompleted');
        case 'failed':
          return t('parallelFailed');
        default:
          return t('waitingParallel');
      }
    }

    switch (node.status) {
      case 'running':
        return node.description || t('executing');
      case 'completed':
        return t('nodeCompleted');
      case 'failed':
        return t('nodeFailed');
      case 'pending':
        return t('nodePending');
      default:
        return t('nodeUnknown');
    }
  };

  const getNodeTitle = () => {
    // Return friendly Chinese name based on node type
    switch (node.type) {
      case 'start':
        return tTypes('start');
      case 'llm':
        return tTypes('llm');
      case 'knowledge-retrieval':
        return tTypes('knowledgeRetrieval');
      case 'question-classifier':
        return tTypes('questionClassifier');
      case 'if-else':
        return tTypes('ifElse');
      case 'code':
        return tTypes('code');
      case 'template-transform':
        return tTypes('templateTransform');
      case 'variable-assigner':
        return tTypes('variableAssigner');
      case 'variable-aggregator':
        return tTypes('variableAggregator');
      case 'document-extractor':
        return tTypes('documentExtractor');
      case 'parameter-extractor':
        return tTypes('parameterExtractor');
      case 'http-request':
        return tTypes('httpRequest');
      case 'list-operator':
        return tTypes('listOperator');
      case 'iteration':
      case 'loop':
        return tTypes('iteration');
      case 'parallel':
        return tTypes('parallel');
      case 'end':
        return tTypes('end');
      default:
        return node.title || tDetails('nodeNumber', { number: index + 1 });
    }
  };

  const getBarStyles = () => {
    const baseStyles = cn(
      // 🎯 Keep workflow original style: thin bar style + hover effect
      'flex items-center gap-3 rounded-md border px-3 py-2 transition-all duration-300',
      'transform font-serif',
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
    );

    // 🎯 Key fix: nodes in iteration/loop use left indicator bar + connection point design, providing clear hierarchical visual indicators
    const nestedStyles =
      node.isInIteration || node.isInLoop
        ? cn(
            'relative ml-6 pl-4',
            // Use the corresponding indicator bar style
            node.isInIteration ? 'iteration-node' : 'loop-node',
            // Slight background color distinction
            'bg-stone-50/40 dark:bg-stone-800/20'
          )
        : '';

    const combinedBaseStyles = cn(baseStyles, nestedStyles);

    switch (node.status) {
      case 'running':
        return cn(
          combinedBaseStyles,
          'border-stone-300 bg-stone-200/50 shadow-lg shadow-stone-200/50 dark:border-stone-600 dark:bg-stone-700/50 dark:shadow-stone-900/30'
        );
      case 'completed':
        return cn(
          combinedBaseStyles,
          'border-stone-300 bg-stone-100 dark:border-stone-500 dark:bg-stone-600/30'
        );
      case 'failed':
        return cn(
          combinedBaseStyles,
          'border-red-200 bg-red-50 dark:border-red-700/50 dark:bg-red-900/20'
        );
      case 'pending':
        return cn(
          combinedBaseStyles,
          'border-stone-200 bg-stone-50 dark:border-stone-700/50 dark:bg-stone-800/50'
        );
      default:
        return cn(
          combinedBaseStyles,
          'border-stone-200 bg-stone-50 dark:border-stone-700/50 dark:bg-stone-800/50'
        );
    }
  };

  return (
    <div className="space-y-1">
      <div
        className={cn(
          getBarStyles(),
          // 🎯 All bars have hover effect, only iteration, loop and parallel branch nodes have cursor pointer
          'transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
          (node.isIterationNode || node.isLoopNode || node.isParallelNode) &&
            'cursor-pointer'
        )}
        onClick={
          node.isIterationNode || node.isLoopNode || node.isParallelNode
            ? () => {
                if (node.isIterationNode) {
                  toggleIterationExpanded(node.id);
                } else if (node.isLoopNode) {
                  toggleLoopExpanded(node.id);
                } else if (node.isParallelNode) {
                  toggleIterationExpanded(node.id); // Parallel branch temporarily uses iteration expanded state
                }
              }
            : undefined
        }
      >
        {/* Left: status icon */}
        <div className="flex-shrink-0">{getStatusIcon()}</div>

        {/* Middle: node information */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Node title row */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className={cn(
                  'truncate font-serif text-sm font-medium',
                  'text-stone-800 dark:text-stone-200'
                )}
              >
                {getNodeTitle()}
              </span>
            </div>

            {/* 🎯 Status label row - move right a little bit to align "execution completed" */}
            <div className="ml-8 flex flex-shrink-0 items-center gap-2">
              {/* Iteration count display - display when adding 1, starting from 1 */}
              {node.isIterationNode && node.totalIterations && (
                <span
                  className={cn(
                    'rounded-full bg-stone-200 px-2 py-0.5 font-serif text-xs text-stone-700',
                    'dark:bg-stone-700/50 dark:text-stone-300'
                  )}
                >
                  {(node.currentIteration || 0) + 1}/{node.totalIterations}
                </span>
              )}

              {/* 🎯 Loop count display - display when adding 1, starting from 1 */}
              {node.isLoopNode && node.maxLoops && (
                <span
                  className={cn(
                    'rounded-full bg-stone-200 px-2 py-0.5 font-serif text-xs text-stone-700',
                    'dark:bg-stone-700/50 dark:text-stone-300'
                  )}
                >
                  {(node.currentLoop || 0) + 1}/{node.maxLoops}
                </span>
              )}

              {/* Parallel branch progress indicator */}
              {node.isParallelNode && node.totalBranches && (
                <span
                  className={cn(
                    'rounded-full bg-stone-200 px-2 py-0.5 font-serif text-xs text-stone-700',
                    'dark:bg-stone-700/50 dark:text-stone-300'
                  )}
                >
                  {node.completedBranches || 0}/{node.totalBranches}
                </span>
              )}

              <span
                className={cn(
                  'rounded-full px-2 py-0.5 font-serif text-xs',
                  node.status === 'running'
                    ? 'bg-stone-300/60 text-stone-700 dark:bg-stone-600/40 dark:text-stone-200'
                    : node.status === 'completed'
                      ? 'bg-stone-200 text-stone-800 dark:bg-stone-500/40 dark:text-stone-100'
                      : node.status === 'failed'
                        ? 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200'
                        : 'bg-stone-200/80 text-stone-600 dark:bg-stone-700/50 dark:text-stone-400'
                )}
              >
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>

        {/* Right: timing information */}
        <div className="w-16 flex-shrink-0 text-right">
          {(node.status === 'running' || node.status === 'completed') &&
            elapsedTime > 0 && (
              <div
                className={cn(
                  'font-serif text-xs',
                  'text-stone-500 dark:text-stone-400'
                )}
              >
                {formatTime(elapsedTime)}
              </div>
            )}
        </div>
      </div>

      {/* 🎯 Iteration detail expansion area */}
      {node.isIterationNode && node.iterations && isExpanded && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-250">
          {node.iterations.map((iteration, iterIndex) => (
            <div
              key={iteration.id}
              className={cn(
                'iteration-node relative ml-6 pl-4',
                'bg-stone-50/30 dark:bg-stone-800/30',
                'flex items-center gap-3 rounded-md border px-3 py-2 font-serif transition-all duration-300',
                iteration.status === 'running'
                  ? 'border-stone-300 bg-stone-200/50 dark:border-stone-600 dark:bg-stone-700/50'
                  : 'border-stone-300 bg-stone-100 dark:border-stone-500 dark:bg-stone-600/30'
              )}
            >
              <div className="flex-shrink-0">
                {iteration.status === 'running' ? (
                  <Loader2
                    className={cn(
                      'h-3 w-3 animate-spin',
                      'text-stone-600 dark:text-stone-400'
                    )}
                  />
                ) : iteration.status === 'completed' ? (
                  <CheckCircle
                    className={cn(
                      'h-3 w-3',
                      'text-stone-600 dark:text-stone-400'
                    )}
                  />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span
                  className={cn(
                    'font-serif text-sm',
                    'text-stone-800 dark:text-stone-200'
                  )}
                >
                  {tDetails('roundIteration', { round: iteration.index + 1 })}
                </span>
              </div>

              <div className="flex-shrink-0">
                {iteration.endTime && iteration.startTime && (
                  <span
                    className={cn(
                      'font-serif text-xs',
                      'text-stone-500 dark:text-stone-400'
                    )}
                  >
                    {formatTime(iteration.endTime - iteration.startTime)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🎯 Loop detail expansion area */}
      {node.isLoopNode && node.loops && isExpanded && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-250">
          {node.loops.map((loop, loopIndex) => (
            <div
              key={loop.id}
              className={cn(
                'loop-node relative ml-6 pl-4',
                'bg-stone-50/30 dark:bg-stone-800/30',
                'flex items-center gap-3 rounded-md border px-3 py-2 font-serif transition-all duration-300',
                loop.status === 'running'
                  ? 'border-stone-300 bg-stone-200/50 dark:border-stone-600 dark:bg-stone-700/50'
                  : 'border-stone-300 bg-stone-100 dark:border-stone-500 dark:bg-stone-600/30'
              )}
            >
              <div className="flex-shrink-0">
                {loop.status === 'running' ? (
                  <Loader2
                    className={cn(
                      'h-3 w-3 animate-spin',
                      'text-stone-600 dark:text-stone-400'
                    )}
                  />
                ) : loop.status === 'completed' ? (
                  <CheckCircle
                    className={cn(
                      'h-3 w-3',
                      'text-stone-600 dark:text-stone-400'
                    )}
                  />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span
                  className={cn(
                    'font-serif text-sm',
                    'text-stone-800 dark:text-stone-200'
                  )}
                >
                  {tDetails('roundLoop', { round: loop.index + 1 })}
                </span>
              </div>

              <div className="flex-shrink-0">
                {loop.endTime && loop.startTime && (
                  <span
                    className={cn(
                      'font-serif text-xs',
                      'text-stone-500 dark:text-stone-400'
                    )}
                  >
                    {formatTime(loop.endTime - loop.startTime)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🎯 Parallel branch detail expansion area */}
      {node.isParallelNode && node.parallelBranches && isExpanded && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-250">
          {node.parallelBranches.map((branch, branchIndex) => (
            <div
              key={branch.id}
              className={cn(
                'iteration-node relative ml-6 pl-4',
                'bg-stone-50/30 dark:bg-stone-800/30',
                'flex items-center gap-3 rounded-md border px-3 py-2 font-serif transition-all duration-300',
                branch.status === 'running'
                  ? 'border-stone-300 bg-stone-200/50 dark:border-stone-600 dark:bg-stone-700/50'
                  : 'border-stone-300 bg-stone-100 dark:border-stone-500 dark:bg-stone-600/30'
              )}
            >
              <div className="flex-shrink-0">
                {branch.status === 'running' ? (
                  <Loader2
                    className={cn(
                      'h-3 w-3 animate-spin',
                      'text-stone-600 dark:text-stone-400'
                    )}
                  />
                ) : branch.status === 'completed' ? (
                  <CheckCircle
                    className={cn(
                      'h-3 w-3',
                      'text-stone-600 dark:text-stone-400'
                    )}
                  />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span
                  className={cn(
                    'font-serif text-sm',
                    'text-stone-800 dark:text-stone-200'
                  )}
                >
                  {branch.name}
                </span>
              </div>

              <div className="flex-shrink-0">
                {branch.endTime && branch.startTime && (
                  <span
                    className={cn(
                      'font-serif text-xs',
                      'text-stone-500 dark:text-stone-400'
                    )}
                  >
                    {formatTime(branch.endTime - branch.startTime)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
