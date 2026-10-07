import { motion, type HTMLMotionProps } from 'framer-motion';

import { fadeUp, staggerContainer } from '@/shared/ui/motion/variants';

type StaggerProps = HTMLMotionProps<'div'> & {
  stagger?: number;
  delayChildren?: number;
};

/** Wrapper that staggers the entrance of its <StaggerItem> children on mount. */
export function Stagger({ stagger, delayChildren, children, ...rest }: StaggerProps) {
  return (
    <motion.div
      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      animate="show"
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** A single staggered child. Defaults to a fade-up entrance. */
export function StaggerItem({ children, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div variants={fadeUp} {...rest}>
      {children}
    </motion.div>
  );
}
