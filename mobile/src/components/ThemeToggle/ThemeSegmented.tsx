import * as React from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Text } from '@components/ui/text';
import { cn } from '@/shared/lib/utils';
import { easeOutExpo } from '@/shared/ui/motion/variants';
import { useThemeStore, type ThemePreference } from '@/shared/theme/themeStore';

type Segment = {
  value: ThemePreference;
  label: string;
};

const SEGMENTS: readonly Segment[] = [
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
  { value: 'system', label: 'Система' },
] as const;

const INDEX_BY_PREF: Record<ThemePreference, number> = {
  light: 0,
  dark: 1,
  system: 2,
};

/** Track inner padding in px — must match the `p-1` (and thumb `inset-1`) class. */
const TRACK_PADDING = 4;

type ThemeSegmentedProps = {
  /** Extra container classes (merged + de-duped via cn). */
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Fire a light haptic on selection change. Defaults to true. */
  haptic?: boolean;
};

/**
 * Three-way Light / Dark / System segmented control for the Settings screen.
 * Drives the theme store's `setPreference` directly (so it persists), and
 * highlights the active option with a sliding thumb animated via reanimated.
 *
 * The thumb position tracks the measured track width so it stays correct across
 * container sizes and orientation changes; reduced-motion snaps without a tween.
 */
export function ThemeSegmented({ className, style, haptic = true }: ThemeSegmentedProps) {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const reduce = useReducedMotion();

  // Width of one segment within the padded track. The thumb's width and its
  // per-step travel both use this, so the inner (`p-1`) padding is subtracted
  // first — otherwise the thumb would overhang the right edge on the last item.
  const segmentWidth = useSharedValue(0);
  const activeIndex = INDEX_BY_PREF[preference];

  const onTrackLayout = React.useCallback((e: LayoutChangeEvent) => {
    const inner = e.nativeEvent.layout.width - TRACK_PADDING * 2;
    segmentWidth.value = inner / SEGMENTS.length;
  }, [segmentWidth]);

  const thumbStyle = useAnimatedStyle(() => {
    const x = segmentWidth.value * activeIndex;
    return {
      width: segmentWidth.value,
      transform: [
        {
          translateX:
            reduce || segmentWidth.value === 0
              ? x
              : withTiming(x, { duration: 240, easing: easeOutExpo }),
        },
      ],
    };
  });

  const handleSelect = React.useCallback(
    (value: ThemePreference) => {
      if (value === preference) return;
      if (haptic) {
        void Haptics.selectionAsync();
      }
      setPreference(value);
    },
    [preference, haptic, setPreference],
  );

  return (
    <View
      onLayout={onTrackLayout}
      style={style}
      className={cn(
        'relative h-11 flex-row rounded-xl border border-border bg-muted p-1',
        className,
      )}
    >
      {/* Sliding active-thumb sits behind the labels. `p-1` inset matches the
          track padding so the thumb never overlaps the border. */}
      <Animated.View
        pointerEvents="none"
        style={thumbStyle}
        className="absolute inset-y-1 left-1 rounded-lg bg-card"
      />
      {SEGMENTS.map(({ value, label }) => {
        const selected = value === preference;
        return (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            onPress={() => handleSelect(value)}
            className="flex-1 items-center justify-center"
          >
            <Text
              weight={selected ? 'semibold' : 'medium'}
              numberOfLines={1}
              className={cn('text-[14px]', selected ? 'text-foreground' : 'text-muted-foreground')}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
