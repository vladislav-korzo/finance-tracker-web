import { motion } from 'framer-motion';
import { CalendarClock, Landmark, Pencil, Percent, Plus, Trash2, Wallet } from 'lucide-react';
import { useMemo } from 'react';

import { CategoryTag } from '@/components/tags';
import { EmptyState, SectionCard, StatCard } from '@/components/blocks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { CreditsSkeleton } from '@/screens/CreditsScreen/CreditsScreen.skeleton';
import type {
  CreditsScreenProps,
  LoanWithStats,
} from '@/screens/CreditsScreen/CreditsScreen.types';
import { DEFAULT_ACCOUNT_CURRENCY } from '@/shared/constants/accountCurrencies';
import { ACCOUNT_CURRENCY_OPTIONS } from '@/shared/constants/accountCurrencies';
import { cn } from '@/shared/lib/utils';
import type { Transaction } from '@/shared/types/entities';
import { AnimatedNumber } from '@/shared/ui/motion/AnimatedNumber';
import { Stagger, StaggerItem } from '@/shared/ui/motion/Stagger';
import type { LoanMonthPaymentStatus } from '@/shared/utils/loanSchedule';
import { formatDate, formatMoney, formatMoneyCompact } from '@/shared/utils/format';

function monthPaymentStatusLabel(status: LoanMonthPaymentStatus): string {
  switch (status) {
    case 'paid':
      return 'Оплачено';
    case 'partial':
      return 'Частично';
    case 'unpaid':
      return 'Не оплачено';
    case 'upcoming':
      return 'Предстоит';
    default:
      return '';
  }
}

function monthPaymentStatusClass(status: LoanMonthPaymentStatus): string {
  switch (status) {
    case 'paid':
      return 'bg-income/15 text-income-foreground';
    case 'partial':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
    case 'unpaid':
      return 'bg-expense/15 text-expense-foreground';
    case 'upcoming':
      return 'bg-muted text-muted-foreground';
    default:
      return '';
  }
}

/** Progress color shifts from amber → green as the loan gets paid down. */
function progressColor(pct: number): string {
  if (pct >= 100) return 'hsl(var(--income))';
  if (pct >= 60) return 'hsl(var(--chart-2))';
  if (pct >= 25) return 'hsl(var(--chart-5))';
  return 'hsl(var(--chart-1))';
}

/** Small labelled stat used inside a loan card. */
function LoanStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Percent;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface-2 px-3.5 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card text-muted-foreground">
        <Icon className="size-4" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold tabular-nums text-foreground">{value}</p>
      </div>
    </div>
  );
}

function LoanCard({
  loan,
  index,
  txs,
  accountOptions,
  categoryOptions,
  onOpenEditLoan,
  onDeleteLoan,
  onOpenPayment,
}: {
  loan: LoanWithStats;
  index: number;
  txs: Transaction[];
  accountOptions: CreditsScreenProps['accountOptions'];
  categoryOptions: CreditsScreenProps['categoryOptions'];
  onOpenEditLoan: CreditsScreenProps['onOpenEditLoan'];
  onDeleteLoan: CreditsScreenProps['onDeleteLoan'];
  onOpenPayment: CreditsScreenProps['onOpenPayment'];
}) {
  const monthly = loan.scheduleEstimate?.approxTotalNextMonth ?? null;
  const pct = loan.progressPct;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <SectionCard>
        <div className="group/card">
          {/* Header: name + meta + actions */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-foreground">
                <Landmark className="size-5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  {loan.name}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Валюта {loan.currency}
                  {loan.payment_end_year != null ? ` · до ${loan.payment_end_year} г.` : ''}
                  {loan.remaining_schedule_months != null
                    ? ` · ${loan.remaining_schedule_months} платежей`
                    : ''}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity sm:opacity-0 sm:group-hover/card:opacity-100">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Редактировать кредит"
                onClick={() => onOpenEditLoan(loan)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Удалить кредит"
                onClick={() => onDeleteLoan(loan)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-5">
            <div className="mb-2 flex items-end justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Погашено</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatMoneyCompact(loan.paid, loan.currency)}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  из {formatMoneyCompact(loan.total_amount, loan.currency)}
                </span>
              </span>
            </div>
            <Progress value={pct} color={progressColor(pct)} />
            <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
              <span>{pct.toFixed(0)}%</span>
              <span>
                Осталось {formatMoneyCompact(loan.remaining, loan.currency)}
              </span>
            </div>
          </div>

          {/* Key figures: remaining + monthly */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-surface-2 p-4">
              <p className="text-xs text-muted-foreground">Остаток долга</p>
              <AnimatedNumber
                value={loan.remaining}
                format={(n) => formatMoney(n, loan.currency)}
                className="mt-1 block text-xl font-bold tracking-tight tabular-nums text-foreground"
              />
            </div>
            <div className="rounded-xl border border-border/70 bg-surface-2 p-4">
              <p className="text-xs text-muted-foreground">Платёж в месяц ~</p>
              {monthly != null ? (
                <AnimatedNumber
                  value={monthly}
                  format={(n) => formatMoney(n, loan.currency)}
                  className="mt-1 block text-xl font-bold tracking-tight tabular-nums text-foreground"
                />
              ) : (
                <p className="mt-1 text-xl font-bold tracking-tight tabular-nums text-muted-foreground">
                  —
                </p>
              )}
            </div>
          </div>

          {/* Small labelled stats */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <LoanStat
              icon={Percent}
              label="Ставка, % годовых"
              value={loan.annual_interest_rate != null ? `${loan.annual_interest_rate}%` : '—'}
            />
            <LoanStat
              icon={CalendarClock}
              label="Год окончания"
              value={loan.payment_end_year != null ? String(loan.payment_end_year) : '—'}
            />
          </div>

          {loan.scheduleEstimate ? (
            <div className="mt-5 rounded-xl border border-border/70 bg-muted/40 p-4 text-sm">
              <p className="mb-2 font-medium text-foreground">Ориентир на ближайший месяц</p>
              <p className="text-muted-foreground">
                Осталось по сроку ~{loan.scheduleEstimate.monthsRemaining} мес. Доля основного долга ~
                {formatMoney(loan.scheduleEstimate.approxPrincipalPortion, loan.currency)}, проценты ~
                {formatMoney(loan.scheduleEstimate.approxInterestPortion, loan.currency)} (
                {loan.annual_interest_rate}% годовых на текущий остаток). Всего ориентировочно ~{' '}
                {formatMoney(loan.scheduleEstimate.approxTotalNextMonth, loan.currency)}.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Упрощённо: тело делится поровну на оставшиеся месяцы до конца года окончания; доля
                процентов в реальном графике может отличаться.
              </p>
            </div>
          ) : null}

          {loan.monthlySchedule && loan.monthlySchedule.length > 0 ? (
            <div className="mt-5 space-y-2">
              <h4 className="text-sm font-semibold text-foreground">График по месяцам</h4>
              <p className="text-xs text-muted-foreground">
                План: тело и проценты по остатку (число месяцев — из поля «осталось платежей» или по
                календарю до года окончания). Факт — сумма расходов по кредиту за месяц. В будущих
                месяцах статус «Предстоит».
              </p>
              <div className="max-h-80 overflow-auto rounded-xl border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Месяц</TableHead>
                      <TableHead className="text-right">Тело</TableHead>
                      <TableHead className="text-right">Проценты</TableHead>
                      <TableHead className="text-right">План (всего)</TableHead>
                      <TableHead className="text-right">Оплачено</TableHead>
                      <TableHead className="w-[1%] whitespace-nowrap">Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loan.monthlySchedule.map((row) => (
                      <TableRow key={row.monthKey}>
                        <TableCell className="whitespace-nowrap">{row.monthLabel}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(row.principal, loan.currency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(row.interest, loan.currency)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatMoney(row.total, loan.currency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(row.paidAmount, loan.currency)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                              monthPaymentStatusClass(row.status)
                            )}
                          >
                            {monthPaymentStatusLabel(row.status)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}

          {loan.note ? (
            <p className="mt-4 rounded-xl bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground">
              {loan.note}
            </p>
          ) : null}

          {/* Operations */}
          <div className="mt-5 flex items-center justify-between gap-2 border-t border-border/70 pt-4">
            <h4 className="text-sm font-semibold text-foreground">Операции по кредиту</h4>
            <Button type="button" size="sm" variant="outline" onClick={() => onOpenPayment(loan)}>
              <Plus className="size-4" />
              Записать платёж
            </Button>
          </div>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Счёт</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Платежей пока нет.
                    </TableCell>
                  </TableRow>
                ) : (
                  txs.map((t) => {
                    const acc = accountOptions.find((a) => a.id === t.account_id);
                    const accName = acc?.name ?? '—';
                    const accCurrency = acc?.currency ?? DEFAULT_ACCOUNT_CURRENCY;
                    const cat = categoryOptions.find((c) => c.id === t.category_id);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(t.occurred_at)}</TableCell>
                        <TableCell>{accName}</TableCell>
                        <TableCell>
                          {cat ? (
                            <CategoryTag name={cat.name} color={cat.color} icon={cat.icon} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-medium tabular-nums',
                            t.type === 'income' ? 'text-income-foreground' : 'text-expense-foreground'
                          )}
                        >
                          {t.type === 'income' ? '+' : '−'}
                          {formatMoney(t.amount, accCurrency)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SectionCard>
    </motion.div>
  );
}

export function CreditsScreen(props: CreditsScreenProps) {
  const {
    loans,
    loanTransactions,
    loading,
    error,
    loanDialogOpen,
    editingLoan,
    loanForm,
    paymentDialogOpen,
    paymentLoan,
    paymentForm,
    accountOptions,
    categoryOptions,
    onOpenCreateLoan,
    onOpenEditLoan,
    onCloseLoanDialog,
    onSubmitLoan,
    onDeleteLoan,
    onOpenPayment,
    onClosePaymentDialog,
    onSubmitPayment,
  } = props;

  // Per-currency totals for the summary row (data supports multiple currencies).
  const summary = useMemo(() => {
    const byCurrency = new Map<string, { remaining: number; monthly: number }>();
    for (const loan of loans) {
      const entry = byCurrency.get(loan.currency) ?? { remaining: 0, monthly: 0 };
      entry.remaining += loan.remaining;
      entry.monthly += loan.scheduleEstimate?.approxTotalNextMonth ?? 0;
      byCurrency.set(loan.currency, entry);
    }
    return Array.from(byCurrency.entries())
      .map(([currency, v]) => ({ currency, ...v }))
      .sort((a, b) => b.remaining - a.remaining);
  }, [loans]);

  return (
    <>
      <Stagger className="space-y-6">
        {/* Header */}
        <StaggerItem className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Сумма к погашению, ставка, год окончания — для ориентира по телу и процентам. Если в
            выписке другое число оставшихся платежей, укажите его отдельно — график посчитается по
            нему. Фактические платежи вносите как расходы с привязкой к кредиту.
          </p>
          <Button type="button" onClick={onOpenCreateLoan} className="shrink-0">
            <Plus className="size-4" />
            Добавить кредит
          </Button>
        </StaggerItem>

        {error ? (
          <StaggerItem>
            <p className="text-sm text-destructive">{error}</p>
          </StaggerItem>
        ) : null}

        {loading ? (
          <StaggerItem>
            <CreditsSkeleton />
          </StaggerItem>
        ) : loans.length === 0 ? (
          <StaggerItem>
            <EmptyState
              icon={Landmark}
              title="Пока нет кредитов"
              description="Добавьте договор: название, валюту и сколько всего нужно вернуть банку. Дальше отслеживайте остаток, график и платежи."
              action={
                <Button type="button" onClick={onOpenCreateLoan}>
                  <Plus className="size-4" />
                  Добавить кредит
                </Button>
              }
            />
          </StaggerItem>
        ) : (
          <>
            {/* Summary row */}
            <StaggerItem className="grid gap-4 sm:grid-cols-2">
              <StatCard
                label="Остаток долга"
                icon={Wallet}
                value={summary.length === 1 ? summary[0].remaining : undefined}
                format={(n) => formatMoney(n, summary[0]?.currency ?? DEFAULT_ACCOUNT_CURRENCY)}
                footer={summary.length > 1 ? 'По валютам кредитов' : `Кредитов: ${loans.length}`}
              >
                {summary.length > 1 ? (
                  <ul className="space-y-1.5">
                    {summary.map((row) => (
                      <li
                        key={row.currency}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          {row.currency}
                        </span>
                        <span className="text-lg font-bold tabular-nums text-foreground">
                          {formatMoney(row.remaining, row.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : undefined}
              </StatCard>

              <StatCard
                label="Платёж в месяц ~"
                icon={CalendarClock}
                value={summary.length === 1 ? summary[0].monthly : undefined}
                format={(n) => formatMoney(n, summary[0]?.currency ?? DEFAULT_ACCOUNT_CURRENCY)}
                delay={0.1}
                footer="Ориентировочно, тело + проценты"
              >
                {summary.length > 1 ? (
                  <ul className="space-y-1.5">
                    {summary.map((row) => (
                      <li
                        key={row.currency}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          {row.currency}
                        </span>
                        <span className="text-lg font-bold tabular-nums text-foreground">
                          {formatMoney(row.monthly, row.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : undefined}
              </StatCard>
            </StaggerItem>

            {/* Loan cards */}
            <StaggerItem className="space-y-6">
              {loans.map((loan, i) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  index={i}
                  txs={loanTransactions.get(loan.id) ?? []}
                  accountOptions={accountOptions}
                  categoryOptions={categoryOptions}
                  onOpenEditLoan={onOpenEditLoan}
                  onDeleteLoan={onDeleteLoan}
                  onOpenPayment={onOpenPayment}
                />
              ))}
            </StaggerItem>
          </>
        )}
      </Stagger>

      <Dialog open={loanDialogOpen} onOpenChange={(open) => !open && onCloseLoanDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLoan ? 'Редактировать кредит' : 'Новый кредит'}</DialogTitle>
            <DialogDescription>
              Сумма к погашению, ставка и год окончания. Если осталось не столько месяцев, сколько
              получается «до конца года» в календаре, заполните «осталось платежей» — тогда график
              совпадёт с вашим сроком. Платежи по факту вносите отдельно.
            </DialogDescription>
          </DialogHeader>
          <Form {...loanForm}>
            <form onSubmit={onSubmitLoan} className="space-y-4">
              <FormField
                control={loanForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input placeholder="Ипотека, кредит наличными…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loanForm.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Валюта</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACCOUNT_CURRENCY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loanForm.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Всего к погашению</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loanForm.control}
                name="annualInterestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ставка, % годовых (необязательно)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="Например 11,5"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loanForm.control}
                name="paymentEndYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Платежи до какого года (необязательно)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="Например 2040"
                        maxLength={4}
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loanForm.control}
                name="remainingScheduleMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Осталось платежей по графику (необязательно)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="Например 36 — из выписки"
                        maxLength={3}
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Если указано, тело долга в графике делится на это число месяцев, а не на месяцы
                      «до конца года окончания» в календаре. Удобно, если кредит заканчивается раньше
                      или срок в договоре не совпадает с полем «год».
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loanForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Заметка</FormLabel>
                    <FormControl>
                      <Input placeholder="Банк, дата договора…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {loanForm.formState.errors.root?.message ? (
                <p className="text-sm text-destructive">{loanForm.formState.errors.root.message}</p>
              ) : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onCloseLoanDialog}>
                  Отмена
                </Button>
                <Button type="submit" disabled={loanForm.formState.isSubmitting}>
                  {loanForm.formState.isSubmitting ? 'Сохранение…' : 'Сохранить'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={(open) => !open && onClosePaymentDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Платёж по кредиту</DialogTitle>
            <DialogDescription>
              {paymentLoan ? (
                <>Создаётся расход с привязкой к «{paymentLoan.name}». Счёт — откуда ушли деньги.</>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={onSubmitPayment} className="space-y-4">
              <FormField
                control={paymentForm.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Кошелёк</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Счёт списания" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountOptions.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Категория (необязательно)</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === '_none' ? '' : v)}
                      value={field.value && field.value.length > 0 ? field.value : '_none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Нет</SelectItem>
                        {categoryOptions
                          .filter((c) => c.type === 'expense')
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              <CategoryTag name={c.name} color={c.color} icon={c.icon} />
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сумма платежа</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="occurredAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Комментарий</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {paymentForm.formState.errors.root?.message ? (
                <p className="text-sm text-destructive">
                  {paymentForm.formState.errors.root.message}
                </p>
              ) : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClosePaymentDialog}>
                  Отмена
                </Button>
                <Button type="submit" disabled={paymentForm.formState.isSubmitting}>
                  {paymentForm.formState.isSubmitting ? 'Сохранение…' : 'Записать'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
