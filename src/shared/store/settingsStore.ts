import { create } from 'zustand';

import { DEFAULT_ACCOUNT_CURRENCY } from '@/shared/constants/accountCurrencies';

const STORAGE_KEY = 'settings.defaultCurrency';

function readDefaultCurrency(): string {
  if (typeof window === 'undefined') return DEFAULT_ACCOUNT_CURRENCY;
  try {
    return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_ACCOUNT_CURRENCY;
  } catch {
    return DEFAULT_ACCOUNT_CURRENCY;
  }
}

type SettingsState = {
  /** Currency the dashboard summary defaults to. */
  defaultCurrency: string;
  setDefaultCurrency: (currency: string) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  defaultCurrency: readDefaultCurrency(),
  setDefaultCurrency: (currency) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      /* ignore */
    }
    set({ defaultCurrency: currency });
  },
}));
