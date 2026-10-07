import { supabase } from '@/shared/lib/supabase';
import type { Transfer } from '@/shared/types/entities';

function parseAmount(raw: string | number): number {
  return typeof raw === 'number' ? raw : Number.parseFloat(raw);
}

function mapRow(row: {
  id: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: string | number;
  occurred_at: string;
  note: string | null;
  created_at: string;
}): Transfer {
  return { ...row, amount: parseAmount(row.amount) };
}

/** The transfers table may not exist yet (migration not applied). */
function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /does not exist|schema cache/i.test(error.message ?? '')
  );
}

export const transferRepository = {
  async list(userId: string): Promise<Transfer[]> {
    const { data, error } = await supabase
      .from('transfers')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return (data ?? []).map((r) => mapRow(r));
  },

  async create(input: {
    userId: string;
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    occurredAt: string;
    note?: string | null;
  }): Promise<Transfer> {
    const { data, error } = await supabase
      .from('transfers')
      .insert({
        user_id: input.userId,
        from_account_id: input.fromAccountId,
        to_account_id: input.toAccountId,
        amount: input.amount,
        occurred_at: input.occurredAt,
        note: input.note ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('transfers').delete().eq('id', id);
    if (error) throw error;
  },
};
