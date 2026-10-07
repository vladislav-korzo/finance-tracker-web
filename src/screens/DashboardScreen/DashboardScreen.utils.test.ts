import {
  buildMonthExpenseByCategory,
  computeBalances,
  computePeriodTotals,
} from '@/screens/DashboardScreen/DashboardScreen.utils';
import type { Account, Category, Transaction } from '@/shared/types/entities';

const baseAccount: Account = {
  id: 'a1',
  user_id: 'u1',
  name: 'Cash',
  currency: 'BYN',
  created_at: '2026-01-01T00:00:00Z',
};

const tx = (partial: Partial<Transaction> & Pick<Transaction, 'id' | 'amount' | 'type'>): Transaction => ({
  id: partial.id,
  user_id: 'u1',
  account_id: partial.account_id ?? 'a1',
  category_id: partial.category_id ?? null,
  loan_id: partial.loan_id ?? null,
  amount: partial.amount,
  type: partial.type,
  occurred_at: partial.occurred_at ?? '2026-04-10',
  note: partial.note ?? null,
  created_at: partial.created_at ?? '2026-04-10T00:00:00Z',
});

describe('computePeriodTotals', () => {
  it('sums income and expense in range', () => {
    const list = [
      tx({ id: '1', amount: 100, type: 'income', occurred_at: '2026-04-05' }),
      tx({ id: '2', amount: 40, type: 'expense', occurred_at: '2026-04-06' }),
      tx({ id: '3', amount: 50, type: 'income', occurred_at: '2026-03-01' }),
    ];
    const t = computePeriodTotals(list, '2026-04-01', '2026-04-30');
    expect(t.income).toBe(100);
    expect(t.expense).toBe(40);
  });
});

describe('computeBalances', () => {
  it('nets income minus expense per account', () => {
    const accounts = [baseAccount];
    const list = [
      tx({ id: '1', amount: 100, type: 'income', account_id: 'a1' }),
      tx({ id: '2', amount: 30, type: 'expense', account_id: 'a1' }),
    ];
    const rows = computeBalances(accounts, list);
    expect(rows[0].balance).toBe(70);
  });
});

const cat = (id: string, name: string, color = '#0ea5e9'): Category => ({
  id,
  user_id: 'u1',
  name,
  type: 'expense',
  icon: 'Circle',
  color,
  monthly_limit: null,
  created_at: '2026-01-01T00:00:00Z',
});

describe('buildMonthExpenseByCategory', () => {
  it('aggregates month expenses by category', () => {
    const map = new Map<string, Category>([
      ['c1', cat('c1', 'Еда')],
      ['c2', cat('c2', 'Транспорт')],
    ]);
    const list = [
      tx({ id: '1', amount: 100, type: 'expense', category_id: 'c1', occurred_at: '2026-04-10' }),
      tx({ id: '2', amount: 50, type: 'expense', category_id: 'c1', occurred_at: '2026-04-11' }),
      tx({ id: '3', amount: 30, type: 'expense', category_id: 'c2', occurred_at: '2026-04-12' }),
      tx({ id: '4', amount: 12, type: 'expense', category_id: null, occurred_at: '2026-04-20' }),
      tx({ id: '5', amount: 999, type: 'expense', occurred_at: '2026-03-01' }),
      tx({ id: '6', amount: 20, type: 'income', category_id: 'c1', occurred_at: '2026-04-15' }),
    ];
    const slices = buildMonthExpenseByCategory(list, '2026-04-01', '2026-04-30', map);
    expect(slices).toHaveLength(3);
    expect(slices.find((s) => s.name === 'Еда')?.value).toBe(150);
    expect(slices.find((s) => s.name === 'Транспорт')?.value).toBe(30);
    expect(slices.find((s) => s.name === 'Без категории')?.value).toBe(12);
  });
});
