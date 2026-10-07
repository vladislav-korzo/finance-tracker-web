import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { cn } from '@/shared/lib/utils';

/**
 * Native counterpart to the web `Progress` (src/components/ui/progress.tsx).
 *
 * Track + animated fill. The fill width springs to `value` on mount and on every
 * change via reanimated `withTiming` (same easing curve the web uses for its
 * framer-motion transition). Mirrors the web's colour-override capability:
 *
 *  - `color` as a hex / rgb / hsl string  → applied as an inline `backgroundColor`
 *  - `color` as a NativeWind class (e.g. `bg-chart-3`, `bg-income`) → applied as
 *    a `className` on the fill (so it stays theme-aware)
 *  - no `color`                            → defaults to `bg-primary`
 *
 * `value` is clamped to 0..100.
 */
export interface ProgressProps extends Omit<ViewProps, 'children'> {
  /** Fill amount, 0..100. Clamped. */
  value: number;
  /** Extra classes for the fill (e.g. a gradient via expo-linear-gradient sibling). */
  indicatorClassName?: string;
  /**
   * Fill colour override. A `bg-*` (or other) NativeWind class is applied as a
   * className; any other string (hex / rgb / hsl) is applied inline. Mirrors the
   * web's `color` prop.
   */
  color?: string;
  /** Track + fill height class. Defaults to `h-2` (matches web). */
  className?: string;
}

/** Matches the web's framer-motion `ease: [0.22, 1, 0.36, 1]` over 0.9s. */
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const DURATION = 900;

/** Heuristic: treat strings that look like a utility class as a className. */
function isClassName(color: string): boolean {
  // Hex / rgb / hsl / named-colour values are applied inline; everything else
  // (e.g. "bg-chart-3", "bg-income") is treated as a NativeWind class.
  return !(
    color.startsWith('#') ||
    color.startsWith('rgb') ||
    color.startsWith('hsl')
  );
}

export const Progress = React.forwardRef<View, ProgressProps>(function Progress(
  { className, value, indicatorClassName, color, ...props },
  ref,
) {
  const v = Math.min(100, Math.max(0, value));
  const reduceMotion = useReducedMotion();

  // Drive width as a 0..1 fraction; mapped to a percentage string in the worklet.
  const progress = useSharedValue(0);

  React.useEffect(() => {
    const next = v / 100;
    progress.value = reduceMotion
      ? next
      : withTiming(next, { duration: DURATION, easing: EASE });
  }, [v, reduceMotion, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const colorIsClass = color != null && isClassName(color);
  const inlineColor = color != null && !colorIsClass ? color : undefined;

  return (
    <View
      ref={ref}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v) }}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <Animated.View
        style={[fillStyle, inlineColor ? { backgroundColor: inlineColor } : null]}
        className={cn(
          'h-full rounded-full',
          // Default brand fill only when no override is supplied.
          !color && 'bg-primary',
          colorIsClass && color,
          indicatorClassName,
        )}
      />
    </View>
  );
});

Progress.displayName = 'Progress';
