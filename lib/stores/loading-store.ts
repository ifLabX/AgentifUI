import { create } from 'zustand';

/**
 * Page key type.
 *
 * Note: Do not modify this type directly. Use the registerPage method to add new pages.
 * Example: loadingStore.registerPage('new-page');
 */
export type PageKey = string;

interface LoadingState {
  // Loading state for each page
  pageLoading: Record<string, boolean>;

  // Set loading state for a specific page
  setPageLoading: (page: PageKey, isLoading: boolean) => void;

  // Get loading state for a specific page
  getPageLoading: (page: PageKey) => boolean;

  // Register a new page
  registerPage: (page: PageKey) => void;

  // Check if a page is registered
  hasPage: (page: PageKey) => boolean;

  // Reset loading state for all pages
  resetPageLoading: () => void;
}

// Predefined page list
// Note: This is just the initial page list. You can add new pages dynamically via registerPage.
const DEFAULT_PAGES = ['settings', 'chat', 'about'];

// Initial state creator
const createInitialState = () => {
  const state: Record<string, boolean> = {};
  DEFAULT_PAGES.forEach(page => {
    state[page] = false;
  });
  return state;
};

export const useLoadingStore = create<LoadingState>((set, get) => ({
  // Initial state
  pageLoading: createInitialState(),

  // Set loading state for a specific page
  setPageLoading: (page, isLoading) => {
    // Register the page if it does not exist
    if (!get().hasPage(page)) {
      get().registerPage(page);
    }

    set(state => ({
      pageLoading: { ...state.pageLoading, [page]: isLoading },
    }));
  },

  // Get loading state for a specific page
  getPageLoading: page => {
    // Return false if the page does not exist
    if (!get().hasPage(page)) {
      return false;
    }
    return get().pageLoading[page];
  },

  // Register a new page
  registerPage: page => {
    if (!get().hasPage(page)) {
      set(state => ({
        pageLoading: { ...state.pageLoading, [page]: false },
      }));
    }
  },

  // Check if a page is registered
  hasPage: page => {
    return Object.prototype.hasOwnProperty.call(get().pageLoading, page);
  },

  // Reset loading state for all pages
  resetPageLoading: () => {
    const currentPages = Object.keys(get().pageLoading);
    const resetState: Record<string, boolean> = {};

    currentPages.forEach(page => {
      resetState[page] = false;
    });

    set({ pageLoading: resetState });
  },
}));
