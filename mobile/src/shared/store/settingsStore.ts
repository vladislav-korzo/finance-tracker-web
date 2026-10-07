import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { DEFAULT_ACCOUNT_CURRENCY } from '@/shared/constants/accountCurrencies';

const STORAGE_KEY = 'settings.defaultCurrency';

type SettingsState = {
  /** Currency the dashboard summary defaults to. */
  defaultCurrency: string;
  setDefaultCurrency: (currency: string) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  // Default synchronously until AsyncStorage hydration completes so the API
  // stays synchronous for consumers (e.g. useSettingsStore.getState()).
  defaultCurrency: DEFAULT_ACCOUNT_CURRENCY,
  setDefaultCurrency: (currency) => {
    set({ defaultCurrency: currency });
    AsyncStorage.setItem(STORAGE_KEY, currency).catch(() => {
      /* ignore */
    });
  },
}));

let hydrated = false;

/**
 * Read the persisted default currency from AsyncStorage once and apply it.
 * Safe to call multiple times; only the first invocation touches storage.
 */
export async function hydrateSettings(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      useSettingsStore.setState({ defaultCurrency: stored });
    }
  } catch {
    /* ignore */
  }
}

// Kick off hydration on module init so consumers eventually see the stored
// value without any explicit wiring at the call site.
void hydrateSettings();
