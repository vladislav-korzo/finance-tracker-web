import { z } from 'zod';

import { ACCOUNT_CURRENCY_CODES } from '@/shared/constants/accountCurrencies';

export const accountFormSchema = z.object({
  name: z.string().min(1, 'Укажите название'),
  currency: z.enum(ACCOUNT_CURRENCY_CODES),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;
