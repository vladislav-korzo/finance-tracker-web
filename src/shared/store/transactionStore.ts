import { create } from 'zustand';

import { celebrate, toast } from '@/shared/lib/feedback';
import { transactionRepository } from '@/shared/repositories/transactionRepository';
import type { TransactionType } from '@/shared/types/database';
import type { Transaction } from '@/shared/types/entities';

import { useAuthStore } from '@/shared/store/authStore';

type TransactionState = {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  createTransaction: (input: {
    accountId: string;
    categoryId?: string | null;
    loanId?: string | null;
    amount: number;
    type: TransactionType;
    occurredAt: string;
    note?: string | null;
  }) => Promise<void>;
  updateTransaction: (
    id: string,
    input: {
      accountId: string;
      categoryId?: string | null;
      loanId?: string | null;
      amount: number;
      type: TransactionType;
      occurredAt: string;
      note?: string | null;
    }
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loading: false,
  error: null,

  fetchTransactions: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ loading: true, error: null });
    try {
      const transactions = await transactionRepository.list(user.id);
      set({ transactions, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createTransaction: async (input) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ error: null });
    const created = await transactionRepository.create({
      userId: user.id,
      accountId: input.accountId,
      categoryId: input.categoryId ?? null,
      loanId: input.loanId ?? null,
      amount: input.amount,
      type: input.type,
      occurredAt: input.occurredAt,
      note: input.note ?? null,
    });
    set({ transactions: [created, ...get().transactions] });
    if (input.type === 'income') {
      celebrate();
      toast.success('Доход добавлен', { description: 'Запись сохранена в истории операций.' });
    } else {
      toast.success('Расход добавлен', { description: 'Запись сохранена в истории операций.' });
    }
  },

  updateTransaction: async (id, input) => {
    set({ error: null });
    const updated = await transactionRepository.update({
      id,
      accountId: input.accountId,
      categoryId: input.categoryId ?? null,
      loanId: input.loanId ?? null,
      amount: input.amount,
      type: input.type,
      occurredAt: input.occurredAt,
      note: input.note ?? null,
    });
    set({
      transactions: get()
        .transactions.map((t) => (t.id === id ? updated : t))
        .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
    });
    toast.success('Транзакция обновлена');
  },

  deleteTransaction: async (id) => {
    set({ error: null });
    try {
      await transactionRepository.remove(id);
      set({ transactions: get().transactions.filter((t) => t.id !== id) });
      toast.success('Транзакция удалена');
    } catch (e) {
      toast.error('Не удалось удалить', { description: (e as Error).message });
    }
  },
}));
