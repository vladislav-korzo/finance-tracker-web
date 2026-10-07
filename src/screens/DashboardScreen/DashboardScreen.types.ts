import type { SpendingPeriod } from '@/shared/utils/format';

export type RecentActivityRow = {
  id: string;
  title: string;
  subtitle: string;
  occurredAt: string;
  amount: number;
  kind: 'income' | 'expense';
  category: { name: string; color: string; icon: string } | null;
  /** Валюта счёта транзакции */
  currency: string;
};

export type DashboardChartPoint = {
  label: string;
  income: number;
  expense: number;
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

export type DashboardScreenProps = {
  loading: boolean;
  loanSummary: DashboardLoanSummary;
  /** Сальдо по валютам (сумма балансов кошельков) */
  balanceByCurrency: DashboardCurrencyAmount[];
  /** Расходы за текущий месяц по валюте счёта */
  monthExpenseByCurrency: DashboardCurrencyAmount[];
  totalSaved: number;
  /** Валюта для верхних трёх карточек */
  displayCurrency: string;
  onDisplayCurrencyChange: (currency: string) => void;
  displayCurrencyOptions: string[];
  /** Загрузка курсов с open.er-api */
  kpiFxLoading: boolean;
  kpiFxError: boolean;
  /** Если не null — одна сумма в displayCurrency; иначе разбивка по валютам */
  kpiUnified: DashboardKpiUnified | null;
  chartByCurrency: { currency: string; data: DashboardChartPoint[] }[];
  /** Валюты кошельков для переключателей */
  currencies: string[];
  pieCurrency: string;
  onPieCurrencyChange: (currency: string) => void;
  topCurrency: string;
  onTopCurrencyChange: (currency: string) => void;
  pieCategoryPeriod: SpendingPeriod;
  onPieCategoryPeriodChange: (period: SpendingPeriod) => void;
  pieCategoryPeriodLabel: string;
  pieExpenseByCategory: CategoryExpenseSlice[];
  topCategoryPeriod: SpendingPeriod;
  onTopCategoryPeriodChange: (period: SpendingPeriod) => void;
  topCategoryPeriodLabel: string;
  topExpenseCategories: CategoryExpenseSlice[];
  topExpenseTotal: number;
  recentActivity: RecentActivityRow[];
};
