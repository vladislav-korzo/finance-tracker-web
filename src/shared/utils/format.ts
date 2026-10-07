import { DEFAULT_ACCOUNT_CURRENCY } from '@/shared/constants/accountCurrencies';

export const APP_LOCALE = 'ru-RU';

export function formatMoney(amount: number, currency: string = DEFAULT_ACCOUNT_CURRENCY): string {
  return new Intl.NumberFormat(APP_LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Compact money for axes / chips, e.g. 8,7 тыс. ₽ → "8.7K". Keeps the currency symbol. */
export function formatMoneyCompact(amount: number, currency: string = DEFAULT_ACCOUNT_CURRENCY): string {
  return new Intl.NumberFormat(APP_LOCALE, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

/** Compact bare number, e.g. 12500 → "12,5 тыс.". */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat(APP_LOCALE, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/** Terse, language-neutral axis tick, e.g. 33000 → "33K", 1_200_000 → "1.2M". */
export function formatAxisCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(abs % 1_000 === 0 ? 0 : 1)}K`;
  return `${Math.round(value)}`;
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString(APP_LOCALE);
}

export function formatDateDisplay(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString(APP_LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function startOfMonthIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

export function endOfMonthIso(): string {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const y = last.getFullYear();
  const m = String(last.getMonth() + 1).padStart(2, '0');
  const day = String(last.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Период для агрегации расходов по категориям (календарная неделя с понедельника). */
export type SpendingPeriod = 'week' | 'month' | 'year';

function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

export function getSpendingPeriodRange(
  period: SpendingPeriod,
  now = new Date()
): { from: string; to: string } {
  const y = now.getFullYear();
  const m = now.getMonth();

  if (period === 'year') {
    return { from: `${y}-01-01`, to: `${y}-12-31` };
  }

  if (period === 'month') {
    const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const last = new Date(y, m + 1, 0);
    const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
    return { from, to };
  }

  const weekStart = startOfWeekMonday(now);
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
  return { from: toIsoDateLocal(weekStart), to: toIsoDateLocal(weekEnd) };
}

export function formatSpendingPeriodLabel(period: SpendingPeriod, now = new Date()): string {
  const { from, to } = getSpendingPeriodRange(period, now);
  const fromD = new Date(from + 'T12:00:00');
  const toD = new Date(to + 'T12:00:00');

  if (period === 'year') {
    return String(fromD.getFullYear());
  }

  if (period === 'month') {
    return fromD.toLocaleString(APP_LOCALE, { month: 'long', year: 'numeric' });
  }

  return `${fromD.toLocaleDateString(APP_LOCALE, { day: 'numeric', month: 'short' })} – ${toD.toLocaleDateString(APP_LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export function isDateInRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}
