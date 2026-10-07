import { Skeleton } from '@/components/ui/skeleton';

/** Loading placeholder that mirrors the credits layout. */
export function CreditsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-[150px] rounded-2xl" />
        ))}
      </div>

      <div className="space-y-6">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
            <Skeleton className="mt-5 h-2 w-full rounded-full" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
