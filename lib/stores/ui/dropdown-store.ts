import { create } from 'zustand';

interface DropdownState {
  isOpen: boolean;
  activeDropdownId: string | null;
  position: { top: number; left: number } | null;
  toggleDropdown: (
    id: string,
    position?: { top: number; left: number }
  ) => void;
  closeDropdown: () => void;
}

export const useDropdownStore = create<DropdownState>(set => ({
  isOpen: false,
  activeDropdownId: null,
  position: null,
  toggleDropdown: (id, position) => {
    set(state => {
      // If the dropdown with the same id is already open, close it
      if (state.isOpen && state.activeDropdownId === id) {
        return {
          isOpen: false,
          activeDropdownId: null,
          position: null,
        };
      }

      // Otherwise, open the new dropdown
      return {
        isOpen: true,
        activeDropdownId: id,
        position: position || null,
      };
    });
  },
  closeDropdown: () => {
    set({
      isOpen: false,
      activeDropdownId: null,
      position: null,
    });
  },
}));
