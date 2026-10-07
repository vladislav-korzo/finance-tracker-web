import type { TransactionType } from '@/shared/types/database';

export type RecentActivityRow = {
  id: string;
  title: string;
  subtitle: string;
  occurredAt: string;
  amount: number;
  kind: TransactionType;
  category: { name: string; color: string; icon: string } | null;
  /** Валюта счёта транзакции */
  currency: string;
};

export type CategoryExpenseSlice = {
  name: string;
  value: number;
  color: string;
  /** Имя иконки Lucide; для «Без категории» не задаётся */
  icon?: string;
};

export type DashboardCurrencyAmount = {
  currency: string;
  amount: number;
};

export type DashboardLoanSummary = {
  loanCount: number;
  byCurrency: { currency: string; remaining: number; paidThisMonth: number }[];
};

/** Сводка в выбранной валюте (курсы через USD); null — показать разбивку по валютам */
export type DashboardKpiUnified = {
  balance: number;
  monthExpense: number;
  totalSaved: number;
};
