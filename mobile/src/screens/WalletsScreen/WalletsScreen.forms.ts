import { z } from 'zod';

import {
  ACCOUNT_CURRENCY_CODES,
  DEFAULT_ACCOUNT_CURRENCY,
} from '@/shared/constants/accountCurrencies';

/* ----------------------------------------------------------------------------
 * Screen-local form schemas for the Wallets screen.
 *
 * Mirrors the web `AccountsScreen.formConfig.ts` (wallet create/edit) and
 * `TransferDialog/transferFormConfig.ts` (transfer) — same fields, same
 * validation messages — so behaviour matches the web 1:1.
 * ------------------------------------------------------------------------- */

/** Wallet create/edit: name + currency. */
export const walletFormSchema = z.object({
  name: z.string().min(1, 'Укажите название'),
  currency: z.enum(ACCOUNT_CURRENCY_CODES),
});

export type WalletFormValues = z.infer<typeof walletFormSchema>;

export const walletFormDefaults: WalletFormValues = {
  name: '',
  currency: DEFAULT_ACCOUNT_CURRENCY,
};

/** Transfer between two same-currency accounts. */
export const transferFormSchema = z
  .object({
    fromAccountId: z.string().min(1, 'Выберите счёт списания'),
    toAccountId: z.string().min(1, 'Выберите счёт зачисления'),
    // RN text inputs hand back strings; coerce to a positive number.
    amount: z.coerce.number().positive('Сумма должна быть больше нуля'),
    occurredAt: z.string().min(1, 'Укажите дату'),
    note: z.string().optional(),
  })
  .refine((v) => v.fromAccountId !== v.toAccountId, {
    message: 'Счета должны различаться',
    path: ['toAccountId'],
  });

export type TransferFormValues = z.infer<typeof transferFormSchema>;

/** Today's date as an ISO `YYYY-MM-DD` string (matches the web default). */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
