import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Selected item type
export type SelectedItemType = 'chat' | 'app' | null;

interface SidebarState {
  // Whether the sidebar is expanded
  isExpanded: boolean;
  // Whether the component is mounted on the client
  isMounted: boolean;
  // Whether the sidebar content is visible
  contentVisible: boolean;
  // Whether the mobile navigation is visible
  isMobileNavVisible: boolean;
  // Whether the sidebar is animating
  isAnimating: boolean;
  // Selected item type: 'chat', 'app', or null
  selectedType: SelectedItemType;
  // Selected item ID
  selectedId: string | number | null;

  // Toggle sidebar expand/collapse
  toggleSidebar: () => void;
  // Set mounted state to true
  setMounted: () => void;
  // Show sidebar content
  showContent: () => void;
  // Hide sidebar content
  hideContent: () => void;
  // Update content visibility based on device type
  updateContentVisibility: (isMobile: boolean) => void;
  // Get sidebar width class based on device type
  getSidebarWidth: (isMobile: boolean) => string;
  // Show mobile navigation
  showMobileNav: () => void;
  // Hide mobile navigation
  hideMobileNav: () => void;
  // Toggle mobile navigation
  toggleMobileNav: () => void;
  // Select an item in the sidebar
  selectItem: (
    type: SelectedItemType,
    id: string | number | null,
    keepCurrentExpandState?: boolean
  ) => void;
  // Clear selection
  clearSelection: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      // Desktop: persist user preference for expanded state
      isExpanded: false,
      // Initial mounted state is false
      isMounted: false,
      // Initial content visibility
      contentVisible: false,
      // Initial mobile navigation state
      isMobileNavVisible: false,
      // Initial animation state
      isAnimating: false,
      // Initial selected state
      selectedType: null,
      selectedId: null,

      // Set mounted state to true
      setMounted: () => {
        set({ isMounted: true });
      },

      // Show sidebar content
      showContent: () => {
        set({ contentVisible: true });
      },

      // Hide sidebar content
      hideContent: () => {
        set({ contentVisible: false });
      },

      // Update content visibility based on sidebar and device state
      updateContentVisibility: (isMobile: boolean) => {
        const { isExpanded } = get();

        if (!isExpanded) {
          // Hide content when sidebar is collapsed
          set({ contentVisible: false });
          return;
        }

        // On mobile, show content immediately; on desktop, rely on external timer
        if (isMobile) {
          set({ contentVisible: true });
        }
        // On desktop, contentVisible is set by external timer
      },

      // Get sidebar width class based on device and expand state
      getSidebarWidth: (isMobile: boolean) => {
        const { isExpanded } = get();

        if (isMobile) {
          return isExpanded ? 'w-64' : 'w-0';
        } else {
          return isExpanded ? 'w-64' : 'w-16';
        }
      },

      // Toggle sidebar expand/collapse
      toggleSidebar: () => {
        set(state => {
          const newIsExpanded = !state.isExpanded;

          // Hide content immediately when collapsing
          if (!newIsExpanded) {
            set({ contentVisible: false });
          }
          // When expanding, let updateContentVisibility handle contentVisible

          // Set animating state
          set({ isAnimating: true });

          // Clear animating state after 150ms
          setTimeout(() => {
            set({ isAnimating: false });
          }, 150);

          return {
            isExpanded: newIsExpanded,
          };
        });
      },

      // Show mobile navigation
      showMobileNav: () => {
        set({
          isExpanded: true,
          isMobileNavVisible: true,
          // Show content immediately on mobile
          contentVisible: true,
        });
      },

      // Hide mobile navigation
      hideMobileNav: () => {
        set({
          isExpanded: false,
          isMobileNavVisible: false,
          contentVisible: false,
        });
      },

      // Toggle mobile navigation
      toggleMobileNav: () => {
        const { isMobileNavVisible } = get();
        const newState = !isMobileNavVisible;

        set({
          isExpanded: newState,
          isMobileNavVisible: newState,
          // Sync content visibility state
          contentVisible: newState,
        });
      },

      // Select an item in the sidebar
      selectItem: (
        type: SelectedItemType,
        id: string | number | null,
        keepCurrentExpandState: boolean = false
      ) => {
        const currentState = get();

        // Update selected state
        const updates: Partial<SidebarState> = {
          selectedType: type,
          selectedId: id,
        };

        // If keeping current expand state and sidebar is expanded, ensure content is visible
        if (keepCurrentExpandState && currentState.isExpanded) {
          updates.contentVisible = true;
        }

        set(updates);
      },

      // Clear selection
      clearSelection: () => {
        set({
          selectedType: null,
          selectedId: null,
        });
      },
    }),
    {
      name: 'sidebar-desktop-preferences',
      storage: createJSONStorage(() => localStorage),
      // Only persist isExpanded state on desktop; use default on mobile
      partialize: state => {
        const isDesktop =
          typeof window !== 'undefined' && window.innerWidth >= 768;
        return isDesktop ? { isExpanded: state.isExpanded } : {};
      },
    }
  )
);
