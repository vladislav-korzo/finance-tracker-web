import { supabase } from '@/shared/lib/supabase';
import type { TransactionType } from '@/shared/types/database';
import type { Transaction } from '@/shared/types/entities';

function parseAmount(raw: string | number): number {
  return typeof raw === 'number' ? raw : Number.parseFloat(raw);
}

function mapRow(row: {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  loan_id: string | null;
  amount: string | number;
  type: TransactionType;
  occurred_at: string;
  note: string | null;
  created_at: string;
}): Transaction {
  return {
    ...row,
    loan_id: row.loan_id ?? null,
    amount: parseAmount(row.amount),
  };
}

export const transactionRepository = {
  async list(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => mapRow(r));
  },

  async create(input: {
    userId: string;
    accountId: string;
    categoryId?: string | null;
    loanId?: string | null;
    amount: number;
    type: TransactionType;
    occurredAt: string;
    note?: string | null;
  }): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: input.userId,
        account_id: input.accountId,
        category_id: input.categoryId ?? null,
        loan_id: input.loanId ?? null,
        amount: input.amount,
        type: input.type,
        occurred_at: input.occurredAt,
        note: input.note ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  async update(input: {
    id: string;
    accountId: string;
    categoryId?: string | null;
    loanId?: string | null;
    amount: number;
    type: TransactionType;
    occurredAt: string;
    note?: string | null;
  }): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        account_id: input.accountId,
        category_id: input.categoryId ?? null,
        loan_id: input.loanId ?? null,
        amount: input.amount,
        type: input.type,
        occurred_at: input.occurredAt,
        note: input.note ?? null,
      })
      .eq('id', input.id)
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },
};
