import { Skeleton } from '@/components/ui/skeleton';

/** Loading placeholder that mirrors the analytics layout. */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[150px] rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-[360px] rounded-2xl" />
      <Skeleton className="h-[340px] rounded-2xl" />
    </div>
  );
}
