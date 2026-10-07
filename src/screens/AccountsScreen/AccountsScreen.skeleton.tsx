import { Skeleton } from '@/components/ui/skeleton';

/** Loading placeholder that mirrors the wallets card grid. */
export function AccountsSkeleton() {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-44 rounded-lg" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-border/70 bg-surface-2 p-4"
          >
            <Skeleton className="size-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
