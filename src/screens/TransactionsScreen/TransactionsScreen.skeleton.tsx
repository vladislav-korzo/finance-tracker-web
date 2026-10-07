import { Skeleton } from '@/components/ui/skeleton';

/** Loading placeholder that mirrors the transactions layout. */
export function TransactionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-10 w-44 rounded-lg" />
      </div>

      <div className="rounded-2xl border border-border/70 bg-card shadow-card">
        <div className="flex items-center justify-between p-5 sm:p-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="space-y-1 px-2 pb-2 sm:px-3 sm:pb-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3">
              <Skeleton className="size-10 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="hidden h-6 w-24 rounded-full sm:block" />
              <Skeleton className="hidden h-6 w-16 rounded-full md:block" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
