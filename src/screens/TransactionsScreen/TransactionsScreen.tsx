import { motion } from 'framer-motion';
import { Pencil, Receipt, Search, SearchX, Trash2, Wallet, X } from 'lucide-react';

import { EmptyState, SectionCard } from '@/components/blocks';
import { CategoryTag, TransactionTypeTag } from '@/components/tags';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { TransactionsSkeleton } from '@/screens/TransactionsScreen/TransactionsScreen.skeleton';
import { transactionsHeaderClassName } from '@/screens/TransactionsScreen/TransactionsScreen.styles';
import type { TransactionsScreenProps } from '@/screens/TransactionsScreen/TransactionsScreen.types';
import { cn } from '@/shared/lib/utils';
import { Stagger, StaggerItem } from '@/shared/ui/motion/Stagger';
import { formatDateDisplay, formatMoney } from '@/shared/utils/format';

export function TransactionsScreen(props: TransactionsScreenProps) {
  const {
    rows,
    totalCount,
    filteredCount,
    hasMore,
    onShowMore,
    query,
    onQueryChange,
    typeFilter,
    onTypeFilterChange,
    categoryFilter,
    onCategoryFilterChange,
    accountFilter,
    onAccountFilterChange,
    hasActiveFilters,
    onResetFilters,
    loading,
    error,
    dialogOpen,
    editing,
    form,
    accountOptions,
    categoryOptions,
    loanOptions,
    onOpenCreate,
    onOpenEdit,
    onCloseDialog,
    onSubmit,
    onDelete,
  } = props;

  const typeWatch = form.watch('type');

  return (
    <>
      <Stagger className="space-y-6">
        {/* Header */}
        <StaggerItem className={transactionsHeaderClassName}>
          <p className="text-sm text-muted-foreground">Учёт доходов и расходов.</p>
          <Button type="button" onClick={onOpenCreate} disabled={accountOptions.length === 0}>
            Добавить транзакцию
          </Button>
        </StaggerItem>

        {accountOptions.length === 0 ? (
          <StaggerItem>
            <p className="text-sm text-muted-foreground">
              Сначала создайте кошелёк, затем добавляйте транзакции.
            </p>
          </StaggerItem>
        ) : null}

        {error ? (
          <StaggerItem>
            <p className="text-sm text-destructive">{error}</p>
          </StaggerItem>
        ) : null}

        {/* Transactions list */}
        <StaggerItem>
          {loading ? (
            <TransactionsSkeleton />
          ) : (
            <SectionCard
              icon={Receipt}
              title="Все транзакции"
              description={
                hasActiveFilters
                  ? `Найдено: ${filteredCount} из ${totalCount}`
                  : `Всего: ${totalCount}`
              }
              flush
              contentClassName="px-2 pb-2 sm:px-3 sm:pb-3"
            >
              {totalCount > 0 ? (
                <div className="flex flex-col gap-2 border-b border-border/60 px-1 pb-3 pt-1 sm:flex-row sm:items-center sm:px-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => onQueryChange(e.target.value)}
                      placeholder="Поиск по заметке, категории, счёту…"
                      className="h-10 pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={typeFilter}
                      onValueChange={(v) => onTypeFilterChange(v as 'all' | 'income' | 'expense')}
                    >
                      <SelectTrigger className="h-10 w-[118px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все типы</SelectItem>
                        <SelectItem value="income">Доходы</SelectItem>
                        <SelectItem value="expense">Расходы</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                      <SelectTrigger className="h-10 w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все категории</SelectItem>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={accountFilter} onValueChange={onAccountFilterChange}>
                      <SelectTrigger className="h-10 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все счета</SelectItem>
                        {accountOptions.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {hasActiveFilters ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Сбросить фильтры"
                        onClick={onResetFilters}
                        className="h-10 w-10"
                      >
                        <X className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {totalCount === 0 ? (
                <div className="p-4">
                  <EmptyState
                    icon={Wallet}
                    title="Пока нет транзакций"
                    description="Нажмите «Добавить транзакцию», чтобы записать первую операцию."
                    size="sm"
                  />
                </div>
              ) : filteredCount === 0 ? (
                <div className="p-4">
                  <EmptyState
                    icon={SearchX}
                    title="Ничего не найдено"
                    description="Измените запрос или сбросьте фильтры."
                    size="sm"
                    action={
                      <Button type="button" variant="outline" size="sm" onClick={onResetFilters}>
                        Сбросить фильтры
                      </Button>
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {rows.map((t, i) => (
                    <motion.li
                      key={t.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(i, 12) * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/50"
                    >
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                        style={{
                          backgroundColor: t.categoryColor
                            ? `${t.categoryColor}22`
                            : 'hsl(var(--muted))',
                          color: t.categoryColor ?? 'hsl(var(--muted-foreground))',
                        }}
                      >
                        {(t.categoryName ?? t.accountName).charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {t.note?.trim() || t.categoryName || t.accountName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatDateDisplay(t.occurred_at)} · {t.accountName}
                          {t.loanName ? ` · ${t.loanName}` : ''}
                        </p>
                      </div>
                      {t.categoryName ? (
                        <div className="hidden sm:block">
                          <CategoryTag
                            name={t.categoryName}
                            color={t.categoryColor ?? '#64748b'}
                            icon={t.categoryIcon ?? undefined}
                          />
                        </div>
                      ) : null}
                      <TransactionTypeTag kind={t.type} className="hidden md:inline-flex" />
                      <span
                        className={cn(
                          'shrink-0 text-right text-sm font-bold tabular-nums sm:text-base',
                          t.type === 'income' ? 'text-income-foreground' : 'text-foreground'
                        )}
                      >
                        {t.type === 'income' ? '+' : '−'}
                        {formatMoney(t.amount, t.accountCurrency)}
                      </span>
                      <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Редактировать транзакцию"
                          onClick={() => onOpenEdit(t)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Удалить транзакцию"
                          onClick={() => onDelete(t)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}

              {hasMore ? (
                <div className="flex justify-center pt-3">
                  <Button type="button" variant="outline" size="sm" onClick={onShowMore}>
                    Показать ещё
                  </Button>
                </div>
              ) : null}
            </SectionCard>
          )}
        </StaggerItem>
      </Stagger>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && onCloseDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать транзакцию' : 'Новая транзакция'}</DialogTitle>
            <DialogDescription>
              Сумма всегда положительная; тип задаёт, прибавляется она или вычитается.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        if (v === 'income') form.setValue('loanId', '');
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Тип" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">Доход</SelectItem>
                        <SelectItem value="expense">Расход</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Кошелёк</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Кошелёк" />
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
                control={form.control}
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
                          <SelectValue placeholder="Категория" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Нет</SelectItem>
                        {categoryOptions
                          .filter((c) => c.type === (typeWatch ?? 'expense'))
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
              {typeWatch === 'expense' && loanOptions.length > 0 ? (
                <FormField
                  control={form.control}
                  name="loanId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Кредит (необязательно)</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === '_none' ? '' : v)}
                        value={field.value && field.value.length > 0 ? field.value : '_none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Нет" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_none">Нет</SelectItem>
                          {loanOptions.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сумма</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Заметка</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
