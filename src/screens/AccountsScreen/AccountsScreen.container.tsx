import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  accountFormSchema,
  type AccountFormValues,
} from '@/screens/AccountsScreen/AccountsScreen.formConfig';
import { confirm } from '@/components/ConfirmDialog/confirmStore';
import { AccountsScreen } from '@/screens/AccountsScreen/AccountsScreen';
import {
  DEFAULT_ACCOUNT_CURRENCY,
  normalizeAccountCurrency,
} from '@/shared/constants/accountCurrencies';
import type { Account } from '@/shared/types/entities';
import { useAccountStore } from '@/shared/store/accountStore';
import { useTransactionStore } from '@/shared/store/transactionStore';
import { useTransferStore } from '@/shared/store/transferStore';

export function AccountsScreenContainer({ embedded = false }: { embedded?: boolean }) {
  const { accounts, loading, error, fetchAccounts, createAccount, updateAccount, deleteAccount } =
    useAccountStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const { transfers, fetchTransfers } = useTransferStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: { name: '', currency: DEFAULT_ACCOUNT_CURRENCY },
  });

  useEffect(() => {
    void fetchAccounts();
    void fetchTransactions();
    void fetchTransfers();
  }, [fetchAccounts, fetchTransactions, fetchTransfers]);

  /** Balance per account: income adds, expense subtracts, transfers move between accounts. */
  const balances = useMemo(() => {
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

  const onOpenCreate = () => {
    setEditing(null);
    form.reset({ name: '', currency: DEFAULT_ACCOUNT_CURRENCY });
    setDialogOpen(true);
  };

  const onOpenEdit = (account: Account) => {
    setEditing(account);
    form.reset({ name: account.name, currency: normalizeAccountCurrency(account.currency) });
    setDialogOpen(true);
  };

  const onCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const currency = values.currency;
      if (editing) {
        await updateAccount(editing.id, values.name, currency);
      } else {
        await createAccount(values.name, currency);
      }
      onCloseDialog();
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    }
  });

  const onDelete = async (account: Account) => {
    const ok = await confirm({
      title: 'Удалить кошелёк?',
      description: `«${account.name}» и все связанные с ним транзакции будут удалены безвозвратно.`,
      confirmText: 'Удалить',
    });
    if (!ok) return;
    void deleteAccount(account.id);
  };

  return (
    <AccountsScreen
      embedded={embedded}
      accounts={accounts}
      balances={balances}
      loading={loading}
      error={error}
      dialogOpen={dialogOpen}
      editing={editing}
      form={form}
      onOpenCreate={onOpenCreate}
      onOpenEdit={onOpenEdit}
      onCloseDialog={onCloseDialog}
      onSubmit={onSubmit}
      onDelete={onDelete}
    />
  );
}
