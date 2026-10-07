import { motion } from 'framer-motion';
import { Check, Gauge, PiggyBank, Target, TrendingUp, Pencil, Trash2 } from 'lucide-react';

import { EmptyState, SectionCard, StatCard } from '@/components/blocks';
import { CategoryTag } from '@/components/tags';
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

import { BudgetSkeleton } from '@/screens/BudgetScreen/BudgetScreen.skeleton';
import type { BudgetScreenProps } from '@/screens/BudgetScreen/BudgetScreen.types';
import { ACCOUNT_CURRENCY_OPTIONS } from '@/shared/constants/accountCurrencies';
import { AnimatedNumber } from '@/shared/ui/motion/AnimatedNumber';
import { Stagger, StaggerItem } from '@/shared/ui/motion/Stagger';
import { formatMoney } from '@/shared/utils/format';

export function BudgetScreen(props: BudgetScreenProps) {
  const {
    goals,
    categoryLimits,
    limitsCurrency,
    loading,
    error,
    dialogOpen,
    editing,
    form,
    onOpenCreate,
    onOpenEdit,
    onCloseDialog,
    onSubmit,
    onDelete,
  } = props;

  // Goals can be in different currencies, so summarise per currency.
  const currencies = Array.from(new Set(goals.map((g) => g.currency)));
  const totalsByCurrency = currencies.map((cur) => {
    const inCur = goals.filter((g) => g.currency === cur);
    return {
      currency: cur,
      saved: inCur.reduce((s, g) => s + g.saved_amount, 0),
      target: inCur.reduce((s, g) => s + g.target_amount, 0),
    };
  });
  const singleCurrency = currencies.length === 1 ? currencies[0] : null;
  const completedCount = goals.filter((g) => g.saved_amount >= g.target_amount).length;

  return (
    <>
      <Stagger className="space-y-6">
        {/* Header */}
        <StaggerItem className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Бюджет</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Цели накоплений — отслеживайте прогресс к важным для вас целям.
            </p>
          </div>
          <Button type="button" onClick={onOpenCreate}>
            Новая цель
          </Button>
        </StaggerItem>

        {error ? (
          <StaggerItem>
            <p className="text-sm text-destructive">{error}</p>
          </StaggerItem>
        ) : null}

        {loading ? (
          <BudgetSkeleton />
        ) : (
          <>
            {/* Summary */}
            {goals.length > 0 ? (
              <StaggerItem className="grid gap-4 md:grid-cols-3">
                <StatCard
                  label="Всего отложено"
                  icon={PiggyBank}
                  footer={`По ${goals.length} ${goalsWord(goals.length)}`}
                >
                  <CurrencyTotals rows={totalsByCurrency} field="saved" single={singleCurrency} />
                </StatCard>
                <StatCard label="Цель накоплений" icon={Target} footer="Сумма всех целей">
                  <CurrencyTotals rows={totalsByCurrency} field="target" single={singleCurrency} />
                </StatCard>
                <StatCard
                  label="Достигнуто целей"
                  icon={TrendingUp}
                  footer={
                    completedCount === goals.length ? 'Все цели достигнуты 🎉' : 'Целей выполнено'
                  }
                >
                  <div className="text-2xl font-bold tabular-nums text-foreground sm:text-[1.75rem]">
                    {completedCount} / {goals.length}
                  </div>
                </StatCard>
              </StaggerItem>
            ) : null}

            {/* Goals */}
            <StaggerItem>
              <SectionCard
                icon={PiggyBank}
                title="Цели накоплений"
                description={`Всего: ${goals.length}`}
              >
                {goals.length === 0 ? (
                  <EmptyState
                    icon={PiggyBank}
                    title="Пока нет целей"
                    description="Создайте первую цель, чтобы видеть прогресс к накоплениям."
                    action={
                      <Button type="button" onClick={onOpenCreate}>
                        Создать цель
                      </Button>
                    }
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {goals.map((g, i) => {
                      const pct =
                        g.target_amount > 0
                          ? Math.min(100, (g.saved_amount / g.target_amount) * 100)
                          : 0;
                      const done = pct >= 100;
                      const remaining = Math.max(0, g.target_amount - g.saved_amount);
                      const fmtG = (n: number) => formatMoney(n, g.currency);
                      return (
                        <motion.div
                          key={g.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                          className="group relative flex flex-col gap-4 rounded-2xl border border-border/70 bg-surface-2 p-5 transition-shadow hover:shadow-card-hover"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="truncate font-semibold text-foreground">{g.name}</h3>
                                {done ? (
                                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-income/15 px-2 py-0.5 text-xs font-semibold text-income-foreground">
                                    <Check className="size-3" strokeWidth={3} />
                                    Готово
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                <AnimatedNumber
                                  value={g.saved_amount}
                                  format={fmtG}
                                  className="font-semibold tabular-nums text-foreground"
                                />{' '}
                                из{' '}
                                <AnimatedNumber
                                  value={g.target_amount}
                                  format={fmtG}
                                  className="tabular-nums"
                                />
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Редактировать ${g.name}`}
                                onClick={() => onOpenEdit(g)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Удалить ${g.name}`}
                                onClick={() => onDelete(g)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="mt-auto space-y-2">
                            <Progress
                              value={pct}
                              color={done ? 'hsl(var(--income))' : undefined}
                            />
                            <div className="flex items-center justify-between text-xs">
                              <span
                                className={
                                  done
                                    ? 'font-semibold tabular-nums text-income-foreground'
                                    : 'font-semibold tabular-nums text-foreground'
                                }
                              >
                                {pct.toFixed(0)}%
                              </span>
                              <span className="tabular-nums text-muted-foreground">
                                {done ? 'Цель достигнута' : `Осталось ${fmtG(remaining)}`}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </StaggerItem>

            {categoryLimits.length > 0 ? (
              <StaggerItem>
                <SectionCard
                  icon={Gauge}
                  title="Лимиты трат за месяц"
                  description="Расходы по категориям относительно установленных лимитов"
                >
                  <ul className="space-y-5">
                    {categoryLimits.map((c, i) => {
                      const pct = c.limit > 0 ? (c.spent / c.limit) * 100 : 0;
                      const over = c.spent > c.limit;
                      return (
                        <motion.li
                          key={c.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <CategoryTag name={c.name} color={c.color} icon={c.icon} />
                            <span
                              className={`shrink-0 font-semibold tabular-nums ${
                                over ? 'text-expense-foreground' : 'text-foreground'
                              }`}
                            >
                              {formatMoney(c.spent, limitsCurrency)} /{' '}
                              {formatMoney(c.limit, limitsCurrency)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-3">
                            <Progress
                              value={Math.min(100, pct)}
                              color={over ? 'hsl(var(--expense))' : undefined}
                              className="flex-1"
                            />
                            <span
                              className={`w-12 shrink-0 text-right text-xs tabular-nums ${
                                over ? 'text-expense-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {over
                              ? `Превышен на ${formatMoney(c.spent - c.limit, limitsCurrency)}`
                              : `Осталось ${formatMoney(c.limit - c.spent, limitsCurrency)}`}
                          </p>
                        </motion.li>
                      );
                    })}
                  </ul>
                </SectionCard>
              </StaggerItem>
            ) : null}
          </>
        )}
      </Stagger>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && onCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать цель' : 'Новая цель накоплений'}</DialogTitle>
            <DialogDescription>Укажите целевую сумму и сколько уже отложено.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input placeholder="Путешествие мечты" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Валюта</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите валюту" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACCOUNT_CURRENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Целевая сумма</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="savedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Уже отложено</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
              ) : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onCloseDialog}>
                  Отмена
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Сохранение…' : 'Сохранить'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Russian declension for the "По N <целям>" footer (dative case). */
function goalsWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  return mod10 === 1 && mod100 !== 11 ? 'цели' : 'целям';
}

/** Renders a single animated total when goals share a currency, else a per-currency list. */
function CurrencyTotals({
  rows,
  field,
  single,
}: {
  rows: { currency: string; saved: number; target: number }[];
  field: 'saved' | 'target';
  single: string | null;
}) {
  if (single && rows.length > 0) {
    return (
      <AnimatedNumber
        value={rows[0][field]}
        format={(n) => formatMoney(n, single)}
        className="text-2xl font-bold tabular-nums text-foreground sm:text-[1.75rem]"
      />
    );
  }
  return (
    <ul className="space-y-1">
      {rows.map((r) => (
        <li key={r.currency} className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-muted-foreground">{r.currency}</span>
          <span className="text-base font-bold tabular-nums text-foreground">
            {formatMoney(r[field], r.currency)}
          </span>
        </li>
      ))}
    </ul>
  );
}
