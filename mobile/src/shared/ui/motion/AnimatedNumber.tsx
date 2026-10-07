import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Text, type TextProps } from '@components/ui/text';
import { easeOutExpo } from '@/shared/ui/motion/variants';

type AnimatedNumberProps = Omit<TextProps, 'children'> & {
  value: number;
  /** Render the (possibly fractional, mid-tween) number to a string. */
  format: (n: number) => string;
  /** Seconds (mirrors the web prop). */
  duration?: number;
  /** Seconds (mirrors the web prop). */
  delay?: number;
};

/**
 * Counts a number up to `value` on mount and whenever it changes, rendering the
 * formatted result through the weight-aware <Text>. The tween runs on the UI
 * thread via a reanimated shared value; `useAnimatedReaction` throttles JS-thread
 * state updates to only fire when the formatted string actually changes, so the
 * count-up stays smooth without a re-render on every frame.
 *
 * Honors reduced-motion by snapping straight to the final value.
 */
export function AnimatedNumber({
  value,
  format,
  duration = 1.1,
  delay = 0,
  ...textProps
}: AnimatedNumberProps) {
  const reduce = useReducedMotion();

  // Keep the latest formatter on a ref so the worklet always reads the current
  // one without re-running the tween when an inline `format` identity changes.
  const formatRef = useRef(format);
  formatRef.current = format;

  // The animated (tweened) numeric value, and the value we last animated FROM.
  const progress = useSharedValue(reduce ? value : 0);
  const fromRef = useRef(reduce ? value : 0);

  // The formatted string actually shown. Seeded so first paint matches the web
  // (web renders format(0) while animating, format(value) when reduced).
  const [display, setDisplay] = useState(() => format(reduce ? value : 0));

  // Format on the JS thread — `formatRef.current` is an ordinary JS closure and
  // MUST NOT be invoked from a worklet (on a real device that runs on the UI
  // runtime, which can't call it → instant crash; the web reanimated shim hides
  // this because it's single-threaded). We compare the *formatted* string and
  // bail out of the re-render when it's unchanged, so fractional frames that
  // round to the same displayed value stay free.
  const applyDisplay = useCallback((n: number) => {
    const next = formatRef.current(n);
    setDisplay((prev) => (prev === next ? prev : next));
  }, []);

  useEffect(() => {
    if (reduce) {
      cancelAnimation(progress);
      progress.value = value;
      fromRef.current = value;
      applyDisplay(value);
      return;
    }

    progress.value = fromRef.current;
    progress.value = withDelay(
      delay * 1000,
      withTiming(value, { duration: duration * 1000, easing: easeOutExpo }),
    );
    fromRef.current = value;

    return () => cancelAnimation(progress);
  }, [value, duration, delay, reduce, progress, applyDisplay]);

  // Bridge UI-thread tween -> JS-thread render. The worklet reads ONLY the
  // numeric shared value (safe on the UI thread); the formatter runs via runOnJS.
  useAnimatedReaction(
    () => progress.value,
    (next, prev) => {
      if (next !== prev) {
        runOnJS(applyDisplay)(next);
      }
    },
    // No deps: the reaction re-reads `progress` every frame it runs.
  );

  return <Text {...textProps}>{display}</Text>;
}
