import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export { toast };

const BRAND_COLORS = ['#C8EE44', '#10b981', '#0ea5e9', '#a855f7'];

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** A celebratory confetti burst for delightful moments (income, goal reached). */
export function celebrate(intensity: 'small' | 'big' = 'small'): void {
  if (prefersReducedMotion()) return;
  const base = { colors: BRAND_COLORS, disableForReducedMotion: true, zIndex: 9999 };
  if (intensity === 'big') {
    confetti({ ...base, particleCount: 120, spread: 90, startVelocity: 45, origin: { y: 0.6 } });
    window.setTimeout(
      () => confetti({ ...base, particleCount: 60, spread: 110, scalar: 0.9, origin: { y: 0.65 } }),
      180
    );
    return;
  }
  confetti({ ...base, particleCount: 60, spread: 70, startVelocity: 38, origin: { y: 0.7 } });
}
