import { CategoryTag } from '@/components/tags';
import { Plus } from 'lucide-react';

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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { QuickAddTransactionProps } from '@/components/QuickAddTransaction/QuickAddTransaction.types';

export function QuickAddTransaction(props: QuickAddTransactionProps) {
  const { open, onOpenChange, form, accountOptions, categoryOptions, loanOptions, onSubmit } = props;
  const typeWatch = form.watch('type');

  return (
    <>
      <Button
        type="button"
        className="gap-1.5 px-3.5 sm:px-4"
        onClick={() => onOpenChange(true)}
      >
        <Plus className="size-4" strokeWidth={2.5} />
        <span className="hidden sm:inline">Добавить</span>
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Новая транзакция</DialogTitle>
            <DialogDescription>Запишите доход или расход в несколько полей.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
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
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="income">Доход</TabsTrigger>
                        <TabsTrigger value="expense">Расход</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сумма</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
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
                          <SelectValue placeholder="Выберите кошелёк" />
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
                    <FormLabel>Категория</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === '_none' ? '' : v)}
                      value={field.value && field.value.length > 0 ? field.value : '_none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Необязательно" />
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
                    <FormLabel>Заметка (необязательно)</FormLabel>
                    <FormControl>
                      <Input placeholder="Комментарий" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
              ) : null}
              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={form.formState.isSubmitting}
                >
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
