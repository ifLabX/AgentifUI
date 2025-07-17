import { useChatInterface } from '@lib/hooks/use-chat-interface';
import { useChatflowInterface } from '@lib/hooks/use-chatflow-interface';

import React from 'react';

/**
 * Chatflow state management hook
 *
 * Features:
 * - Selects the correct interface based on app type
 * - Manages node tracker display state
 * - Automatically responds to node execution state
 * - Supports not auto-opening tracker if user manually closed it
 */
export function useChatflowState(isChatflowApp: boolean) {
  const chatflowInterface = useChatflowInterface();
  const regularInterface = useChatInterface();

  // Select the correct chat interface based on app type
  const chatInterface = isChatflowApp ? chatflowInterface : regularInterface;

  // nodeTracker is only valid in chatflow apps
  const nodeTracker = isChatflowApp
    ? chatflowInterface.nodeTracker
    : {
        nodes: [],
        isExecuting: false,
        executionProgress: { current: 0, total: 0, percentage: 0 },
        error: null,
      };

  // State for node tracker visibility
  const [showNodeTracker, setShowNodeTracker] = React.useState(false);

  // Track if user has manually closed the tracker popup
  // If user closes, new executions will not auto-open the tracker
  const [userHasClosed, setUserHasClosed] = React.useState(false);

  // Floating controller is always shown in chatflow apps
  const showFloatingController = isChatflowApp;

  // Only auto-show tracker when execution actually starts and user hasn't closed it
  // Avoids auto-popup when switching between chatflow apps
  React.useEffect(() => {
    if (!isChatflowApp) return;

    const isExecuting = nodeTracker?.isExecuting;

    // Only auto-show tracker if execution starts and user hasn't closed it
    if (isExecuting && !userHasClosed) {
      setShowNodeTracker(true);
    }
  }, [isChatflowApp, nodeTracker?.isExecuting, userHasClosed]);

  // Wrap setShowNodeTracker to track user's manual actions
  const handleToggleNodeTracker = React.useCallback(
    (show: boolean) => {
      setShowNodeTracker(show);

      // If user manually closes (from true to false), record this state
      if (!show && showNodeTracker) {
        setUserHasClosed(true);
      }

      // If user manually opens (from false to true), reset closed state
      if (show && !showNodeTracker) {
        setUserHasClosed(false);
      }
    },
    [showNodeTracker]
  );

  // Reset user closed state when a new execution starts
  // This allows tracker to auto-show for each new conversation
  React.useEffect(() => {
    if (!isChatflowApp) return;

    const isExecuting = nodeTracker?.isExecuting;

    // Reset user closed state when execution starts
    if (isExecuting) {
      setUserHasClosed(false);
    }
  }, [isChatflowApp, nodeTracker?.isExecuting]);

  return {
    // Chat interface
    messages: chatInterface.messages,
    handleSubmit: chatInterface.handleSubmit,
    isProcessing: chatInterface.isProcessing,
    handleStopProcessing: chatInterface.handleStopProcessing,
    sendDirectMessage: chatInterface.sendDirectMessage,

    // Chatflow related
    nodeTracker,
    showNodeTracker,
    setShowNodeTracker: handleToggleNodeTracker, // Use wrapped function
    showFloatingController,
  };
}
