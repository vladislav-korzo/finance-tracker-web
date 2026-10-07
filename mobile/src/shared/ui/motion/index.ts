export { AnimatedNumber } from '@/shared/ui/motion/AnimatedNumber';
export { Stagger, StaggerItem } from '@/shared/ui/motion/Stagger';
export type { StaggerProps, StaggerItemProps } from '@/shared/ui/motion/Stagger';

// RouteTransition is intentionally omitted: it was a web-router primitive, and on
// native expo-router owns screen transitions. Screens should configure transitions
// via expo-router's Stack screenOptions instead.

export {
  easeOutExpo,
  easeSpring,
  fadeUp,
  fadeIn,
  scaleIn,
  staggerDefaults,
} from '@/shared/ui/motion/variants';
