import { ArrowLeftRight, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { EmptyState, SectionCard, StatCard } from '@/components/blocks';
import { AnalyticsSkeleton } from '@/screens/AnalyticsScreen/AnalyticsScreen.skeleton';
import type { AnalyticsScreenProps } from '@/screens/AnalyticsScreen/AnalyticsScreen.types';
import { Stagger, StaggerItem } from '@/shared/ui/motion/Stagger';
import { formatAxisCompact, formatMoney } from '@/shared/utils/format';

type ChartPoint = { label: string; income: number; expense: number };

/** Themed glass tooltip shared by the area and bar charts. */
function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ name?: string | number; value?: unknown; color?: string; payload?: { name?: string } }>;
  label?: string | number;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl border border-border/70 px-3 py-2 shadow-floating">
      {label ? <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
            <span className="text-muted-foreground">{entry.payload?.name ?? entry.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">
              {formatMoney(Number(entry.value ?? 0), currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-income" />
        Доход
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-expense" />
        Расход
      </span>
    </div>
  );
}

function CashFlowChart({ data, currency }: { data: ChartPoint[]; currency: string }) {
  const incId = `analytics-inc-${currency}`;
  const expId = `analytics-exp-${currency}`;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 6, left: -14, bottom: 0 }}>
        <defs>
          <linearGradient id={incId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--income))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--income))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={expId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--expense))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--expense))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(v) => formatAxisCompact(Number(v))}
        />
        <Tooltip
          content={(p) => <ChartTooltip {...p} currency={currency} />}
          cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="income"
          name="Доход"
          stroke="hsl(var(--income))"
          strokeWidth={2.5}
          fill={`url(#${incId})`}
          animationDuration={900}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="expense"
          name="Расход"
          stroke="hsl(var(--expense))"
          strokeWidth={2.5}
          fill={`url(#${expId})`}
          animationDuration={900}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MonthlyComparisonChart({ data, currency }: { data: ChartPoint[]; currency: string }) {
  const incId = `analytics-bar-inc-${currency}`;
  const expId = `analytics-bar-exp-${currency}`;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 6, left: -14, bottom: 0 }} barGap={6}>
        <defs>
          <linearGradient id={incId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--income))" stopOpacity={0.95} />
            <stop offset="100%" stopColor="hsl(var(--income))" stopOpacity={0.55} />
          </linearGradient>
          <linearGradient id={expId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--expense))" stopOpacity={0.95} />
            <stop offset="100%" stopColor="hsl(var(--expense))" stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(v) => formatAxisCompact(Number(v))}
        />
        <Tooltip
          content={(p) => <ChartTooltip {...p} currency={currency} />}
          cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.4 }}
        />
        <Bar
          dataKey="income"
          name="Доход"
          fill={`url(#${incId})`}
          radius={[6, 6, 0, 0]}
          maxBarSize={36}
          animationDuration={900}
        />
        <Bar
          dataKey="expense"
          name="Расход"
          fill={`url(#${expId})`}
          radius={[6, 6, 0, 0]}
          maxBarSize={36}
          animationDuration={900}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AnalyticsScreen(props: AnalyticsScreenProps) {
  const { loading, chartData, defaultCurrency } = props;

  if (loading) return <AnalyticsSkeleton />;

  const fmt = (value: number) => formatMoney(value, defaultCurrency);

  const totalIncome = chartData.reduce((s, x) => s + x.income, 0);
  const totalExpense = chartData.reduce((s, x) => s + x.expense, 0);
  const net = totalIncome - totalExpense;
  const hasData = chartData.some((x) => x.income > 0 || x.expense > 0);

  const incomeSparkline = chartData.map((x) => x.income);
  const expenseSparkline = chartData.map((x) => x.expense);
  const netSparkline = chartData.map((x) => x.income - x.expense);

  return (
    <Stagger className="space-y-6">
      {/* Header */}
      <StaggerItem>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Аналитика</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Доходы и расходы за последние 6 месяцев · валюта {defaultCurrency}
        </p>
      </StaggerItem>

      {/* Summary */}
      <StaggerItem className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Доходы за 6 месяцев"
          value={totalIncome}
          format={fmt}
          icon={TrendingUp}
          sparkline={incomeSparkline}
          sparklineColor="hsl(var(--income))"
          footer="Сумма поступлений за период"
        />
        <StatCard
          label="Расходы за 6 месяцев"
          value={totalExpense}
          format={fmt}
          icon={TrendingDown}
          sparkline={expenseSparkline}
          sparklineColor="hsl(var(--expense))"
          footer="Сумма списаний за период"
        />
        <StatCard
          label="Чистый поток"
          value={net}
          format={fmt}
          icon={PiggyBank}
          sparkline={netSparkline}
          sparklineColor={net >= 0 ? 'hsl(var(--income))' : 'hsl(var(--expense))'}
          footer={net >= 0 ? 'Накоплено сверх расходов' : 'Расходы превысили доходы'}
        />
      </StaggerItem>

      {/* Cash flow */}
      <StaggerItem>
        <SectionCard
          icon={ArrowLeftRight}
          title="Денежный поток"
          description={`Динамика за последние 6 месяцев · ${defaultCurrency}`}
          action={<Legend />}
        >
          {hasData ? (
            <CashFlowChart data={chartData} currency={defaultCurrency} />
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

      {/* Monthly comparison */}
      <StaggerItem>
        <SectionCard
          title="Сравнение по месяцам"
          description={`Доходы и расходы помесячно · ${defaultCurrency}`}
          action={<Legend />}
        >
          {hasData ? (
            <MonthlyComparisonChart data={chartData} currency={defaultCurrency} />
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
  );
}
