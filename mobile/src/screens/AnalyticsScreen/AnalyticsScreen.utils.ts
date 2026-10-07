import type { Transaction } from '@/shared/types/entities';
import { APP_LOCALE, isDateInRange } from '@/shared/utils/format';

/** One month bucket of aggregated income vs. expense, with a display label. */
export type CashFlowPoint = { label: string; income: number; expense: number };

/**
 * Sum income and expense over an inclusive ISO-date range `[from, to]`.
 *
 * Ported verbatim from the web `DashboardScreen.utils` so the Analytics screen
 * is self-contained and does not import across screen boundaries.
 */
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

function monthKeyLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleString(APP_LOCALE, {
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Build the last six calendar months (oldest → newest, ending with the current
 * month) of income/expense totals. Ported from the web dashboard utils.
 */
export function buildLastSixMonthsChart(transactions: Transaction[]): CashFlowPoint[] {
  const now = new Date();
  const rows: CashFlowPoint[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const { income, expense } = computePeriodTotals(transactions, from, to);
    rows.push({ label: monthKeyLabel(y, m), income, expense });
  }
  return rows;
}
