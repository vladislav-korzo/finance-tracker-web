import type { Transaction } from '@/shared/types/entities';
import {
  attachPaymentsToSchedule,
  buildEqualPrincipalMonthlySchedule,
  buildLoanMonthlyRows,
  estimateEqualPrincipalPlusInterest,
  monthsRemainingUntilYearEnd,
  resolveScheduleMonthCount,
  sumLoanPaymentsByMonth,
} from '@/shared/utils/loanSchedule';

describe('monthsRemainingUntilYearEnd', () => {
  it('counts months from April 2026 through Dec 2040', () => {
    const from = new Date(2026, 3, 15);
    const n = monthsRemainingUntilYearEnd(2040, from);
    expect(n).toBe(12 * (2040 - 2026) + (11 - 3 + 1));
  });

  it('returns 0 when year already passed', () => {
    const from = new Date(2030, 0, 1);
    expect(monthsRemainingUntilYearEnd(2029, from)).toBe(0);
  });
});

describe('resolveScheduleMonthCount', () => {
  const from = new Date(2026, 3, 1);

  it('uses remaining_schedule_months when in range', () => {
    expect(resolveScheduleMonthCount(2040, 24, from)).toBe(24);
  });

  it('prefers remaining months over payment_end_year', () => {
    expect(resolveScheduleMonthCount(2040, 12, from)).toBe(12);
  });

  it('falls back to calendar months until payment_end_year', () => {
    expect(resolveScheduleMonthCount(2027, null, from)).toBe(21);
  });
});

describe('estimateEqualPrincipalPlusInterest', () => {
  it('splits principal equally and adds monthly interest on balance', () => {
    const est = estimateEqualPrincipalPlusInterest(1_000_000, 12, 21);
    expect(est).not.toBeNull();
    if (!est) return;
    expect(est.monthsRemaining).toBe(21);
    const principal = 1_000_000 / 21;
    const interest = 1_000_000 * (0.12 / 12);
    expect(est.approxPrincipalPortion).toBeCloseTo(principal, 4);
    expect(est.approxInterestPortion).toBeCloseTo(interest, 4);
    expect(est.approxTotalNextMonth).toBeCloseTo(principal + interest, 4);
  });
});

describe('buildEqualPrincipalMonthlySchedule', () => {
  it('first month matches estimateEqualPrincipalPlusInterest', () => {
    const from = new Date(2026, 3, 1);
    const remaining = 1_000_000;
    const rate = 12;
    const monthCount = 21;
    const est = estimateEqualPrincipalPlusInterest(remaining, rate, monthCount);
    const rows = buildEqualPrincipalMonthlySchedule(remaining, rate, monthCount, from);
    expect(est).not.toBeNull();
    expect(rows.length).toBe(est!.monthsRemaining);
    expect(rows[0].principal).toBeCloseTo(est!.approxPrincipalPortion, 4);
    expect(rows[0].interest).toBeCloseTo(est!.approxInterestPortion, 4);
    expect(rows[0].total).toBeCloseTo(est!.approxTotalNextMonth, 4);
  });

  it('uses zero interest when rate is null', () => {
    const from = new Date(2026, 0, 1);
    const rows = buildEqualPrincipalMonthlySchedule(1200, null, 12, from);
    expect(rows.length).toBe(12);
    for (const r of rows) {
      expect(r.interest).toBe(0);
    }
  });
});

describe('sumLoanPaymentsByMonth', () => {
  const base = {
    user_id: 'u',
    account_id: 'a',
    category_id: null,
    note: null,
    created_at: '',
  };

  it('sums expense amounts by YYYY-MM', () => {
    const loanId = 'loan-1';
    const txs: Transaction[] = [
      {
        ...base,
        id: '1',
        loan_id: loanId,
        amount: 100,
        type: 'expense',
        occurred_at: '2026-04-10',
      },
      {
        ...base,
        id: '2',
        loan_id: loanId,
        amount: 50,
        type: 'expense',
        occurred_at: '2026-04-20',
      },
      {
        ...base,
        id: '3',
        loan_id: loanId,
        amount: 999,
        type: 'income',
        occurred_at: '2026-04-30',
      },
    ];
    const m = sumLoanPaymentsByMonth(txs, loanId);
    expect(m.get('2026-04')).toBe(150);
  });
});

describe('attachPaymentsToSchedule', () => {
  it('marks future months as upcoming', () => {
    const from = new Date(2026, 3, 15);
    const rows = buildEqualPrincipalMonthlySchedule(100_000, 12, 21, from);
    const paid = new Map<string, number>();
    const withStatus = attachPaymentsToSchedule(rows, paid, from);
    expect(withStatus[0].status).not.toBe('upcoming');
    expect(withStatus[withStatus.length - 1].status).toBe('upcoming');
  });

  it('marks month as paid when paid >= plan', () => {
    const from = new Date(2026, 3, 1);
    const rows = buildEqualPrincipalMonthlySchedule(100_000, 0, 9, from);
    const first = rows[0];
    const paid = new Map([[first.monthKey, first.total]]);
    const withStatus = attachPaymentsToSchedule(rows, paid, from);
    expect(withStatus[0].status).toBe('paid');
  });
});

describe('buildLoanMonthlyRows', () => {
  it('returns null when remaining is zero', () => {
    const from = new Date(2026, 3, 1);
    expect(buildLoanMonthlyRows(0, 12, 21, [], 'x', from)).toBeNull();
  });
});
