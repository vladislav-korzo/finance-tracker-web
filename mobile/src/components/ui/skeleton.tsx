import * as React from 'react';
import { View, type LayoutChangeEvent, type ViewProps } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { cn } from '@/shared/lib/utils';

/**
 * Native counterpart to the web `Skeleton` (src/components/ui/skeleton.tsx).
 *
 * Shimmering placeholder block. The web uses a 100deg gradient sweep translating
 * across a `bg-muted` base (`.shimmer`, 1.5s ease-in-out infinite); here a
 * translucent highlight band (rendered with expo-linear-gradient) is translated
 * across a muted block on the UI thread via reanimated. The highlight is a
 * white→transparent sheen so it reads in both light and dark themes.
 *
 * Accepts `className` for sizing (height/width/radius) — compose into
 * screen-specific skeletons. Defaults to `rounded-md` to match the web.
 *
 * Honours the OS "reduce motion" setting: the sweep is disabled and a static
 * muted block is shown instead.
 */
export interface SkeletonProps extends ViewProps {
  /** Sizing / radius utilities (e.g. `h-4 w-32 rounded-lg`). */
  className?: string;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const DURATION = 1500;
const EASE = Easing.inOut(Easing.ease);

/** White sheen → transparent, faded at both edges for a soft sweep. */
const HIGHLIGHT_COLORS = [
  'rgba(255,255,255,0)',
  'rgba(255,255,255,0.10)',
  'rgba(255,255,255,0.18)',
  'rgba(255,255,255,0.10)',
  'rgba(255,255,255,0)',
] as const;
const HIGHLIGHT_LOCATIONS = [0, 0.35, 0.5, 0.65, 1] as const;

export const Skeleton = React.forwardRef<View, SkeletonProps>(function Skeleton(
  { className, onLayout, ...props },
  ref,
) {
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = React.useState(0);
  const progress = useSharedValue(0);

  const handleLayout = React.useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      setWidth((prev) => (prev === w ? prev : w));
      onLayout?.(e);
    },
    [onLayout],
  );

  React.useEffect(() => {
    if (reduceMotion || width === 0) {
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: DURATION, easing: EASE }),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [reduceMotion, width, progress]);

  // The highlight band is 1.5× the block width; it travels from fully off the
  // left edge to fully off the right edge.
  const bandWidth = width * 1.5;
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: -bandWidth + progress.value * (width + bandWidth),
      },
    ],
  }));

  return (
    <View
      ref={ref}
      onLayout={handleLayout}
      accessibilityRole="none"
      className={cn('overflow-hidden rounded-md bg-muted', className)}
      {...props}
    >
      {!reduceMotion && width > 0 ? (
        <AnimatedLinearGradient
          colors={HIGHLIGHT_COLORS}
          locations={HIGHLIGHT_LOCATIONS}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[
            { position: 'absolute', top: 0, bottom: 0, width: bandWidth },
            sweepStyle,
          ]}
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
});

Skeleton.displayName = 'Skeleton';
