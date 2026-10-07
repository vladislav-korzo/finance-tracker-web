import { cn } from '@/shared/lib/utils';

/** Shimmering placeholder block. Compose into screen-specific skeletons. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('shimmer rounded-md', className)} {...props} />;
}

export { Skeleton };
