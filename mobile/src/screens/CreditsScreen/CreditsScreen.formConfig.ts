import { z } from 'zod';

import { ACCOUNT_CURRENCY_CODES } from '@/shared/constants/accountCurrencies';

/**
 * Loan create/edit form. Numeric-ish optional fields stay strings here and are
 * parsed/validated in the submit handler (mirrors the web `loanFormSchema`):
 * - `annualInterestRate` accepts comma or dot decimals,
 * - `paymentEndYear` is a 4-digit year,
 * - `remainingScheduleMonths` is an integer 1..600.
 */
export const loanFormSchema = z.object({
  name: z.string().min(1, 'Укажите название'),
  currency: z.enum(ACCOUNT_CURRENCY_CODES),
  totalAmount: z.coerce
    .number({ invalid_type_error: 'Введите сумму' })
    .positive('Сумма должна быть больше нуля'),
  annualInterestRate: z.string().optional(),
  paymentEndYear: z.string().optional(),
  remainingScheduleMonths: z.string().optional(),
  note: z.string().optional(),
});

export type LoanFormValues = z.infer<typeof loanFormSchema>;
