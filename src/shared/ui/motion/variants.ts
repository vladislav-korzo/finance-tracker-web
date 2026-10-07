import type { Variants } from 'framer-motion';

/** Signature easing — expo-out, used across entrances. */
export const easeOutExpo = [0.22, 1, 0.36, 1] as const;
export const easeSpring = { type: 'spring', stiffness: 380, damping: 30 } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOutExpo } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: easeOutExpo } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.45, ease: easeOutExpo } },
};

/** Container that staggers its children's entrance. */
export function staggerContainer(stagger = 0.07, delayChildren = 0.04): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren } },
  };
}
