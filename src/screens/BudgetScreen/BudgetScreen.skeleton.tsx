import { Skeleton } from '@/components/ui/skeleton';

/** Loading placeholder that mirrors the savings-goals layout. */
export function BudgetSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[150px] rounded-2xl" />
        ))}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="space-y-4 rounded-2xl border border-border/70 bg-surface-2 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="size-9 rounded-xl" />
              </div>
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
