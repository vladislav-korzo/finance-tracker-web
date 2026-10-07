import { useCallback, useEffect, useMemo, useState } from 'react';

import { DashboardScreen } from '@/screens/DashboardScreen/DashboardScreen';
import {
  buildLastSevenDaysChartByCurrency,
  buildMonthExpenseByCategory,
  computeBalances,
  expenseByCurrencyForPeriod,
  groupBalanceByCurrency,
} from '@/screens/DashboardScreen/DashboardScreen.utils';
import type { DashboardLoanSummary } from '@/screens/DashboardScreen/DashboardScreen.types';
import {
  endOfMonthIso,
  formatSpendingPeriodLabel,
  getSpendingPeriodRange,
  startOfMonthIso,
  type SpendingPeriod,
} from '@/shared/utils/format';
import { useAccountStore } from '@/shared/store/accountStore';
import { useBudgetStore } from '@/shared/store/budgetStore';
import { useCategoryStore } from '@/shared/store/categoryStore';
import { useLoanStore } from '@/shared/store/loanStore';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { useTransactionStore } from '@/shared/store/transactionStore';
import {
  fetchUsdRates,
  sumConvertedAmounts,
  type UsdRatesMap,
} from '@/shared/utils/exchangeRates';
import {
  ACCOUNT_CURRENCY_CODES,
  DEFAULT_ACCOUNT_CURRENCY,
} from '@/shared/constants/accountCurrencies';
import { sumLoanRepayments } from '@/shared/utils/loan';

export function DashboardScreenContainer() {
  const { accounts, fetchAccounts, loading: accountsLoading } = useAccountStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { transactions, fetchTransactions, loading: txLoading } = useTransactionStore();
  const { goals, fetchGoals, loading: budgetLoading } = useBudgetStore();
  const { loans, fetchLoans, loading: loansLoading } = useLoanStore();

  useEffect(() => {
    void fetchAccounts();
    void fetchCategories();
    void fetchTransactions();
    void fetchGoals();
    void fetchLoans();
  }, [fetchAccounts, fetchCategories, fetchTransactions, fetchGoals, fetchLoans]);

  const [pieCategoryPeriod, setPieCategoryPeriod] = useState<SpendingPeriod>('month');
  const [topCategoryPeriod, setTopCategoryPeriod] = useState<SpendingPeriod>('month');
  const [pieCurrency, setPieCurrency] = useState('');
  const [topCurrency, setTopCurrency] = useState('');
  const [displayCurrency, setDisplayCurrency] = useState<string>(
    () => useSettingsStore.getState().defaultCurrency
  );
  const [usdRates, setUsdRates] = useState<UsdRatesMap | null>(null);
  const [kpiFxLoading, setKpiFxLoading] = useState(true);
  const [kpiFxError, setKpiFxError] = useState(false);

  const currencies = useMemo(
    () => [...new Set(accounts.map((a) => a.currency))].sort(),
    [accounts]
  );

  useEffect(() => {
    let cancelled = false;
    setKpiFxLoading(true);
    setKpiFxError(false);
    void (async () => {
      const r = await fetchUsdRates();
      if (cancelled) return;
      if (r) {
        setUsdRates(r);
        setKpiFxError(false);
      } else {
        setUsdRates(null);
        setKpiFxError(true);
      }
      setKpiFxLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Фиксированный способ отображения сводки: не зависит от валют кошельков (конвертация через курсы). */
  const displayCurrencyOptions = useMemo<string[]>(() => [...ACCOUNT_CURRENCY_CODES], []);

  const displayCurrencyEffective = useMemo(() => {
    if (displayCurrencyOptions.includes(displayCurrency)) return displayCurrency;
    return displayCurrencyOptions[0] ?? DEFAULT_ACCOUNT_CURRENCY;
  }, [displayCurrency, displayCurrencyOptions]);

  useEffect(() => {
    if (!displayCurrencyOptions.includes(displayCurrency)) {
      setDisplayCurrency(displayCurrencyOptions[0]);
    }
  }, [displayCurrency, displayCurrencyOptions]);

  const from = startOfMonthIso();
  const to = endOfMonthIso();

  const pieCurrencyEffective =
    pieCurrency && currencies.includes(pieCurrency) ? pieCurrency : (currencies[0] ?? DEFAULT_ACCOUNT_CURRENCY);
  const topCurrencyEffective =
    topCurrency && currencies.includes(topCurrency) ? topCurrency : (currencies[0] ?? DEFAULT_ACCOUNT_CURRENCY);

  const { from: pieFrom, to: pieTo } = useMemo(
    () => getSpendingPeriodRange(pieCategoryPeriod),
    [pieCategoryPeriod]
  );

  const { from: topFrom, to: topTo } = useMemo(
    () => getSpendingPeriodRange(topCategoryPeriod),
    [topCategoryPeriod]
  );

  const pieCategoryPeriodLabel = useMemo(
    () => formatSpendingPeriodLabel(pieCategoryPeriod),
    [pieCategoryPeriod]
  );

  const topCategoryPeriodLabel = useMemo(
    () => formatSpendingPeriodLabel(topCategoryPeriod),
    [topCategoryPeriod]
  );

  const onPieCategoryPeriodChange = useCallback((p: SpendingPeriod) => {
    setPieCategoryPeriod(p);
  }, []);

  const onTopCategoryPeriodChange = useCallback((p: SpendingPeriod) => {
    setTopCategoryPeriod(p);
  }, []);

  const withBalances = useMemo(
    () => computeBalances(accounts, transactions),
    [accounts, transactions]
  );

  const balanceByCurrency = useMemo(() => groupBalanceByCurrency(withBalances), [withBalances]);

  const monthExpenseByCurrency = useMemo(
    () => expenseByCurrencyForPeriod(transactions, accounts, from, to),
    [transactions, accounts, from, to]
  );

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const loanSummary: DashboardLoanSummary = useMemo(() => {
    const remainingBy = new Map<string, number>();
    for (const loan of loans) {
      const paid = sumLoanRepayments(transactions, loan.id);
      const remaining = Math.max(0, loan.total_amount - paid);
      remainingBy.set(loan.currency, (remainingBy.get(loan.currency) ?? 0) + remaining);
    }
    const paidMonthBy = new Map<string, number>();
    for (const t of transactions) {
      if (!t.loan_id || t.type !== 'expense') continue;
      if (t.occurred_at < from || t.occurred_at > to) continue;
      const loan = loans.find((l) => l.id === t.loan_id);
      if (!loan) continue;
      paidMonthBy.set(loan.currency, (paidMonthBy.get(loan.currency) ?? 0) + t.amount);
    }
    const all = new Set([...remainingBy.keys(), ...paidMonthBy.keys()]);
    const byCurrency = [...all]
      .sort((a, b) => a.localeCompare(b))
      .map((currency) => ({
        currency,
        remaining: remainingBy.get(currency) ?? 0,
        paidThisMonth: paidMonthBy.get(currency) ?? 0,
      }));
    return { loanCount: loans.length, byCurrency };
  }, [loans, transactions, from, to]);

  const totalSaved = useMemo(() => goals.reduce((s, g) => s + g.saved_amount, 0), [goals]);

  const kpiUnified = useMemo(() => {
    if (kpiFxLoading || kpiFxError || !usdRates) return null;
    const to = displayCurrencyEffective;
    if (usdRates[to] == null) return null;
    const balance = sumConvertedAmounts(balanceByCurrency, to, usdRates);
    const monthExpense = sumConvertedAmounts(monthExpenseByCurrency, to, usdRates);
    const savedConv = sumConvertedAmounts(
      goals.map((g) => ({ currency: g.currency, amount: g.saved_amount })),
      to,
      usdRates
    );
    if (balance == null || monthExpense == null || savedConv == null) return null;
    return { balance, monthExpense, totalSaved: savedConv };
  }, [
    kpiFxLoading,
    kpiFxError,
    usdRates,
    displayCurrencyEffective,
    balanceByCurrency,
    monthExpenseByCurrency,
    goals,
  ]);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const chartByCurrency = useMemo(
    () =>
      buildLastSevenDaysChartByCurrency(transactions, currencies, (id) => accountById.get(id)?.currency),
    [transactions, currencies, accountById]
  );

  const txsForPieCurrency = useMemo(
    () => transactions.filter((t) => accountById.get(t.account_id)?.currency === pieCurrencyEffective),
    [transactions, accountById, pieCurrencyEffective]
  );

  const txsForTopCurrency = useMemo(
    () => transactions.filter((t) => accountById.get(t.account_id)?.currency === topCurrencyEffective),
    [transactions, accountById, topCurrencyEffective]
  );

  const pieExpenseByCategory = useMemo(
    () => buildMonthExpenseByCategory(txsForPieCurrency, pieFrom, pieTo, categoryById),
    [txsForPieCurrency, pieFrom, pieTo, categoryById]
  );

  const topExpenseByCategoryFull = useMemo(
    () => buildMonthExpenseByCategory(txsForTopCurrency, topFrom, topTo, categoryById),
    [txsForTopCurrency, topFrom, topTo, categoryById]
  );

  const topExpenseCategories = useMemo(
    () => topExpenseByCategoryFull.slice(0, 5),
    [topExpenseByCategoryFull]
  );

  const topExpenseTotal = useMemo(
    () => topExpenseByCategoryFull.reduce((s, x) => s + x.value, 0),
    [topExpenseByCategoryFull]
  );

  const recentActivity = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => b.occurred_at.localeCompare(a.occurred_at) || b.created_at.localeCompare(a.created_at)
    );
    return sorted.slice(0, 5).map((t) => {
      const accountName = withBalances.find((x) => x.id === t.account_id)?.name ?? '—';
      const cat = t.category_id ? categoryById.get(t.category_id) : undefined;
      const categoryName = cat?.name ?? null;
      const note = t.note?.trim();
      const title =
        note ||
        categoryName ||
        (t.type === 'income' ? 'Доход' : 'Расход');
      const subtitle = note || categoryName ? accountName : '';
      const category =
        cat != null
          ? { name: cat.name, color: cat.color, icon: cat.icon }
          : null;
      const currency = accountById.get(t.account_id)?.currency ?? currencies[0] ?? DEFAULT_ACCOUNT_CURRENCY;
      return {
        id: t.id,
        title,
        subtitle,
        occurredAt: t.occurred_at,
        amount: t.amount,
        kind: t.type,
        category,
        currency,
      };
    });
  }, [transactions, withBalances, categoryById, accountById, currencies]);

  const loading = accountsLoading || txLoading || budgetLoading || loansLoading;

  return (
    <DashboardScreen
      loading={loading}
      loanSummary={loanSummary}
      balanceByCurrency={balanceByCurrency}
      monthExpenseByCurrency={monthExpenseByCurrency}
      totalSaved={totalSaved}
      displayCurrency={displayCurrencyEffective}
      onDisplayCurrencyChange={setDisplayCurrency}
      displayCurrencyOptions={displayCurrencyOptions}
      kpiFxLoading={kpiFxLoading}
      kpiFxError={kpiFxError}
      kpiUnified={kpiUnified}
      chartByCurrency={chartByCurrency}
      currencies={currencies}
      pieCurrency={pieCurrencyEffective}
      onPieCurrencyChange={setPieCurrency}
      topCurrency={topCurrencyEffective}
      onTopCurrencyChange={setTopCurrency}
      pieCategoryPeriod={pieCategoryPeriod}
      onPieCategoryPeriodChange={onPieCategoryPeriodChange}
      pieCategoryPeriodLabel={pieCategoryPeriodLabel}
      pieExpenseByCategory={pieExpenseByCategory}
      topCategoryPeriod={topCategoryPeriod}
      onTopCategoryPeriodChange={onTopCategoryPeriodChange}
      topCategoryPeriodLabel={topCategoryPeriodLabel}
      topExpenseCategories={topExpenseCategories}
      topExpenseTotal={topExpenseTotal}
      recentActivity={recentActivity}
    />
  );
}
