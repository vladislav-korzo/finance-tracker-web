import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  transactionFormSchema,
  type TransactionFormValues,
} from '@/shared/forms/transactionFormConfig';
import { confirm } from '@/components/ConfirmDialog/confirmStore';
import { TransactionsScreen } from '@/screens/TransactionsScreen/TransactionsScreen';
import type { TransactionRow } from '@/screens/TransactionsScreen/TransactionsScreen.types';
import { DEFAULT_ACCOUNT_CURRENCY } from '@/shared/constants/accountCurrencies';
import type { Transaction } from '@/shared/types/entities';
import { useAccountStore } from '@/shared/store/accountStore';
import { useCategoryStore } from '@/shared/store/categoryStore';
import { useLoanStore } from '@/shared/store/loanStore';
import { useTransactionStore } from '@/shared/store/transactionStore';

function todayIsoDate(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function TransactionsScreenContainer() {
  const { accounts, fetchAccounts } = useAccountStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { loans, fetchLoans } = useLoanStore();
  const {
    transactions,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactionStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  // Filters & pagination
  const PAGE_SIZE = 25;
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      accountId: '',
      categoryId: '',
      amount: 0,
      type: 'expense',
      occurredAt: todayIsoDate(),
      note: '',
      loanId: '',
    },
  });

  useEffect(() => {
    void fetchAccounts();
    void fetchCategories();
    void fetchLoans();
    void fetchTransactions();
  }, [fetchAccounts, fetchCategories, fetchLoans, fetchTransactions]);

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const loanById = useMemo(() => new Map(loans.map((l) => [l.id, l])), [loans]);

  const rows: TransactionRow[] = useMemo(
    () =>
      transactions.map((t) => {
        const cat = t.category_id ? categoryById.get(t.category_id) : undefined;
        const loan = t.loan_id ? loanById.get(t.loan_id) : undefined;
        return {
          ...t,
          accountName: accountById.get(t.account_id)?.name ?? '—',
          accountCurrency: accountById.get(t.account_id)?.currency ?? DEFAULT_ACCOUNT_CURRENCY,
          categoryName: t.category_id ? cat?.name ?? null : null,
          categoryIcon: t.category_id && cat ? cat.icon : null,
          categoryColor: t.category_id && cat ? cat.color : null,
          loanName: loan?.name ?? null,
        };
      }),
    [transactions, accountById, categoryById, loanById]
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (accountFilter !== 'all' && r.account_id !== accountFilter) return false;
      if (categoryFilter !== 'all' && r.category_id !== categoryFilter) return false;
      if (q) {
        const haystack = [r.note ?? '', r.categoryName ?? '', r.accountName, String(r.amount)]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, query, typeFilter, accountFilter, categoryFilter]);

  // Reset pagination whenever filters change.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, typeFilter, accountFilter, categoryFilter]);

  const visibleRows = useMemo(
    () => filteredRows.slice(0, visibleCount),
    [filteredRows, visibleCount]
  );
  const hasActiveFilters =
    query.trim() !== '' || typeFilter !== 'all' || categoryFilter !== 'all' || accountFilter !== 'all';

  const onResetFilters = () => {
    setQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setAccountFilter('all');
  };

  const accountOptions = useMemo(
    () => accounts.map((a) => ({ id: a.id, name: a.name })),
    [accounts]
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({ id: c.id, name: c.name, type: c.type, icon: c.icon, color: c.color })),
    [categories]
  );

  const loanOptions = useMemo(() => loans.map((l) => ({ id: l.id, name: l.name })), [loans]);

  const onOpenCreate = () => {
    setEditing(null);
    const firstAccount = accounts[0];
    form.reset({
      accountId: firstAccount?.id ?? '',
      categoryId: '',
      amount: 0,
      type: 'expense',
      occurredAt: todayIsoDate(),
      note: '',
      loanId: '',
    });
    setDialogOpen(true);
  };

  const onOpenEdit = (transaction: Transaction) => {
    setEditing(transaction);
    form.reset({
      accountId: transaction.account_id,
      categoryId: transaction.category_id ?? '',
      amount: transaction.amount,
      type: transaction.type,
      occurredAt: transaction.occurred_at,
      note: transaction.note ?? '',
      loanId: transaction.loan_id ?? '',
    });
    setDialogOpen(true);
  };

  const onCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const categoryId =
        values.categoryId && values.categoryId.length > 0 ? values.categoryId : null;
      const loanId =
        values.type === 'expense' && values.loanId && values.loanId.length > 0 ? values.loanId : null;
      if (editing) {
        await updateTransaction(editing.id, {
          accountId: values.accountId,
          categoryId,
          loanId,
          amount: values.amount,
          type: values.type,
          occurredAt: values.occurredAt,
          note: values.note ?? null,
        });
      } else {
        await createTransaction({
          accountId: values.accountId,
          categoryId,
          loanId,
          amount: values.amount,
          type: values.type,
          occurredAt: values.occurredAt,
          note: values.note ?? null,
        });
      }
      onCloseDialog();
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    }
  });

  const onDelete = async (transaction: Transaction) => {
    const ok = await confirm({
      title: 'Удалить транзакцию?',
      description: 'Операция будет удалена безвозвратно.',
      confirmText: 'Удалить',
    });
    if (!ok) return;
    void deleteTransaction(transaction.id);
  };

  return (
    <TransactionsScreen
      rows={visibleRows}
      totalCount={rows.length}
      filteredCount={filteredRows.length}
      hasMore={filteredRows.length > visibleCount}
      onShowMore={() => setVisibleCount((c) => c + PAGE_SIZE)}
      query={query}
      onQueryChange={setQuery}
      typeFilter={typeFilter}
      onTypeFilterChange={setTypeFilter}
      categoryFilter={categoryFilter}
      onCategoryFilterChange={setCategoryFilter}
      accountFilter={accountFilter}
      onAccountFilterChange={setAccountFilter}
      hasActiveFilters={hasActiveFilters}
      onResetFilters={onResetFilters}
      loading={loading}
      error={error}
      dialogOpen={dialogOpen}
      editing={editing}
      form={form}
      accountOptions={accountOptions}
      categoryOptions={categoryOptions}
      loanOptions={loanOptions}
      onOpenCreate={onOpenCreate}
      onOpenEdit={onOpenEdit}
      onCloseDialog={onCloseDialog}
      onSubmit={onSubmit}
      onDelete={onDelete}
    />
  );
}
