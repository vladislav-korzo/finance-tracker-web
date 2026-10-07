import type { UseFormReturn } from 'react-hook-form';

import type { Account } from '@/shared/types/entities';

import type { AccountFormValues } from '@/screens/AccountsScreen/AccountsScreen.formConfig';

export type AccountsScreenProps = {
  /** Hide page heading when embedded in Wallets tabs */
  embedded?: boolean;
  accounts: Account[];
  /** Current balance per account id (income − expense). */
  balances: Record<string, number>;
  loading: boolean;
  error: string | null;
  dialogOpen: boolean;
  editing: Account | null;
  form: UseFormReturn<AccountFormValues>;
  onOpenCreate: () => void;
  onOpenEdit: (account: Account) => void;
  onCloseDialog: () => void;
  onSubmit: () => void;
  onDelete: (account: Account) => void;
};
