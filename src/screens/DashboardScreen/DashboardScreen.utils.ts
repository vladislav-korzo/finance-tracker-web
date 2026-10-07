import type { CategoryExpenseSlice } from '@/screens/DashboardScreen/DashboardScreen.types';
import type { Account, Category, Transaction } from '@/shared/types/entities';
import { APP_LOCALE, isDateInRange } from '@/shared/utils/format';

const EXPENSE_PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(217 91% 60%)',
  'hsl(262 83% 58%)',
  'hsl(38 92% 50%)',
  'hsl(var(--income))',
  'hsl(330 81% 60%)',
  'hsl(173 80% 40%)',
  'hsl(25 95% 53%)',
];

export function computePeriodTotals(
  transactions: Transaction[],
  from: string,
  to: string
): { income: number; expense: number } {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (!isDateInRange(t.occurred_at, from, to)) continue;
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense };
}

const NO_CATEGORY_COLOR = '#94a3b8';

export function buildMonthExpenseByCategory(
  transactions: Transaction[],
  from: string,
  to: string,
  categoryById: Map<string, Category>
): CategoryExpenseSlice[] {
  const byKey = new Map<
    string,
    { name: string; value: number; categoryId: string | null }
  >();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    if (!isDateInRange(t.occurred_at, from, to)) continue;
    const key = t.category_id ?? '__none__';
    const name = t.category_id
      ? (categoryById.get(t.category_id)?.name ?? 'Неизвестная категория')
      : 'Без категории';
    const categoryId = t.category_id;
    const prev = byKey.get(key);
    if (prev) prev.value += t.amount;
    else byKey.set(key, { name, value: t.amount, categoryId });
  }
  const rows = [...byKey.values()].sort((a, b) => b.value - a.value);
  let fallbackPalette = 0;
  return rows.map((row) => {
    const cat = row.categoryId ? categoryById.get(row.categoryId) : undefined;
    let color: string;
    let icon: string | undefined;
    if (row.categoryId == null) {
      color = NO_CATEGORY_COLOR;
    } else if (cat) {
      color = cat.color;
      icon = cat.icon;
    } else {
      color = EXPENSE_PIE_COLORS[fallbackPalette % EXPENSE_PIE_COLORS.length];
      fallbackPalette += 1;
    }
    return {
      name: row.name,
      value: row.value,
      color,
      ...(icon ? { icon } : {}),
    };
  });
}

export type AccountBalanceRow = Account & { balance: number };

export type CurrencyAmount = { currency: string; amount: number };

export function groupBalanceByCurrency(rows: AccountBalanceRow[]): CurrencyAmount[] {
  const m = new Map<string, number>();
  for (const a of rows) {
    m.set(a.currency, (m.get(a.currency) ?? 0) + a.balance);
  }
  return [...m.entries()]
    .sort(([c1], [c2]) => c1.localeCompare(c2))
    .map(([currency, amount]) => ({ currency, amount }));
}

/** Расходы за период по валюте счёта транзакции */
export function expenseByCurrencyForPeriod(
  transactions: Transaction[],
  accounts: Account[],
  from: string,
  to: string
): CurrencyAmount[] {
  const accCurrency = new Map(accounts.map((a) => [a.id, a.currency]));
  const m = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    if (!isDateInRange(t.occurred_at, from, to)) continue;
    const c = accCurrency.get(t.account_id);
    if (!c) continue;
    m.set(c, (m.get(c) ?? 0) + t.amount);
  }
  return [...m.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amount]) => ({ currency, amount }));
}

export function buildLastSevenDaysChartByCurrency(
  transactions: Transaction[],
  currencies: string[],
  accountCurrency: (accountId: string) => string | undefined
): { currency: string; data: { label: string; income: number; expense: number }[] }[] {
  return currencies.map((currency) => {
    const txs = transactions.filter((t) => accountCurrency(t.account_id) === currency);
    return { currency, data: buildLastSevenDaysChart(txs) };
  });
}

export function computeBalances(accounts: Account[], transactions: Transaction[]): AccountBalanceRow[] {
  return accounts.map((acc) => {
    let balance = 0;
    for (const t of transactions) {
      if (t.account_id !== acc.id) continue;
      balance += t.type === 'income' ? t.amount : -t.amount;
    }
    return { ...acc, balance };
  });
}

function monthKeyLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleString(APP_LOCALE, { month: 'short', year: 'numeric' });
}

export function buildLastSevenDaysChart(transactions: Transaction[]) {
  const now = new Date();
  const rows: { label: string; income: number; expense: number }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const from = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const { income, expense } = computePeriodTotals(transactions, from, from);
    rows.push({
      label: d.toLocaleDateString(APP_LOCALE, { month: 'short', day: 'numeric' }),
      income,
      expense,
    });
  }
  return rows;
}

export function buildLastSixMonthsChart(transactions: Transaction[]) {
  const now = new Date();
  const rows: { label: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const { income, expense } = computePeriodTotals(transactions, from, to);
    rows.push({
      label: monthKeyLabel(y, m),
      income,
      expense,
    });
  }
  return rows;
}
