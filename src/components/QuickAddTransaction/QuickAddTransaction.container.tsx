import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { QuickAddTransaction } from '@/components/QuickAddTransaction/QuickAddTransaction';
import {
  transactionFormSchema,
  type TransactionFormValues,
} from '@/shared/forms/transactionFormConfig';
import { useAccountStore } from '@/shared/store/accountStore';
import { useCategoryStore } from '@/shared/store/categoryStore';
import { useLoanStore } from '@/shared/store/loanStore';
import { useTransactionStore } from '@/shared/store/transactionStore';
import { useUIStore } from '@/shared/store/uiStore';

function todayIsoDate(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function QuickAddTransactionContainer() {
  const open = useUIStore((s) => s.quickAddOpen);
  const setOpen = useUIStore((s) => s.setQuickAddOpen);
  const { accounts, fetchAccounts } = useAccountStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { loans, fetchLoans } = useLoanStore();
  const { createTransaction, fetchTransactions } = useTransactionStore();

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
  }, [fetchAccounts, fetchCategories, fetchLoans]);

  useEffect(() => {
    if (!open) return;
    const first = accounts[0];
    form.reset({
      accountId: first?.id ?? '',
      categoryId: '',
      amount: 0,
      type: 'expense',
      occurredAt: todayIsoDate(),
      note: '',
      loanId: '',
    });
  }, [open, accounts, form]);

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

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const categoryId =
        values.categoryId && values.categoryId.length > 0 ? values.categoryId : null;
      const loanId =
        values.type === 'expense' && values.loanId && values.loanId.length > 0 ? values.loanId : null;
      await createTransaction({
        accountId: values.accountId,
        categoryId,
        loanId,
        amount: values.amount,
        type: values.type,
        occurredAt: values.occurredAt,
        note: values.note ?? null,
      });
      await fetchTransactions();
      setOpen(false);
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    }
  });

  return (
    <QuickAddTransaction
      open={open}
      onOpenChange={setOpen}
      form={form}
      accountOptions={accountOptions}
      categoryOptions={categoryOptions}
      loanOptions={loanOptions}
      onSubmit={onSubmit}
    />
  );
}
