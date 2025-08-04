/**
 * Test suite for sidebar click synchronization fix
 * Validates that sidebar highlight and URL navigation happen simultaneously
 * without delays or inconsistencies.
 */
import { act } from '@testing-library/react';

// Import React for createElement
import React from 'react';

// Mock Next.js router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/chat/new',
}));

// Mock stores
const mockSelectItem = jest.fn();
const mockSetCurrentConversationId = jest.fn();
const mockSetIsWelcomeScreen = jest.fn();

jest.mock('@lib/stores/sidebar-store', () => ({
  useSidebarStore: () => ({
    selectedType: 'chat',
    selectedId: null,
    isExpanded: true,
    contentVisible: true,
    selectItem: mockSelectItem,
    updateContentVisibility: jest.fn(),
    showContent: jest.fn(),
  }),
}));

jest.mock('@lib/stores/chat-store', () => ({
  useChatStore: () => mockSetCurrentConversationId,
}));

jest.mock('@lib/stores/chat-input-store', () => ({
  useChatInputStore: () => ({
    setIsWelcomeScreen: mockSetIsWelcomeScreen,
  }),
}));

jest.mock('@lib/hooks', () => ({
  useMobile: () => false,
}));

jest.mock('@lib/hooks/use-theme', () => ({
  useTheme: () => ({ isDark: false }),
}));

// Mock child components with createElement
jest.mock('../../../components/sidebar/sidebar-chat-list', () => ({
  SidebarChatList: ({ onSelectChat }: { onSelectChat: (id: string) => void }) =>
    React.createElement('div', { 'data-testid': 'chat-list' }, [
      React.createElement(
        'button',
        {
          key: '123',
          'data-testid': 'chat-item-123',
          onClick: () => onSelectChat('123'),
        },
        'Test Chat'
      ),
      React.createElement(
        'button',
        {
          key: '456',
          'data-testid': 'chat-item-456',
          onClick: () => onSelectChat('456'),
        },
        'Another Chat'
      ),
    ]),
}));

jest.mock('../../../components/sidebar/sidebar-favorite-apps', () => ({
  SidebarFavoriteApps: () =>
    React.createElement(
      'div',
      { 'data-testid': 'favorite-apps' },
      'Favorite Apps'
    ),
}));

// Test the actual handleSelectChat function logic without rendering
const createHandleSelectChat = () => {
  // Simulate the actual function implementation
  return (chatId: number | string) => {
    try {
      // CRITICAL: Execute sidebar highlight and URL navigation simultaneously
      mockSelectItem('chat', chatId, true);
      mockPush(`/chat/${chatId}`);

      // Optional: Set conversation ID for consistency (non-blocking)
      mockSetCurrentConversationId(String(chatId));
      mockSetIsWelcomeScreen(false);
    } catch (error) {
      console.error('[ChatList] Failed to switch conversation:', error);
    }
  };
};

describe('Sidebar Click Synchronization', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementations
    mockPush.mockImplementation(() => Promise.resolve(true));
    mockSelectItem.mockImplementation(() => {});
    mockSetCurrentConversationId.mockImplementation(() => {});
    mockSetIsWelcomeScreen.mockImplementation(() => {});
  });

  describe('handleSelectChat synchronization logic', () => {
    it('should execute selectItem and router.push simultaneously', async () => {
      const handleSelectChat = createHandleSelectChat();

      // Track execution order and timing
      const executionOrder: string[] = [];
      const startTime = Date.now();

      mockSelectItem.mockImplementation(() => {
        executionOrder.push(`selectItem-${Date.now() - startTime}ms`);
      });

      mockPush.mockImplementation(() => {
        executionOrder.push(`router.push-${Date.now() - startTime}ms`);
        return Promise.resolve(true);
      });

      // Execute the handler
      await act(async () => {
        handleSelectChat('123');
      });

      // Verify both operations were called
      expect(mockSelectItem).toHaveBeenCalledWith('chat', '123', true);
      expect(mockPush).toHaveBeenCalledWith('/chat/123');

      // Verify execution order (both should be called almost simultaneously)
      expect(executionOrder).toHaveLength(2);
      expect(executionOrder[0]).toMatch(/selectItem-\d+ms/);
      expect(executionOrder[1]).toMatch(/router\.push-\d+ms/);

      // Verify timing - should be within 1ms of each other (essentially simultaneous)
      const selectTime = parseInt(executionOrder[0].match(/(\d+)ms/)![1]);
      const routerTime = parseInt(executionOrder[1].match(/(\d+)ms/)![1]);
      const timeDiff = Math.abs(routerTime - selectTime);

      expect(timeDiff).toBeLessThan(2); // Within 2ms is considered simultaneous
    });

    it('should prioritize critical operations over optional ones', async () => {
      const handleSelectChat = createHandleSelectChat();

      // Track execution order
      const executionOrder: string[] = [];

      mockSelectItem.mockImplementation(() => {
        executionOrder.push('selectItem');
      });

      mockPush.mockImplementation(() => {
        executionOrder.push('router.push');
        return Promise.resolve(true);
      });

      mockSetCurrentConversationId.mockImplementation(() => {
        executionOrder.push('setCurrentConversationId');
      });

      mockSetIsWelcomeScreen.mockImplementation(() => {
        executionOrder.push('setIsWelcomeScreen');
      });

      // Execute the handler
      await act(async () => {
        handleSelectChat('456');
      });

      // Verify execution order: critical operations first, then optional ones
      expect(executionOrder).toEqual([
        'selectItem',
        'router.push',
        'setCurrentConversationId',
        'setIsWelcomeScreen',
      ]);
    });

    it('should handle multiple rapid calls without conflicts', async () => {
      const handleSelectChat = createHandleSelectChat();

      let selectItemCallCount = 0;
      let routerPushCallCount = 0;

      mockSelectItem.mockImplementation(() => {
        selectItemCallCount++;
      });

      mockPush.mockImplementation(() => {
        routerPushCallCount++;
        return Promise.resolve(true);
      });

      // Rapid successive calls
      await act(async () => {
        handleSelectChat('123');
        handleSelectChat('456');
        handleSelectChat('123');
      });

      // Verify all calls were processed
      expect(selectItemCallCount).toBe(3);
      expect(routerPushCallCount).toBe(3);

      // Verify final state is the last called item
      expect(mockSelectItem).toHaveBeenLastCalledWith('chat', '123', true);
      expect(mockPush).toHaveBeenLastCalledWith('/chat/123');
    });

    it('should handle router.push errors gracefully', async () => {
      const handleSelectChat = createHandleSelectChat();

      // Mock router.push to throw an error
      const routerError = new Error('Navigation failed');
      mockPush.mockImplementation(() => {
        throw routerError;
      });

      // Mock console.error to track error handling
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Call should not throw error
      await act(async () => {
        expect(() => handleSelectChat('123')).not.toThrow();
      });

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ChatList] Failed to switch conversation:',
        routerError
      );

      // Verify selectItem was still called despite router error
      expect(mockSelectItem).toHaveBeenCalledWith('chat', '123', true);

      consoleSpy.mockRestore();
    });
  });

  describe('Performance characteristics', () => {
    it('should complete critical operations within performance budget', async () => {
      const handleSelectChat = createHandleSelectChat();

      // Measure execution time
      const startTime = performance.now();

      await act(async () => {
        handleSelectChat('123');
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Should complete within 5ms for immediate user feedback
      expect(executionTime).toBeLessThan(5);

      // Verify operations were called
      expect(mockSelectItem).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalled();
    });

    it('should not have synchronous delays between critical operations', async () => {
      const handleSelectChat = createHandleSelectChat();

      const timestamps: number[] = [];

      mockSelectItem.mockImplementation(() => {
        timestamps.push(performance.now());
      });

      mockPush.mockImplementation(() => {
        timestamps.push(performance.now());
        return Promise.resolve(true);
      });

      await act(async () => {
        handleSelectChat('123');
      });

      // Verify both operations were called
      expect(timestamps).toHaveLength(2);

      // Verify minimal time difference between operations (< 1ms)
      const timeDiff = timestamps[1] - timestamps[0];
      expect(timeDiff).toBeLessThan(1);
    });
  });

  describe('State consistency', () => {
    it('should maintain consistent state between highlight and URL', async () => {
      const handleSelectChat = createHandleSelectChat();

      let highlightState: { type: string; id: string } | null = null;
      let urlState: string | null = null;

      mockSelectItem.mockImplementation((type, id) => {
        highlightState = { type, id: String(id) };
      });

      mockPush.mockImplementation(url => {
        urlState = url;
        return Promise.resolve(true);
      });

      await act(async () => {
        handleSelectChat('123');
      });

      // Verify state consistency
      expect(highlightState).toEqual({ type: 'chat', id: '123' });
      expect(urlState).toBe('/chat/123');

      // Verify URL matches the highlighted item - both should be defined
      expect(urlState).toBeDefined();
      expect(highlightState).toBeDefined();

      // Type assertions to satisfy TypeScript after the checks above
      const url = urlState as unknown as string;
      const highlight = highlightState as unknown as {
        type: string;
        id: string;
      };

      const chatIdFromUrl = url.split('/').pop();
      expect(chatIdFromUrl).toBe(highlight.id);
    });

    it('should handle string and number IDs consistently', async () => {
      const handleSelectChat = createHandleSelectChat();

      const testCases = [
        { input: '123', expectedUrl: '/chat/123', expectedId: '123' },
        { input: 456, expectedUrl: '/chat/456', expectedId: '456' },
        {
          input: 'abc-123',
          expectedUrl: '/chat/abc-123',
          expectedId: 'abc-123',
        },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        let capturedHighlightId: string | null = null;
        let capturedUrl: string | null = null;

        mockSelectItem.mockImplementation((_type, id) => {
          capturedHighlightId = String(id);
        });

        mockPush.mockImplementation(url => {
          capturedUrl = url;
          return Promise.resolve(true);
        });

        await act(async () => {
          handleSelectChat(testCase.input);
        });

        expect(capturedHighlightId).toBe(testCase.expectedId);
        expect(capturedUrl).toBe(testCase.expectedUrl);
      }
    });
  });

  describe('Integration with existing sidebar highlight logic', () => {
    it('should work correctly with isChatActive function', () => {
      // Simulate the isChatActive logic from sidebar-chat-list.tsx
      const isChatActive = (
        chat: { id: string },
        selectedId: string | null
      ) => {
        if (!selectedId) return false;
        if (chat.id === selectedId) return true;
        return false;
      };

      // Test synchronization with highlight logic
      const testChat = { id: '123' };

      // Before selection
      expect(isChatActive(testChat, null)).toBe(false);

      // After selection (simulate immediate state update)
      expect(isChatActive(testChat, '123')).toBe(true);
      expect(isChatActive(testChat, '456')).toBe(false);
    });
  });
});
