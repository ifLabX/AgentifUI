import { create } from 'zustand';

interface TooltipState {
  activeTooltipId: string | null;
  showTooltip: (id: string) => void;
  hideTooltip: () => void;
}

export const useTooltipStore = create<TooltipState>(set => ({
  activeTooltipId: null,
  showTooltip: id => set({ activeTooltipId: id }),
  hideTooltip: () => set({ activeTooltipId: null }),
}));
