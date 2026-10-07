import { create } from 'zustand';

import { toast } from '@/shared/lib/feedback';
import { transferRepository } from '@/shared/repositories/transferRepository';
import type { Transfer } from '@/shared/types/entities';

import { useAuthStore } from '@/shared/store/authStore';

type TransferState = {
  transfers: Transfer[];
  loading: boolean;
  error: string | null;
  fetchTransfers: () => Promise<void>;
  createTransfer: (input: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    occurredAt: string;
    note?: string | null;
  }) => Promise<void>;
  deleteTransfer: (id: string) => Promise<void>;
};

export const useTransferStore = create<TransferState>((set, get) => ({
  transfers: [],
  loading: false,
  error: null,

  fetchTransfers: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ loading: true, error: null });
    try {
      const transfers = await transferRepository.list(user.id);
      set({ transfers, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createTransfer: async (input) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ error: null });
    const created = await transferRepository.create({ userId: user.id, ...input });
    set({ transfers: [created, ...get().transfers] });
    toast.success('Перевод выполнен');
  },

  deleteTransfer: async (id) => {
    set({ error: null });
    try {
      await transferRepository.remove(id);
      set({ transfers: get().transfers.filter((t) => t.id !== id) });
      toast.success('Перевод удалён');
    } catch (e) {
      toast.error('Не удалось удалить перевод', { description: (e as Error).message });
    }
  },
}));
