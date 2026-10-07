import { create } from 'zustand';

import { toast } from '@/shared/lib/feedback';
import { accountRepository } from '@/shared/repositories/accountRepository';
import type { Account } from '@/shared/types/entities';

import { useAuthStore } from '@/shared/store/authStore';

type AccountState = {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  createAccount: (name: string, currency?: string, opts?: { silent?: boolean }) => Promise<void>;
  updateAccount: (id: string, name: string, currency: string) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
};

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  loading: false,
  error: null,

  fetchAccounts: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ loading: true, error: null });
    try {
      const accounts = await accountRepository.list(user.id);
      set({ accounts, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createAccount: async (name, currency, opts) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ error: null });
    const created = await accountRepository.create({ userId: user.id, name, currency });
    set({ accounts: [...get().accounts, created] });
    if (!opts?.silent) toast.success('Кошелёк создан', { description: created.name });
  },

  updateAccount: async (id, name, currency) => {
    set({ error: null });
    const updated = await accountRepository.update({ id, name, currency });
    set({
      accounts: get().accounts.map((a) => (a.id === id ? updated : a)),
    });
    toast.success('Кошелёк обновлён');
  },

  deleteAccount: async (id) => {
    set({ error: null });
    try {
      await accountRepository.remove(id);
      set({ accounts: get().accounts.filter((a) => a.id !== id) });
      toast.success('Кошелёк удалён');
    } catch (e) {
      toast.error('Не удалось удалить кошелёк', { description: (e as Error).message });
    }
  },
}));
