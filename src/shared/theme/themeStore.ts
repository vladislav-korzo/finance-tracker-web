import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function resolve(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return pref;
}

/** Applies the resolved theme to <html>, briefly enabling a cross-fade. */
function applyTheme(resolved: ResolvedTheme, animate: boolean): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (animate) {
    root.classList.add('theming');
    window.setTimeout(() => root.classList.remove('theming'), 480);
  }
  root.classList.toggle('dark', resolved === 'dark');
}

type ThemeState = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  /** Wire up system-change listener and sync initial state. Call once on mount. */
  initialize: () => void;
  setPreference: (pref: ThemePreference) => void;
  /** Convenience: flip between light and dark (resolving system first). */
  toggle: () => void;
};

let systemListenerAttached = false;

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: readStoredPreference(),
  resolved: resolve(readStoredPreference()),

  initialize: () => {
    const pref = readStoredPreference();
    const resolved = resolve(pref);
    applyTheme(resolved, false);
    set({ preference: pref, resolved });

    if (!systemListenerAttached && typeof window !== 'undefined') {
      systemListenerAttached = true;
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', () => {
        if (get().preference !== 'system') return;
        const next = systemPrefersDark() ? 'dark' : 'light';
        applyTheme(next, true);
        set({ resolved: next });
      });
    }
  },

  setPreference: (pref) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, pref);
    const resolved = resolve(pref);
    applyTheme(resolved, true);
    set({ preference: pref, resolved });
  },

  toggle: () => {
    const next: ThemePreference = get().resolved === 'dark' ? 'light' : 'dark';
    get().setPreference(next);
  },
}));
