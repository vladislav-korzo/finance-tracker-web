import type { UseFormReturn } from 'react-hook-form';

import type { TransactionFormValues } from '@/shared/forms/transactionFormConfig';

export type QuickAddTransactionProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<TransactionFormValues>;
  accountOptions: { id: string; name: string }[];
  categoryOptions: {
    id: string;
    name: string;
    type: 'income' | 'expense';
    icon: string;
    color: string;
  }[];
  loanOptions: { id: string; name: string }[];
  onSubmit: () => void;
};
