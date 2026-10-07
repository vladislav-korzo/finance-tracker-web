import { z } from 'zod';

import { ACCOUNT_CURRENCY_CODES } from '@/shared/constants/accountCurrencies';

export const loanFormSchema = z.object({
  name: z.string().min(1, 'Укажите название'),
  currency: z.enum(ACCOUNT_CURRENCY_CODES),
  totalAmount: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? NaN : Number(v)),
    z.number({ invalid_type_error: 'Введите сумму' }).positive('Сумма должна быть больше нуля')
  ),
  annualInterestRate: z.coerce.string().optional(),
  paymentEndYear: z.coerce.string().optional(),
  /** Осталось платежей по графику — строка, парсится в контейнере */
  remainingScheduleMonths: z.coerce.string().optional(),
  note: z.string().optional(),
});

export type LoanFormValues = z.infer<typeof loanFormSchema>;
