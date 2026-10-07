import { motion } from 'framer-motion';
import { Pencil, Trash2, Wallet } from 'lucide-react';

import { EmptyState, SectionCard } from '@/components/blocks';
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

import { AccountsSkeleton } from '@/screens/AccountsScreen/AccountsScreen.skeleton';
import { accountsHeaderClassName } from '@/screens/AccountsScreen/AccountsScreen.styles';
import type { AccountsScreenProps } from '@/screens/AccountsScreen/AccountsScreen.types';
import { ACCOUNT_CURRENCY_OPTIONS } from '@/shared/constants/accountCurrencies';
import { formatMoney } from '@/shared/utils/format';
import { AnimatedNumber } from '@/shared/ui/motion/AnimatedNumber';
import { Stagger, StaggerItem } from '@/shared/ui/motion/Stagger';

export function AccountsScreen(props: AccountsScreenProps) {
  const {
    embedded,
    accounts,
    balances,
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

  return (
    <>
      <Stagger className="space-y-6">
        {!embedded ? (
          <StaggerItem className={accountsHeaderClassName}>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Кошельки</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Наличные и счета, которые вы ведёте.
              </p>
            </div>
            <Button type="button" onClick={onOpenCreate}>
              Добавить кошелёк
            </Button>
          </StaggerItem>
        ) : null}

        {error ? (
          <StaggerItem>
            <p className="text-sm text-destructive">{error}</p>
          </StaggerItem>
        ) : null}

        <StaggerItem>
          {loading ? (
            <AccountsSkeleton />
          ) : (
            <SectionCard
              icon={Wallet}
              title="Ваши кошельки"
              description={`Всего: ${accounts.length}`}
              action={
                embedded ? (
                  <Button type="button" onClick={onOpenCreate}>
                    Добавить кошелёк
                  </Button>
                ) : undefined
              }
            >
              {accounts.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="Пока нет кошельков"
                  description="Создайте первый кошелёк, чтобы привязывать к нему транзакции."
                  action={
                    <Button type="button" onClick={onOpenCreate}>
                      Создать кошелёк
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {accounts.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      className="group relative flex items-center gap-4 rounded-2xl border border-border/70 bg-surface-2 p-4 transition-shadow hover:shadow-card-hover"
                    >
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-sm font-bold tracking-tight text-primary">
                        {a.currency}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-muted-foreground">{a.name}</p>
                        <AnimatedNumber
                          value={balances[a.id] ?? 0}
                          format={(n) => formatMoney(n, a.currency)}
                          className={`block truncate text-lg font-bold tabular-nums ${
                            (balances[a.id] ?? 0) < 0 ? 'text-expense-foreground' : 'text-foreground'
                          }`}
                        />
                      </div>
                      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-lg bg-surface-2/85 opacity-0 backdrop-blur-sm transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Редактировать ${a.name}`}
                          onClick={() => onOpenEdit(a)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Удалить ${a.name}`}
                          onClick={() => onDelete(a)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}
        </StaggerItem>
      </Stagger>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && onCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать кошелёк' : 'Новый кошелёк'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Измените название или валюту.'
                : 'Добавьте кошелёк для привязки транзакций.'}
            </DialogDescription>
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
                      <Input autoComplete="off" {...field} />
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
