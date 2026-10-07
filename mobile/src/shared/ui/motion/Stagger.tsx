import { Children, createContext, isValidElement, useContext } from 'react';
import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, { FadeInDown, type AnimatedProps } from 'react-native-reanimated';

import { easeOutExpo, fadeUp, staggerDefaults } from '@/shared/ui/motion/variants';

type StaggerContextValue = {
  /** Per-item step, in ms. */
  stagger: number;
  /** Delay before the first item, in ms. */
  delayChildren: number;
};

const StaggerContext = createContext<StaggerContextValue>(staggerDefaults);

/** Items read their position from here so the parent can clone-inject it. */
const IndexContext = createContext(0);

type StaggerProps = ViewProps & {
  /** Per-child step. Seconds (mirrors web); converted to ms internally. */
  stagger?: number;
  /** Delay before the first child. Seconds (mirrors web). */
  delayChildren?: number;
  children?: ReactNode;
};

/**
 * Wrapper that staggers the entrance of its <StaggerItem> children on mount.
 *
 * Web framer-motion drives this through a variant container; reanimated has no
 * parent-orchestrated stagger across separate children, so we assign each direct
 * child an index and let every <StaggerItem> derive its own entrance delay
 * (`delayChildren + index * stagger`). Same export names and usage as web.
 */
export function Stagger({
  stagger = staggerDefaults.stagger / 1000,
  delayChildren = staggerDefaults.delayChildren / 1000,
  children,
  ...rest
}: StaggerProps) {
  let index = 0;
  const indexed = Children.map(children, (child) =>
    // Only count real elements toward the stagger order; skip null/strings so a
    // conditional `{cond && <StaggerItem/>}` doesn't leave a gap in the timing.
    isValidElement(child) ? (
      <IndexContext.Provider value={index++}>{child}</IndexContext.Provider>
    ) : (
      child
    ),
  );

  return (
    <StaggerContext.Provider
      value={{ stagger: stagger * 1000, delayChildren: delayChildren * 1000 }}
    >
      <View {...rest}>{indexed}</View>
    </StaggerContext.Provider>
  );
}

type StaggerItemProps = AnimatedProps<ViewProps> & {
  children?: ReactNode;
};

/**
 * A single staggered child. Defaults to a fade-up entrance (opacity + translateY),
 * matching the web `fadeUp` variant. Place inside <Stagger> to inherit the
 * per-index delay; used standalone it simply fades up with no extra delay.
 */
export function StaggerItem({ children, entering, ...rest }: StaggerItemProps) {
  const { stagger, delayChildren } = useContext(StaggerContext);
  const index = useContext(IndexContext);

  // Let callers override the entrance entirely; otherwise build the staggered fade-up.
  const enter =
    entering ??
    FadeInDown.duration(fadeUp.duration)
      .easing(easeOutExpo)
      .delay(delayChildren + index * stagger);

  return (
    <Animated.View entering={enter} {...rest}>
      {children}
    </Animated.View>
  );
}

export type { StaggerProps, StaggerItemProps };
