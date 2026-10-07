import { ArrowLeftRight, BarChart3, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, LineChart, type barDataItem, type lineDataItem } from 'react-native-gifted-charts';

import { EmptyState, ScreenHeader, SectionCard, StatCard } from '@components/blocks';
import { Text } from '@components/ui/text';
import { DEFAULT_ACCOUNT_CURRENCY } from '@/shared/constants/accountCurrencies';
import { useAccountStore } from '@/shared/store/accountStore';
import { useTransactionStore } from '@/shared/store/transactionStore';
import { tokenColor, useResolvedTheme, useToken } from '@/shared/theme/tokens';
import { Stagger, StaggerItem } from '@/shared/ui/motion';
import { formatAxisCompact, formatMoney } from '@/shared/utils/format';

import { buildLastSixMonthsChart, type CashFlowPoint } from '@screens/AnalyticsScreen/AnalyticsScreen.utils';

/** Shared legend (income / expense swatches) used by both charts. */
function ChartLegend({ income, expense }: { income: string; expense: string }) {
  return (
    <View className="flex-row items-center gap-4">
      <View className="flex-row items-center gap-1.5">
        <View className="size-2.5 rounded-full" style={{ backgroundColor: income }} />
        <Text weight="semibold" className="text-xs text-muted-foreground">
          Доход
        </Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <View className="size-2.5 rounded-full" style={{ backgroundColor: expense }} />
        <Text weight="semibold" className="text-xs text-muted-foreground">
          Расход
        </Text>
      </View>
    </View>
  );
}

/** Glass-ish floating card rendered by both charts when a point/bar is focused. */
function FocusTooltip({
  label,
  income,
  expense,
  currency,
  surface,
  border,
  incomeColor,
  expenseColor,
}: {
  label: string;
  income: number;
  expense: number;
  currency: string;
  surface: string;
  border: string;
  incomeColor: string;
  expenseColor: string;
}) {
  return (
    <View
      className="rounded-xl border px-3 py-2"
      style={{ backgroundColor: surface, borderColor: border, minWidth: 132 }}
    >
      <Text weight="medium" className="mb-1 text-xs text-muted-foreground">
        {label}
      </Text>
      <View className="gap-1">
        <View className="flex-row items-center gap-2">
          <View className="size-2 rounded-full" style={{ backgroundColor: incomeColor }} />
          <Text className="text-xs text-muted-foreground">Доход</Text>
          <Text weight="semibold" className="ml-auto text-xs text-foreground">
            {formatMoney(income, currency)}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="size-2 rounded-full" style={{ backgroundColor: expenseColor }} />
          <Text className="text-xs text-muted-foreground">Расход</Text>
          <Text weight="semibold" className="ml-auto text-xs text-foreground">
            {formatMoney(expense, currency)}
          </Text>
        </View>
      </View>
    </View>
  );
}

type ChartTheme = {
  income: string;
  incomeSoft: string;
  expense: string;
  expenseSoft: string;
  axisText: string;
  rules: string;
  surface: string;
  border: string;
};

/** Six-month income-vs-expense filled area chart (two overlaid series). */
function CashFlowAreaChart({
  data,
  width,
  currency,
  colors,
}: {
  data: CashFlowPoint[];
  width: number;
  currency: string;
  colors: ChartTheme;
}) {
  // Two parallel series: the first carries the x-axis labels, the second only values.
  const incomeData: lineDataItem[] = data.map((p) => ({ value: p.income, label: p.label }));
  const expenseData: lineDataItem[] = data.map((p) => ({ value: p.expense }));

  const maxValue = Math.max(1, ...data.map((p) => Math.max(p.income, p.expense)));
  // Reserve space for the y-axis labels so the plot fits the card.
  const spacing = Math.max(36, (width - 56) / Math.max(1, data.length));

  return (
    <LineChart
      data={incomeData}
      data2={expenseData}
      width={width}
      height={220}
      spacing={spacing}
      initialSpacing={spacing / 2}
      endSpacing={8}
      adjustToWidth
      maxValue={maxValue * 1.15}
      noOfSections={4}
      areaChart
      curved
      thickness={2.5}
      color1={colors.income}
      color2={colors.expense}
      startFillColor1={colors.income}
      endFillColor1={colors.income}
      startOpacity1={0.28}
      endOpacity1={0.02}
      startFillColor2={colors.expense}
      endFillColor2={colors.expense}
      startOpacity2={0.24}
      endOpacity2={0.02}
      hideDataPoints
      yAxisThickness={0}
      xAxisThickness={0}
      rulesColor={colors.rules}
      rulesType="dashed"
      yAxisTextStyle={{ color: colors.axisText, fontSize: 11 }}
      xAxisLabelTextStyle={{ color: colors.axisText, fontSize: 11 }}
      formatYLabel={(label) => formatAxisCompact(Number(label))}
      isAnimated
      animationDuration={900}
      disableScroll
      pointerConfig={{
        pointerStripHeight: 220,
        pointerStripColor: colors.rules,
        pointerStripWidth: 1,
        pointer1Color: colors.income,
        pointer2Color: colors.expense,
        radius: 4,
        pointerLabelWidth: 140,
        pointerLabelHeight: 90,
        activatePointersOnLongPress: false,
        autoAdjustPointerLabelPosition: true,
        pointerLabelComponent: (items: lineDataItem[]) => {
          const point = items?.[0];
          const idx = point?.label ? data.findIndex((d) => d.label === point.label) : -1;
          const row = idx >= 0 ? data[idx] : data[data.length - 1];
          return (
            <FocusTooltip
              label={row.label}
              income={row.income}
              expense={row.expense}
              currency={currency}
              surface={colors.surface}
              border={colors.border}
              incomeColor={colors.income}
              expenseColor={colors.expense}
            />
          );
        },
      }}
    />
  );
}

/** Six-month grouped bars (income + expense per month). */
function MonthlyComparisonChart({
  data,
  width,
  currency,
  colors,
}: {
  data: CashFlowPoint[];
  width: number;
  currency: string;
  colors: ChartTheme;
}) {
  const barWidth = 12;
  // Interleave income/expense bars; `spacing` separates the pair, the larger
  // gap before each income bar (via `label` only on income) groups by month.
  const barData: barDataItem[] = data.flatMap((p, i) => [
    {
      value: p.income,
      label: p.label,
      spacing: 4,
      labelWidth: 56,
      frontColor: colors.income,
      gradientColor: colors.incomeSoft,
      showGradient: true,
    },
    {
      value: p.expense,
      frontColor: colors.expense,
      gradientColor: colors.expenseSoft,
      showGradient: true,
      // wider trailing gap between month groups (none after the last bar)
      spacing: i === data.length - 1 ? 0 : 24,
    },
  ]);

  const maxValue = Math.max(1, ...data.map((p) => Math.max(p.income, p.expense)));

  return (
    <BarChart
      data={barData}
      width={width}
      height={220}
      barWidth={barWidth}
      initialSpacing={16}
      maxValue={maxValue * 1.15}
      noOfSections={4}
      roundedTop
      barBorderRadius={4}
      yAxisThickness={0}
      xAxisThickness={0}
      rulesColor={colors.rules}
      rulesType="dashed"
      yAxisTextStyle={{ color: colors.axisText, fontSize: 11 }}
      xAxisLabelTextStyle={{ color: colors.axisText, fontSize: 11 }}
      formatYLabel={(label) => formatAxisCompact(Number(label))}
      isAnimated
      animationDuration={900}
      disableScroll
      focusBarOnPress
      focusedBarConfig={{ opacity: 1 }}
      renderTooltip={(item: barDataItem) => {
        const idx = item?.label ? data.findIndex((d) => d.label === item.label) : -1;
        const row = idx >= 0 ? data[idx] : undefined;
        if (!row) return null;
        return (
          <View style={{ marginBottom: 8, marginLeft: -36 }}>
            <FocusTooltip
              label={row.label}
              income={row.income}
              expense={row.expense}
              currency={currency}
              surface={colors.surface}
              border={colors.border}
              incomeColor={colors.income}
              expenseColor={colors.expense}
            />
          </View>
        );
      }}
    />
  );
}

export default function AnalyticsScreen() {
  const theme = useResolvedTheme();
  const { accounts, fetchAccounts } = useAccountStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const [refreshing, setRefreshing] = useState(false);

  const tintColor = useToken('primary');

  useEffect(() => {
    void fetchAccounts();
    void fetchTransactions();
  }, [fetchAccounts, fetchTransactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchAccounts(), fetchTransactions()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAccounts, fetchTransactions]);

  const chartData = useMemo(() => buildLastSixMonthsChart(transactions), [transactions]);
  const defaultCurrency = accounts[0]?.currency ?? DEFAULT_ACCOUNT_CURRENCY;

  const fmt = useCallback((value: number) => formatMoney(value, defaultCurrency), [defaultCurrency]);

  const { totalIncome, totalExpense, net, hasData, incomeSpark, expenseSpark, netSpark } =
    useMemo(() => {
      const inc = chartData.reduce((s, x) => s + x.income, 0);
      const exp = chartData.reduce((s, x) => s + x.expense, 0);
      return {
        totalIncome: inc,
        totalExpense: exp,
        net: inc - exp,
        hasData: chartData.some((x) => x.income > 0 || x.expense > 0),
        incomeSpark: chartData.map((x) => x.income),
        expenseSpark: chartData.map((x) => x.expense),
        netSpark: chartData.map((x) => x.income - x.expense),
      };
    }, [chartData]);

  const { width } = useWindowDimensions();
  // Card content width: screen minus screen padding (px-5 → 20*2) and card padding (px-5 → 20*2).
  const chartWidth = Math.max(240, width - 40 - 40);

  const incomeColor = tokenColor('income', theme);
  const expenseColor = tokenColor('expense', theme);
  const chartColors: ChartTheme = {
    income: incomeColor,
    incomeSoft: tokenColor('income', theme, 0.45),
    expense: expenseColor,
    expenseSoft: tokenColor('expense', theme, 0.4),
    axisText: tokenColor('muted-foreground', theme),
    rules: tokenColor('border', theme, 0.6),
    surface: tokenColor('popover', theme),
    border: tokenColor('border', theme, 0.7),
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScreenHeader
        title="Аналитика"
        subtitle={`Доходы и расходы за 6 месяцев · ${defaultCurrency}`}
      />

      <ScrollView
        contentContainerClassName="gap-6 px-5 pb-10 pt-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tintColor} />
        }
      >
        <Stagger className="gap-6">
          {/* Summary */}
          <StaggerItem>
            <View className="gap-4">
              <StatCard
                label="Доходы за 6 месяцев"
                value={totalIncome}
                format={fmt}
                icon={TrendingUp}
                sparkline={incomeSpark}
                sparklineColor={incomeColor}
                footer="Сумма поступлений за период"
              />
              <View className="flex-row gap-4">
                <StatCard
                  className="flex-1"
                  label="Расходы"
                  value={totalExpense}
                  format={fmt}
                  icon={TrendingDown}
                  sparkline={expenseSpark}
                  sparklineColor={expenseColor}
                />
                <StatCard
                  className="flex-1"
                  label="Чистый поток"
                  value={net}
                  format={fmt}
                  icon={PiggyBank}
                  sparkline={netSpark}
                  sparklineColor={net >= 0 ? incomeColor : expenseColor}
                />
              </View>
            </View>
          </StaggerItem>

          {/* Cash flow area chart */}
          <StaggerItem>
            <SectionCard
              icon={ArrowLeftRight}
              title="Денежный поток"
              description={`Динамика за 6 месяцев · ${defaultCurrency}`}
            >
              {hasData ? (
                <View className="gap-4">
                  <ChartLegend income={incomeColor} expense={expenseColor} />
                  <CashFlowAreaChart
                    data={chartData}
                    width={chartWidth}
                    currency={defaultCurrency}
                    colors={chartColors}
                  />
                </View>
              ) : (
                <EmptyState
                  icon={TrendingUp}
                  title="Пока нет данных"
                  description="График появится после добавления счетов и операций."
                  size="sm"
                />
              )}
            </SectionCard>
          </StaggerItem>

          {/* Monthly comparison bars */}
          <StaggerItem>
            <SectionCard
              icon={BarChart3}
              title="Сравнение по месяцам"
              description={`Доходы и расходы помесячно · ${defaultCurrency}`}
            >
              {hasData ? (
                <View className="gap-4">
                  <ChartLegend income={incomeColor} expense={expenseColor} />
                  <MonthlyComparisonChart
                    data={chartData}
                    width={chartWidth}
                    currency={defaultCurrency}
                    colors={chartColors}
                  />
                </View>
              ) : (
                <EmptyState
                  icon={TrendingDown}
                  title="Нет операций"
                  description="Столбцы появятся, как только появятся доходы или расходы."
                  size="sm"
                />
              )}
            </SectionCard>
          </StaggerItem>
        </Stagger>
      </ScrollView>
    </SafeAreaView>
  );
}
