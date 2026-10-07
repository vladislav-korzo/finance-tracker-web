import type { ResolvedTheme } from '@/shared/theme/themeStore';

/**
 * Resolved hex values for the design tokens that need to be handed to
 * components which don't honour NativeWind `className` colouring — chiefly
 * `lucide-react-native` icons, whose stroke is set via the `color` prop (there's
 * no `cssInterop`/`remapProps` wiring for them, so `text-*` classes are inert).
 *
 * Each entry is the exact `hsl(var(--token))` value from `global.css`, computed
 * for both the light (`:root`) and dark (`.dark:root`) palettes. Keep in sync if
 * those tokens change. Consumers pick the map for the current `resolved` theme.
 */
export const THEME_COLORS: Record<ResolvedTheme, {
  foreground: string;
  mutedForeground: string;
  primary: string;
}> = {
  light: {
    foreground: '#0f1729', // hsl(222 47% 11%)
    mutedForeground: '#657186', // hsl(217 14% 46%)
    primary: '#caf425', // hsl(72 90% 55%)
  },
  dark: {
    foreground: '#f2f5f8', // hsl(210 30% 96%)
    mutedForeground: '#8f9aae', // hsl(217 16% 62%)
    primary: '#caf22c', // hsl(72 88% 56%)
  },
};

/** tailwind `amber-500` — used for the light-theme Sun glyph (matches web). */
export const AMBER_500 = '#f59e0b';
