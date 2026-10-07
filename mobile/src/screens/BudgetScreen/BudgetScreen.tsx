import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Gauge, PiggyBank, Plus, Target, Trash2, TrendingUp } from 'lucide-react-native';

import { EmptyState, ScreenHeader, SectionCard, StatCard } from '@components/blocks';
import { CategoryIcon } from '@components/CategoryIcon';
import { Button } from '@components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Progress } from '@components/ui/progress';
import { Select } from '@components/ui/select';
import { Sheet, SheetContent } from '@components/ui/sheet';
import { Skeleton } from '@components/ui/skeleton';
import { Text } from '@components/ui/text';
import { confirm } from '@components/ConfirmDialog';

import {
  budgetGoalFormSchema,
  type BudgetGoalFormValues,
} from '@screens/BudgetScreen/BudgetScreen.formConfig';
import { ACCOUNT_CURRENCY_OPTIONS, DEFAULT_ACCOUNT_CURRENCY } from '@/shared/constants/accountCurrencies';
import { useAccountStore } from '@/shared/store/accountStore';
import { useBudgetStore } from '@/shared/store/budgetStore';
import { useCategoryStore } from '@/shared/store/categoryStore';
import { useTransactionStore } from '@/shared/store/transactionStore';
import { tokenColor, useResolvedTheme, useToken } from '@/shared/theme/tokens';
import type { BudgetGoal } from '@/shared/types/entities';
import { AnimatedNumber, Stagger, StaggerItem } from '@/shared/ui/motion';
import { endOfMonthIso, formatAmount, formatMoney, startOfMonthIso } from '@/shared/utils/format';

/** This-month category spend vs limit, computed locally (mirrors the web container). */
type CategoryLimitRow = {
  id: string;
  name: string;
  color: string;
  icon: string;
  limit: number;
  spent: number;
};

type CurrencyTotal = { currency: string; saved: number; target: number };

export default function BudgetScreen() {
  const { accounts, fetchAccounts } = useAccountStore();
  const { goals, loading, error, fetchGoals, createGoal, updateGoal, deleteGoal } =
    useBudgetStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { transactions, fetchTransactions } = useTransactionStore();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetGoal | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Token colours that feed RN props (icons, RefreshControl) which can't take
  // className. Read once at the top so the hook order stays stable.
  const addIconColor = useToken('primary-foreground');
  const refreshTint = useToken('muted-foreground');

  const form = useForm<BudgetGoalFormValues>({
    resolver: zodResolver(budgetGoalFormSchema),
    defaultValues: {
      name: '',
      currency: DEFAULT_ACCOUNT_CURRENCY,
      targetAmount: 0,
      savedAmount: 0,
    },
  });

  useEffect(() => {
    void fetchAccounts();
    void fetchGoals();
    void fetchCategories();
    void fetchTransactions();
  }, [fetchAccounts, fetchGoals, fetchCategories, fetchTransactions]);

  const defaultCurrency = accounts[0]?.currency ?? DEFAULT_ACCOUNT_CURRENCY;
  const limitsCurrency = defaultCurrency;

  // Currency options for the goal form, limited to the currencies actually in
  // use across the user's accounts (falls back to all supported codes when no
  // accounts exist yet). Mirrors the brief's "limited to active account
  // currencies" requirement.
  const currencyOptions = useMemo(() => {
    const active = new Set(accounts.map((a) => a.currency));
    const filtered = ACCOUNT_CURRENCY_OPTIONS.filter((o) => active.has(o.value));
    const base = filtered.length > 0 ? filtered : ACCOUNT_CURRENCY_OPTIONS;
    return base.map((o) => ({ label: o.label, value: o.value }));
  }, [accounts]);

  // Per-currency saved/target totals (goals may span several currencies).
  const { totalsByCurrency, singleCurrency, completedCount } = useMemo(() => {
    const currencies = Array.from(new Set(goals.map((g) => g.currency)));
    const totals: CurrencyTotal[] = currencies.map((cur) => {
      const inCur = goals.filter((g) => g.currency === cur);
      return {
        currency: cur,
        saved: inCur.reduce((s, g) => s + g.saved_amount, 0),
        target: inCur.reduce((s, g) => s + g.target_amount, 0),
      };
    });
    return {
      totalsByCurrency: totals,
      singleCurrency: currencies.length === 1 ? currencies[0] : null,
      completedCount: goals.filter((g) => g.saved_amount >= g.target_amount).length,
    };
  }, [goals]);

  // This-month spend vs limit for expense categories that carry a monthly limit.
  const categoryLimits = useMemo<CategoryLimitRow[]>(() => {
    const from = startOfMonthIso();
    const to = endOfMonthIso();
    const spent: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type !== 'expense' || !t.category_id) continue;
      if (t.occurred_at < from || t.occurred_at > to) continue;
      spent[t.category_id] = (spent[t.category_id] ?? 0) + t.amount;
    }
    return categories
      .filter((c) => c.type === 'expense' && c.monthly_limit != null)
      .map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        icon: c.icon,
        limit: c.monthly_limit as number,
        spent: spent[c.id] ?? 0,
      }))
      .sort((a, b) => b.spent / b.limit - a.spent / a.limit);
  }, [categories, transactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchAccounts(),
        fetchGoals(),
        fetchCategories(),
        fetchTransactions(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: '', currency: defaultCurrency, targetAmount: 0, savedAmount: 0 });
    setSheetOpen(true);
  };

  const openEdit = (goal: BudgetGoal) => {
    setEditing(goal);
    form.reset({
      name: goal.name,
      currency: goal.currency,
      targetAmount: goal.target_amount,
      savedAmount: goal.saved_amount,
    });
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditing(null);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing) {
        await updateGoal(
          editing.id,
          values.name,
          values.currency,
          values.targetAmount,
          values.savedAmount,
        );
      } else {
        await createGoal(values.name, values.currency, values.targetAmount, values.savedAmount);
      }
      closeSheet();
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    }
  });

  const onDelete = async () => {
    if (!editing) return;
    const ok = await confirm({
      title: 'Удалить цель?',
      description: `«${editing.name}» будет удалена.`,
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;
    await deleteGoal(editing.id);
    closeSheet();
  };

  const showSkeleton = loading && goals.length === 0;
  const rootError = form.formState.errors.root?.message;
  const submitting = form.formState.isSubmitting;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {/* Header */}
      <ScreenHeader
        title="Бюджет"
        subtitle="Цели и лимиты трат."
        action={
          <Button size="icon" onPress={openCreate} accessibilityLabel="Новая цель">
            <Plus size={20} color={addIconColor} strokeWidth={2.5} />
          </Button>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-1 gap-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={refreshTint} />
        }
      >
        {error ? (
          <View className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <Text weight="medium" className="text-sm text-destructive">
              {error}
            </Text>
          </View>
        ) : null}

        {showSkeleton ? (
          <BudgetSkeleton />
        ) : (
          <Stagger className="gap-5">
            {/* Summary */}
            {goals.length > 0 ? (
              <StaggerItem className="gap-4">
                <StatCard
                  label="Всего отложено"
                  icon={PiggyBank}
                  footer={`По ${goals.length} ${goalsWord(goals.length)}`}
                >
                  <CurrencyTotals rows={totalsByCurrency} field="saved" single={singleCurrency} />
                </StatCard>
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <StatCard label="Цель накоплений" icon={Target} footer="Сумма всех целей">
                      <CurrencyTotals
                        rows={totalsByCurrency}
                        field="target"
                        single={singleCurrency}
                      />
                    </StatCard>
                  </View>
                  <View className="flex-1">
                    <StatCard
                      label="Достигнуто целей"
                      icon={TrendingUp}
                      footer={
                        completedCount === goals.length
                          ? 'Все цели достигнуты 🎉'
                          : 'Целей выполнено'
                      }
                    >
                      <Text weight="bold" className="text-2xl tracking-tight text-foreground">
                        {completedCount} / {goals.length}
                      </Text>
                    </StatCard>
                  </View>
                </View>
              </StaggerItem>
            ) : null}

            {/* Goals */}
            <StaggerItem>
              <SectionCard
                icon={PiggyBank}
                title="Цели накоплений"
                description={`Всего: ${goals.length}`}
                flush
                contentClassName="px-2 pb-2"
              >
                {goals.length === 0 ? (
                  <View className="px-3 pb-3 pt-1">
                    <EmptyState
                      icon={PiggyBank}
                      title="Пока нет целей"
                      description="Создайте первую цель, чтобы видеть прогресс к накоплениям."
                      action={<Button onPress={openCreate}>Создать цель</Button>}
                    />
                  </View>
                ) : (
                  <View>
                    {goals.map((g, i) => (
                      <GoalRow key={g.id} goal={g} divider={i > 0} onEdit={() => openEdit(g)} />
                    ))}
                  </View>
                )}
              </SectionCard>
            </StaggerItem>

            {/* Category monthly limits */}
            {categoryLimits.length > 0 ? (
              <StaggerItem>
                <SectionCard
                  icon={Gauge}
                  title="Лимиты трат за месяц"
                  description="Расходы по категориям"
                  flush
                  contentClassName="px-2 pb-2"
                >
                  <View>
                    {categoryLimits.map((c, i) => (
                      <CategoryLimitRowItem
                        key={c.id}
                        row={c}
                        currency={limitsCurrency}
                        divider={i > 0}
                      />
                    ))}
                  </View>
                </SectionCard>
              </StaggerItem>
            ) : null}
          </Stagger>
        )}
      </ScrollView>

      {/* Create / edit goal */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) closeSheet();
        }}
        title={editing ? 'Редактировать цель' : 'Новая цель накоплений'}
        footer={
          <>
            <Button variant="outline" onPress={closeSheet}>
              Отмена
            </Button>
            <Button onPress={onSubmit} loading={submitting}>
              {submitting ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </>
        }
      >
        <SheetContent>
          <Text className="text-sm text-muted-foreground">
            Укажите целевую сумму и сколько уже отложено.
          </Text>
          <Form {...form}>
            <View className="gap-4">
              <FormField
                control={form.control}
                name="name"
                render={() => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input placeholder="Путешествие мечты" returnKeyType="next" />
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
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      options={currencyOptions}
                      placeholder="Выберите валюту"
                      title="Валюта цели"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetAmount"
                render={() => (
                  <FormItem>
                    <FormLabel>Целевая сумма</FormLabel>
                    <FormControl>
                      <Input keyboardType="decimal-pad" placeholder="0" returnKeyType="next" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="savedAmount"
                render={() => (
                  <FormItem>
                    <FormLabel>Уже отложено</FormLabel>
                    <FormControl>
                      <Input
                        keyboardType="decimal-pad"
                        placeholder="0"
                        returnKeyType="done"
                        onSubmitEditing={onSubmit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {rootError ? (
                <Text weight="medium" className="text-sm text-destructive">
                  {rootError}
                </Text>
              ) : null}
            </View>
          </Form>

          {/* Delete lives in the edit sheet so goal rows stay button-free. */}
          {editing ? (
            <DeleteGoalButton onDelete={onDelete} disabled={submitting} />
          ) : null}
        </SheetContent>
      </Sheet>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* Savings-goal row — canonical anatomy (icon · title/subtitle · figure) +    */
/* a progress bar. Whole row taps to edit; delete lives in the edit sheet.    */
/* -------------------------------------------------------------------------- */

function GoalRow({
  goal,
  divider,
  onEdit,
}: {
  goal: BudgetGoal;
  divider: boolean;
  onEdit: () => void;
}) {
  const incomeColor = useToken('income');

  const pct =
    goal.target_amount > 0 ? Math.min(100, (goal.saved_amount / goal.target_amount) * 100) : 0;
  const done = pct >= 100;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Изменить: ${goal.name}`}
      onPress={onEdit}
      className={
        divider
          ? 'gap-3 border-t border-border/60 px-3 py-3.5 active:opacity-70'
          : 'gap-3 px-3 py-3.5 active:opacity-70'
      }
    >
      <View className="flex-row items-center gap-3">
        <CategoryIcon iconName="PiggyBank" color={done ? incomeColor : '#64748b'} size={20} />
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              weight="medium"
              numberOfLines={1}
              className="min-w-0 shrink text-[15px] text-foreground"
            >
              {goal.name}
            </Text>
            {done ? (
              <View className="shrink-0 flex-row items-center gap-0.5 rounded-full bg-income/15 px-2 py-0.5">
                <Check size={12} color={incomeColor} strokeWidth={3} />
                <Text weight="semibold" className="text-[11px] text-income-foreground">
                  Выполнено
                </Text>
              </View>
            ) : null}
          </View>
          <Text numberOfLines={1} className="mt-0.5 text-[12px] text-muted-foreground">
            {formatAmount(goal.saved_amount)} из {formatAmount(goal.target_amount)} {goal.currency}
          </Text>
        </View>
        <AnimatedNumber
          value={pct}
          format={(n) => `${Math.round(n)}%`}
          weight="semibold"
          numberOfLines={1}
          className={done ? 'text-[15px] text-income-foreground' : 'text-[15px] text-foreground'}
          style={{ fontVariant: ['tabular-nums'] }}
        />
      </View>
      <Progress value={pct} color={done ? 'hsl(var(--income))' : undefined} />
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Category monthly-limit row — read-only (limits live in category config).   */
/* Same canonical anatomy: category icon · name/meta · spent figure + bar.    */
/* -------------------------------------------------------------------------- */

function CategoryLimitRowItem({
  row,
  currency,
  divider,
}: {
  row: CategoryLimitRow;
  currency: string;
  divider: boolean;
}) {
  const theme = useResolvedTheme();
  const pct = row.limit > 0 ? (row.spent / row.limit) * 100 : 0;
  const over = row.spent > row.limit;

  return (
    <View
      className={
        divider
          ? 'gap-3 border-t border-border/60 px-3 py-3.5'
          : 'gap-3 px-3 py-3.5'
      }
    >
      <View className="flex-row items-center gap-3">
        <CategoryIcon iconName={row.icon} color={row.color} size={20} />
        <View className="min-w-0 flex-1">
          <Text
            weight="medium"
            numberOfLines={1}
            className="min-w-0 text-[15px] text-foreground"
          >
            {row.name}
          </Text>
          <Text numberOfLines={1} className="mt-0.5 text-[12px] text-muted-foreground">
            {formatAmount(row.spent)} из {formatAmount(row.limit)} {currency}
          </Text>
        </View>
        <Text
          weight="semibold"
          numberOfLines={1}
          className="text-[15px]"
          style={{
            color: over
              ? tokenColor('expense-foreground', theme)
              : tokenColor('foreground', theme),
            fontVariant: ['tabular-nums'],
          }}
        >
          {Math.round(pct)}%
        </Text>
      </View>
      <Progress value={Math.min(100, pct)} color={over ? 'hsl(var(--expense))' : undefined} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Destructive delete control for the edit sheet (matches TransactionForm).   */
/* -------------------------------------------------------------------------- */

function DeleteGoalButton({
  onDelete,
  disabled,
}: {
  onDelete: () => void;
  disabled?: boolean;
}) {
  const destructive = useToken('destructive');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Удалить цель"
      onPress={onDelete}
      disabled={disabled}
      className="h-12 flex-row items-center justify-center gap-2 rounded-xl active:opacity-70"
    >
      <Trash2 size={18} color={destructive} />
      <Text weight="semibold" className="text-destructive">
        Удалить
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Per-currency totals body for the summary StatCards                         */
/* -------------------------------------------------------------------------- */

function CurrencyTotals({
  rows,
  field,
  single,
}: {
  rows: CurrencyTotal[];
  field: 'saved' | 'target';
  single: string | null;
}) {
  if (single && rows.length > 0) {
    return (
      <AnimatedNumber
        value={rows[0][field]}
        format={(n) => formatMoney(n, single)}
        weight="bold"
        className="text-2xl tracking-tight text-foreground"
      />
    );
  }
  return (
    <View className="gap-1">
      {rows.map((r) => (
        <View key={r.currency} className="flex-row items-baseline justify-between gap-3">
          <Text className="text-xs text-muted-foreground">{r.currency}</Text>
          <Text weight="bold" className="text-base text-foreground">
            {formatMoney(r[field], r.currency)}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading skeleton (mirrors the goals layout)                                */
/* -------------------------------------------------------------------------- */

function BudgetSkeleton() {
  return (
    <View className="gap-5">
      <View className="gap-4">
        <Skeleton className="h-[132px] rounded-2xl" />
        <View className="flex-row gap-4">
          <Skeleton className="h-[132px] flex-1 rounded-2xl" />
          <Skeleton className="h-[132px] flex-1 rounded-2xl" />
        </View>
      </View>
      <View className="gap-3 rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
        {[0, 1, 2].map((i) => (
          <View key={i} className="gap-3 py-2">
            <View className="flex-row items-center gap-3">
              <Skeleton className="size-9 rounded-xl" />
              <View className="flex-1 gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </View>
              <Skeleton className="h-4 w-10" />
            </View>
            <Skeleton className="h-2 w-full rounded-full" />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Russian declension for the "По N <целям>" footer (dative case). */
function goalsWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  return mod10 === 1 && mod100 !== 11 ? 'цели' : 'целям';
}
