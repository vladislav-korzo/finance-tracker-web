import { Skeleton } from '@/components/ui/skeleton';

/** Loading placeholder that mirrors the income/expense category groups. */
export function CategoriesSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[0, 1].map((group) => (
        <div
          key={group}
          className="rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-6"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface-2 p-3"
              >
                <Skeleton className="size-10 shrink-0 rounded-xl" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
