import { z } from 'zod';

export const transactionFormSchema = z.object({
  accountId: z.string().min(1, 'Выберите кошелёк'),
  categoryId: z.string().optional(),
  loanId: z.string().optional(),
  amount: z.coerce.number().positive('Сумма должна быть больше нуля'),
  type: z.enum(['income', 'expense']),
  occurredAt: z.string().min(1, 'Выберите дату'),
  note: z.string().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
