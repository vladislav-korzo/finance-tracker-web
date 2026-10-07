import { supabase } from '@/shared/lib/supabase';
import type { TransactionType } from '@/shared/types/database';
import type { Category } from '@/shared/types/entities';

function parseAmount(raw: string | number): number {
  return typeof raw === 'number' ? raw : Number.parseFloat(raw);
}

function mapRow(row: {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  monthly_limit?: string | number | null;
  created_at: string;
}): Category {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    type: row.type,
    icon: row.icon,
    color: row.color,
    monthly_limit: row.monthly_limit != null ? parseAmount(row.monthly_limit) : null,
    created_at: row.created_at,
  };
}

/** True when PostgREST reports a missing column (DB behind on migrations). */
function isMissingColumn(error: { message?: string } | null, column: string): boolean {
  return !!error?.message?.includes(`Could not find the '${column}' column`);
}

export const categoryRepository = {
  async list(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => mapRow(r));
  },

  async create(input: {
    userId: string;
    name: string;
    type: TransactionType;
    icon: string;
    color: string;
    monthlyLimit?: number | null;
  }): Promise<Category> {
    const base = {
      user_id: input.userId,
      name: input.name,
      type: input.type,
      icon: input.icon,
      color: input.color,
    };
    let res = await supabase
      .from('categories')
      .insert({ ...base, monthly_limit: input.monthlyLimit ?? null })
      .select()
      .single();
    if (res.error && isMissingColumn(res.error, 'monthly_limit')) {
      res = await supabase.from('categories').insert(base).select().single();
    }
    if (res.error) throw res.error;
    return mapRow(res.data);
  },

  async update(input: {
    id: string;
    name: string;
    type: TransactionType;
    icon: string;
    color: string;
    monthlyLimit?: number | null;
  }): Promise<Category> {
    const base = { name: input.name, type: input.type, icon: input.icon, color: input.color };
    let res = await supabase
      .from('categories')
      .update({ ...base, monthly_limit: input.monthlyLimit ?? null })
      .eq('id', input.id)
      .select()
      .single();
    if (res.error && isMissingColumn(res.error, 'monthly_limit')) {
      res = await supabase.from('categories').update(base).eq('id', input.id).select().single();
    }
    if (res.error) throw res.error;
    return mapRow(res.data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  },
};
