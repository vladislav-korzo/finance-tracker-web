import { buildLoansWithStats } from '@screens/CreditsScreen/CreditsScreen.utils';
import type { CategoryExpenseSlice } from '@screens/DashboardScreen/DashboardScreen.types';
import type { Account, BudgetGoal, Category, Loan, Transaction } from '@/shared/types/entities';
import { APP_LOCALE, isDateInRange } from '@/shared/utils/format';

/**
 * Fallback palette for expense slices whose category was deleted (its `color`
 * is no longer resolvable). Real categories always carry their own hex `color`,
 * so this is only used as a last resort and is intentionally kept in sync with
 * the web list. These are plain `hsl(...)` strings (not CSS vars) so the native
 * chart libraries can consume them directly.
 */
const EXPENSE_PIE_COLORS = [
  'hsl(72 84% 48%)',
  'hsl(217 91% 60%)',
  'hsl(262 83% 58%)',
  'hsl(38 92% 50%)',
  'hsl(158 64% 40%)',
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

/* -------------------------------------------------------------------------- */
/* Home (carousel + insights) helpers                                          */
/* -------------------------------------------------------------------------- */

/**
 * The currency to headline in the compact total line: the one used by the most
 * accounts (ties broken by first appearance). Returns `null` when there are no
 * accounts so the caller can fall back to an account-count line.
 */
export function pickPrimaryCurrency(accounts: Account[]): string | null {
  if (accounts.length === 0) return null;
  const counts = new Map<string, number>();
  for (const a of accounts) counts.set(a.currency, (counts.get(a.currency) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = -1;
  for (const a of accounts) {
    const c = counts.get(a.currency) ?? 0;
    if (c > bestCount) {
      bestCount = c;
      best = a.currency;
    }
  }
  return best;
}

/** Sum of per-account balances restricted to a single currency. */
export function sumBalanceForCurrency(rows: AccountBalanceRow[], currency: string): number {
  return rows.reduce((s, r) => (r.currency === currency ? s + r.balance : s), 0);
}

/** ISO `from`/`to` for the calendar month `offset` months before `now` (offset 0 = current). */
export function monthRangeIso(offset = 0, now: Date = new Date()): { from: string; to: string } {
  const y = now.getFullYear();
  const m = now.getMonth() - offset;
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const sm = String(start.getMonth() + 1).padStart(2, '0');
  const em = String(end.getMonth() + 1).padStart(2, '0');
  return {
    from: `${start.getFullYear()}-${sm}-01`,
    to: `${end.getFullYear()}-${em}-${String(end.getDate()).padStart(2, '0')}`,
  };
}

export type MonthOverMonthExpense = {
  current: number;
  previous: number;
  /** Signed percent change vs last month, rounded; null when last month had no expense. */
  deltaPct: number | null;
  direction: 'up' | 'down' | 'flat';
};

/**
 * This-month vs last-month expense for a set of (already currency-filtered)
 * transactions. `deltaPct` is null when last month had no expense (so the caller
 * can hide the insight rather than print a misleading ∞%).
 */
export function computeMonthOverMonthExpense(
  transactions: Transaction[],
  now: Date = new Date()
): MonthOverMonthExpense {
  const cur = monthRangeIso(0, now);
  const prev = monthRangeIso(1, now);
  const current = computePeriodTotals(transactions, cur.from, cur.to).expense;
  const previous = computePeriodTotals(transactions, prev.from, prev.to).expense;
  if (previous <= 0) {
    return { current, previous, deltaPct: null, direction: current > 0 ? 'up' : 'flat' };
  }
  const raw = ((current - previous) / previous) * 100;
  const deltaPct = Math.round(raw);
  const direction = deltaPct > 0 ? 'up' : deltaPct < 0 ? 'down' : 'flat';
  return { current, previous, deltaPct, direction };
}

export type BudgetProgress = {
  /** 0–1 clamped fraction for the ring. */
  fraction: number;
  /** Whole-percent for the centre label. */
  pct: number;
  saved: number;
  target: number;
  currency: string;
  /** `goals` when derived from saved/target, `limits` when derived from spend vs monthly_limit. */
  mode: 'goals' | 'limits';
};

/**
 * Budget ring data. Prefers savings goals (Σ saved / Σ target). When there are no
 * goals, falls back to this-month expense vs Σ category monthly_limit for the
 * given currency. Returns null when neither data source has a meaningful target.
 */
export function computeBudgetProgress(
  goals: BudgetGoal[],
  categories: Category[],
  transactions: Transaction[],
  accounts: Account[],
  currency: string,
  now: Date = new Date()
): BudgetProgress | null {
  const goalsForCurrency = goals.filter((g) => g.currency === currency);
  const usableGoals = goalsForCurrency.length > 0 ? goalsForCurrency : goals;
  const target = usableGoals.reduce((s, g) => s + g.target_amount, 0);
  if (target > 0) {
    const saved = usableGoals.reduce((s, g) => s + g.saved_amount, 0);
    const fraction = Math.max(0, Math.min(1, saved / target));
    const goalCurrency = goalsForCurrency.length > 0 ? currency : (usableGoals[0]?.currency ?? currency);
    return { fraction, pct: Math.round(fraction * 100), saved, target, currency: goalCurrency, mode: 'goals' };
  }

  // Fallback: spend vs sum of monthly limits (expense categories) for this currency.
  const limitTotal = categories.reduce((s, c) => s + (c.monthly_limit ?? 0), 0);
  if (limitTotal <= 0) return null;
  const accCurrency = new Map(accounts.map((a) => [a.id, a.currency]));
  const { from, to } = monthRangeIso(0, now);
  let spent = 0;
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    if (accCurrency.get(t.account_id) !== currency) continue;
    if (!isDateInRange(t.occurred_at, from, to)) continue;
    spent += t.amount;
  }
  const fraction = Math.max(0, Math.min(1, spent / limitTotal));
  return { fraction, pct: Math.round(fraction * 100), saved: spent, target: limitTotal, currency, mode: 'limits' };
}

export type NearestLoan = {
  name: string;
  /** Estimated next monthly payment (тело + проценты); null when not estimable. */
  monthly: number | null;
  remaining: number;
  currency: string;
};

/**
 * The loan with the largest remaining debt, enriched with its estimated next
 * monthly payment. Returns null when there are no loans with outstanding debt.
 */
export function pickNearestLoan(
  loans: Loan[],
  transactions: Transaction[],
  now: Date = new Date()
): NearestLoan | null {
  if (loans.length === 0) return null;
  const withStats = buildLoansWithStats(loans, transactions, now);
  const outstanding = withStats.filter((l) => l.remaining > 0);
  const pool = outstanding.length > 0 ? outstanding : withStats;
  const top = [...pool].sort((a, b) => b.remaining - a.remaining)[0];
  if (!top) return null;
  return {
    name: top.name,
    monthly: top.scheduleEstimate?.approxTotalNextMonth ?? null,
    remaining: top.remaining,
    currency: top.currency,
  };
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
