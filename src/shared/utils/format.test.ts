import {
  endOfMonthIso,
  formatMoney,
  formatSpendingPeriodLabel,
  getSpendingPeriodRange,
  isDateInRange,
  startOfMonthIso,
} from '@/shared/utils/format';

describe('formatMoney', () => {
  it('formats USD with ru-RU locale', () => {
    expect(formatMoney(1234.5, 'USD')).toMatch(/1[\s\u00a0]234,50/);
  });

  it('defaults to BYN when currency omitted', () => {
    expect(formatMoney(1234.5)).toMatch(/1[\s\u00a0]234,50/);
  });
});

describe('date helpers', () => {
  it('startOfMonthIso returns YYYY-MM-01', () => {
    const s = startOfMonthIso();
    expect(s).toMatch(/^\d{4}-\d{2}-01$/);
  });

  it('endOfMonthIso returns last day of month', () => {
    const e = endOfMonthIso();
    expect(e).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('isDateInRange is inclusive', () => {
    expect(isDateInRange('2026-04-15', '2026-04-01', '2026-04-30')).toBe(true);
    expect(isDateInRange('2026-03-31', '2026-04-01', '2026-04-30')).toBe(false);
  });
});

describe('getSpendingPeriodRange', () => {
  const now = new Date('2026-04-15T12:00:00');

  it('returns calendar month', () => {
    const r = getSpendingPeriodRange('month', now);
    expect(r).toEqual({ from: '2026-04-01', to: '2026-04-30' });
  });

  it('returns calendar year', () => {
    const r = getSpendingPeriodRange('year', now);
    expect(r).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });

  it('returns week Mon–Sun', () => {
    const r = getSpendingPeriodRange('week', now);
    expect(r).toEqual({ from: '2026-04-13', to: '2026-04-19' });
  });
});

describe('formatSpendingPeriodLabel', () => {
  const now = new Date('2026-04-15T12:00:00');

  it('formats month in Russian locale', () => {
    expect(formatSpendingPeriodLabel('month', now)).toMatch(/апрел/i);
    expect(formatSpendingPeriodLabel('month', now)).toMatch(/2026/);
  });

  it('formats year', () => {
    expect(formatSpendingPeriodLabel('year', now)).toBe('2026');
  });

  it('formats week range', () => {
    const s = formatSpendingPeriodLabel('week', now);
    expect(s).toMatch(/13/);
    expect(s).toMatch(/19/);
  });
});
