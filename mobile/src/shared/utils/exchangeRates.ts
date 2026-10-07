/** Курсы: сколько единиц валюты X приходится на 1 USD (как в open.er-api). */
export type UsdRatesMap = Record<string, number>;

const OPEN_ER_USD_URL = 'https://open.er-api.com/v6/latest/USD';

export async function fetchUsdRates(): Promise<UsdRatesMap | null> {
  try {
    const res = await fetch(OPEN_ER_USD_URL);
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (
      typeof data !== 'object' ||
      data === null ||
      !('result' in data) ||
      (data as { result?: string }).result !== 'success' ||
      !('rates' in data) ||
      typeof (data as { rates?: unknown }).rates !== 'object' ||
      (data as { rates?: unknown }).rates === null
    ) {
      return null;
    }
    return (data as { rates: UsdRatesMap }).rates;
  } catch {
    return null;
  }
}

/**
 * Перевод суммы из `from` в `to` через курсы к USD.
 * multiplier: amount_to = amount_from * (rates[to] / rates[from])
 */
export function convertViaUsdRates(
  amount: number,
  from: string,
  to: string,
  usdRates: UsdRatesMap
): number | null {
  const F = from.trim().toUpperCase();
  const T = to.trim().toUpperCase();
  if (F === T) return amount;
  const rf = usdRates[F];
  const rt = usdRates[T];
  if (rf == null || rt == null || rf === 0) return null;
  return (amount / rf) * rt;
}

/** Сумма нескольких сумм в разных валютах в целевой `to`; null, если любая конвертация невозможна. */
export function sumConvertedAmounts(
  rows: { currency: string; amount: number }[],
  to: string,
  usdRates: UsdRatesMap
): number | null {
  let sum = 0;
  for (const r of rows) {
    const v = convertViaUsdRates(r.amount, r.currency, to, usdRates);
    if (v == null) return null;
    sum += v;
  }
  return sum;
}
