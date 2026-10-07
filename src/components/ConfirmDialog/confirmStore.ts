import { create } from 'zustand';

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** Style the confirm button as destructive (red). Defaults to true. */
  destructive?: boolean;
};

type ConfirmState = {
  open: boolean;
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;
  request: (options: ConfirmOptions) => Promise<boolean>;
  resolveWith: (value: boolean) => void;
};

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  options: null,
  resolve: null,
  request: (options) =>
    new Promise<boolean>((resolve) => {
      set({ open: true, options, resolve });
    }),
  resolveWith: (value) => {
    get().resolve?.(value);
    set({ open: false, resolve: null });
  },
}));

/** Imperatively ask the user to confirm. Resolves true if confirmed. */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().request(options);
}
