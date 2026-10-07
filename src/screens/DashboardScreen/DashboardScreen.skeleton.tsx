import { Skeleton } from '@/components/ui/skeleton';

/** Loading placeholder that mirrors the dashboard layout. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[150px] rounded-2xl" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-[340px] rounded-2xl lg:col-span-3" />
        <Skeleton className="h-[340px] rounded-2xl lg:col-span-2" />
      </div>

      <Skeleton className="h-[260px] rounded-2xl" />
      <Skeleton className="h-[320px] rounded-2xl" />
    </div>
  );
}
