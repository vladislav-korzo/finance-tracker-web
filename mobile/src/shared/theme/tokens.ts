import { useThemeStore, type ResolvedTheme } from '@/shared/theme/themeStore';

/**
 * Design-token → HSL-channel values, mirrored from `mobile/global.css`.
 *
 * NativeWind classes can't reach SVG fill/stroke or other raw color props, so
 * components that draw (Sparkline) resolve tokens to real `hsl(...)` strings via
 * {@link useToken}. Keep these in sync with `global.css`; values are the bare
 * `H S% L%` channels so we can compose any alpha.
 */
type TokenName =
  | 'background'
  | 'foreground'
  | 'card'
  | 'card-foreground'
  | 'surface-2'
  | 'popover'
  | 'popover-foreground'
  | 'primary'
  | 'primary-foreground'
  | 'secondary'
  | 'secondary-foreground'
  | 'muted'
  | 'muted-foreground'
  | 'accent'
  | 'accent-foreground'
  | 'destructive'
  | 'destructive-foreground'
  | 'border'
  | 'input'
  | 'ring'
  | 'hero'
  | 'hero-foreground'
  | 'income'
  | 'income-foreground'
  | 'expense'
  | 'expense-foreground'
  | 'chart-1'
  | 'chart-2'
  | 'chart-3'
  | 'chart-4'
  | 'chart-5'
  | 'chart-6'
  | 'shadow-color';

const LIGHT: Record<TokenName, string> = {
  background: '220 33% 98%',
  foreground: '222 47% 11%',
  card: '0 0% 100%',
  'card-foreground': '222 47% 11%',
  'surface-2': '220 27% 96%',
  popover: '0 0% 100%',
  'popover-foreground': '222 47% 11%',
  primary: '72 90% 55%',
  'primary-foreground': '222 47% 11%',
  secondary: '220 27% 95%',
  'secondary-foreground': '222 40% 18%',
  muted: '220 27% 96%',
  'muted-foreground': '217 14% 46%',
  accent: '73 80% 92%',
  'accent-foreground': '95 60% 22%',
  destructive: '0 78% 58%',
  'destructive-foreground': '0 0% 100%',
  border: '220 20% 91%',
  input: '220 20% 91%',
  ring: '72 90% 45%',
  hero: '224 38% 12%',
  'hero-foreground': '210 30% 96%',
  income: '158 64% 40%',
  'income-foreground': '158 64% 30%',
  expense: '8 82% 60%',
  'expense-foreground': '8 72% 48%',
  'chart-1': '72 84% 48%',
  'chart-2': '158 64% 42%',
  'chart-3': '199 89% 52%',
  'chart-4': '262 70% 62%',
  'chart-5': '32 95% 56%',
  'chart-6': '330 75% 60%',
  'shadow-color': '222 47% 30%',
};

const DARK: Record<TokenName, string> = {
  background: '224 36% 6%',
  foreground: '210 30% 96%',
  card: '223 30% 9.5%',
  'card-foreground': '210 30% 96%',
  'surface-2': '223 26% 13%',
  popover: '223 30% 11%',
  'popover-foreground': '210 30% 96%',
  primary: '72 88% 56%',
  'primary-foreground': '224 40% 8%',
  secondary: '223 22% 16%',
  'secondary-foreground': '210 24% 90%',
  muted: '223 22% 15%',
  'muted-foreground': '217 16% 62%',
  accent: '95 40% 18%',
  'accent-foreground': '73 80% 78%',
  destructive: '0 72% 56%',
  'destructive-foreground': '0 0% 100%',
  border: '220 18% 18%',
  input: '220 16% 20%',
  ring: '72 88% 50%',
  hero: '223 32% 11%',
  'hero-foreground': '210 30% 96%',
  income: '158 64% 48%',
  'income-foreground': '158 60% 64%',
  expense: '8 86% 66%',
  'expense-foreground': '8 86% 70%',
  'chart-1': '72 84% 56%',
  'chart-2': '158 64% 50%',
  'chart-3': '199 89% 60%',
  'chart-4': '262 78% 72%',
  'chart-5': '32 95% 62%',
  'chart-6': '330 80% 68%',
  'shadow-color': '224 60% 2%',
};

const PALETTES: Record<ResolvedTheme, Record<TokenName, string>> = {
  light: LIGHT,
  dark: DARK,
};

/** Resolve a semantic token to an `hsl()` string for the given theme, with optional alpha (0–1). */
export function tokenColor(name: TokenName, theme: ResolvedTheme, alpha = 1): string {
  const channels = PALETTES[theme][name];
  return alpha >= 1 ? `hsl(${channels})` : `hsl(${channels} / ${alpha})`;
}

/**
 * Reactive token resolver for components that draw (SVG) and can't use NativeWind
 * classes. Re-renders on theme change. Pass alpha for soft fills.
 */
export function useToken(name: TokenName, alpha = 1): string {
  const theme = useThemeStore((s) => s.resolved);
  return tokenColor(name, theme, alpha);
}

/** Current resolved theme as a hook, for components that branch on light/dark. */
export function useResolvedTheme(): ResolvedTheme {
  return useThemeStore((s) => s.resolved);
}

export type { TokenName };
