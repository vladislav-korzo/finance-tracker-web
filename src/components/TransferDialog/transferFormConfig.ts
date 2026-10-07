import { z } from 'zod';

export const transferFormSchema = z
  .object({
    fromAccountId: z.string().min(1, 'Выберите счёт списания'),
    toAccountId: z.string().min(1, 'Выберите счёт зачисления'),
    amount: z.coerce.number().positive('Сумма должна быть больше нуля'),
    occurredAt: z.string().min(1, 'Укажите дату'),
    note: z.string().optional(),
  })
  .refine((v) => v.fromAccountId !== v.toAccountId, {
    message: 'Счета должны различаться',
    path: ['toAccountId'],
  });

export type TransferFormValues = z.infer<typeof transferFormSchema>;
