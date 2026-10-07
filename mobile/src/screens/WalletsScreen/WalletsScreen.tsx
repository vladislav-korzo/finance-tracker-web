import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeftRight,
  ArrowRight,
  Info,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react-native';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { confirm } from '@components/ConfirmDialog';
import { EmptyState, ScreenHeader, SectionCard } from '@components/blocks';
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
import { Select } from '@components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@components/ui/sheet';
import { Skeleton } from '@components/ui/skeleton';
import { Text } from '@components/ui/text';
import {
  ACCOUNT_CURRENCY_OPTIONS,
  DEFAULT_ACCOUNT_CURRENCY,
  normalizeAccountCurrency,
} from '@/shared/constants/accountCurrencies';
import { AnimatedNumber } from '@/shared/ui/motion/AnimatedNumber';
import { StaggerItem } from '@/shared/ui/motion/Stagger';
import { useToken } from '@/shared/theme/tokens';
import type { Account, Transfer } from '@/shared/types/entities';
import { formatMoney, formatTxDate } from '@/shared/utils/format';
import { useAccountStore } from '@/shared/store/accountStore';
import { useTransactionStore } from '@/shared/store/transactionStore';
import { useTransferStore } from '@/shared/store/transferStore';

import {
  todayIsoDate,
  transferFormSchema,
  walletFormDefaults,
  walletFormSchema,
  type TransferFormValues,
  type WalletFormValues,
} from './WalletsScreen.forms';

/* ============================================================================
 * Wallets screen — accounts (wallets) + transfers between them.
 *
 * Native redesign of the web WalletsScreen, which composes AccountsScreen
 * (wallet CRUD with computed balances) + TransferDialog + TransfersCard. Same
 * features, mobile layout: an own header, a vertically-scrolling list of wallet
 * cards (pull-to-refresh), bottom-sheet forms for create/edit + transfer, and a
 * transfers history list with confirm-to-delete.
 *
 * Balance per wallet = income adds, expense subtracts, transfers move funds
 * between accounts (out of `from`, into `to`) — identical to the web reducer.
 * ========================================================================== */

export default function WalletsScreen() {
  const {
    accounts,
    loading,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  } = useAccountStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const {
    transfers,
    fetchTransfers,
    createTransfer,
    deleteTransfer,
  } = useTransferStore();

  const [refreshing, setRefreshing] = React.useState(false);
  const [walletSheetOpen, setWalletSheetOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Account | null>(null);
  const [transferSheetOpen, setTransferSheetOpen] = React.useState(false);

  // Icon colour for the primary "+" button (theme-aware; matches the label).
  const primaryFg = useToken('primary-foreground');

  const loadAll = React.useCallback(() => {
    void fetchAccounts();
    void fetchTransactions();
    void fetchTransfers();
  }, [fetchAccounts, fetchTransactions, fetchTransfers]);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchAccounts(), fetchTransactions(), fetchTransfers()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAccounts, fetchTransactions, fetchTransfers]);

  /** Balance per account id: income +, expense −, transfers move between accounts. */
  const balances = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      const delta = t.type === 'income' ? t.amount : -t.amount;
      map[t.account_id] = (map[t.account_id] ?? 0) + delta;
    }
    for (const tr of transfers) {
      map[tr.from_account_id] = (map[tr.from_account_id] ?? 0) - tr.amount;
      map[tr.to_account_id] = (map[tr.to_account_id] ?? 0) + tr.amount;
    }
    return map;
  }, [transactions, transfers]);

  const accountById = React.useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts],
  );

  /* --- Wallet create/edit ------------------------------------------------- */

  const openCreateWallet = React.useCallback(() => {
    setEditing(null);
    setWalletSheetOpen(true);
  }, []);

  const openEditWallet = React.useCallback((account: Account) => {
    setEditing(account);
    setWalletSheetOpen(true);
  }, []);

  const onDeleteWallet = React.useCallback(
    async (account: Account): Promise<boolean> => {
      const ok = await confirm({
        title: 'Удалить кошелёк?',
        description: `«${account.name}» и все связанные с ним транзакции будут удалены безвозвратно.`,
        confirmText: 'Удалить',
        destructive: true,
      });
      if (!ok) return false;
      await deleteAccount(account.id);
      return true;
    },
    [deleteAccount],
  );

  /* --- Transfer delete ---------------------------------------------------- */

  const onDeleteTransfer = React.useCallback(
    async (id: string) => {
      const ok = await confirm({
        title: 'Удалить перевод?',
        description: 'Балансы счетов вернутся к прежним значениям.',
        confirmText: 'Удалить',
        destructive: true,
      });
      if (!ok) return;
      void deleteTransfer(id);
    },
    [deleteTransfer],
  );

  const showSkeleton = loading && accounts.length === 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {/* Header */}
      <ScreenHeader
        title="Кошельки"
        subtitle="Счета и балансы в разных валютах."
        action={
          <Button size="icon" onPress={openCreateWallet} accessibilityLabel="Добавить кошелёк">
            <Plus size={20} color={primaryFg} />
          </Button>
        }
      />

      <FlatList
        data={accounts}
        keyExtractor={(a) => a.id}
        contentContainerClassName="px-5 pb-10 pt-1 gap-3"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View className="gap-3 pb-1">
            {/* Info hint */}
            <View className="flex-row items-start gap-2 rounded-xl bg-muted/40 px-3.5 py-3">
              <Info size={16} className="mt-0.5 text-muted-foreground" />
              <Text className="flex-1 text-[13px] leading-5 text-muted-foreground">
                Кошельки хранят балансы и привязаны к транзакциям.
              </Text>
            </View>

            {/* Transfer action */}
            <Button
              variant="outline"
              onPress={() => setTransferSheetOpen(true)}
              disabled={accounts.length < 2}
              className="w-full"
            >
              <View className="flex-row items-center gap-2">
                <ArrowLeftRight size={16} className="text-foreground" />
                <Text weight="semibold" className="text-sm text-foreground">
                  Перевод
                </Text>
              </View>
            </Button>

            {error ? (
              <Text weight="medium" className="text-sm text-destructive">
                {error}
              </Text>
            ) : null}

            {showSkeleton ? <WalletsSkeleton /> : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <StaggerItem>
            <WalletCard
              account={item}
              balance={balances[item.id] ?? 0}
              delay={Math.min(index, 8) * 0.05}
              onEdit={() => openEditWallet(item)}
            />
          </StaggerItem>
        )}
        ListEmptyComponent={
          showSkeleton ? null : (
            <EmptyState
              icon={Wallet}
              title="Пока нет кошельков"
              description="Создайте первый кошелёк, чтобы привязывать к нему транзакции."
              action={
                <Button onPress={openCreateWallet}>Создать кошелёк</Button>
              }
            />
          )
        }
        ListFooterComponent={
          <TransfersHistory
            transfers={transfers}
            accountById={accountById}
            onDelete={onDeleteTransfer}
          />
        }
      />

      <WalletFormSheet
        open={walletSheetOpen}
        onOpenChange={setWalletSheetOpen}
        editing={editing}
        onCreate={createAccount}
        onUpdate={updateAccount}
        onDelete={editing ? () => onDeleteWallet(editing) : undefined}
      />

      <TransferFormSheet
        open={transferSheetOpen}
        onOpenChange={setTransferSheetOpen}
        accounts={accounts}
        onSubmit={createTransfer}
      />
    </SafeAreaView>
  );
}

/* ----------------------------------------------------------------------------
 * Wallet card — currency badge + name + animated balance, with inline edit /
 * delete icon buttons (>=44px targets). Red balance when negative.
 * -------------------------------------------------------------------------- */

function WalletCard({
  account,
  balance,
  delay,
  onEdit,
}: {
  account: Account;
  balance: number;
  delay: number;
  onEdit: () => void;
}) {
  const negative = balance < 0;
  // Whole card taps to edit; edit/delete live in the sheet (no inline buttons).
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Изменить ${account.name}`}
      onPress={onEdit}
      className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4 active:opacity-70"
    >
      <View className="size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
        <Text weight="bold" className="text-sm tracking-tight text-primary">
          {account.currency}
        </Text>
      </View>
      <Text
        weight="medium"
        numberOfLines={1}
        className="min-w-0 flex-1 text-[15px] text-foreground"
      >
        {account.name}
      </Text>
      <AnimatedNumber
        value={balance}
        delay={delay}
        format={(n) => formatMoney(n, account.currency)}
        weight="bold"
        numberOfLines={1}
        className={
          negative
            ? 'text-lg text-expense-foreground'
            : 'text-lg text-foreground'
        }
        style={{ fontVariant: ['tabular-nums'] }}
      />
    </Pressable>
  );
}

/* ----------------------------------------------------------------------------
 * Transfers history — recent transfers with confirm-to-delete. Hidden entirely
 * when there are none (mirrors the web TransfersCard).
 * -------------------------------------------------------------------------- */

function TransfersHistory({
  transfers,
  accountById,
  onDelete,
}: {
  transfers: Transfer[];
  accountById: Map<string, Account>;
  onDelete: (id: string) => void;
}) {
  if (transfers.length === 0) return null;

  return (
    <View className="pt-5">
      <SectionCard
        title="Переводы"
        description={`Всего: ${transfers.length}`}
        flush
        contentClassName="px-2 pb-2"
      >
        <View>
          {transfers.map((t, i) => {
            const from = accountById.get(t.from_account_id);
            const to = accountById.get(t.to_account_id);
            // Never pass an empty code to Intl currency formatting (it throws
            // "Invalid currency code") — fall back to the default if a transfer's
            // accounts aren't resolvable (e.g. deleted, or not yet loaded).
            const currency = from?.currency ?? to?.currency ?? DEFAULT_ACCOUNT_CURRENCY;
            return (
              <View
                key={t.id}
                className={
                  i > 0
                    ? 'flex-row items-center gap-3 border-t border-border/60 px-3 py-3'
                    : 'flex-row items-center gap-3 px-3 py-3'
                }
              >
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text
                      weight="medium"
                      numberOfLines={1}
                      className="shrink text-foreground"
                    >
                      {from?.name ?? '—'}
                    </Text>
                    <ArrowRight size={14} className="text-muted-foreground" />
                    <Text
                      weight="medium"
                      numberOfLines={1}
                      className="shrink text-foreground"
                    >
                      {to?.name ?? '—'}
                    </Text>
                  </View>
                  <Text numberOfLines={1} className="text-xs text-muted-foreground">
                    {formatTxDate(t.occurred_at)}
                    {t.note ? ` · ${t.note}` : ''}
                  </Text>
                </View>
                <Text
                  weight="bold"
                  className="shrink-0 text-sm text-foreground"
                >
                  {formatMoney(t.amount, currency)}
                </Text>
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={() => onDelete(t.id)}
                  accessibilityLabel="Удалить перевод"
                >
                  <Trash2 size={18} className="text-muted-foreground" />
                </Button>
              </View>
            );
          })}
        </View>
      </SectionCard>
    </View>
  );
}

/* ----------------------------------------------------------------------------
 * Wallet form sheet — create or edit a wallet (name + currency).
 * -------------------------------------------------------------------------- */

function WalletFormSheet({
  open,
  onOpenChange,
  editing,
  onCreate,
  onUpdate,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Account | null;
  onCreate: (name: string, currency?: string) => Promise<void>;
  onUpdate: (id: string, name: string, currency: string) => Promise<void>;
  /** Edit-only: confirm + delete the wallet. Resolves true when actually deleted. */
  onDelete?: () => Promise<boolean>;
}) {
  const destructive = useToken('destructive');
  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: walletFormDefaults,
  });

  // Re-seed the form each time the sheet opens (create vs edit).
  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        name: editing.name,
        currency: normalizeAccountCurrency(editing.currency),
      });
    } else {
      form.reset(walletFormDefaults);
    }
    // form identity is stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing) {
        await onUpdate(editing.id, values.name, values.currency);
      } else {
        await onCreate(values.name, values.currency);
      }
      onOpenChange(false);
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    }
  });

  const rootError = form.formState.errors.root?.message;
  const submitting = form.formState.isSubmitting;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader>
        <SheetTitle>{editing ? 'Редактировать кошелёк' : 'Новый кошелёк'}</SheetTitle>
        <SheetDescription>
          {editing
            ? 'Измените название или валюту.'
            : 'Добавьте кошелёк для привязки транзакций.'}
        </SheetDescription>
      </SheetHeader>
      <SheetContent contentContainerClassName="gap-4 pb-4">
        <Form {...form}>
          <FormField
            control={form.control}
            name="name"
            render={() => (
              <FormItem>
                <FormLabel>Название</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Например, Наличные"
                    autoCapitalize="sentences"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={onSubmit}
                  />
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
                  title="Выберите валюту"
                  placeholder="Выберите валюту"
                  options={ACCOUNT_CURRENCY_OPTIONS.map((o) => ({
                    label: o.label,
                    value: o.value,
                  }))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {rootError ? (
            <View className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
              <Text weight="medium" className="text-sm text-destructive">
                {rootError}
              </Text>
            </View>
          ) : null}
          <View className="flex-row gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onPress={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button className="flex-1" onPress={onSubmit} loading={submitting}>
              {submitting ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </View>

          {/* Delete lives in the edit sheet so wallet cards stay button-free. */}
          {editing && onDelete ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Удалить кошелёк"
              onPress={async () => {
                const deleted = await onDelete();
                if (deleted) onOpenChange(false);
              }}
              disabled={submitting}
              className="h-12 flex-row items-center justify-center gap-2 rounded-xl active:opacity-70"
            >
              <Trash2 size={18} color={destructive} />
              <Text weight="semibold" className="text-destructive">
                Удалить кошелёк
              </Text>
            </Pressable>
          ) : null}
        </Form>
      </SheetContent>
    </Sheet>
  );
}

/* ----------------------------------------------------------------------------
 * Transfer form sheet — move money between two same-currency accounts.
 * `to` options are filtered to the source account's currency (excluding it).
 * -------------------------------------------------------------------------- */

function TransferFormSheet({
  open,
  onOpenChange,
  accounts,
  onSubmit: submitTransfer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  onSubmit: (input: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    occurredAt: string;
    note?: string | null;
  }) => Promise<void>;
}) {
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      fromAccountId: '',
      toAccountId: '',
      amount: 0,
      occurredAt: todayIsoDate(),
      note: '',
    },
  });

  const fromId = form.watch('fromAccountId');
  const fromAccount = accounts.find((a) => a.id === fromId);

  // Only same-currency destinations (and never the source itself).
  const toOptions = React.useMemo(
    () =>
      fromAccount
        ? accounts.filter(
            (a) => a.id !== fromAccount.id && a.currency === fromAccount.currency,
          )
        : [],
    [accounts, fromAccount],
  );

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      fromAccountId: accounts[0]?.id ?? '',
      toAccountId: '',
      amount: 0,
      occurredAt: todayIsoDate(),
      note: '',
    });
    // form identity is stable; reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, accounts]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await submitTransfer({
        fromAccountId: values.fromAccountId,
        toAccountId: values.toAccountId,
        amount: values.amount,
        occurredAt: values.occurredAt,
        note: values.note ?? null,
      });
      onOpenChange(false);
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    }
  });

  const rootError = form.formState.errors.root?.message;
  const submitting = form.formState.isSubmitting;

  const accountOptions = accounts.map((a) => ({
    label: `${a.name} · ${a.currency}`,
    value: a.id,
  }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader>
        <SheetTitle>Перевод между счетами</SheetTitle>
        <SheetDescription>
          Перемещение средств между кошельками одной валюты. На доходы и расходы не
          влияет.
        </SheetDescription>
      </SheetHeader>
      <SheetContent contentContainerClassName="gap-4 pb-4">
        <Form {...form}>
          <FormField
            control={form.control}
            name="fromAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Со счёта</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    // Reset the destination — its valid set depends on the source.
                    form.setValue('toAccountId', '');
                  }}
                  title="Со счёта"
                  placeholder="Выберите счёт"
                  options={accountOptions}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="toAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>На счёт</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!fromAccount}
                  title="На счёт"
                  placeholder={
                    toOptions.length === 0
                      ? 'Нет счетов той же валюты'
                      : 'Выберите счёт'
                  }
                  options={toOptions.map((a) => ({
                    label: `${a.name} · ${a.currency}`,
                    value: a.id,
                  }))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Сумма{fromAccount ? `, ${fromAccount.currency}` : ''}
                </FormLabel>
                <FormControl>
                  <Input
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    value={
                      field.value === 0 || field.value == null
                        ? ''
                        : String(field.value)
                    }
                    onChangeText={(text) =>
                      field.onChange(text.replace(',', '.'))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                    keyboardType="numbers-and-punctuation"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="note"
            render={() => (
              <FormItem>
                <FormLabel>Заметка (необязательно)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Комментарий"
                    autoCapitalize="sentences"
                    returnKeyType="done"
                    onSubmitEditing={onSubmit}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {rootError ? (
            <View className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
              <Text weight="medium" className="text-sm text-destructive">
                {rootError}
              </Text>
            </View>
          ) : null}
          <View className="flex-row gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onPress={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button className="flex-1" onPress={onSubmit} loading={submitting}>
              {submitting ? 'Перевод…' : 'Перевести'}
            </Button>
          </View>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

/* ----------------------------------------------------------------------------
 * Loading skeleton — a few placeholder wallet cards.
 * -------------------------------------------------------------------------- */

function WalletsSkeleton() {
  return (
    <View className="gap-3">
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <Skeleton className="size-12 rounded-xl" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </View>
        </View>
      ))}
    </View>
  );
}
