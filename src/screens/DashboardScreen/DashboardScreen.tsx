import { motion } from 'framer-motion';
import { ChevronRight, Landmark, PiggyBank, TrendingDown, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { EmptyState, SectionCard } from '@/components/blocks';
import { Sparkline } from '@/components/blocks/Sparkline';
import { CategoryTag, TransactionTypeTag } from '@/components/tags';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardSkeleton } from '@/screens/DashboardScreen/DashboardScreen.skeleton';
import type { DashboardScreenProps } from '@/screens/DashboardScreen/DashboardScreen.types';
import { DEFAULT_ACCOUNT_CURRENCY } from '@/shared/constants/accountCurrencies';
import { cn } from '@/shared/lib/utils';
import { AnimatedNumber } from '@/shared/ui/motion/AnimatedNumber';
import { Stagger, StaggerItem } from '@/shared/ui/motion/Stagger';
import type { SpendingPeriod } from '@/shared/utils/format';
import {
  formatAxisCompact,
  formatDateDisplay,
  formatMoney,
  formatMoneyCompact,
} from '@/shared/utils/format';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

/** Themed tooltip shared by the area and donut charts. */
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
            <span className="text-muted-foreground">
              {entry.payload?.name ?? entry.name}
            </span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">
              {formatMoney(Number(entry.value ?? 0), currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CashFlowChart({
  data,
  currency,
}: {
  data: { label: string; income: number; expense: number }[];
  currency: string;
}) {
  const incId = `inc-${currency}`;
  const expId = `exp-${currency}`;
  return (
    <ResponsiveContainer width="100%" height={248}>
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

export function DashboardScreen(props: DashboardScreenProps) {
  const {
    loading,
    loanSummary,
    balanceByCurrency,
    monthExpenseByCurrency,
    totalSaved,
    displayCurrency,
    onDisplayCurrencyChange,
    displayCurrencyOptions,
    kpiFxLoading,
    kpiFxError,
    kpiUnified,
    chartByCurrency,
    currencies,
    pieCurrency,
    onPieCurrencyChange,
    topCurrency,
    onTopCurrencyChange,
    pieCategoryPeriod,
    onPieCategoryPeriodChange,
    pieCategoryPeriodLabel,
    pieExpenseByCategory,
    topCategoryPeriod,
    onTopCategoryPeriodChange,
    topCategoryPeriodLabel,
    topExpenseCategories,
    topExpenseTotal,
    recentActivity,
  } = props;

  const primaryCurrency = currencies[0] ?? DEFAULT_ACCOUNT_CURRENCY;
  const [cashflowCurrency, setCashflowCurrency] = useState<string>(primaryCurrency);
  const fmt = (value: number, currency: string) => formatMoney(value, currency);
  const showKpiUnified = !kpiFxLoading && kpiUnified != null;
  const pieExpenseTotal = pieExpenseByCategory.reduce((s, x) => s + x.value, 0);

  if (loading) return <DashboardSkeleton />;

  const activeChart =
    chartByCurrency.find((c) => c.currency === cashflowCurrency) ?? chartByCurrency[0];
  const heroSparkline = activeChart?.data.map((d) => d.income - d.expense) ?? [];

  // ---- KPI value resolution (single number vs per-currency breakdown) ----
  const balanceSingle = showKpiUnified
    ? kpiUnified.balance
    : balanceByCurrency.length === 1
      ? balanceByCurrency[0].amount
      : null;
  const balanceCurrency = showKpiUnified
    ? displayCurrency
    : (balanceByCurrency[0]?.currency ?? displayCurrency);

  const expenseSingle = showKpiUnified
    ? kpiUnified.monthExpense
    : monthExpenseByCurrency.length === 1
      ? monthExpenseByCurrency[0].amount
      : null;
  const expenseCurrency = showKpiUnified
    ? displayCurrency
    : (monthExpenseByCurrency[0]?.currency ?? displayCurrency);

  const savedSingle = showKpiUnified ? kpiUnified.totalSaved : totalSaved;
  const savedCurrency = showKpiUnified ? displayCurrency : primaryCurrency;

  return (
    <Stagger className="space-y-6">
      {/* Header */}
      <StaggerItem className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {greeting()} 👋
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Сводка пересчитывается в выбранную валюту по курсам к USD
            {kpiFxError ? ' · не удалось загрузить курсы' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Показать в</span>
          <Select
            value={displayCurrency}
            onValueChange={onDisplayCurrencyChange}
            disabled={displayCurrencyOptions.length === 0}
          >
            <SelectTrigger className="h-10 w-[110px]">
              <SelectValue placeholder="Валюта" />
            </SelectTrigger>
            <SelectContent>
              {displayCurrencyOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </StaggerItem>

      {/* KPI grid */}
      <StaggerItem className="grid gap-4 md:grid-cols-3">
        {/* Hero balance */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          className="group relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded-2xl bg-hero p-6 text-hero-foreground shadow-floating"
        >
          <div className="pointer-events-none absolute inset-0 bg-hero-sheen opacity-80" aria-hidden />
          <div className="relative flex items-start justify-between">
            <p className="text-sm font-medium text-hero-foreground/70">Общий баланс</p>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary transition-transform group-hover:scale-110">
              <Wallet className="size-5" strokeWidth={2} />
            </div>
          </div>
          <div className="relative mt-4">
            {kpiFxLoading ? (
              <p className="text-3xl font-bold tabular-nums text-hero-foreground/40">…</p>
            ) : balanceByCurrency.length === 0 ? (
              <p className="text-sm text-hero-foreground/70">Добавьте кошелёк, чтобы видеть баланс.</p>
            ) : balanceSingle !== null ? (
              <AnimatedNumber
                value={balanceSingle}
                format={(n) => fmt(n, balanceCurrency)}
                className={`text-3xl font-bold tracking-tight tabular-nums sm:text-[2rem] ${
                  balanceSingle < 0 ? 'text-expense' : ''
                }`}
              />
            ) : (
              <ul className="space-y-1.5">
                {balanceByCurrency.map((row) => (
                  <li key={row.currency} className="flex items-baseline justify-between gap-3">
                    <span className="text-xs font-medium text-hero-foreground/60">{row.currency}</span>
                    <span className="text-lg font-bold tabular-nums">{fmt(row.amount, row.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="text-xs text-hero-foreground/60">
                {showKpiUnified ? `Все счета в ${displayCurrency}` : 'По валютам счетов'}
              </p>
              {heroSparkline.length > 1 ? (
                <Sparkline data={heroSparkline} color="hsl(var(--primary))" width={104} height={34} />
              ) : null}
            </div>
          </div>
        </motion.div>

        {/* Month expense */}
        <KpiTile
          label="Расходы за месяц"
          icon={TrendingDown}
          loading={kpiFxLoading}
          single={expenseSingle}
          currency={expenseCurrency}
          rows={monthExpenseByCurrency}
          emptyText="Нет расходов в этом месяце."
          footer={showKpiUnified ? `За текущий месяц, в ${displayCurrency}` : 'За месяц, по валюте счёта'}
        />

        {/* Saved */}
        <KpiTile
          label="Всего накоплено"
          icon={PiggyBank}
          loading={kpiFxLoading}
          single={savedSingle}
          currency={savedCurrency}
          rows={[]}
          footer={
            showKpiUnified
              ? `Цели в ${primaryCurrency}, показано в ${displayCurrency}`
              : 'По целям в бюджете'
          }
          accent="income"
        />
      </StaggerItem>

      {/* Charts */}
      <StaggerItem className="grid gap-4 lg:grid-cols-5">
        <SectionCard
          className="lg:col-span-3"
          title="Денежный поток"
          description="Доходы и расходы за последние 7 дней"
          action={
            <div className="flex items-center gap-3">
              <Legend />
              {currencies.length > 1 ? (
                <Select value={cashflowCurrency} onValueChange={setCashflowCurrency}>
                  <SelectTrigger className="h-9 w-[92px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          }
        >
          {!activeChart || activeChart.data.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Пока нет данных"
              description="График появится после добавления счетов и операций."
              size="sm"
            />
          ) : (
            <CashFlowChart data={activeChart.data} currency={activeChart.currency} />
          )}
        </SectionCard>

        <SectionCard
          className="lg:col-span-2"
          title="Расходы по категориям"
          description={pieCategoryPeriodLabel}
          action={
            <div className="flex flex-wrap gap-2">
              {currencies.length > 1 ? (
                <CurrencySelect value={pieCurrency} onChange={onPieCurrencyChange} currencies={currencies} />
              ) : null}
              <PeriodSelect value={pieCategoryPeriod} onChange={onPieCategoryPeriodChange} />
            </div>
          }
        >
          {pieExpenseTotal <= 0 ? (
            <EmptyState
              icon={TrendingDown}
              title="Нет расходов"
              description="Категории появятся после операций за период."
              size="sm"
            />
          ) : (
            <ExpenseDonut data={pieExpenseByCategory} total={pieExpenseTotal} currency={pieCurrency} />
          )}
        </SectionCard>
      </StaggerItem>

      {/* Top categories */}
      <StaggerItem>
        <SectionCard
          title="Топ категорий по расходам"
          description={`До пяти категорий · ${topCategoryPeriodLabel}`}
          action={
            <div className="flex flex-wrap gap-2">
              {currencies.length > 1 ? (
                <CurrencySelect value={topCurrency} onChange={onTopCurrencyChange} currencies={currencies} />
              ) : null}
              <PeriodSelect value={topCategoryPeriod} onChange={onTopCategoryPeriodChange} />
            </div>
          }
        >
          {topExpenseTotal <= 0 ? (
            <EmptyState icon={TrendingDown} title="Нет расходов за период" size="sm" />
          ) : (
            <ul className="space-y-4">
              {topExpenseCategories.map((row, i) => {
                const share = topExpenseTotal > 0 ? (row.value / topExpenseTotal) * 100 : 0;
                return (
                  <li key={`${row.name}-${i}`}>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                          {i + 1}
                        </span>
                        <CategoryTag name={row.name} color={row.color} icon={row.icon} />
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-foreground">
                        {fmt(row.value, topCurrency)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 pl-[34px]">
                      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: row.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, share)}%` }}
                          transition={{ duration: 0.9, delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {share.toFixed(1)}%
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </StaggerItem>

      {/* Loans */}
      <StaggerItem>
        <SectionCard icon={Landmark} title="Кредиты" description={`Договоров: ${loanSummary.loanCount}`}
          action={
            <Link
              to="/credits"
              className="inline-flex items-center gap-1 text-sm font-semibold text-income-foreground transition-colors hover:text-income"
            >
              Подробнее
              <ChevronRight className="size-4" />
            </Link>
          }
        >
          {loanSummary.loanCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              Пока нет кредитов. Добавьте договор на странице «Кредиты», чтобы отслеживать остаток и платежи.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {loanSummary.byCurrency.map((row) => (
                <div key={row.currency} className="rounded-xl border border-border/70 bg-surface-2 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {row.currency}
                  </p>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="text-sm text-muted-foreground">Осталось</span>
                    <span className="font-bold tabular-nums text-foreground">{fmt(row.remaining, row.currency)}</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="text-sm text-muted-foreground">За месяц</span>
                    <span className="font-semibold tabular-nums text-foreground">{fmt(row.paidThisMonth, row.currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </StaggerItem>

      {/* Recent transactions */}
      <StaggerItem>
        <SectionCard
          title="Последние транзакции"
          action={
            <Link
              to="/transactions"
              className="inline-flex items-center gap-1 text-sm font-semibold text-income-foreground transition-colors hover:text-income"
            >
              Смотреть все
              <ChevronRight className="size-4" />
            </Link>
          }
          flush
          contentClassName="px-2 pb-2 sm:px-3 sm:pb-3"
        >
          {recentActivity.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Wallet}
                title="Пока нет транзакций"
                description="Нажмите «Добавить» в шапке, чтобы записать первую операцию."
                size="sm"
              />
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {recentActivity.map((row, i) => (
                <motion.li
                  key={row.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/50"
                >
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                    style={{
                      backgroundColor: row.category ? `${row.category.color}22` : 'hsl(var(--muted))',
                      color: row.category ? row.category.color : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {row.title.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{row.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.subtitle || formatDateDisplay(row.occurredAt)}
                    </p>
                  </div>
                  {row.category ? (
                    <div className="hidden sm:block">
                      <CategoryTag name={row.category.name} color={row.category.color} icon={row.category.icon} />
                    </div>
                  ) : null}
                  <TransactionTypeTag kind={row.kind} className="hidden md:inline-flex" />
                  <span
                    className={cn(
                      'shrink-0 text-right text-sm font-bold tabular-nums sm:text-base',
                      row.kind === 'income' ? 'text-income-foreground' : 'text-foreground'
                    )}
                  >
                    {row.kind === 'income' ? '+' : '−'}
                    {fmt(row.amount, row.currency)}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </SectionCard>
      </StaggerItem>
    </Stagger>
  );
}

/** Secondary KPI tile with count-up or per-currency breakdown. */
function KpiTile({
  label,
  icon: Icon,
  loading,
  single,
  currency,
  rows,
  emptyText,
  footer,
  accent,
}: {
  label: string;
  icon: typeof Wallet;
  loading: boolean;
  single: number | null;
  currency: string;
  rows: { currency: string; amount: number }[];
  emptyText?: string;
  footer: string;
  accent?: 'income';
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="group flex min-h-[160px] flex-col justify-between rounded-2xl border border-border/70 bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
            accent === 'income' ? 'bg-income/15 text-income-foreground' : 'bg-surface-2 text-foreground'
          )}
        >
          <Icon className="size-5" strokeWidth={2} />
        </div>
      </div>
      <div className="mt-4">
        {loading ? (
          <p className="text-2xl font-bold tabular-nums text-muted-foreground">…</p>
        ) : single !== null ? (
          <AnimatedNumber
            value={single}
            format={(n) => formatMoney(n, currency)}
            className="text-2xl font-bold tracking-tight tabular-nums text-foreground sm:text-[1.75rem]"
          />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ul className="space-y-1">
            {rows.map((row) => (
              <li key={row.currency} className="flex items-baseline justify-between gap-3">
                <span className="text-xs text-muted-foreground">{row.currency}</span>
                <span className="text-base font-bold tabular-nums text-foreground">
                  {formatMoney(row.amount, row.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted-foreground">{footer}</p>
      </div>
    </motion.div>
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

function ExpenseDonut({
  data,
  total,
  currency,
}: {
  data: { name: string; value: number; color: string }[];
  total: number;
  currency: string;
}) {
  const top = [...data].sort((a, b) => b.value - a.value).slice(0, 6);
  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
              stroke="hsl(var(--card))"
              strokeWidth={3}
              animationDuration={900}
            >
              {data.map((slice, i) => (
                <Cell key={`${slice.name}-${i}`} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip content={(p) => <ChartTooltip {...p} currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Всего</span>
          <span className="text-lg font-bold tabular-nums text-foreground">
            {formatMoneyCompact(total, currency)}
          </span>
        </div>
      </div>
      <ul className="space-y-1.5">
        {top.map((slice) => {
          const pct = total > 0 ? (slice.value / total) * 100 : 0;
          return (
            <li key={slice.name} className="flex items-center gap-2 text-sm">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{slice.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{pct.toFixed(0)}%</span>
              <span className="w-20 shrink-0 text-right font-semibold tabular-nums text-foreground">
                {formatMoneyCompact(slice.value, currency)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CurrencySelect({
  value,
  onChange,
  currencies,
}: {
  value: string;
  onChange: (v: string) => void;
  currencies: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[88px]">
        <SelectValue placeholder="Валюта" />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PeriodSelect({
  value,
  onChange,
}: {
  value: SpendingPeriod;
  onChange: (v: SpendingPeriod) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SpendingPeriod)}>
      <SelectTrigger className="h-9 w-[130px]">
        <SelectValue placeholder="Период" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="week">Неделя</SelectItem>
        <SelectItem value="month">Месяц</SelectItem>
        <SelectItem value="year">Год</SelectItem>
      </SelectContent>
    </Select>
  );
}
