import { Loader2 } from 'lucide-react';

/** Lightweight fallback shown while a lazily-loaded route chunk is fetched. */
export function ScreenFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="size-7 animate-spin-slow text-primary" />
    </div>
  );
}
