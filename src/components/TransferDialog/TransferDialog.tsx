import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  transferFormSchema,
  type TransferFormValues,
} from '@/components/TransferDialog/transferFormConfig';
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
import { useAccountStore } from '@/shared/store/accountStore';
import { useTransferStore } from '@/shared/store/transferStore';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Button + dialog for moving money between two same-currency accounts. */
export function TransferDialog() {
  const [open, setOpen] = useState(false);
  const accounts = useAccountStore((s) => s.accounts);
  const createTransfer = useTransferStore((s) => s.createTransfer);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: { fromAccountId: '', toAccountId: '', amount: 0, occurredAt: todayIsoDate(), note: '' },
  });

  const fromId = form.watch('fromAccountId');
  const fromAccount = accounts.find((a) => a.id === fromId);

  // Only allow transferring between accounts of the same currency.
  const toOptions = useMemo(
    () =>
      fromAccount
        ? accounts.filter((a) => a.id !== fromAccount.id && a.currency === fromAccount.currency)
        : [],
    [accounts, fromAccount]
  );

  useEffect(() => {
    if (open) {
      form.reset({
        fromAccountId: accounts[0]?.id ?? '',
        toAccountId: '',
        amount: 0,
        occurredAt: todayIsoDate(),
        note: '',
      });
    }
  }, [open, accounts, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createTransfer({
        fromAccountId: values.fromAccountId,
        toAccountId: values.toAccountId,
        amount: values.amount,
        occurredAt: values.occurredAt,
        note: values.note ?? null,
      });
      setOpen(false);
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    }
  });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => setOpen(true)}
        disabled={accounts.length < 2}
      >
        <ArrowLeftRight className="size-4" />
        Перевод
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Перевод между счетами</DialogTitle>
            <DialogDescription>
              Перемещение средств между кошельками одной валюты. На доходы и расходы не влияет.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
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
                        form.setValue('toAccountId', '');
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите счёт" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name} · {a.currency}
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
                name="toAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>На счёт</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!fromAccount}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              toOptions.length === 0 ? 'Нет счетов той же валюты' : 'Выберите счёт'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {toOptions.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name} · {a.currency}
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сумма{fromAccount ? `, ${fromAccount.currency}` : ''}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
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
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Перевод…' : 'Перевести'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
