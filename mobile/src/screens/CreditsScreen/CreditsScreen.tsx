import * as React from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  CalendarDays,
  Landmark,
  Plus,
  Trash2,
} from 'lucide-react-native';

import { confirm } from '@components/ConfirmDialog';
import { CategoryTag } from '@components/tags';
import { EmptyState, ScreenHeader, StatCard } from '@components/blocks';
import { Button } from '@components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Progress } from '@components/ui/progress';
import { Select } from '@components/ui/select';
import { Skeleton } from '@components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription } from '@components/ui/sheet';
import { Text } from '@components/ui/text';

import {
  loanFormSchema,
  type LoanFormValues,
} from '@screens/CreditsScreen/CreditsScreen.formConfig';
import {
  buildCurrencySummary,
  buildLoansWithStats,
  buildLoanTransactionsMap,
  monthPaymentStatusClasses,
  monthPaymentStatusLabel,
  progressColorToken,
  type LoanWithStats,
} from '@screens/CreditsScreen/CreditsScreen.utils';
import { ACCOUNT_CURRENCY_OPTIONS, DEFAULT_ACCOUNT_CURRENCY } from '@/shared/constants/accountCurrencies';
import { cn } from '@/shared/lib/utils';
import { useAccountStore } from '@/shared/store/accountStore';
import { useCategoryStore } from '@/shared/store/categoryStore';
import { useLoanStore } from '@/shared/store/loanStore';
import { useTransactionStore } from '@/shared/store/transactionStore';
import { tokenColor, useResolvedTheme } from '@/shared/theme/tokens';
import type { Loan, Transaction } from '@/shared/types/entities';
import { StaggerItem } from '@/shared/ui/motion/Stagger';
import {
  transactionFormSchema,
  type TransactionFormValues,
} from '@/shared/forms/transactionFormConfig';
import { formatMoney, formatMoneyCompact, formatTxDate } from '@/shared/utils/format';
import type { LoanMonthPaymentStatus } from '@/shared/utils/loanSchedule';

/* ----------------------------------------------------------------------------
 * CreditsScreen — native loans manager.
 *
 * Mirrors the web CreditsScreen feature set (per-currency summary, loan cards
 * with progress + key figures + a month-by-month schedule + linked payments,
 * create/edit loan, record a payment) but follows the locked "super-simple"
 * mobile design language: a ScreenHeader, summary StatCards, and a FlatList of
 * loan cards built from the canonical row anatomy (icon circle + title + short
 * subtitle + trailing balance). Tapping a card opens the edit sheet; delete
 * lives inside that sheet (no inline pencil/trash). Self-contained (owns its
 * data fetching) since the route renders it directly.
 * ------------------------------------------------------------------------- */

const NONE = '_none';

function todayIsoDate(): string {
  // Local calendar date as YYYY-MM-DD (avoids the UTC shift of toISOString()).
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const EMPTY_LOAN_DEFAULTS = {
  name: '',
  currency: DEFAULT_ACCOUNT_CURRENCY,
  totalAmount: '',
  annualInterestRate: '',
  paymentEndYear: '',
  remainingScheduleMonths: '',
  note: '',
} as unknown as LoanFormValues;

/* ============================================================================
 * Small building blocks
 * ========================================================================== */

/** Status pill for a schedule row. */
function StatusPill({ status }: { status: LoanMonthPaymentStatus }) {
  const { chip, text } = monthPaymentStatusClasses(status);
  return (
    <View className={cn('self-start rounded-full px-2 py-0.5', chip)}>
      <Text weight="semibold" className={cn('text-[11px]', text)}>
        {monthPaymentStatusLabel(status)}
      </Text>
    </View>
  );
}

/** One schedule month as a clean row inside a card surface (date + plan, status + paid). */
function ScheduleRow({
  row,
  currency,
  divider,
}: {
  row: NonNullable<LoanWithStats['monthlySchedule']>[number];
  currency: string;
  divider: boolean;
}) {
  return (
    <View className={cn('flex-row items-center gap-3 px-4 py-3', divider && 'border-t border-border')}>
      <View className="min-w-0 flex-1">
        <Text weight="medium" numberOfLines={1} className="text-[15px] capitalize text-foreground">
          {row.monthLabel}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 text-[12px] text-muted-foreground">
          Тело {formatMoneyCompact(row.principal, currency)} · % {formatMoneyCompact(row.interest, currency)}
        </Text>
      </View>
      <View className="shrink-0 items-end gap-1">
        <Text
          weight="semibold"
          numberOfLines={1}
          className="text-[15px] text-foreground"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatMoney(row.total, currency)}
        </Text>
        <StatusPill status={row.status} />
      </View>
    </View>
  );
}

/* ============================================================================
 * Linked payments — clean date + amount rows.
 * ========================================================================== */

function PaymentRow({
  tx,
  accountOptions,
  categoryOptions,
  divider,
  theme,
}: {
  tx: Transaction;
  accountOptions: { id: string; name: string; currency: string }[];
  categoryOptions: { id: string; name: string; type: 'income' | 'expense'; icon: string; color: string }[];
  divider: boolean;
  theme: 'light' | 'dark';
}) {
  const acc = accountOptions.find((a) => a.id === tx.account_id);
  const accCurrency = acc?.currency ?? DEFAULT_ACCOUNT_CURRENCY;
  const cat = categoryOptions.find((c) => c.id === tx.category_id);
  const isIncome = tx.type === 'income';

  return (
    <View className={cn('flex-row items-center gap-3 px-4 py-3', divider && 'border-t border-border')}>
      <View className="min-w-0 flex-1">
        <Text weight="medium" numberOfLines={1} className="text-[15px] text-foreground">
          {acc?.name ?? '—'}
        </Text>
        {cat ? (
          <View className="mt-1 self-start">
            <CategoryTag name={cat.name} color={cat.color} icon={cat.icon} />
          </View>
        ) : (
          <Text numberOfLines={1} className="mt-0.5 text-[12px] text-muted-foreground">
            {formatTxDate(tx.occurred_at)}
          </Text>
        )}
      </View>
      <Text
        weight="semibold"
        numberOfLines={1}
        className="shrink-0 text-[15px]"
        style={{
          color: isIncome ? tokenColor('income', theme) : tokenColor('foreground', theme),
          fontVariant: ['tabular-nums'],
        }}
      >
        {isIncome ? '+' : '−'}
        {formatMoney(tx.amount, accCurrency)}
      </Text>
    </View>
  );
}

/* ============================================================================
 * Loan card — canonical row header (icon circle + name + short subtitle +
 * trailing remaining balance), then a payoff progress bar, a couple of key
 * figures, an optional schedule, linked payments, and a record-payment action.
 * The whole header taps to edit; delete lives in the edit sheet.
 * ========================================================================== */

function LoanCard({
  loan,
  txs,
  accountOptions,
  categoryOptions,
  onEdit,
  onRecordPayment,
}: {
  loan: LoanWithStats;
  txs: Transaction[];
  accountOptions: { id: string; name: string; currency: string }[];
  categoryOptions: { id: string; name: string; type: 'income' | 'expense'; icon: string; color: string }[];
  onEdit: (loan: Loan) => void;
  onRecordPayment: (loan: Loan) => void;
}) {
  const theme = useResolvedTheme();
  const monthly = loan.scheduleEstimate?.approxTotalNextMonth ?? null;
  const pct = loan.progressPct;
  const progressColor = tokenColor(progressColorToken(pct), theme);

  // Subtitle kept to a single short token so it never truncates into nonsense.
  const subtitle =
    loan.payment_end_year != null
      ? `до ${loan.payment_end_year} г.`
      : loan.annual_interest_rate != null
        ? `${loan.annual_interest_rate}% годовых`
        : `Валюта ${loan.currency}`;

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Header row — taps to edit. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Изменить: ${loan.name}`}
        onPress={() => onEdit(loan)}
        className="flex-row items-center gap-3 p-5 active:opacity-70"
      >
        <View className="size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Landmark size={18} color={tokenColor('foreground', theme)} strokeWidth={2} />
        </View>
        <View className="min-w-0 flex-1">
          <Text weight="medium" numberOfLines={1} className="text-[15px] text-foreground">
            {loan.name}
          </Text>
          <Text numberOfLines={1} className="mt-0.5 text-[12px] text-muted-foreground">
            {subtitle}
          </Text>
        </View>
        <Text
          weight="semibold"
          numberOfLines={1}
          className="shrink-0 text-[15px] text-foreground"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatMoney(loan.remaining, loan.currency)}
        </Text>
      </Pressable>

      {/* Payoff progress */}
      <View className="px-5 pb-5">
        <View className="mb-2 flex-row items-end justify-between gap-3">
          <Text className="text-[12px] text-muted-foreground">Погашено</Text>
          <Text
            weight="medium"
            className="text-[12px] text-foreground"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatMoneyCompact(loan.paid, loan.currency)}
            <Text className="text-[12px] text-muted-foreground">
              {' '}
              из {formatMoneyCompact(loan.total_amount, loan.currency)}
            </Text>
          </Text>
        </View>
        <Progress value={pct} color={progressColor} />
        <View className="mt-1.5 flex-row justify-between">
          <Text className="text-[12px] text-muted-foreground">{pct.toFixed(0)}%</Text>
          <Text className="text-[12px] text-muted-foreground">
            Осталось {formatMoneyCompact(loan.remaining, loan.currency)}
          </Text>
        </View>
      </View>

      {/* Key figures: remaining + monthly */}
      <View className="flex-row border-t border-border">
        <View className="flex-1 p-4">
          <Text className="text-[12px] text-muted-foreground">Остаток долга</Text>
          <Text
            weight="semibold"
            numberOfLines={1}
            className="mt-1 text-[17px] text-foreground"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatMoney(loan.remaining, loan.currency)}
          </Text>
        </View>
        <View className="flex-1 border-l border-border p-4">
          <Text className="text-[12px] text-muted-foreground">Платёж в месяц ~</Text>
          <Text
            weight="semibold"
            numberOfLines={1}
            className="mt-1 text-[17px] text-foreground"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {monthly == null ? '—' : formatMoney(monthly, loan.currency)}
          </Text>
        </View>
      </View>

      {/* Rate + end year */}
      <View className="flex-row border-t border-border">
        <View className="flex-1 p-4">
          <Text className="text-[12px] text-muted-foreground">Ставка, % годовых</Text>
          <Text weight="medium" numberOfLines={1} className="mt-1 text-[15px] text-foreground">
            {loan.annual_interest_rate != null ? `${loan.annual_interest_rate}%` : '—'}
          </Text>
        </View>
        <View className="flex-1 border-l border-border p-4">
          <Text className="text-[12px] text-muted-foreground">Год окончания</Text>
          <Text weight="medium" numberOfLines={1} className="mt-1 text-[15px] text-foreground">
            {loan.payment_end_year != null ? String(loan.payment_end_year) : '—'}
          </Text>
        </View>
      </View>

      {/* Note */}
      {loan.note ? (
        <View className="border-t border-border px-5 py-4">
          <Text className="text-[13px] leading-5 text-muted-foreground">{loan.note}</Text>
        </View>
      ) : null}

      {/* Monthly schedule */}
      {loan.monthlySchedule && loan.monthlySchedule.length > 0 ? (
        <View className="border-t border-border px-5 py-4">
          <Text weight="medium" className="text-[15px] text-foreground">
            График по месяцам
          </Text>
          <Text className="mt-1 text-[12px] leading-4 text-muted-foreground">
            План — тело и проценты по остатку. Факт — расходы по кредиту за месяц.
          </Text>
          <View className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
            {loan.monthlySchedule.map((row, i) => (
              <ScheduleRow key={row.monthKey} row={row} currency={loan.currency} divider={i > 0} />
            ))}
          </View>
        </View>
      ) : null}

      {/* Operations */}
      <View className="border-t border-border px-5 py-4">
        <View className="flex-row items-center justify-between gap-2">
          <Text weight="medium" className="text-[15px] text-foreground">
            Операции по кредиту
          </Text>
          <Button variant="outline" size="sm" onPress={() => onRecordPayment(loan)}>
            <View className="flex-row items-center gap-1.5">
              <Plus size={16} color={tokenColor('foreground', theme)} />
              <Text weight="semibold" className="text-xs text-foreground">
                Платёж
              </Text>
            </View>
          </Button>
        </View>

        {txs.length === 0 ? (
          <Text className="mt-3 text-[13px] text-muted-foreground">Платежей пока нет.</Text>
        ) : (
          <View className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
            {txs.map((t, i) => (
              <PaymentRow
                key={t.id}
                tx={t}
                accountOptions={accountOptions}
                categoryOptions={categoryOptions}
                divider={i > 0}
                theme={theme}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

/* ============================================================================
 * Summary StatCards (FlatList header)
 * ========================================================================== */

function MultiCurrencyList({
  rows,
  field,
}: {
  rows: { currency: string; remaining: number; monthly: number }[];
  field: 'remaining' | 'monthly';
}) {
  return (
    <View className="gap-1.5">
      {rows.map((row) => (
        <View key={row.currency} className="flex-row items-baseline justify-between gap-3">
          <Text weight="medium" className="text-xs text-muted-foreground">
            {row.currency}
          </Text>
          <Text
            weight="bold"
            className="text-lg text-foreground"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatMoney(row[field], row.currency)}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ============================================================================
 * Screen
 * ========================================================================== */

export default function CreditsScreen() {
  const { accounts, fetchAccounts } = useAccountStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { loans, loading, error, fetchLoans, createLoan, updateLoan, deleteLoan } = useLoanStore();
  const { transactions, fetchTransactions, createTransaction } = useTransactionStore();

  const [refreshing, setRefreshing] = React.useState(false);
  const [loanSheetOpen, setLoanSheetOpen] = React.useState(false);
  const [editingLoan, setEditingLoan] = React.useState<Loan | null>(null);
  const [paymentSheetOpen, setPaymentSheetOpen] = React.useState(false);
  const [paymentLoan, setPaymentLoan] = React.useState<Loan | null>(null);

  const loanForm = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: EMPTY_LOAN_DEFAULTS,
  });

  const paymentForm = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      accountId: '',
      categoryId: '',
      loanId: '',
      amount: '' as unknown as number,
      type: 'expense',
      occurredAt: todayIsoDate(),
      note: '',
    },
  });

  const fetchAll = React.useCallback(() => {
    void fetchLoans();
    void fetchTransactions();
    void fetchAccounts();
    void fetchCategories();
  }, [fetchLoans, fetchTransactions, fetchAccounts, fetchCategories]);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchLoans(), fetchTransactions(), fetchAccounts(), fetchCategories()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchLoans, fetchTransactions, fetchAccounts, fetchCategories]);

  const loansWithStats = React.useMemo(
    () => buildLoansWithStats(loans, transactions),
    [loans, transactions]
  );
  const loanTransactions = React.useMemo(
    () => buildLoanTransactionsMap(loans, transactions),
    [loans, transactions]
  );
  const summary = React.useMemo(() => buildCurrencySummary(loansWithStats), [loansWithStats]);

  const accountOptions = React.useMemo(
    () => accounts.map((a) => ({ id: a.id, name: a.name, currency: a.currency })),
    [accounts]
  );
  const categoryOptions = React.useMemo(
    () =>
      categories.map((c) => ({ id: c.id, name: c.name, type: c.type, icon: c.icon, color: c.color })),
    [categories]
  );

  // Select option lists for the payment sheet.
  const accountSelectOptions = React.useMemo(
    () => accounts.map((a) => ({ label: a.name, value: a.id })),
    [accounts]
  );
  const expenseCategoryOptions = React.useMemo(
    () => [
      { label: 'Нет', value: NONE },
      ...categories.filter((c) => c.type === 'expense').map((c) => ({ label: c.name, value: c.id })),
    ],
    [categories]
  );

  /* --- Loan create/edit --------------------------------------------------- */

  const openCreateLoan = React.useCallback(() => {
    setEditingLoan(null);
    loanForm.reset(EMPTY_LOAN_DEFAULTS);
    setLoanSheetOpen(true);
  }, [loanForm]);

  const openEditLoan = React.useCallback(
    (loan: Loan) => {
      setEditingLoan(loan);
      loanForm.reset({
        name: loan.name,
        currency: loan.currency as LoanFormValues['currency'],
        totalAmount: loan.total_amount as unknown as LoanFormValues['totalAmount'],
        annualInterestRate: loan.annual_interest_rate != null ? String(loan.annual_interest_rate) : '',
        paymentEndYear: loan.payment_end_year != null ? String(loan.payment_end_year) : '',
        remainingScheduleMonths:
          loan.remaining_schedule_months != null ? String(loan.remaining_schedule_months) : '',
        note: loan.note ?? '',
      });
      setLoanSheetOpen(true);
    },
    [loanForm]
  );

  const closeLoanSheet = React.useCallback(() => {
    setLoanSheetOpen(false);
    setEditingLoan(null);
  }, []);

  const onSubmitLoan = loanForm.handleSubmit(async (values) => {
    try {
      const rateRaw = values.annualInterestRate?.trim().replace(',', '.') ?? '';
      const annualInterestRate =
        rateRaw.length > 0 && !Number.isNaN(Number.parseFloat(rateRaw))
          ? Number.parseFloat(rateRaw)
          : null;

      const yearRaw = values.paymentEndYear?.trim() ?? '';
      const y = yearRaw.length >= 4 ? Number.parseInt(yearRaw.slice(0, 4), 10) : NaN;
      const paymentEndYear = !Number.isNaN(y) && y >= 2000 && y <= 2100 ? y : null;

      const monthsRaw = values.remainingScheduleMonths?.trim() ?? '';
      let remainingScheduleMonths: number | null = null;
      if (monthsRaw.length > 0) {
        const n = Number.parseInt(monthsRaw, 10);
        if (Number.isNaN(n) || n < 1 || n > 600) {
          loanForm.setError('remainingScheduleMonths', {
            message: 'Укажите целое число от 1 до 600 или оставьте пустым',
          });
          return;
        }
        remainingScheduleMonths = n;
      }

      const payload = {
        name: values.name,
        currency: values.currency,
        totalAmount: values.totalAmount,
        annualInterestRate,
        paymentEndYear,
        remainingScheduleMonths,
        note: values.note?.trim() ? values.note.trim() : null,
      };

      if (editingLoan) {
        await updateLoan(editingLoan.id, payload);
      } else {
        await createLoan(payload);
      }
      await fetchLoans();
      closeLoanSheet();
    } catch (e) {
      loanForm.setError('root', { message: (e as Error).message });
    }
  });

  const onDeleteLoan = React.useCallback(async () => {
    if (!editingLoan) return;
    const ok = await confirm({
      title: 'Удалить кредит?',
      description: `«${editingLoan.name}». Платежи останутся, но потеряют привязку к кредиту.`,
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;
    await deleteLoan(editingLoan.id);
    void fetchTransactions();
    closeLoanSheet();
  }, [editingLoan, deleteLoan, fetchTransactions, closeLoanSheet]);

  /* --- Record payment ----------------------------------------------------- */

  const openPayment = React.useCallback(
    (loan: Loan) => {
      setPaymentLoan(loan);
      paymentForm.reset({
        accountId: accounts[0]?.id ?? '',
        categoryId: '',
        loanId: loan.id,
        amount: '' as unknown as number,
        type: 'expense',
        occurredAt: todayIsoDate(),
        note: '',
      });
      setPaymentSheetOpen(true);
    },
    [accounts, paymentForm]
  );

  const closePaymentSheet = React.useCallback(() => {
    setPaymentSheetOpen(false);
    setPaymentLoan(null);
  }, []);

  const onSubmitPayment = paymentForm.handleSubmit(async (values) => {
    if (!paymentLoan) return;
    try {
      const categoryId = values.categoryId && values.categoryId.length > 0 ? values.categoryId : null;
      await createTransaction({
        accountId: values.accountId,
        categoryId,
        loanId: paymentLoan.id,
        amount: values.amount,
        type: 'expense',
        occurredAt: values.occurredAt,
        note: values.note?.trim() ? values.note.trim() : null,
      });
      await fetchTransactions();
      closePaymentSheet();
    } catch (e) {
      paymentForm.setError('root', { message: (e as Error).message });
    }
  });

  /* --- Derived flags ------------------------------------------------------ */

  const loanSubmitting = loanForm.formState.isSubmitting;
  const loanRootError = loanForm.formState.errors.root?.message;
  const paymentSubmitting = paymentForm.formState.isSubmitting;
  const paymentRootError = paymentForm.formState.errors.root?.message;

  const theme = useResolvedTheme();
  const showSkeleton = loading && loans.length === 0;
  const isEmpty = !loading && loans.length === 0;

  /* --- List header: summary StatCards ------------------------------------ */

  const ListHeader =
    loansWithStats.length > 0 ? (
      <View className="gap-4 pb-4 pt-1">
        <StatCard
          label="Остаток долга"
          icon={Landmark}
          value={summary.length === 1 ? summary[0].remaining : undefined}
          format={(n) => formatMoney(n, summary[0]?.currency ?? DEFAULT_ACCOUNT_CURRENCY)}
          footer={summary.length > 1 ? 'По валютам кредитов' : `Кредитов: ${loans.length}`}
        >
          {summary.length > 1 ? <MultiCurrencyList rows={summary} field="remaining" /> : undefined}
        </StatCard>
        <StatCard
          label="Платёж в месяц ~"
          icon={CalendarDays}
          value={summary.length === 1 ? summary[0].monthly : undefined}
          format={(n) => formatMoney(n, summary[0]?.currency ?? DEFAULT_ACCOUNT_CURRENCY)}
          delay={0.1}
          footer="Ориентировочно, тело + проценты"
        >
          {summary.length > 1 ? <MultiCurrencyList rows={summary} field="monthly" /> : undefined}
        </StatCard>
      </View>
    ) : null;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScreenHeader
        title="Кредиты"
        subtitle="Остаток, ставка и график платежей."
        action={
          <Button size="icon" accessibilityLabel="Добавить кредит" onPress={openCreateLoan}>
            <Plus size={20} color={tokenColor('primary-foreground', theme)} />
          </Button>
        }
      />

      {error && loans.length === 0 && !loading ? (
        <View className="px-5 pb-3">
          <Text className="text-sm text-destructive">{error}</Text>
        </View>
      ) : null}

      {showSkeleton ? (
        <View className="gap-4 px-5 pt-2">
          <View className="flex-row gap-4">
            <Skeleton className="h-[120px] flex-1 rounded-2xl" />
            <Skeleton className="h-[120px] flex-1 rounded-2xl" />
          </View>
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-[260px] rounded-2xl" />
          ))}
        </View>
      ) : isEmpty ? (
        <View className="flex-1 justify-center px-5">
          <EmptyState
            icon={Landmark}
            title="Пока нет кредитов"
            description="Добавьте договор: название, валюту и сколько всего нужно вернуть банку. Дальше отслеживайте остаток, график и платежи."
            action={
              <Button onPress={openCreateLoan}>
                <View className="flex-row items-center gap-2">
                  <Plus size={18} color={tokenColor('primary-foreground', theme)} />
                  <Text weight="semibold" className="text-sm text-primary-foreground">
                    Добавить кредит
                  </Text>
                </View>
              </Button>
            }
          />
        </View>
      ) : (
        <FlatList
          data={loansWithStats}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View className="h-4" />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tokenColor('muted-foreground', theme)}
            />
          }
          renderItem={({ item }) => (
            <StaggerItem>
              <LoanCard
                loan={item}
                txs={loanTransactions.get(item.id) ?? []}
                accountOptions={accountOptions}
                categoryOptions={categoryOptions}
                onEdit={openEditLoan}
                onRecordPayment={openPayment}
              />
            </StaggerItem>
          )}
        />
      )}

      {/* ---- Loan create/edit sheet ---- */}
      <Sheet
        open={loanSheetOpen}
        onOpenChange={(o) => (o ? setLoanSheetOpen(true) : closeLoanSheet())}
        snapPoints={['90%']}
        title={editingLoan ? 'Редактировать кредит' : 'Новый кредит'}
      >
        <Form {...loanForm}>
          <SheetContent contentContainerClassName="gap-4 pb-4">
            <SheetDescription className="-mt-1">
              Сумма к погашению, ставка и год окончания. Если осталось другое число платежей —
              укажите его отдельно, тогда график совпадёт с вашим сроком.
            </SheetDescription>

            <FormField
              control={loanForm.control}
              name="name"
              render={() => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Ипотека, кредит наличными…" returnKeyType="next" />
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
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    options={ACCOUNT_CURRENCY_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
                    placeholder="Выберите валюту"
                    title="Валюта"
                  />
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
                  <Input
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    placeholder="0.00"
                    returnKeyType="next"
                    value={
                      field.value === undefined ||
                      field.value === null ||
                      (typeof field.value === 'number' && Number.isNaN(field.value))
                        ? ''
                        : String(field.value)
                    }
                    onChangeText={(t) => {
                      const normalized = t.replace(',', '.').replace(/[^0-9.]/g, '');
                      field.onChange(normalized as unknown as number);
                    }}
                    onBlur={field.onBlur}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={loanForm.control}
              name="annualInterestRate"
              render={() => (
                <FormItem>
                  <FormLabel>Ставка, % годовых (необязательно)</FormLabel>
                  <FormControl>
                    <Input
                      keyboardType="decimal-pad"
                      inputMode="decimal"
                      placeholder="Например 11,5"
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={loanForm.control}
              name="paymentEndYear"
              render={() => (
                <FormItem>
                  <FormLabel>Платежи до какого года (необязательно)</FormLabel>
                  <FormControl>
                    <Input
                      keyboardType="number-pad"
                      inputMode="numeric"
                      placeholder="Например 2040"
                      maxLength={4}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={loanForm.control}
              name="remainingScheduleMonths"
              render={() => (
                <FormItem>
                  <FormLabel>Осталось платежей по графику (необязательно)</FormLabel>
                  <FormControl>
                    <Input
                      keyboardType="number-pad"
                      inputMode="numeric"
                      placeholder="Например 36 — из выписки"
                      maxLength={3}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormDescription>
                    Если указано, тело долга делится на это число месяцев, а не «до конца года» по
                    календарю.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={loanForm.control}
              name="note"
              render={() => (
                <FormItem>
                  <FormLabel>Заметка (необязательно)</FormLabel>
                  <FormControl>
                    <Input placeholder="Банк, дата договора…" returnKeyType="done" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {loanRootError ? (
              <View className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                <Text weight="medium" className="text-sm text-destructive">
                  {loanRootError}
                </Text>
              </View>
            ) : null}

            <View className="mt-1 flex-row gap-3">
              <Button variant="outline" className="flex-1" onPress={closeLoanSheet}>
                Отмена
              </Button>
              <Button
                className="flex-1"
                onPress={onSubmitLoan}
                loading={loanSubmitting}
                disabled={loanSubmitting}
              >
                {loanSubmitting ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </View>

            {/* Delete lives in the edit sheet so loan cards stay button-free. */}
            {editingLoan ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Удалить кредит"
                onPress={onDeleteLoan}
                disabled={loanSubmitting}
                className="h-12 flex-row items-center justify-center gap-2 rounded-xl active:opacity-70"
              >
                <Trash2 size={18} color={tokenColor('destructive', theme)} />
                <Text weight="semibold" className="text-destructive">
                  Удалить
                </Text>
              </Pressable>
            ) : null}
          </SheetContent>
        </Form>
      </Sheet>

      {/* ---- Record-payment sheet ---- */}
      <Sheet
        open={paymentSheetOpen}
        onOpenChange={(o) => (o ? setPaymentSheetOpen(true) : closePaymentSheet())}
        snapPoints={['85%']}
        title="Платёж по кредиту"
      >
        <Form {...paymentForm}>
          <SheetContent contentContainerClassName="gap-4 pb-4">
            {paymentLoan ? (
              <SheetDescription className="-mt-1">
                Создаётся расход с привязкой к «{paymentLoan.name}». Счёт — откуда ушли деньги.
              </SheetDescription>
            ) : null}

            <FormField
              control={paymentForm.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Кошелёк</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    options={accountSelectOptions}
                    placeholder="Счёт списания"
                    title="Кошелёк"
                  />
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
                    value={field.value && field.value.length > 0 ? field.value : NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
                    options={expenseCategoryOptions}
                    placeholder="Нет"
                    title="Категория"
                  />
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
                  <Input
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    placeholder="0.00"
                    returnKeyType="done"
                    value={
                      field.value === undefined ||
                      field.value === null ||
                      (typeof field.value === 'number' && Number.isNaN(field.value))
                        ? ''
                        : String(field.value)
                    }
                    onChangeText={(t) => {
                      const normalized = t.replace(',', '.').replace(/[^0-9.]/g, '');
                      field.onChange(normalized as unknown as number);
                    }}
                    onBlur={field.onBlur}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={paymentForm.control}
              name="occurredAt"
              render={() => (
                <FormItem>
                  <FormLabel>Дата</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ГГГГ-ММ-ДД"
                      autoCapitalize="none"
                      autoCorrect={false}
                      inputMode="numeric"
                      left={<CalendarDays size={16} color={tokenColor('muted-foreground', theme)} />}
                    />
                  </FormControl>
                  <FormDescription>Формат: год-месяц-день</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={paymentForm.control}
              name="note"
              render={() => (
                <FormItem>
                  <FormLabel>Комментарий (необязательно)</FormLabel>
                  <FormControl>
                    <Input placeholder="Комментарий" returnKeyType="done" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {paymentRootError ? (
              <View className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                <Text weight="medium" className="text-sm text-destructive">
                  {paymentRootError}
                </Text>
              </View>
            ) : null}

            <View className="mt-1 flex-row gap-3">
              <Button variant="outline" className="flex-1" onPress={closePaymentSheet}>
                Отмена
              </Button>
              <Button
                className="flex-1"
                onPress={onSubmitPayment}
                loading={paymentSubmitting}
                disabled={paymentSubmitting}
              >
                {paymentSubmitting ? 'Сохранение…' : 'Записать'}
              </Button>
            </View>
          </SheetContent>
        </Form>
      </Sheet>
    </SafeAreaView>
  );
}
