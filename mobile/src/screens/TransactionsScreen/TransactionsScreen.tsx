import * as React from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ListFilter,
  Plus,
  Receipt,
  Search,
  SearchX,
  Wallet,
  X,
} from 'lucide-react-native';

import { Button } from '@components/ui/button';
import { EmptyState, ScreenHeader } from '@components/blocks';
import { CategoryIcon } from '@components/CategoryIcon';
import { Input } from '@components/ui/input';
import { Select } from '@components/ui/select';
import { Sheet, SheetContent, SheetFooter } from '@components/ui/sheet';
import { Skeleton } from '@components/ui/skeleton';
import { Text } from '@components/ui/text';
import { Label } from '@components/ui/label';
import { tokenColor, useResolvedTheme } from '@/shared/theme/tokens';

import { formatMoney, formatTxDate } from '@/shared/utils/format';
import type { Transaction } from '@/shared/types/entities';
import { useAccountStore } from '@/shared/store/accountStore';
import { useCategoryStore } from '@/shared/store/categoryStore';
import { useLoanStore } from '@/shared/store/loanStore';
import { useTransactionStore } from '@/shared/store/transactionStore';

import { TransactionForm } from '@screens/TransactionsScreen/TransactionForm';
import {
  activeFilterCount,
  buildRows,
  EMPTY_FILTERS,
  filterRows,
  hasActiveFilters,
  PAGE_SIZE,
  type TransactionFilters,
  type TransactionRow,
  type TypeFilter,
} from '@screens/TransactionsScreen/transactionFilters';

/* ----------------------------------------------------------------------------
 * TransactionsScreen — the mobile operations screen.
 *
 * Mirrors the web TransactionsScreen features (search + type/category/account
 * filters, paginated list, create/edit/delete) but redesigned for mobile:
 * an own header, an inline search with a «Фильтры» bottom sheet, a FlatList of
 * tappable rows with inline edit/delete, "Показать ещё" pagination, and
 * pull-to-refresh. Create/edit run through the shared <TransactionForm> sheet.
 * ------------------------------------------------------------------------- */

export default function TransactionsScreen() {
  const theme = useResolvedTheme();
  const { accounts, fetchAccounts } = useAccountStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { loans, fetchLoans } = useLoanStore();
  const { transactions, loading, error, fetchTransactions } = useTransactionStore();

  // Form sheet (create / edit) state.
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Transaction | null>(null);

  // Filters + pagination.
  const [filters, setFilters] = React.useState<TransactionFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadAll = React.useCallback(() => {
    void fetchAccounts();
    void fetchCategories();
    void fetchLoans();
    void fetchTransactions();
  }, [fetchAccounts, fetchCategories, fetchLoans, fetchTransactions]);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchAccounts(),
        fetchCategories(),
        fetchLoans(),
        fetchTransactions(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAccounts, fetchCategories, fetchLoans, fetchTransactions]);

  const rows = React.useMemo(
    () => buildRows(transactions, accounts, categories, loans),
    [transactions, accounts, categories, loans],
  );

  const filteredRows = React.useMemo(() => filterRows(rows, filters), [rows, filters]);

  // Reset pagination whenever the filters change.
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters]);

  const visibleRows = React.useMemo(
    () => filteredRows.slice(0, visibleCount),
    [filteredRows, visibleCount],
  );

  const totalCount = rows.length;
  const filteredCount = filteredRows.length;
  const hasMore = filteredCount > visibleCount;
  const filtersActive = hasActiveFilters(filters);
  const filterBadge = activeFilterCount(filters);
  const noAccounts = accounts.length === 0;

  const onOpenCreate = React.useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const onOpenEdit = React.useCallback((t: TransactionRow) => {
    // Strip the derived display fields back to a bare Transaction for the form.
    const {
      accountName: _a,
      accountCurrency: _c,
      categoryName: _cn,
      categoryIcon: _ci,
      categoryColor: _cc,
      loanName: _ln,
      ...transaction
    } = t;
    setEditing(transaction);
    setFormOpen(true);
  }, []);

  const resetFilters = React.useCallback(() => setFilters(EMPTY_FILTERS), []);

  const showSkeleton = loading && rows.length === 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {/* Header */}
      <ScreenHeader
        title="Операции"
        subtitle="Учёт доходов и расходов."
        action={
          <Button
            size="icon"
            onPress={onOpenCreate}
            disabled={noAccounts}
            accessibilityLabel="Добавить транзакцию"
          >
            <Plus size={20} className="text-primary-foreground" />
          </Button>
        }
      />

      {noAccounts && !showSkeleton ? (
        <View className="px-5 pb-3">
          <Text className="text-sm text-muted-foreground">
            Сначала создайте кошелёк, затем добавляйте транзакции.
          </Text>
        </View>
      ) : null}

      {/* Search + filters row */}
      {totalCount > 0 ? (
        <View className="flex-row items-center gap-2 px-5 pb-3">
          <View className="flex-1">
            <Input
              value={filters.query}
              onChangeText={(query) => setFilters((f) => ({ ...f, query }))}
              placeholder="Поиск по операциям…"
              returnKeyType="search"
              left={<Search size={16} className="text-muted-foreground" />}
              right={
                filters.query.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Очистить поиск"
                    hitSlop={8}
                    onPress={() => setFilters((f) => ({ ...f, query: '' }))}
                  >
                    <X size={16} className="text-muted-foreground" />
                  </Pressable>
                ) : null
              }
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Фильтры"
            onPress={() => setFiltersOpen(true)}
            className="h-11 flex-row items-center gap-1.5 rounded-lg border border-input bg-card px-3 active:border-muted-foreground/40"
          >
            <ListFilter size={18} className="text-foreground" />
            {filterBadge > 0 ? (
              <View className="h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1">
                <Text weight="bold" className="text-[11px] text-primary-foreground">
                  {filterBadge}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      ) : null}

      {/* List / states */}
      {showSkeleton ? (
        <TransactionsSkeleton />
      ) : totalCount === 0 ? (
        <View className="flex-1 px-5 pt-6">
          <EmptyState
            icon={Wallet}
            title="Пока нет транзакций"
            description={
              noAccounts
                ? 'Сначала создайте кошелёк, затем запишите первую операцию.'
                : 'Нажмите «+», чтобы записать первую операцию.'
            }
            action={
              noAccounts ? undefined : (
                <Button size="sm" onPress={onOpenCreate}>
                  Добавить транзакцию
                </Button>
              )
            }
          />
        </View>
      ) : filteredCount === 0 ? (
        <View className="flex-1 px-5 pt-6">
          <EmptyState
            icon={SearchX}
            title="Ничего не найдено"
            description="Измените запрос или сбросьте фильтры."
            action={
              <Button variant="outline" size="sm" onPress={resetFilters}>
                Сбросить фильтры
              </Button>
            }
          />
        </View>
      ) : (
        <FlatList
          data={visibleRows}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          ItemSeparatorComponent={ListSeparator}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <View className="flex-row items-center justify-between pb-2 pt-1">
              <Text className="text-xs text-muted-foreground">
                {filtersActive ? `Найдено: ${filteredCount} из ${totalCount}` : `Всего: ${totalCount}`}
              </Text>
              {filtersActive ? (
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={resetFilters}
                  className="flex-row items-center gap-1 active:opacity-70"
                >
                  <X size={13} className="text-muted-foreground" />
                  <Text weight="medium" className="text-xs text-muted-foreground">
                    Сбросить
                  </Text>
                </Pressable>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <TransactionRowItem row={item} onEdit={onOpenEdit} theme={theme} />
          )}
          ListFooterComponent={
            hasMore ? (
              <View className="items-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => setVisibleCount((c) => c + PAGE_SIZE)}
                >
                  Показать ещё
                </Button>
              </View>
            ) : null
          }
        />
      )}

      {error && !showSkeleton ? (
        <View className="px-5 pb-2">
          <Text className="text-sm text-destructive">{error}</Text>
        </View>
      ) : null}

      {/* Create / edit sheet */}
      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        accounts={accounts}
        categories={categories}
        loans={loans}
      />

      {/* Filter sheet */}
      <FiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onChange={setFilters}
        categories={categories}
        accounts={accounts}
      />
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* Row                                                                         */
/* -------------------------------------------------------------------------- */

const TransactionRowItem = React.memo(function TransactionRowItem({
  row,
  onEdit,
  theme,
}: {
  row: TransactionRow;
  onEdit: (row: TransactionRow) => void;
  theme: 'light' | 'dark';
}) {
  const isIncome = row.type === 'income';
  const title = row.note?.trim() || row.categoryName || row.accountName;
  // Always surface the date; prepend the category only when it isn't already the
  // title. Kept to two tokens (like Home) so it never truncates — the account is
  // implied by the amount's currency and shown in full in the edit sheet.
  const meta =
    row.note?.trim() && row.categoryName
      ? `${row.categoryName} · ${formatTxDate(row.occurred_at)}`
      : formatTxDate(row.occurred_at);

  // Whole row taps to edit; delete lives inside the edit sheet. No inline
  // pencil/trash — matches the clean Home row anatomy.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Изменить: ${title}`}
      onPress={() => onEdit(row)}
      className="flex-row items-center gap-3 py-3.5 active:opacity-70"
    >
      {row.categoryName ? (
        <CategoryIcon
          iconName={row.categoryIcon ?? 'Circle'}
          color={row.categoryColor ?? '#64748b'}
          size={20}
        />
      ) : (
        <View className="size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Receipt size={18} color={tokenColor('muted-foreground', theme)} strokeWidth={2} />
        </View>
      )}

      <View className="min-w-0 flex-1">
        <Text weight="medium" numberOfLines={1} className="text-[15px] text-foreground">
          {title}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 text-[12px] text-muted-foreground">
          {meta}
        </Text>
      </View>

      <Text
        weight="semibold"
        numberOfLines={1}
        className="text-[15px]"
        style={{
          color: isIncome ? tokenColor('income', theme) : tokenColor('foreground', theme),
          fontVariant: ['tabular-nums'],
        }}
      >
        {isIncome ? '+' : '−'}
        {formatMoney(row.amount, row.accountCurrency)}
      </Text>
    </Pressable>
  );
});

function ListSeparator() {
  return <View className="h-px bg-border/60" />;
}

/* -------------------------------------------------------------------------- */
/* Filters sheet                                                               */
/* -------------------------------------------------------------------------- */

const TYPE_OPTIONS: { label: string; value: TypeFilter }[] = [
  { label: 'Все типы', value: 'all' },
  { label: 'Доходы', value: 'income' },
  { label: 'Расходы', value: 'expense' },
];

function FiltersSheet({
  open,
  onOpenChange,
  filters,
  onChange,
  categories,
  accounts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: TransactionFilters;
  onChange: React.Dispatch<React.SetStateAction<TransactionFilters>>;
  categories: { id: string; name: string }[];
  accounts: { id: string; name: string }[];
}) {
  const categoryOptions = React.useMemo(
    () => [
      { label: 'Все категории', value: 'all' },
      ...categories.map((c) => ({ label: c.name, value: c.id })),
    ],
    [categories],
  );
  const accountOptions = React.useMemo(
    () => [
      { label: 'Все счета', value: 'all' },
      ...accounts.map((a) => ({ label: a.name, value: a.id })),
    ],
    [accounts],
  );

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Фильтры"
      footer={
        <SheetFooter className="border-t-0 px-0 pb-0 pt-0">
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => onChange((f) => ({ ...EMPTY_FILTERS, query: f.query }))}
          >
            Сбросить
          </Button>
          <Button className="flex-1" onPress={() => onOpenChange(false)}>
            Готово
          </Button>
        </SheetFooter>
      }
    >
      <SheetContent contentContainerClassName="gap-4 pb-2">
        <View className="gap-2">
          <Label>Тип</Label>
          <Select
            value={filters.type}
            onValueChange={(v) => onChange((f) => ({ ...f, type: v as TypeFilter }))}
            options={TYPE_OPTIONS}
            title="Тип"
          />
        </View>
        <View className="gap-2">
          <Label>Категория</Label>
          <Select
            value={filters.categoryId}
            onValueChange={(v) => onChange((f) => ({ ...f, categoryId: v }))}
            options={categoryOptions}
            title="Категория"
          />
        </View>
        <View className="gap-2">
          <Label>Кошелёк</Label>
          <Select
            value={filters.accountId}
            onValueChange={(v) => onChange((f) => ({ ...f, accountId: v }))}
            options={accountOptions}
            title="Кошелёк"
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                    */
/* -------------------------------------------------------------------------- */

function TransactionsSkeleton() {
  return (
    <View className="flex-1 px-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} className="flex-row items-center gap-3 py-3">
          <Skeleton className="size-9 rounded-xl" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </View>
          <Skeleton className="h-4 w-16" />
        </View>
      ))}
    </View>
  );
}
