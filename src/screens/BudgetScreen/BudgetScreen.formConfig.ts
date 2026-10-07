import { z } from 'zod';

export const budgetGoalFormSchema = z.object({
  name: z.string().min(1, 'Укажите название'),
  currency: z.string().min(1, 'Выберите валюту'),
  targetAmount: z.coerce.number().positive('Сумма должна быть больше нуля'),
  savedAmount: z.coerce.number().min(0, 'Не может быть отрицательной'),
});

export type BudgetGoalFormValues = z.infer<typeof budgetGoalFormSchema>;
