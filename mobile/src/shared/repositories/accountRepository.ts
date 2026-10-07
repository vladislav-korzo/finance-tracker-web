import { DEFAULT_ACCOUNT_CURRENCY } from '@/shared/constants/accountCurrencies';
import { supabase } from '@/shared/lib/supabase';
import type { Account } from '@/shared/types/entities';

function mapRow(row: Account): Account {
  return row;
}

export const accountRepository = {
  async list(userId: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },

  async create(input: { userId: string; name: string; currency?: string }): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: input.userId,
        name: input.name,
        currency: input.currency ?? DEFAULT_ACCOUNT_CURRENCY,
      })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data as Account);
  },

  async update(input: { id: string; name: string; currency: string }): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .update({ name: input.name, currency: input.currency })
      .eq('id', input.id)
      .select()
      .single();
    if (error) throw error;
    return mapRow(data as Account);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) throw error;
  },
};
