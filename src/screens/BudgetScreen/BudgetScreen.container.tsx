import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  budgetGoalFormSchema,
  type BudgetGoalFormValues,
} from '@/screens/BudgetScreen/BudgetScreen.formConfig';
import { confirm } from '@/components/ConfirmDialog/confirmStore';
import { BudgetScreen } from '@/screens/BudgetScreen/BudgetScreen';
import { DEFAULT_ACCOUNT_CURRENCY } from '@/shared/constants/accountCurrencies';
import type { BudgetGoal } from '@/shared/types/entities';
import { useAccountStore } from '@/shared/store/accountStore';
import { useBudgetStore } from '@/shared/store/budgetStore';
import { useCategoryStore } from '@/shared/store/categoryStore';
import { useTransactionStore } from '@/shared/store/transactionStore';
import { endOfMonthIso, startOfMonthIso } from '@/shared/utils/format';

export function BudgetScreenContainer() {
  const { accounts, fetchAccounts } = useAccountStore();
  const { goals, loading, error, fetchGoals, createGoal, updateGoal, deleteGoal } = useBudgetStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetGoal | null>(null);

  const form = useForm<BudgetGoalFormValues>({
    resolver: zodResolver(budgetGoalFormSchema),
    defaultValues: {
      name: '',
      currency: DEFAULT_ACCOUNT_CURRENCY,
      targetAmount: 0,
      savedAmount: 0,
    },
  });

  useEffect(() => {
    void fetchAccounts();
    void fetchGoals();
    void fetchCategories();
    void fetchTransactions();
  }, [fetchAccounts, fetchGoals, fetchCategories, fetchTransactions]);

  const defaultCurrency = accounts[0]?.currency ?? DEFAULT_ACCOUNT_CURRENCY;

  /** This-month spend vs limit for expense categories that have a limit set. */
  const categoryLimits = useMemo(() => {
    const from = startOfMonthIso();
    const to = endOfMonthIso();
    const spent: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type !== 'expense' || !t.category_id) continue;
      if (t.occurred_at < from || t.occurred_at > to) continue;
      spent[t.category_id] = (spent[t.category_id] ?? 0) + t.amount;
    }
    return categories
      .filter((c) => c.type === 'expense' && c.monthly_limit != null)
      .map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        icon: c.icon,
        limit: c.monthly_limit as number,
        spent: spent[c.id] ?? 0,
      }))
      .sort((a, b) => b.spent / b.limit - a.spent / a.limit);
  }, [categories, transactions]);

  const onOpenCreate = () => {
    setEditing(null);
    form.reset({ name: '', currency: defaultCurrency, targetAmount: 0, savedAmount: 0 });
    setDialogOpen(true);
  };

  const onOpenEdit = (goal: BudgetGoal) => {
    setEditing(goal);
    form.reset({
      name: goal.name,
      currency: goal.currency,
      targetAmount: goal.target_amount,
      savedAmount: goal.saved_amount,
    });
    setDialogOpen(true);
  };

  const onCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing) {
        await updateGoal(
          editing.id,
          values.name,
          values.currency,
          values.targetAmount,
          values.savedAmount
        );
      } else {
        await createGoal(values.name, values.currency, values.targetAmount, values.savedAmount);
      }
      onCloseDialog();
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    }
  });

  const onDelete = async (goal: BudgetGoal) => {
    const ok = await confirm({
      title: 'Удалить цель?',
      description: `«${goal.name}» будет удалена.`,
      confirmText: 'Удалить',
    });
    if (!ok) return;
    void deleteGoal(goal.id);
  };

  return (
    <BudgetScreen
      goals={goals}
      categoryLimits={categoryLimits}
      limitsCurrency={defaultCurrency}
      loading={loading}
      error={error}
      dialogOpen={dialogOpen}
      editing={editing}
      form={form}
      defaultCurrency={defaultCurrency}
      onOpenCreate={onOpenCreate}
      onOpenEdit={onOpenEdit}
      onCloseDialog={onCloseDialog}
      onSubmit={onSubmit}
      onDelete={onDelete}
    />
  );
}
