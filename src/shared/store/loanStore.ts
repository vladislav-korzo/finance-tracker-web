import { create } from 'zustand';

import { toast } from '@/shared/lib/feedback';
import { loanRepository } from '@/shared/repositories/loanRepository';
import type { Loan } from '@/shared/types/entities';

import { useAuthStore } from '@/shared/store/authStore';

type LoanState = {
  loans: Loan[];
  loading: boolean;
  error: string | null;
  fetchLoans: () => Promise<void>;
  createLoan: (input: {
    name: string;
    currency: string;
    totalAmount: number;
    annualInterestRate?: number | null;
    paymentEndYear?: number | null;
    remainingScheduleMonths?: number | null;
    note?: string | null;
  }) => Promise<void>;
  updateLoan: (
    id: string,
    input: {
      name: string;
      currency: string;
      totalAmount: number;
      annualInterestRate?: number | null;
      paymentEndYear?: number | null;
      remainingScheduleMonths?: number | null;
      note?: string | null;
    }
  ) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
};

export const useLoanStore = create<LoanState>((set, get) => ({
  loans: [],
  loading: false,
  error: null,

  fetchLoans: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ loading: true, error: null });
    try {
      const loans = await loanRepository.list(user.id);
      set({ loans, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createLoan: async (input) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ error: null });
    const created = await loanRepository.create({ userId: user.id, ...input });
    set({ loans: [...get().loans, created].sort((a, b) => a.name.localeCompare(b.name)) });
    toast.success('Кредит добавлен', { description: created.name });
  },

  updateLoan: async (id, input) => {
    set({ error: null });
    const updated = await loanRepository.update({ id, ...input });
    set({
      loans: get()
        .loans.map((l) => (l.id === id ? updated : l))
        .sort((a, b) => a.name.localeCompare(b.name)),
    });
    toast.success('Кредит обновлён');
  },

  deleteLoan: async (id) => {
    set({ error: null });
    try {
      await loanRepository.remove(id);
      set({ loans: get().loans.filter((l) => l.id !== id) });
      toast.success('Кредит удалён');
    } catch (e) {
      toast.error('Не удалось удалить кредит', { description: (e as Error).message });
    }
  },
}));
