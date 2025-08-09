'use client';

import { ResizableSplitPane } from '@components/ui/resizable-split-pane';
import { MobileTabSwitcher } from '@components/workflow/mobile-tab-switcher';
import { useMobile } from '@lib/hooks/use-mobile';
import { useTheme } from '@lib/hooks/use-theme';
import { useWorkflowExecution } from '@lib/hooks/use-workflow-execution';
import { useWorkflowHistoryStore } from '@lib/stores/workflow-history-store';
import { cn } from '@lib/utils';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

import React, { useCallback, useState } from 'react';

import { useTranslations } from 'next-intl';

import { ExecutionHistory } from './execution-history';
import { WorkflowInputForm, WorkflowInputFormRef } from './workflow-input-form';
import { WorkflowTracker } from './workflow-tracker';
import { ResultViewer } from './workflow-tracker/result-viewer';

interface WorkflowLayoutProps {
  instanceId: string;
}

type MobileTab = 'form' | 'tracker' | 'history';

/**
 * Workflow main layout component
 *
 * Layout features:
 * - Desktop: left-right split layout (form + tracker)
 * - Mobile: tab switching layout
 * - Foldable history sidebar
 * - Unified status management and data flow
 */
export function WorkflowLayout({ instanceId }: WorkflowLayoutProps) {
  const { isDark } = useTheme();
  const isMobile = useMobile();
  const t = useTranslations('pages.workflow.buttons');

  // --- New workflow execution system ---
  const {
    isExecuting,
    error,
    canRetry,
    currentExecution,
    executeWorkflow,
    stopWorkflowExecution,
    retryExecution,
    resetExecution,
    clearExecutionState,
  } = useWorkflowExecution(instanceId);

  // --- Keep the original status management ---
  const { showHistory, setShowHistory } = useWorkflowHistoryStore();
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('form');

  // --- ResultViewer status management ---
  const [showResultViewer, setShowResultViewer] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedExecution, setSelectedExecution] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [executionResult, setExecutionResult] = useState<any>(null);

  // --- Form reset reference ---
  const formResetRef = React.useRef<WorkflowInputFormRef>(null);

  // --- Workflow execution callback, now using the real hook ---
  const handleExecuteWorkflow = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (formData: Record<string, any>) => {
      console.log(
        '[Workflow layout] Start executing workflow, input data:',
        formData
      );

      try {
        await executeWorkflow(formData);
      } catch (error) {
        console.error('[Workflow layout] Execution failed:', error);
      }
    },
    [executeWorkflow]
  );

  // --- Node status update callback ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeUpdate = useCallback((event: any) => {
    console.log('[Node update]', event);
    // Note: Node status is now automatically managed through the hook, no need to manually update
  }, []);

  // --- Stop execution ---
  const handleStopExecution = useCallback(async () => {
    console.log('[Workflow layout] Stop execution');
    try {
      await stopWorkflowExecution();
    } catch (error) {
      console.error('[Workflow layout] Stop execution failed:', error);
    }
  }, [stopWorkflowExecution]);

  // --- Retry execution ---
  const handleRetryExecution = useCallback(async () => {
    console.log('[Workflow layout] Retry execution');
    try {
      await retryExecution();
    } catch (error) {
      console.error('[Workflow layout] Retry execution failed:', error);
    }
  }, [retryExecution]);

  // --- Complete reset (including form) ---
  const handleCompleteReset = useCallback(() => {
    console.log('[Workflow layout] Complete reset');

    // Reset execution state (keep history)
    resetExecution();

    // Reset form
    if (formResetRef.current?.resetForm) {
      formResetRef.current.resetForm();
    }
  }, [resetExecution]);

  // --- Clear error ---
  const handleClearError = useCallback(() => {
    console.log('[Workflow layout] Clear error');
    clearExecutionState();
  }, [clearExecutionState]);

  // --- Handle view result ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleViewResult = useCallback((result: any, execution: any) => {
    console.log('[Workflow layout] View execution result:', execution);
    setExecutionResult(result);
    setSelectedExecution(execution);
    setShowResultViewer(true);
  }, []);

  // --- Error banner component ---
  const ErrorBanner = ({
    error,
    canRetry,
    onRetry,
    onDismiss,
  }: {
    error: string;
    canRetry: boolean;
    onRetry: () => void;
    onDismiss: () => void;
  }) => (
    <div
      className={cn(
        'flex items-center gap-3 border-l-4 border-red-500 px-4 py-3',
        isDark ? 'bg-red-900/20 text-red-200' : 'bg-red-50 text-red-800'
      )}
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
      <div className="flex-1">
        <p className="font-serif text-sm">{error}</p>
      </div>
      <div className="flex items-center gap-2">
        {canRetry && (
          <button
            onClick={onRetry}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              isDark
                ? 'text-red-300 hover:bg-red-800/50 hover:text-red-200'
                : 'text-red-700 hover:bg-red-200/50 hover:text-red-800'
            )}
            title={t('retry')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onDismiss}
          className={cn(
            'rounded-md p-1.5 transition-colors',
            isDark
              ? 'text-red-300 hover:bg-red-800/50 hover:text-red-200'
              : 'text-red-700 hover:bg-red-200/50 hover:text-red-800'
          )}
          title={t('close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  // --- Mobile layout ---
  if (isMobile) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Global error banner */}
        {error && (
          <ErrorBanner
            error={error}
            canRetry={canRetry}
            onRetry={handleRetryExecution}
            onDismiss={handleClearError}
          />
        )}

        {/* Mobile tab switcher */}
        <MobileTabSwitcher
          activeTab={mobileActiveTab}
          onTabChange={setMobileActiveTab}
          hasHistory={showHistory}
        />

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {mobileActiveTab === 'form' && (
            <div className="h-full p-4">
              <WorkflowInputForm
                instanceId={instanceId}
                onExecute={handleExecuteWorkflow}
                isExecuting={isExecuting}
                ref={formResetRef}
              />
            </div>
          )}

          {mobileActiveTab === 'tracker' && (
            <div className="h-full">
              <WorkflowTracker
                isExecuting={isExecuting}
                executionResult={currentExecution?.outputs || null}
                currentExecution={currentExecution}
                onNodeUpdate={handleNodeUpdate}
                onStop={handleStopExecution}
                onRetry={handleRetryExecution}
                onReset={handleCompleteReset}
              />
            </div>
          )}

          {mobileActiveTab === 'history' && (
            <div className="h-full">
              <ExecutionHistory
                instanceId={instanceId}
                onClose={() => setMobileActiveTab('form')}
                isMobile={true}
                onViewResult={handleViewResult}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Desktop layout ---
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Global error banner */}
      {error && (
        <ErrorBanner
          error={error}
          canRetry={canRetry}
          onRetry={handleRetryExecution}
          onDismiss={handleClearError}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <div
          className={cn(
            'relative flex-1 overflow-hidden transition-all duration-300',
            showHistory ? 'lg:w-2/3' : 'w-full'
          )}
        >
          <ResizableSplitPane
            storageKey="workflow-split-pane"
            defaultLeftWidth={50}
            minLeftWidth={25}
            maxLeftWidth={75}
            left={
              <div className="hide-all-scrollbars flex h-full flex-col overflow-hidden">
                <div className="no-scrollbar flex-1 overflow-x-hidden overflow-y-auto px-8 pt-4 pb-12">
                  <WorkflowInputForm
                    instanceId={instanceId}
                    onExecute={handleExecuteWorkflow}
                    isExecuting={isExecuting}
                    ref={formResetRef}
                  />
                </div>
              </div>
            }
            right={
              <div className="hide-all-scrollbars flex h-full flex-col overflow-hidden">
                <div className="no-scrollbar flex-1 overflow-x-hidden overflow-y-auto">
                  <WorkflowTracker
                    isExecuting={isExecuting}
                    executionResult={currentExecution?.outputs || null}
                    currentExecution={currentExecution}
                    onNodeUpdate={handleNodeUpdate}
                    onStop={handleStopExecution}
                    onRetry={handleRetryExecution}
                    onReset={handleCompleteReset}
                  />
                </div>
              </div>
            }
          />
        </div>

        {/* History sidebar */}
        {showHistory && (
          <div
            className={cn(
              'w-80 min-w-72 overflow-hidden border-l',
              'transition-all duration-300 ease-in-out',
              'transform-gpu', // Use GPU acceleration
              isDark ? 'border-stone-700' : 'border-stone-200'
            )}
          >
            <ExecutionHistory
              instanceId={instanceId}
              onClose={() => setShowHistory(false)}
              isMobile={false}
              onViewResult={handleViewResult}
            />
          </div>
        )}
      </div>

      {/* --- Result viewer (page level, with blurred background) --- */}
      {showResultViewer && executionResult && selectedExecution && (
        <ResultViewer
          result={executionResult}
          execution={selectedExecution}
          onClose={() => {
            setShowResultViewer(false);
            setSelectedExecution(null);
            setExecutionResult(null);
          }}
        />
      )}
    </div>
  );
}
