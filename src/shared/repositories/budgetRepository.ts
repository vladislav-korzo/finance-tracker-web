import { supabase } from '@/shared/lib/supabase';
import { DEFAULT_ACCOUNT_CURRENCY } from '@/shared/constants/accountCurrencies';
import type { BudgetGoal } from '@/shared/types/entities';

function parseAmount(raw: string | number): number {
  return typeof raw === 'number' ? raw : Number.parseFloat(raw);
}

function mapRow(row: {
  id: string;
  user_id: string;
  name: string;
  currency?: string | null;
  target_amount: string | number;
  saved_amount: string | number;
  created_at: string;
}): BudgetGoal {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    currency: row.currency ?? DEFAULT_ACCOUNT_CURRENCY,
    target_amount: parseAmount(row.target_amount),
    saved_amount: parseAmount(row.saved_amount),
    created_at: row.created_at,
  };
}

/** True when PostgREST reports a missing column (DB behind on migrations). */
function isMissingColumn(error: { message?: string } | null, column: string): boolean {
  return !!error?.message?.includes(`Could not find the '${column}' column`);
}

export const budgetRepository = {
  async list(userId: string): Promise<BudgetGoal[]> {
    const { data, error } = await supabase
      .from('budget_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => mapRow(r));
  },

  async create(input: {
    userId: string;
    name: string;
    currency: string;
    targetAmount: number;
    savedAmount?: number;
  }): Promise<BudgetGoal> {
    const base = {
      user_id: input.userId,
      name: input.name,
      target_amount: input.targetAmount,
      saved_amount: input.savedAmount ?? 0,
    };
    let res = await supabase
      .from('budget_goals')
      .insert({ ...base, currency: input.currency })
      .select()
      .single();
    if (res.error && isMissingColumn(res.error, 'currency')) {
      res = await supabase.from('budget_goals').insert(base).select().single();
    }
    if (res.error) throw res.error;
    return mapRow(res.data);
  },

  async update(input: {
    id: string;
    name: string;
    currency: string;
    targetAmount: number;
    savedAmount: number;
  }): Promise<BudgetGoal> {
    const base = {
      name: input.name,
      target_amount: input.targetAmount,
      saved_amount: input.savedAmount,
    };
    let res = await supabase
      .from('budget_goals')
      .update({ ...base, currency: input.currency })
      .eq('id', input.id)
      .select()
      .single();
    if (res.error && isMissingColumn(res.error, 'currency')) {
      res = await supabase.from('budget_goals').update(base).eq('id', input.id).select().single();
    }
    if (res.error) throw res.error;
    return mapRow(res.data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('budget_goals').delete().eq('id', id);
    if (error) throw error;
  },
};
