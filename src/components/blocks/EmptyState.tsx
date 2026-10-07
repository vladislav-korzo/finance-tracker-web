import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Compact variant for inside cards/charts. */
  size?: 'default' | 'sm';
};

/** Friendly placeholder for empty lists, charts and screens. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = 'default',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-center',
        size === 'sm' ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-12',
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn(
          'flex items-center justify-center rounded-2xl bg-primary/12 text-primary',
          size === 'sm' ? 'size-11' : 'size-14'
        )}
      >
        <Icon className={size === 'sm' ? 'size-5' : 'size-7'} strokeWidth={2} />
      </motion.div>
      <div>
        <p className={cn('font-semibold text-foreground', size === 'sm' ? 'text-sm' : 'text-base')}>
          {title}
        </p>
        {description ? (
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
