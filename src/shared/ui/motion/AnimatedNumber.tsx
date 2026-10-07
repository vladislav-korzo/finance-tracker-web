import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';

type AnimatedNumberProps = {
  value: number;
  /** Render the (possibly fractional, mid-tween) number to a string. */
  format: (n: number) => string;
  /** Seconds. */
  duration?: number;
  delay?: number;
  className?: string;
};

/**
 * Counts a number up to `value` on mount and whenever it changes, writing
 * directly to the DOM node so the tween never triggers React re-renders.
 * Honors prefers-reduced-motion by snapping to the final value.
 */
export function AnimatedNumber({
  value,
  format,
  duration = 1.1,
  delay = 0,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const formatRef = useRef(format);
  formatRef.current = format;
  const fromRef = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const fmt = formatRef.current;
    if (reduce) {
      node.textContent = fmt(value);
      fromRef.current = value;
      return;
    }
    const controls = animate(fromRef.current, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = fmt(latest);
      },
    });
    fromRef.current = value;
    return () => controls.stop();
  }, [value, duration, delay, reduce]);

  return (
    <span ref={ref} className={className}>
      {format(reduce ? value : 0)}
    </span>
  );
}
