import * as React from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/shared/lib/utils';

type ProgressProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> & {
  value: number;
  indicatorClassName?: string;
  /** Inline color for the fill (e.g. a category color). Overrides the gradient. */
  color?: string;
};

/** Track + animated fill. Width springs to `value` on mount and change. */
export function Progress({ className, value, indicatorClassName, color, ...props }: ProgressProps) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <motion.div
        className={cn(
          'h-full rounded-full',
          !color && 'bg-primary-gradient',
          indicatorClassName
        )}
        style={color ? { backgroundColor: color } : undefined}
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
