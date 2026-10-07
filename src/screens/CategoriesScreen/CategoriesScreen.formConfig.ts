import { z } from 'zod';

import { categoryColorSchema, categoryIconSchema } from '@/shared/constants/categoryAppearance';

export const categoryFormSchema = z.object({
  name: z.string().min(1, 'Укажите название'),
  type: z.enum(['income', 'expense']),
  icon: categoryIconSchema,
  color: categoryColorSchema,
  /** Месячный лимит трат для расходов; пусто — без лимита. */
  monthlyLimit: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
