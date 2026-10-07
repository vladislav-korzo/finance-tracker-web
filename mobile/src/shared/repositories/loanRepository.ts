import { supabase } from '@/shared/lib/supabase';
import type { Loan } from '@/shared/types/entities';

function parseAmount(raw: string | number | null): number | null {
  if (raw === null || raw === undefined) return null;
  return typeof raw === 'number' ? raw : Number.parseFloat(String(raw));
}

function mapRow(row: {
  id: string;
  user_id: string;
  name: string;
  currency: string;
  total_amount: string | number;
  annual_interest_rate: string | number | null;
  payment_end_year: number | null;
  remaining_schedule_months?: number | null;
  note: string | null;
  created_at: string;
}): Loan {
  return {
    ...row,
    total_amount: typeof row.total_amount === 'number' ? row.total_amount : Number.parseFloat(row.total_amount),
    annual_interest_rate: parseAmount(row.annual_interest_rate),
    payment_end_year: row.payment_end_year != null ? Number(row.payment_end_year) : null,
    remaining_schedule_months:
      row.remaining_schedule_months != null ? Number(row.remaining_schedule_months) : null,
  };
}

export const loanRepository = {
  async list(userId: string): Promise<Loan[]> {
    const { data, error } = await supabase
      .from('loans')
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
    totalAmount: number;
    annualInterestRate?: number | null;
    paymentEndYear?: number | null;
    remainingScheduleMonths?: number | null;
    note?: string | null;
  }): Promise<Loan> {
    const { data, error } = await supabase
      .from('loans')
      .insert({
        user_id: input.userId,
        name: input.name,
        currency: input.currency,
        total_amount: input.totalAmount,
        annual_interest_rate: input.annualInterestRate ?? null,
        payment_end_year: input.paymentEndYear ?? null,
        remaining_schedule_months: input.remainingScheduleMonths ?? null,
        note: input.note ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  async update(input: {
    id: string;
    name: string;
    currency: string;
    totalAmount: number;
    annualInterestRate?: number | null;
    paymentEndYear?: number | null;
    remainingScheduleMonths?: number | null;
    note?: string | null;
  }): Promise<Loan> {
    const { data, error } = await supabase
      .from('loans')
      .update({
        name: input.name,
        currency: input.currency,
        total_amount: input.totalAmount,
        annual_interest_rate: input.annualInterestRate ?? null,
        payment_end_year: input.paymentEndYear ?? null,
        remaining_schedule_months: input.remainingScheduleMonths ?? null,
        note: input.note ?? null,
      })
      .eq('id', input.id)
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('loans').delete().eq('id', id);
    if (error) throw error;
  },
};
