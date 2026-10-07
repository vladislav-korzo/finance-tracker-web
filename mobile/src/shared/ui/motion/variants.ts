import { Easing } from 'react-native-reanimated';

/**
 * Native port of the web motion tokens. Framer-motion's array-form cubic-bezier
 * and spring config don't apply to reanimated, so we expose reanimated-native
 * equivalents instead. Only the pieces AnimatedNumber/Stagger need are ported.
 */

/** Signature easing — expo-out, used across entrances. Mirrors web `[0.22, 1, 0.36, 1]`. */
export const easeOutExpo = Easing.bezier(0.22, 1, 0.36, 1);

/** Spring config approximating the web `easeSpring` (stiffness 380 / damping 30). */
export const easeSpring = { stiffness: 380, damping: 30, mass: 1 } as const;

/** Entrance timing tokens (ms) shared by the Stagger primitives. */
export const fadeUp = { duration: 500, translateY: 16 } as const;
export const fadeIn = { duration: 400 } as const;
export const scaleIn = { duration: 450, scale: 0.96, translateY: 8 } as const;

/** Stagger defaults, in ms (web used seconds: 0.07 / 0.04). */
export const staggerDefaults = { stagger: 70, delayChildren: 40 } as const;
