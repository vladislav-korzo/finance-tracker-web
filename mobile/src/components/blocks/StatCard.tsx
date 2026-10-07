import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Sparkline } from '@components/blocks/Sparkline';
import { Text } from '@components/ui/text';
import { tokenColor, useResolvedTheme, useToken } from '@/shared/theme/tokens';
import { cn } from '@/shared/lib/utils';

type Trend = {
  /** Signed delta, in percent. */
  value: number;
  label?: string;
};

type StatCardProps = {
  label: string;
  value?: number;
  format?: (n: number) => string;
  icon?: LucideIcon;
  trend?: Trend;
  /** When true (default), a positive trend is shown in the income color. */
  trendPositiveIsGood?: boolean;
  sparkline?: number[];
  /** Sparkline color override (any color string). Defaults per variant. */
  sparklineColor?: string;
  variant?: 'hero' | 'default';
  /** Count-up start delay in seconds. */
  delay?: number;
  footer?: ReactNode;
  /** Custom body, used instead of the animated value (e.g. multi-currency lists). */
  children?: ReactNode;
  className?: string;
};

/**
 * Count-up number. Drives a reanimated shared value with `withTiming` and bridges
 * the interpolated value back to JS state (RN `<Text>` can't be written from a
 * worklet). Mirrors the web `AnimatedNumber`.
 */
function AnimatedNumber({
  value,
  format,
  delay = 0,
  className,
  style,
}: {
  value: number;
  format: (n: number) => string;
  delay?: number;
  className?: string;
  style?: React.ComponentProps<typeof Text>['style'];
}) {
  const progress = useSharedValue(0);
  const formatRef = useRef(format);
  formatRef.current = format;
  const [display, setDisplay] = useState(() => format(0));

  // Format on the JS thread — `format` is a plain closure and must NOT be invoked
  // inside the reaction (it runs on the UI runtime, which can't call it → native
  // crash; the web reanimated shim hides this). The worklet passes only the raw
  // number across via runOnJS.
  const applyDisplay = useCallback((n: number) => {
    const next = formatRef.current(n);
    setDisplay((prev) => (prev === next ? prev : next));
  }, []);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      Math.round(delay * 1000),
      withTiming(value, { duration: 900, easing: Easing.out(Easing.cubic) })
    );
  }, [value, delay, progress]);

  useAnimatedReaction(
    () => progress.value,
    (current) => {
      runOnJS(applyDisplay)(current);
    },
  );

  return (
    <Text
      weight="bold"
      className={className}
      style={style}
      // Native: keep the figure on one line, shrinking to fit a narrow (2-column)
      // card. Web has no adjustsFontSizeToFit, so allow wrapping there rather than
      // truncating the value with an ellipsis.
      numberOfLines={Platform.OS === 'web' ? undefined : 1}
      adjustsFontSizeToFit={Platform.OS !== 'web'}
      minimumFontScale={0.6}
    >
      {display}
    </Text>
  );
}

export function StatCard({
  label,
  value,
  format = (n) => String(Math.round(n)),
  icon: Icon,
  trend,
  trendPositiveIsGood = true,
  sparkline,
  sparklineColor,
  variant = 'default',
  delay = 0,
  footer,
  children,
  className,
}: StatCardProps) {
  const theme = useResolvedTheme();
  const shadowColor = useToken('shadow-color');
  const hero = variant === 'hero';

  const trendUp = trend ? trend.value >= 0 : false;
  const trendGood = trend ? trendUp === trendPositiveIsGood : false;
  const trendArrowColor = tokenColor(
    trendGood ? 'income-foreground' : 'expense-foreground',
    theme
  );

  // Hero uses the dark `--hero` surface, so its text colors are derived inline
  // from the hero-foreground token at reduced alpha (there are no on-hero text
  // utility classes). Default variant uses semantic NativeWind classes.
  const iconTint = hero ? tokenColor('primary', theme) : tokenColor('foreground', theme);
  const sparkColor = sparklineColor ?? tokenColor(hero ? 'primary' : 'chart-2', theme);
  // Non-hero StatCards are often shown two-per-row, so the value must fit a
  // narrow card. ru-RU currency strings use non-breaking spaces (one unbreakable
  // token), so a smaller size + the one-line shrink (below) keeps it tidy on both
  // native (adjustsFontSizeToFit) and web (no truncation at this size).
  const valueSize = hero ? 'text-3xl' : 'text-xl';

  // (className | style) pairs that flip between hero (inline color) and default.
  const valueProps = hero
    ? { style: { color: tokenColor('hero-foreground', theme) } }
    : { className: 'text-foreground' };
  const labelProps = hero
    ? { style: { color: tokenColor('hero-foreground', theme, 0.7) } }
    : { className: 'text-muted-foreground' };
  const faintProps = hero
    ? { style: { color: tokenColor('hero-foreground', theme, 0.6) } }
    : { className: 'text-muted-foreground' };

  return (
    <View
      className={cn(
        'relative justify-between overflow-hidden rounded-2xl p-5',
        hero ? 'bg-hero' : 'border border-border bg-card',
        className
      )}
      style={{
        shadowColor,
        shadowOpacity: hero ? 0.18 : 0.1,
        shadowRadius: hero ? 22 : 16,
        shadowOffset: { width: 0, height: hero ? 12 : 8 },
        elevation: hero ? 6 : 3,
      }}
    >
      {hero ? (
        <LinearGradient
          colors={[tokenColor('primary', theme, 0.16), 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          pointerEvents="none"
        />
      ) : null}

      <View className="flex-row items-start justify-between gap-3">
        <Text
          weight="medium"
          className={cn('flex-1 text-sm', labelProps.className)}
          style={labelProps.style}
        >
          {label}
        </Text>
        {Icon ? (
          <View
            className={cn(
              'size-10 shrink-0 items-center justify-center rounded-xl',
              hero ? 'bg-primary/20' : 'bg-surface-2'
            )}
          >
            <Icon size={20} color={iconTint} strokeWidth={2} />
          </View>
        ) : null}
      </View>

      <View className="mt-5">
        {children ? (
          children
        ) : typeof value === 'number' ? (
          <AnimatedNumber
            value={value}
            format={format}
            delay={delay}
            className={cn('tracking-tight', valueSize, valueProps.className)}
            style={valueProps.style}
          />
        ) : (
          <Text
            weight="bold"
            className={cn('tracking-tight', valueSize, valueProps.className)}
            style={valueProps.style}
          >
            —
          </Text>
        )}

        <View className="mt-2 flex-row items-center justify-between gap-3">
          <View className="flex-1 flex-row items-center gap-2">
            {trend ? (
              <View
                className={cn(
                  'flex-row items-center gap-0.5 rounded-full px-2 py-0.5',
                  trendGood ? 'bg-income/15' : 'bg-expense/15'
                )}
              >
                {trendUp ? (
                  <ArrowUpRight size={14} color={trendArrowColor} strokeWidth={2.5} />
                ) : (
                  <ArrowDownRight size={14} color={trendArrowColor} strokeWidth={2.5} />
                )}
                <Text
                  weight="semibold"
                  className={cn(
                    'text-xs',
                    trendGood ? 'text-income-foreground' : 'text-expense-foreground'
                  )}
                >
                  {Math.abs(trend.value).toFixed(1)}%
                </Text>
              </View>
            ) : null}
            {trend?.label ? (
              <Text
                className={cn('text-xs', faintProps.className)}
                style={faintProps.style}
              >
                {trend.label}
              </Text>
            ) : null}
          </View>

          {sparkline && sparkline.length > 1 ? (
            <Sparkline data={sparkline} color={sparkColor} width={96} height={32} />
          ) : null}
        </View>

        {footer ? (
          <View className="mt-3">
            {typeof footer === 'string' || typeof footer === 'number' ? (
              <Text className={cn('text-xs', faintProps.className)} style={faintProps.style}>
                {footer}
              </Text>
            ) : (
              footer
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export type { StatCardProps };
