import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Sparkline } from '@/components/blocks/Sparkline';
import { cn } from '@/shared/lib/utils';
import { AnimatedNumber } from '@/shared/ui/motion/AnimatedNumber';

type Trend = {
  /** Signed delta, in percent. */
  value: number;
  label?: string;
};

type StatCardProps = {
  label: string;
  value?: number;
  format?: (n: number) => string;
  icon?: LucideIcon;
  trend?: Trend;
  /** When true (default), a positive trend is shown in the income color. */
  trendPositiveIsGood?: boolean;
  sparkline?: number[];
  sparklineColor?: string;
  variant?: 'hero' | 'default';
  /** Count-up start delay in seconds. */
  delay?: number;
  footer?: ReactNode;
  /** Custom body, used instead of the animated value (e.g. multi-currency lists). */
  children?: ReactNode;
  className?: string;
};

export function StatCard({
  label,
  value,
  format = (n) => String(Math.round(n)),
  icon: Icon,
  trend,
  trendPositiveIsGood = true,
  sparkline,
  sparklineColor,
  variant = 'default',
  delay = 0,
  footer,
  children,
  className,
}: StatCardProps) {
  const hero = variant === 'hero';
  const trendUp = trend ? trend.value >= 0 : false;
  const trendGood = trend ? trendUp === trendPositiveIsGood : false;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6',
        hero
          ? 'bg-hero text-hero-foreground shadow-floating'
          : 'border border-border/70 bg-card text-card-foreground shadow-card hover:shadow-card-hover',
        className
      )}
    >
      {hero ? (
        <div className="pointer-events-none absolute inset-0 bg-hero-sheen opacity-80" aria-hidden />
      ) : null}

      <div className="relative flex items-start justify-between gap-3">
        <p
          className={cn(
            'text-sm font-medium',
            hero ? 'text-hero-foreground/70' : 'text-muted-foreground'
          )}
        >
          {label}
        </p>
        {Icon ? (
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
              hero ? 'bg-primary/20 text-primary' : 'bg-surface-2 text-foreground'
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
          </div>
        ) : null}
      </div>

      <div className="relative mt-5">
        {children ? (
          children
        ) : (
          <div
            className={cn(
              'font-bold tracking-tight tabular-nums',
              hero ? 'text-3xl sm:text-[2rem]' : 'text-2xl sm:text-[1.75rem]'
            )}
          >
            {typeof value === 'number' ? (
              <AnimatedNumber value={value} format={format} delay={delay} />
            ) : (
              '—'
            )}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {trend ? (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                  trendGood
                    ? 'bg-income/15 text-income-foreground'
                    : 'bg-expense/15 text-expense-foreground'
                )}
              >
                {trendUp ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {Math.abs(trend.value).toFixed(1)}%
              </span>
            ) : null}
            {trend?.label ? (
              <span
                className={cn(
                  'text-xs',
                  hero ? 'text-hero-foreground/60' : 'text-muted-foreground'
                )}
              >
                {trend.label}
              </span>
            ) : null}
          </div>
          {sparkline && sparkline.length > 1 ? (
            <Sparkline
              data={sparkline}
              color={sparklineColor ?? (hero ? 'hsl(var(--primary))' : 'hsl(var(--chart-2))')}
              width={96}
              height={32}
            />
          ) : null}
        </div>

        {footer ? (
          <div
            className={cn(
              'mt-3 text-xs',
              hero ? 'text-hero-foreground/60' : 'text-muted-foreground'
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
