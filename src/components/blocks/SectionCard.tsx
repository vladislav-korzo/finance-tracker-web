import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';

type SectionCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  /** Right-aligned controls in the header (selects, links, etc.). */
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Remove inner padding around children (for tables/charts that bleed). */
  flush?: boolean;
};

/** The standard content surface used across screens — consistent header + body. */
export function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
  flush,
}: SectionCardProps) {
  const hasHeader = title || description || action || Icon;
  return (
    <section
      className={cn(
        'rounded-2xl border border-border/70 bg-card text-card-foreground shadow-card',
        className
      )}
    >
      {hasHeader ? (
        <header className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            {Icon ? (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-foreground">
                <Icon className="size-5" strokeWidth={2} />
              </div>
            ) : null}
            <div className="min-w-0">
              {title ? (
                <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
          {action ? <div className="flex flex-wrap items-center gap-2 sm:justify-end">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn(!flush && (hasHeader ? 'px-5 pb-5 sm:px-6 sm:pb-6' : 'p-5 sm:p-6'), contentClassName)}>
        {children}
      </div>
    </section>
  );
}
