import * as React from 'react';
import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CalendarDays } from 'lucide-react-native';

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
import { useAccountStore } from '@/shared/store/accountStore';
import { useCategoryStore } from '@/shared/store/categoryStore';
import { useLoanStore } from '@/shared/store/loanStore';
import { useTransactionStore } from '@/shared/store/transactionStore';
import { useUIStore } from '@/shared/store/uiStore';

/* ----------------------------------------------------------------------------
 * QuickAddTransaction — the GLOBAL quick-add sheet.
 *
 * Native counterpart of the web `QuickAddTransaction` (container + presentational).
 * Unlike the web split, this is a single self-controlled component: it reads its
 * open state straight from `useUIStore` (quickAddOpen / setQuickAddOpen), so it
 * can be mounted exactly once in the root layout and opened from anywhere (the
 * tab FAB, a command palette, etc.).
 *
 * Built on the native <Sheet> (a @gorhom bottom-sheet) with an 85% snap point so
 * the form gets a scrollable region, and react-hook-form + the shared
 * `transactionFormSchema` so validation matches the web exactly.
 * ------------------------------------------------------------------------- */

function todayIsoDate(): string {
  // Local calendar date as YYYY-MM-DD (avoids the UTC shift of toISOString()).
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// `amount` starts empty: the schema coerces the string on submit, and an empty
// field is friendlier than a literal "0" the user must clear. Typed loose here
// because the RHF form value is the raw input string until zod coercion runs.
const EMPTY_DEFAULTS = {
  accountId: '',
  categoryId: '',
  amount: '',
  type: 'expense' as const,
  occurredAt: todayIsoDate(),
  note: '',
  loanId: '',
} as unknown as TransactionFormValues;

export function QuickAddTransaction() {
  const open = useUIStore((s) => s.quickAddOpen);
  const setOpen = useUIStore((s) => s.setQuickAddOpen);

  const accounts = useAccountStore((s) => s.accounts);
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts);
  const categories = useCategoryStore((s) => s.categories);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);
  const loans = useLoanStore((s) => s.loans);
  const fetchLoans = useLoanStore((s) => s.fetchLoans);
  const createTransaction = useTransactionStore((s) => s.createTransaction);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  const typeWatch = form.watch('type');

  // Ensure the option sources are loaded the first time the sheet is opened.
  React.useEffect(() => {
    if (!open) return;
    if (accounts.length === 0) void fetchAccounts();
    if (categories.length === 0) void fetchCategories();
    if (loans.length === 0) void fetchLoans();
    // Only re-run when the sheet transitions open; the fetch guards keep it cheap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Re-seed the form each time the sheet opens, defaulting to the first account.
  React.useEffect(() => {
    if (!open) return;
    form.reset({ ...EMPTY_DEFAULTS, accountId: accounts[0]?.id ?? '' });
  }, [open, accounts, form]);

  const accountOptions = React.useMemo(
    () => accounts.map((a) => ({ label: a.name, value: a.id })),
    [accounts],
  );

  // Sentinel for the "no selection" row on the optional Selects (the native
  // <Select> can't represent an empty value, so we model it explicitly).
  const NONE = '_none';

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
      const categoryId = values.categoryId && values.categoryId.length > 0 ? values.categoryId : null;
      const loanId =
        values.type === 'expense' && values.loanId && values.loanId.length > 0 ? values.loanId : null;
      await createTransaction({
        accountId: values.accountId,
        categoryId,
        loanId,
        amount: values.amount,
        type: values.type,
        occurredAt: values.occurredAt,
        note: values.note ?? null,
      });
      // The store fires its own success toast + haptic; just close & reset here.
      setOpen(false);
      form.reset(EMPTY_DEFAULTS);
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    }
  });

  const submitting = form.formState.isSubmitting;
  const rootError = form.formState.errors.root?.message;

  return (
    <Sheet open={open} onOpenChange={setOpen} snapPoints={['85%']} title="Новая транзакция">
      <Form {...form}>
        {/* Everything (incl. the submit button) lives inside the single scrollable
            SheetContent: with a fixed snap point the BottomSheetScrollView owns the
            sheet's body height and scrolls, so the form never gets clipped and the
            keyboard can lift fields into view. */}
        <SheetContent contentContainerClassName="gap-4 pb-4">
          <SheetDescription className="-mt-1">
            Запишите доход или расход в несколько полей.
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
                  autoFocus
                  returnKeyType="done"
                  value={
                    field.value === undefined ||
                    field.value === null ||
                    (typeof field.value === 'number' && Number.isNaN(field.value))
                      ? ''
                      : String(field.value)
                  }
                  onChangeText={(t) => {
                    // Normalise comma decimals + strip junk, then keep the RAW
                    // string in form state (so partial input like "1." survives).
                    // `transactionFormSchema` uses z.coerce.number(), which turns
                    // this string into a number at validation/submit time.
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
                <FormLabel>Категория</FormLabel>
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
        </SheetContent>
      </Form>
    </Sheet>
  );
}

export default QuickAddTransaction;
