import type { UseFormReturn } from 'react-hook-form';

import type { Transaction } from '@/shared/types/entities';

import type { TransactionFormValues } from '@/shared/forms/transactionFormConfig';

export type TransactionRow = Transaction & {
  accountName: string;
  /** Валюта кошелька операции */
  accountCurrency: string;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  loanName: string | null;
};

export type TransactionsScreenProps = {
  /** Currently visible (paginated, filtered) rows. */
  rows: TransactionRow[];
  totalCount: number;
  filteredCount: number;
  hasMore: boolean;
  onShowMore: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  typeFilter: 'all' | 'income' | 'expense';
  onTypeFilterChange: (value: 'all' | 'income' | 'expense') => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  accountFilter: string;
  onAccountFilterChange: (value: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  loading: boolean;
  error: string | null;
  dialogOpen: boolean;
  editing: Transaction | null;
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
  onOpenCreate: () => void;
  onOpenEdit: (transaction: Transaction) => void;
  onCloseDialog: () => void;
  onSubmit: () => void;
  onDelete: (transaction: Transaction) => void;
};
