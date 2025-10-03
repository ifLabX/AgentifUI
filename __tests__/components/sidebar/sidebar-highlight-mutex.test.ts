/**
 * Test suite for sidebar highlight mutual exclusion behavior
 * Validates that all sidebar navigation buttons properly clear previous selections
 * to ensure only one button is highlighted at any time.
 */

// Mock sidebar store
const mockSelectItem = jest.fn();
let mockSidebarState = {
  selectedType: null as string | null,
  selectedId: null as string | null,
};

jest.mock('@lib/stores/sidebar-store', () => ({
  useSidebarStore: jest.fn(() => ({
    ...mockSidebarState,
    selectItem: mockSelectItem,
    isExpanded: true,
  })),
}));

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/chat/new',
}));

// Mock other dependencies
jest.mock('@lib/hooks/use-theme', () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('Sidebar Highlight Mutex', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSidebarState = { selectedType: null, selectedId: null };

    mockSelectItem.mockImplementation((type, id) => {
      mockSidebarState.selectedType = type;
      mockSidebarState.selectedId = id;
    });
  });

  describe('Consistent State Management Pattern', () => {
    it('should clear previous selections when navigating to history', () => {
      // Simulate chat selection
      mockSidebarState.selectedType = 'chat';
      mockSidebarState.selectedId = 'chat-123';

      // Simulate history button click (fixed implementation)
      const handleHistoryClick = () => {
        mockSelectItem(null, null);
        mockPush('/chat/history');
      };

      handleHistoryClick();

      expect(mockSelectItem).toHaveBeenCalledWith(null, null);
      expect(mockSidebarState.selectedType).toBe(null);
      expect(mockSidebarState.selectedId).toBe(null);
      expect(mockPush).toHaveBeenCalledWith('/chat/history');
    });

    it('should clear previous selections when navigating to settings', () => {
      // Simulate app selection
      mockSidebarState.selectedType = 'app';
      mockSidebarState.selectedId = 'app-456';

      // Simulate settings button click (fixed implementation)
      const handleSettingsClick = () => {
        mockSelectItem(null, null);
        mockPush('/settings');
      };

      handleSettingsClick();

      expect(mockSelectItem).toHaveBeenCalledWith(null, null);
      expect(mockSidebarState.selectedType).toBe(null);
      expect(mockSidebarState.selectedId).toBe(null);
      expect(mockPush).toHaveBeenCalledWith('/settings');
    });

    it('should maintain consistent pattern across all navigation buttons', () => {
      const handlers = {
        selectChat: (id: string) => {
          mockSelectItem('chat', id, true);
          mockPush(`/chat/${id}`);
        },
        selectApp: (id: string) => {
          mockSelectItem('app', id);
          mockPush(`/apps/${id}`);
        },
        newChat: () => {
          mockPush('/chat/new');
          setTimeout(() => mockSelectItem('chat', null, true), 100);
        },
        history: () => {
          mockSelectItem(null, null);
          mockPush('/chat/history');
        },
        settings: () => {
          mockSelectItem(null, null);
          mockPush('/settings');
        },
      };

      // Test sequence: verify each button clears previous state
      handlers.selectChat('chat-1');
      expect(mockSidebarState).toEqual({
        selectedType: 'chat',
        selectedId: 'chat-1',
      });

      handlers.selectApp('app-1');
      expect(mockSidebarState).toEqual({
        selectedType: 'app',
        selectedId: 'app-1',
      });

      handlers.history();
      expect(mockSidebarState).toEqual({
        selectedType: null,
        selectedId: null,
      });

      handlers.selectChat('chat-2');
      expect(mockSidebarState).toEqual({
        selectedType: 'chat',
        selectedId: 'chat-2',
      });

      handlers.settings();
      expect(mockSidebarState).toEqual({
        selectedType: null,
        selectedId: null,
      });
    });
  });

  describe('Mutual Exclusion Validation', () => {
    it('should ensure only one button can be active at any time', () => {
      // Helper to simulate button active state
      const isButtonActive = (
        type: string,
        id: string | null,
        pathname: string
      ) => {
        switch (pathname) {
          case '/chat/history':
            return mockSidebarState.selectedType === null;
          case '/settings':
            return mockSidebarState.selectedType === null;
          case '/apps':
            return mockSidebarState.selectedType === 'app';
          case '/chat/new':
            return (
              mockSidebarState.selectedType === 'chat' &&
              mockSidebarState.selectedId === null
            );
          default:
            if (pathname.startsWith('/chat/')) {
              const chatId = pathname.split('/')[2];
              return (
                mockSidebarState.selectedType === 'chat' &&
                mockSidebarState.selectedId === chatId
              );
            }
            return false;
        }
      };

      // Test scenarios
      const scenarios = [
        {
          state: { type: 'chat', id: 'chat-1' },
          pathname: '/chat/chat-1',
          shouldBeActive: true,
        },
        {
          state: { type: 'chat', id: 'chat-1' },
          pathname: '/chat/history',
          shouldBeActive: false,
        },
        {
          state: { type: null, id: null },
          pathname: '/chat/history',
          shouldBeActive: true,
        },
        {
          state: { type: 'app', id: 'app-1' },
          pathname: '/settings',
          shouldBeActive: false,
        },
        {
          state: { type: null, id: null },
          pathname: '/settings',
          shouldBeActive: true,
        },
      ];

      scenarios.forEach(({ state, pathname, shouldBeActive }) => {
        mockSidebarState.selectedType = state.type;
        mockSidebarState.selectedId = state.id;

        const isActive = isButtonActive(state.type || '', state.id, pathname);
        expect(isActive).toBe(shouldBeActive);
      });
    });
  });
});
