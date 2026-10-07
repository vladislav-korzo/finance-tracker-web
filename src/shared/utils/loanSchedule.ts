/**
 * Оценка платежа при равных долях основного долга: каждый месяц тело ≈ остаток / N месяцев,
 * проценты — на остаток по ставке (упрощённо, первый месяц после учёта оплат).
 */

import type { Transaction } from '@/shared/types/entities';
import { APP_LOCALE } from '@/shared/utils/format';

export type LoanScheduleEstimate = {
  monthsRemaining: number;
  /** Доля основного долга в ближайшем месяце */
  approxPrincipalPortion: number;
  /** Проценты на текущий остаток за месяц */
  approxInterestPortion: number;
  /** Сумма ориентировочно (тело + проценты) */
  approxTotalNextMonth: number;
};

/** Строка помесячного плана + факт оплат за месяц */
export type LoanMonthPaymentStatus = 'paid' | 'partial' | 'unpaid' | 'upcoming';

export type LoanMonthRow = {
  monthKey: string;
  monthLabel: string;
  principal: number;
  interest: number;
  total: number;
  paidAmount: number;
  status: LoanMonthPaymentStatus;
};

type ScheduleRowCore = {
  monthKey: string;
  monthLabel: string;
  principal: number;
  interest: number;
  total: number;
};

/** Полных календарных месяцев от начала текущего месяца до конца paymentEndYear (включительно). */
export function monthsRemainingUntilYearEnd(endYear: number, from: Date = new Date()): number {
  const lastMonthStart = new Date(endYear, 11, 1);
  const start = new Date(from.getFullYear(), from.getMonth(), 1);
  if (start > lastMonthStart) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= lastMonthStart) {
    count++;
    cur.setMonth(cur.getMonth() + 1);
  }
  return count;
}

/**
 * Сколько месяцев подряд использовать в графике: явное «осталось платежей» из выписки
 * или календарные месяцы до конца года окончания (если число платежей не задано).
 */
export function resolveScheduleMonthCount(
  paymentEndYear: number | null,
  remainingScheduleMonths: number | null,
  from: Date = new Date()
): number | null {
  if (remainingScheduleMonths != null) {
    const n = Math.floor(remainingScheduleMonths);
    if (n >= 1 && n <= 600) return n;
  }
  if (paymentEndYear != null) {
    const m = monthsRemainingUntilYearEnd(paymentEndYear, from);
    return m > 0 ? m : null;
  }
  return null;
}

export function estimateEqualPrincipalPlusInterest(
  remainingDebt: number,
  annualRatePercent: number,
  months: number
): LoanScheduleEstimate | null {
  if (remainingDebt <= 0 || annualRatePercent < 0 || months <= 0) return null;
  const monthlyRate = annualRatePercent / 100 / 12;
  const approxPrincipalPortion = remainingDebt / months;
  const approxInterestPortion = remainingDebt * monthlyRate;
  return {
    monthsRemaining: months,
    approxPrincipalPortion,
    approxInterestPortion,
    approxTotalNextMonth: approxPrincipalPortion + approxInterestPortion,
  };
}

function monthKeyFromYearMonth(year: number, monthIndex0: number): string {
  const m = monthIndex0 + 1;
  return `${year}-${String(m).padStart(2, '0')}`;
}

function monthLabelRu(monthKey: string): string {
  const d = new Date(`${monthKey}-01T12:00:00`);
  return d.toLocaleString(APP_LOCALE, { month: 'long', year: 'numeric' });
}

/** Календарные месяцы от начала текущего месяца до декабря endYear включительно. */
export function monthRangeUntilYearEnd(endYear: number, from: Date = new Date()): string[] {
  const lastMonthStart = new Date(endYear, 11, 1);
  const start = new Date(from.getFullYear(), from.getMonth(), 1);
  const keys: string[] = [];
  const cur = new Date(start);
  while (cur <= lastMonthStart) {
    keys.push(monthKeyFromYearMonth(cur.getFullYear(), cur.getMonth()));
    cur.setMonth(cur.getMonth() + 1);
  }
  return keys;
}

/** Первые `count` календарных месяцев начиная с текущего (по `from`). */
export function monthKeysFromCount(count: number, from: Date = new Date()): string[] {
  const keys: string[] = [];
  const cur = new Date(from.getFullYear(), from.getMonth(), 1);
  for (let i = 0; i < count; i++) {
    keys.push(monthKeyFromYearMonth(cur.getFullYear(), cur.getMonth()));
    cur.setMonth(cur.getMonth() + 1);
  }
  return keys;
}

function currentMonthKey(from: Date = new Date()): string {
  return monthKeyFromYearMonth(from.getFullYear(), from.getMonth());
}

/**
 * Помесячный план: равные доли основного долга, проценты на остаток.
 * Остаток на входе — уже с учётом всех записанных платежей.
 */
export function buildEqualPrincipalMonthlySchedule(
  remainingDebt: number,
  annualRatePercent: number | null,
  monthCount: number,
  from: Date = new Date()
): ScheduleRowCore[] {
  if (remainingDebt <= 0 || monthCount <= 0) return [];
  const monthKeys = monthKeysFromCount(monthCount, from);
  if (monthKeys.length === 0) return [];

  const rate = annualRatePercent ?? 0;
  const monthlyRate = rate / 100 / 12;
  const rows: ScheduleRowCore[] = [];
  let balance = remainingDebt;

  for (let k = 0; k < monthKeys.length; k++) {
    const monthsLeft = monthKeys.length - k;
    const principal = balance / monthsLeft;
    const interest = balance * monthlyRate;
    const total = principal + interest;
    const monthKey = monthKeys[k];
    rows.push({
      monthKey,
      monthLabel: monthLabelRu(monthKey),
      principal,
      interest,
      total,
    });
    balance = Math.max(0, balance - principal);
  }

  return rows;
}

/** Сумма расходов по кредиту по календарным месяцам (ключ YYYY-MM). */
export function sumLoanPaymentsByMonth(transactions: Transaction[], loanId: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of transactions) {
    if (t.loan_id !== loanId || t.type !== 'expense') continue;
    const key = t.occurred_at.slice(0, 7);
    m.set(key, (m.get(key) ?? 0) + t.amount);
  }
  return m;
}

function isMonthBefore(a: string, b: string): boolean {
  return a < b;
}

function isPaidEnough(paid: number, expected: number): boolean {
  return paid + 1e-6 >= expected;
}

export function attachPaymentsToSchedule(
  schedule: ScheduleRowCore[],
  paidByMonth: Map<string, number>,
  from: Date = new Date()
): LoanMonthRow[] {
  const nowKey = currentMonthKey(from);
  return schedule.map((row) => {
    const paidAmount = paidByMonth.get(row.monthKey) ?? 0;
    let status: LoanMonthPaymentStatus;
    if (isMonthBefore(nowKey, row.monthKey)) {
      status = 'upcoming';
    } else if (isPaidEnough(paidAmount, row.total)) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    } else {
      status = 'unpaid';
    }
    return {
      ...row,
      paidAmount,
      status,
    };
  });
}

/** Полный помесячный график с фактами (удобно для экрана кредитов). */
export function buildLoanMonthlyRows(
  remainingDebt: number,
  annualRatePercent: number | null,
  monthCount: number,
  transactions: Transaction[],
  loanId: string,
  from: Date = new Date()
): LoanMonthRow[] | null {
  if (remainingDebt <= 0) return null;
  const core = buildEqualPrincipalMonthlySchedule(remainingDebt, annualRatePercent, monthCount, from);
  if (core.length === 0) return null;
  const paidByMonth = sumLoanPaymentsByMonth(transactions, loanId);
  return attachPaymentsToSchedule(core, paidByMonth, from);
}
