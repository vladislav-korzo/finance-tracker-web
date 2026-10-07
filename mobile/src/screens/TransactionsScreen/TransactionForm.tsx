import * as React from 'react';
import { Pressable, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CalendarDays, Trash2 } from 'lucide-react-native';

import { confirm } from '@components/ConfirmDialog';
import { tokenColor, useResolvedTheme } from '@/shared/theme/tokens';
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
import { Select } from '@components/ui/select';
import { Sheet, SheetContent, SheetDescription } from '@components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Text } from '@components/ui/text';

import {
  transactionFormSchema,
  type TransactionFormValues,
} from '@/shared/forms/transactionFormConfig';
import { CATEGORY_ICON_MAP } from '@/shared/constants/categoryIconMap';
import type { CategoryIconName } from '@/shared/constants/categoryAppearance';
import type { Account, Category, Loan, Transaction } from '@/shared/types/entities';
import { useTransactionStore } from '@/shared/store/transactionStore';

/* ----------------------------------------------------------------------------
 * TransactionForm — the add / edit bottom sheet for the Transactions screen.
 *
 * Mirrors the GLOBAL QuickAddTransaction field set + validation
 * (mobile/src/components/QuickAddTransaction/QuickAddTransaction.tsx) but is
 * reusable for editing: pass `editing` to seed the form from an existing
 * transaction and route the submit through `updateTransaction`. Controlled by
 * the parent via `open` / `onOpenChange`. The store fires its own success
 * toast + haptic, so this only closes + resets on success.
 * ------------------------------------------------------------------------- */

function todayIsoDate(): string {
  // Local calendar date as YYYY-MM-DD (avoids the UTC shift of toISOString()).
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Sentinel for the "no selection" row on the optional Selects (the native
// <Select> can't represent an empty value, so we model it explicitly).
const NONE = '_none';

// `amount` starts empty so the field reads as empty (not a literal "0"); the
// schema coerces it on submit. Typed loose because the RHF value is the raw
// input string until zod coercion runs.
function emptyDefaults(accountId: string): TransactionFormValues {
  return {
    accountId,
    categoryId: '',
    amount: '',
    type: 'expense',
    occurredAt: todayIsoDate(),
    note: '',
    loanId: '',
  } as unknown as TransactionFormValues;
}

type TransactionFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the sheet edits this transaction instead of creating a new one. */
  editing: Transaction | null;
  accounts: Account[];
  categories: Category[];
  loans: Loan[];
};

export function TransactionForm({
  open,
  onOpenChange,
  editing,
  accounts,
  categories,
  loans,
}: TransactionFormProps) {
  const createTransaction = useTransactionStore((s) => s.createTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const theme = useResolvedTheme();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: emptyDefaults(accounts[0]?.id ?? ''),
  });

  const typeWatch = form.watch('type');

  // Re-seed the form each time the sheet opens: from `editing` when present,
  // otherwise a fresh expense defaulting to the first account.
  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        accountId: editing.account_id,
        categoryId: editing.category_id ?? '',
        amount: editing.amount,
        type: editing.type,
        occurredAt: editing.occurred_at,
        note: editing.note ?? '',
        loanId: editing.loan_id ?? '',
      });
    } else {
      form.reset(emptyDefaults(accounts[0]?.id ?? ''));
    }
    // Seed only on open / when the target transaction changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const accountOptions = React.useMemo(
    () => accounts.map((a) => ({ label: a.name, value: a.id })),
    [accounts],
  );

  const categoryOptions = React.useMemo(
    () => [
      { label: 'Нет', value: NONE },
      ...categories
        .filter((c) => c.type === typeWatch)
        .map((c) => ({
          label: c.name,
          value: c.id,
          icon: CATEGORY_ICON_MAP[c.icon as CategoryIconName] ?? CATEGORY_ICON_MAP.Circle,
        })),
    ],
    [categories, typeWatch],
  );

  const loanOptions = React.useMemo(
    () => [{ label: 'Нет', value: NONE }, ...loans.map((l) => ({ label: l.name, value: l.id }))],
    [loans],
  );

  const showLoan = typeWatch === 'expense' && loans.length > 0;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const categoryId =
        values.categoryId && values.categoryId.length > 0 ? values.categoryId : null;
      const loanId =
        values.type === 'expense' && values.loanId && values.loanId.length > 0
          ? values.loanId
          : null;
      const payload = {
        accountId: values.accountId,
        categoryId,
        loanId,
        amount: values.amount,
        type: values.type,
        occurredAt: values.occurredAt,
        note: values.note ?? null,
      };
      if (editing) {
        await updateTransaction(editing.id, payload);
      } else {
        await createTransaction(payload);
      }
      // The store fires its own success toast + haptic; just close & reset here.
      onOpenChange(false);
      form.reset(emptyDefaults(accounts[0]?.id ?? ''));
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    }
  });

  const onDelete = React.useCallback(async () => {
    if (!editing) return;
    const ok = await confirm({
      title: 'Удалить транзакцию?',
      description: 'Операция будет удалена безвозвратно.',
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;
    await deleteTransaction(editing.id);
    onOpenChange(false);
  }, [editing, deleteTransaction, onOpenChange]);

  const submitting = form.formState.isSubmitting;
  const rootError = form.formState.errors.root?.message;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={['90%']}
      title={editing ? 'Редактировать транзакцию' : 'Новая транзакция'}
    >
      <Form {...form}>
        {/* Everything (incl. the submit button) lives inside the single scrollable
            SheetContent so the form never clips and the keyboard can lift fields. */}
        <SheetContent contentContainerClassName="gap-4 pb-4">
          <SheetDescription className="-mt-1">
            Сумма всегда положительная; тип задаёт, прибавляется она или вычитается.
          </SheetDescription>

          {/* Type — income / expense; resets category + loan on change. */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип</FormLabel>
                <Tabs
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    form.setValue('categoryId', '');
                    if (v === 'income') form.setValue('loanId', '');
                  }}
                >
                  <TabsList>
                    <TabsTrigger value="income">Доход</TabsTrigger>
                    <TabsTrigger value="expense">Расход</TabsTrigger>
                  </TabsList>
                </Tabs>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amount — custom render so an empty field reads as empty (not "0") and
              comma decimals are normalised before coercion. */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Сумма</FormLabel>
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
                    // Keep the RAW normalised string in form state (so partial input
                    // like "1." survives); the schema's z.coerce.number() converts it
                    // at validation/submit time.
                    const normalized = t.replace(',', '.').replace(/[^0-9.]/g, '');
                    field.onChange(normalized as unknown as number);
                  }}
                  onBlur={field.onBlur}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Account */}
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Кошелёк</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  options={accountOptions}
                  placeholder="Выберите кошелёк"
                  title="Кошелёк"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category — filtered by type; optional. */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Категория (необязательно)</FormLabel>
                <Select
                  value={field.value && field.value.length > 0 ? field.value : NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
                  options={categoryOptions}
                  placeholder="Необязательно"
                  title="Категория"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Loan — only for expenses, and only when loans exist. */}
          {showLoan ? (
            <FormField
              control={form.control}
              name="loanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Кредит (необязательно)</FormLabel>
                  <Select
                    value={field.value && field.value.length > 0 ? field.value : NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
                    options={loanOptions}
                    placeholder="Нет"
                    title="Кредит"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          {/* Date — native-friendly text field, prefilled with today. */}
          <FormField
            control={form.control}
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
                    left={<CalendarDays size={16} className="text-muted-foreground" />}
                  />
                </FormControl>
                <FormDescription>Формат: год-месяц-день</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Note */}
          <FormField
            control={form.control}
            name="note"
            render={() => (
              <FormItem>
                <FormLabel>Заметка (необязательно)</FormLabel>
                <FormControl>
                  <Input placeholder="Комментарий" returnKeyType="done" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {rootError ? (
            <View className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
              <Text weight="medium" className="text-sm text-destructive">
                {rootError}
              </Text>
            </View>
          ) : null}

          <Button
            size="lg"
            className="mt-1 w-full"
            onPress={onSubmit}
            loading={submitting}
            disabled={submitting}
          >
            {submitting ? 'Сохранение…' : 'Сохранить'}
          </Button>

          {/* Delete lives here (edit only) so the operations list rows stay clean. */}
          {editing ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Удалить транзакцию"
              onPress={onDelete}
              disabled={submitting}
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
  );
}

export default TransactionForm;
