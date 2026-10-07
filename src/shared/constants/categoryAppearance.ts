import { z } from 'zod';

/** Имена иконок Lucide (PascalCase), доступные при создании категории */
export const CATEGORY_ICON_NAMES = [
  'Circle',
  'Wallet',
  'ShoppingCart',
  'Utensils',
  'Car',
  'Bus',
  'Coffee',
  'Film',
  'Heart',
  'Shirt',
  'Home',
  'Zap',
  'Gift',
  'Laptop',
  'Smartphone',
  'Plane',
  'Briefcase',
  'Banknote',
  'Coins',
  'PiggyBank',
  'TrendingUp',
  'Award',
  'Dumbbell',
  'Flower2',
  'Baby',
  'Dog',
  'Cat',
  'Music',
  'BookOpen',
  'Gamepad2',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_NAMES)[number];

export const DEFAULT_CATEGORY_ICON: CategoryIconName = 'Circle';

export const CATEGORY_COLOR_PRESETS = [
  '#0ea5e9',
  '#3b82f6',
  '#06b6d4',
  '#14b8a6',
  '#10b981',
  '#84cc16',
  '#eab308',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#f43f5e',
  '#ec4899',
  '#d946ef',
  '#a855f7',
  '#8b5cf6',
  '#6366f1',
  '#64748b',
] as const;

export type CategoryColorPreset = (typeof CATEGORY_COLOR_PRESETS)[number];

export const DEFAULT_CATEGORY_COLOR: CategoryColorPreset = CATEGORY_COLOR_PRESETS[0];

export function normalizeCategoryColor(hex: string): CategoryColorPreset {
  const key = hex.trim().toLowerCase();
  const found = CATEGORY_COLOR_PRESETS.find((p) => p.toLowerCase() === key);
  return found ?? DEFAULT_CATEGORY_COLOR;
}

export function isCategoryIconName(s: string): s is CategoryIconName {
  return (CATEGORY_ICON_NAMES as readonly string[]).includes(s);
}

export const categoryColorSchema = z.enum(CATEGORY_COLOR_PRESETS, {
  errorMap: () => ({ message: 'Выберите цвет из палитры' }),
});

export const categoryIconSchema = z.string().refine(isCategoryIconName, {
  message: 'Выберите иконку из списка',
});
