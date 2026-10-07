import { create } from 'zustand';

import { celebrate, toast } from '@/shared/lib/feedback';
import { budgetRepository } from '@/shared/repositories/budgetRepository';
import type { BudgetGoal } from '@/shared/types/entities';

import { useAuthStore } from '@/shared/store/authStore';

type BudgetState = {
  goals: BudgetGoal[];
  loading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  createGoal: (
    name: string,
    currency: string,
    targetAmount: number,
    savedAmount?: number
  ) => Promise<void>;
  updateGoal: (
    id: string,
    name: string,
    currency: string,
    targetAmount: number,
    savedAmount: number
  ) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
};

export const useBudgetStore = create<BudgetState>((set, get) => ({
  goals: [],
  loading: false,
  error: null,

  fetchGoals: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ loading: true, error: null });
    try {
      const goals = await budgetRepository.list(user.id);
      set({ goals, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createGoal: async (name, currency, targetAmount, savedAmount) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ error: null });
    const g = await budgetRepository.create({
      userId: user.id,
      name,
      currency,
      targetAmount,
      savedAmount,
    });
    set({ goals: [...get().goals, g] });
    if (g.saved_amount >= g.target_amount) {
      celebrate('big');
      toast.success('Цель достигнута! 🎉', { description: g.name });
    } else {
      toast.success('Цель создана', { description: g.name });
    }
  },

  updateGoal: async (id, name, currency, targetAmount, savedAmount) => {
    set({ error: null });
    const prev = get().goals.find((x) => x.id === id);
    const wasReached = prev ? prev.saved_amount >= prev.target_amount : false;
    const g = await budgetRepository.update({ id, name, currency, targetAmount, savedAmount });
    set({ goals: get().goals.map((x) => (x.id === id ? g : x)) });
    if (!wasReached && g.saved_amount >= g.target_amount) {
      celebrate('big');
      toast.success('Цель достигнута! 🎉', { description: g.name });
    } else {
      toast.success('Цель обновлена');
    }
  },

  deleteGoal: async (id) => {
    set({ error: null });
    try {
      await budgetRepository.remove(id);
      set({ goals: get().goals.filter((x) => x.id !== id) });
      toast.success('Цель удалена');
    } catch (e) {
      toast.error('Не удалось удалить цель', { description: (e as Error).message });
    }
  },
}));
