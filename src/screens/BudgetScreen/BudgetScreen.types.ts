import type { UseFormReturn } from 'react-hook-form';

import type { BudgetGoal } from '@/shared/types/entities';

import type { BudgetGoalFormValues } from '@/screens/BudgetScreen/BudgetScreen.formConfig';

export type CategoryLimitRow = {
  id: string;
  name: string;
  color: string;
  icon: string;
  limit: number;
  spent: number;
};

export type BudgetScreenProps = {
  goals: BudgetGoal[];
  categoryLimits: CategoryLimitRow[];
  limitsCurrency: string;
  loading: boolean;
  error: string | null;
  dialogOpen: boolean;
  editing: BudgetGoal | null;
  form: UseFormReturn<BudgetGoalFormValues>;
  defaultCurrency: string;
  onOpenCreate: () => void;
  onOpenEdit: (goal: BudgetGoal) => void;
  onCloseDialog: () => void;
  onSubmit: () => void;
  onDelete: (goal: BudgetGoal) => void;
};
