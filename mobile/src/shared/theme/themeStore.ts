import { colorScheme } from 'nativewind';
import { Appearance } from 'react-native';
import { create } from 'zustand';

import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function systemPrefersDark(): boolean {
  return Appearance.getColorScheme() === 'dark';
}

function resolve(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return pref;
}

/** Applies the resolved theme via NativeWind's runtime color-scheme observable. */
function applyTheme(resolved: ResolvedTheme): void {
  colorScheme.set(resolved);
}

type ThemeState = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  /** Read persisted preference, wire up system-change listener, sync state. Call once on mount. */
  initialize: () => void;
  setPreference: (pref: ThemePreference) => void;
  /** Convenience: flip between light and dark (resolving system first). */
  toggle: () => void;
};

let systemListenerAttached = false;

export const useThemeStore = create<ThemeState>((set, get) => ({
  // Default to 'system' synchronously; the persisted preference is loaded
  // asynchronously in initialize() so this store stays sync for consumers.
  preference: 'system',
  resolved: resolve('system'),

  initialize: () => {
    // Apply the synchronous default immediately so the UI is themed on mount.
    applyTheme(resolve('system'));

    if (!systemListenerAttached) {
      systemListenerAttached = true;
      Appearance.addChangeListener(() => {
        if (get().preference !== 'system') return;
        const next: ResolvedTheme = systemPrefersDark() ? 'dark' : 'light';
        applyTheme(next);
        set({ resolved: next });
      });
    }

    // Load the persisted preference and reconcile.
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        const pref: ThemePreference =
          stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
        const resolved = resolve(pref);
        applyTheme(resolved);
        set({ preference: pref, resolved });
      })
      .catch(() => {
        /* ignore */
      });
  },

  setPreference: (pref) => {
    const resolved = resolve(pref);
    applyTheme(resolved);
    set({ preference: pref, resolved });
    AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {
      /* ignore */
    });
  },

  toggle: () => {
    const next: ThemePreference = get().resolved === 'dark' ? 'light' : 'dark';
    get().setPreference(next);
  },
}));
