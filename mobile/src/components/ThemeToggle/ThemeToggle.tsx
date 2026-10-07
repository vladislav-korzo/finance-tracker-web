import * as React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Moon, Sun } from 'lucide-react-native';

import { cn } from '@/shared/lib/utils';
import { easeOutExpo } from '@/shared/ui/motion/variants';
import { useThemeStore } from '@/shared/theme/themeStore';
import { AMBER_500, THEME_COLORS } from '@/shared/theme/themeColors';

/**
 * Lucide RN icons are coloured via the `color` prop (NativeWind `className` does
 * not reach the underlying SVG stroke — there's no interop wiring), so we can't
 * lean on `text-primary` / `text-amber-500` classes the way the web does. We
 * mirror the web treatment instead: the Moon uses the brand `--primary` (resolved
 * per theme), the Sun uses amber (web hardcodes `text-amber-500`).
 */
const ICON_SIZE = 18;
const ICON_STROKE = 2.2;

type ThemeToggleProps = {
  /** Extra container classes (merged + de-duped via cn). */
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Fire a light haptic impact on press. Defaults to true. */
  haptic?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Compact icon button that flips between light and dark themes. Native
 * counterpart to the web `ThemeToggle` (src/components/ThemeToggle).
 *
 * Mirrors the web's morphing-icon affordance with reanimated: a single derived
 * progress value (0 = light/Sun, 1 = dark/Moon) cross-fades the two glyphs while
 * each slides vertically and counter-rotates, echoing the framer-motion
 * y/opacity/rotate transition. The press scale replaces the web `whileTap`.
 * Honors reduced-motion by snapping between states.
 */
export function ThemeToggle({ className, style, haptic = true }: ThemeToggleProps) {
  const resolved = useThemeStore((s) => s.resolved);
  const toggle = useThemeStore((s) => s.toggle);
  const reduce = useReducedMotion();
  const isDark = resolved === 'dark';

  // Drive both glyphs off one progress value so the swap stays in sync.
  const progress = useDerivedValue(() => {
    const target = isDark ? 1 : 0;
    return reduce ? target : withTiming(target, { duration: 260, easing: easeOutExpo });
  }, [isDark, reduce]);

  // Press feedback (mirrors web `whileTap={{ scale: 0.9 }}`).
  const pressed = useSharedValue(0);
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.9]) }],
  }));

  const sunStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -14]) },
      { rotate: `${interpolate(progress.value, [0, 1], [0, -40])}deg` },
    ],
  }));

  const moonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [14, 0]) },
      { rotate: `${interpolate(progress.value, [0, 1], [-40, 0])}deg` },
    ],
  }));

  const handlePress = React.useCallback(() => {
    if (haptic) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggle();
  }, [haptic, toggle]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      onPress={handlePress}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 90 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 140 });
      }}
      hitSlop={6}
      style={[containerStyle, style]}
      className={cn(
        // size-9 (36px) + 6px hitSlop keeps the effective target >= 44px.
        'relative h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-card',
        className,
      )}
    >
      <Animated.View style={[StyleSheetAbsolute, sunStyle]}>
        <Sun size={ICON_SIZE} strokeWidth={ICON_STROKE} color={AMBER_500} />
      </Animated.View>
      <Animated.View style={[StyleSheetAbsolute, moonStyle]}>
        <Moon size={ICON_SIZE} strokeWidth={ICON_STROKE} color={THEME_COLORS[resolved].primary} />
      </Animated.View>
      {/* Spacer reserves layout box so the absolutely-positioned glyphs centre. */}
      <View style={{ width: ICON_SIZE, height: ICON_SIZE }} />
    </AnimatedPressable>
  );
}

/** Absolutely-centred layer for each glyph so they stack and cross-fade. */
const StyleSheetAbsolute: ViewStyle = {
  position: 'absolute',
  alignItems: 'center',
  justifyContent: 'center',
};
