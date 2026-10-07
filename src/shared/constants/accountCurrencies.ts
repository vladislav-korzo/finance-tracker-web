/** Поддерживаемые валюты кошельков (ISO 4217). */
export const ACCOUNT_CURRENCY_CODES = ['RUB', 'USD', 'EUR', 'BYN'] as const;

export type AccountCurrencyCode = (typeof ACCOUNT_CURRENCY_CODES)[number];

/** Валюта по умолчанию в формах, API и при отсутствии данных. */
export const DEFAULT_ACCOUNT_CURRENCY: AccountCurrencyCode = 'BYN';

export const ACCOUNT_CURRENCY_OPTIONS: { value: AccountCurrencyCode; label: string }[] = [
  { value: 'RUB', label: 'RUB — российский рубль' },
  { value: 'USD', label: 'USD — доллар США' },
  { value: 'EUR', label: 'EUR — евро' },
  { value: 'BYN', label: 'BYN — белорусский рубль' },
];

export function normalizeAccountCurrency(code: string): AccountCurrencyCode {
  const upper = code.toUpperCase() as AccountCurrencyCode;
  return ACCOUNT_CURRENCY_CODES.includes(upper) ? upper : DEFAULT_ACCOUNT_CURRENCY;
}
