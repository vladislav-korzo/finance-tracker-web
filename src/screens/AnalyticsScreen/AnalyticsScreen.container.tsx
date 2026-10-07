import { useEffect, useMemo } from 'react';

import { AnalyticsScreen } from '@/screens/AnalyticsScreen/AnalyticsScreen';
import { DEFAULT_ACCOUNT_CURRENCY } from '@/shared/constants/accountCurrencies';
import { buildLastSixMonthsChart } from '@/screens/DashboardScreen/DashboardScreen.utils';
import { useAccountStore } from '@/shared/store/accountStore';
import { useTransactionStore } from '@/shared/store/transactionStore';

export function AnalyticsScreenContainer() {
  const { accounts, fetchAccounts, loading: accountsLoading } = useAccountStore();
  const { transactions, fetchTransactions, loading: txLoading } = useTransactionStore();

  useEffect(() => {
    void fetchAccounts();
    void fetchTransactions();
  }, [fetchAccounts, fetchTransactions]);

  const chartData = useMemo(() => buildLastSixMonthsChart(transactions), [transactions]);
  const defaultCurrency = accounts[0]?.currency ?? DEFAULT_ACCOUNT_CURRENCY;
  const loading = accountsLoading || txLoading;

  return (
    <AnalyticsScreen loading={loading} chartData={chartData} defaultCurrency={defaultCurrency} />
  );
}
