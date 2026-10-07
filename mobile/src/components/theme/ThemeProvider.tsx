import * as React from 'react';

import {
  useThemeStore,
  type ResolvedTheme,
  type ThemePreference,
} from '@/shared/theme/themeStore';

type ThemeProviderProps = {
  children: React.ReactNode;
};

/**
 * Bootstraps the theme system. Calls the store's `initialize()` exactly once on
 * mount — which applies the synchronous `'system'` default to NativeWind's
 * runtime color-scheme, attaches the OS appearance-change listener, then loads
 * and reconciles the persisted preference from AsyncStorage.
 *
 * `app/_layout.tsx` wraps the app tree with this so the whole UI is themed
 * before first paint. Renders its children unchanged.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  React.useEffect(() => {
    // Read the action off `getState()` rather than subscribing, so the provider
    // never re-renders the tree on theme changes — consumers subscribe directly.
    useThemeStore.getState().initialize();
  }, []);

  return <>{children}</>;
}

export type UseThemeReturn = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (pref: ThemePreference) => void;
  toggle: () => void;
};

/**
 * Convenience hook over the theme store. Subscribes to `preference` and
 * `resolved` (so the caller re-renders when the theme changes) and exposes the
 * stable `setPreference` / `toggle` actions.
 */
export function useTheme(): UseThemeReturn {
  const preference = useThemeStore((s) => s.preference);
  const resolved = useThemeStore((s) => s.resolved);
  const setPreference = useThemeStore((s) => s.setPreference);
  const toggle = useThemeStore((s) => s.toggle);

  return { preference, resolved, setPreference, toggle };
}
