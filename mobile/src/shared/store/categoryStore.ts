import { create } from 'zustand';

import { toast } from '@/shared/lib/feedback';
import { categoryRepository } from '@/shared/repositories/categoryRepository';
import type { TransactionType } from '@/shared/types/database';
import type { Category } from '@/shared/types/entities';

import { useAuthStore } from '@/shared/store/authStore';

type CategoryState = {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  createCategory: (
    name: string,
    type: TransactionType,
    icon: string,
    color: string,
    monthlyLimit?: number | null
  ) => Promise<void>;
  updateCategory: (
    id: string,
    name: string,
    type: TransactionType,
    icon: string,
    color: string,
    monthlyLimit?: number | null
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
};

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ loading: true, error: null });
    try {
      const categories = await categoryRepository.list(user.id);
      set({ categories, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createCategory: async (name, type, icon, color, monthlyLimit) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ error: null });
    const created = await categoryRepository.create({
      userId: user.id,
      name,
      type,
      icon,
      color,
      monthlyLimit,
    });
    set({ categories: [...get().categories, created].sort((a, b) => a.name.localeCompare(b.name)) });
    toast.success('Категория создана', { description: created.name });
  },

  updateCategory: async (id, name, type, icon, color, monthlyLimit) => {
    set({ error: null });
    const updated = await categoryRepository.update({ id, name, type, icon, color, monthlyLimit });
    set({
      categories: get()
        .categories.map((c) => (c.id === id ? updated : c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    });
    toast.success('Категория обновлена');
  },

  deleteCategory: async (id) => {
    set({ error: null });
    try {
      await categoryRepository.remove(id);
      set({ categories: get().categories.filter((c) => c.id !== id) });
      toast.success('Категория удалена');
    } catch (e) {
      toast.error('Не удалось удалить категорию', { description: (e as Error).message });
    }
  },
}));
