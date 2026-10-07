import type { Loan, Transaction } from '@/shared/types/entities';
import { sumLoanRepayments } from '@/shared/utils/loan';
import {
  buildLoanMonthlyRows,
  estimateEqualPrincipalPlusInterest,
  resolveScheduleMonthCount,
  type LoanMonthPaymentStatus,
  type LoanMonthRow,
  type LoanScheduleEstimate,
} from '@/shared/utils/loanSchedule';

/** A loan enriched with derived progress + schedule figures (mirrors the web `LoanWithStats`). */
export type LoanWithStats = Loan & {
  paid: number;
  remaining: number;
  progressPct: number;
  /** Оценка следующего платежа (тело + %), если заданы ставка и год окончания. */
  scheduleEstimate: LoanScheduleEstimate | null;
  /** Помесячный план и факт оплат, если задан год окончания платежей и есть остаток. */
  monthlySchedule: LoanMonthRow[] | null;
};

/** Per-currency rollup used for the summary StatCards. */
export type CurrencySummaryRow = {
  currency: string;
  remaining: number;
  monthly: number;
};

/**
 * Decorate the raw loans with paid/remaining/progress and the schedule estimate +
 * monthly plan. Equivalent to the web container's `loansWithStats` memo.
 */
export function buildLoansWithStats(
  loans: Loan[],
  transactions: Transaction[],
  now: Date = new Date()
): LoanWithStats[] {
  return loans.map((loan) => {
    const paid = sumLoanRepayments(transactions, loan.id);
    const remaining = Math.max(0, loan.total_amount - paid);
    const progressPct =
      loan.total_amount > 0 ? Math.min(100, (paid / loan.total_amount) * 100) : 0;
    const scheduleMonths = resolveScheduleMonthCount(
      loan.payment_end_year,
      loan.remaining_schedule_months,
      now
    );
    const scheduleEstimate =
      loan.annual_interest_rate != null && scheduleMonths != null && remaining > 0
        ? estimateEqualPrincipalPlusInterest(remaining, loan.annual_interest_rate, scheduleMonths)
        : null;
    const monthlySchedule =
      scheduleMonths != null && remaining > 0
        ? buildLoanMonthlyRows(remaining, loan.annual_interest_rate, scheduleMonths, transactions, loan.id, now)
        : null;
    return { ...loan, paid, remaining, progressPct, scheduleEstimate, monthlySchedule };
  });
}

/** Map each loan id to its linked transactions, newest first (mirrors the web `loanTransactions`). */
export function buildLoanTransactionsMap(
  loans: Loan[],
  transactions: Transaction[]
): Map<string, Transaction[]> {
  const m = new Map<string, Transaction[]>();
  for (const l of loans) {
    const list = transactions
      .filter((t) => t.loan_id === l.id)
      .sort(
        (a, b) =>
          b.occurred_at.localeCompare(a.occurred_at) || b.created_at.localeCompare(a.created_at)
      );
    m.set(l.id, list);
  }
  return m;
}

/** Per-currency totals for the summary row, sorted by remaining debt desc. */
export function buildCurrencySummary(loans: LoanWithStats[]): CurrencySummaryRow[] {
  const byCurrency = new Map<string, { remaining: number; monthly: number }>();
  for (const loan of loans) {
    const entry = byCurrency.get(loan.currency) ?? { remaining: 0, monthly: 0 };
    entry.remaining += loan.remaining;
    entry.monthly += loan.scheduleEstimate?.approxTotalNextMonth ?? 0;
    byCurrency.set(loan.currency, entry);
  }
  return Array.from(byCurrency.entries())
    .map(([currency, v]) => ({ currency, ...v }))
    .sort((a, b) => b.remaining - a.remaining);
}

export function monthPaymentStatusLabel(status: LoanMonthPaymentStatus): string {
  switch (status) {
    case 'paid':
      return 'Оплачено';
    case 'partial':
      return 'Частично';
    case 'unpaid':
      return 'Не оплачено';
    case 'upcoming':
      return 'Предстоит';
    default:
      return '';
  }
}

/**
 * Tailwind classes for the status pill, split into the chip background and the
 * label text colour (RN can't inherit text colour from a wrapper the way the web
 * pill does), mirroring the web tints.
 */
export function monthPaymentStatusClasses(status: LoanMonthPaymentStatus): {
  chip: string;
  text: string;
} {
  switch (status) {
    case 'paid':
      return { chip: 'bg-income/15', text: 'text-income-foreground' };
    case 'partial':
      return { chip: 'bg-chart-5/15', text: 'text-chart-5' };
    case 'unpaid':
      return { chip: 'bg-expense/15', text: 'text-expense-foreground' };
    case 'upcoming':
      return { chip: 'bg-muted', text: 'text-muted-foreground' };
    default:
      return { chip: '', text: '' };
  }
}

/**
 * Progress fill colour shifts red → amber → green as the loan is paid down.
 * Returned as a token name so callers resolve it through `tokenColor`/`useToken`.
 */
export function progressColorToken(pct: number): 'income' | 'chart-2' | 'chart-5' | 'expense' {
  if (pct >= 100) return 'income';
  if (pct >= 60) return 'chart-2';
  if (pct >= 25) return 'chart-5';
  return 'expense';
}
