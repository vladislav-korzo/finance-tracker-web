import { convertViaUsdRates, type UsdRatesMap } from '@/shared/utils/exchangeRates';

describe('convertViaUsdRates', () => {
  const rates: UsdRatesMap = {
    USD: 1,
    EUR: 0.85,
    RUB: 90,
  };

  it('returns same amount when from === to', () => {
    expect(convertViaUsdRates(100, 'USD', 'USD', rates)).toBe(100);
  });

  it('converts USD to EUR', () => {
    // 100 USD -> 100 * 0.85 EUR
    expect(convertViaUsdRates(100, 'USD', 'EUR', rates)).toBeCloseTo(85, 5);
  });

  it('converts EUR to USD', () => {
    // 85 EUR -> 85 / 0.85 = 100 USD
    expect(convertViaUsdRates(85, 'EUR', 'USD', rates)).toBeCloseTo(100, 5);
  });

  it('converts between non-USD pairs', () => {
    // 85 EUR to RUB: (85/0.85)*90 = 9000
    expect(convertViaUsdRates(85, 'EUR', 'RUB', rates)).toBeCloseTo(9000, 5);
  });

  it('returns null for unknown currency', () => {
    expect(convertViaUsdRates(10, 'USD', 'XXX', rates)).toBeNull();
  });
});
