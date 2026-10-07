import { create } from 'zustand';

type UIState = {
  /** ⌘K command palette visibility. */
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;
  /** Quick-add transaction dialog visibility (openable from anywhere). */
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
};

export const useUIStore = create<UIState>((set, get) => ({
  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
  toggleCommand: () => set({ commandOpen: !get().commandOpen }),
  quickAddOpen: false,
  setQuickAddOpen: (open) => set({ quickAddOpen: open }),
}));
