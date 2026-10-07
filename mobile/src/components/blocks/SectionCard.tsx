import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@components/ui/text';
import { useToken } from '@/shared/theme/tokens';
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

/** Render a `ReactNode` title/description either as raw node or wrapped in styled Text. */
function HeaderText({
  value,
  className,
  weight,
}: {
  value: ReactNode;
  className: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}) {
  if (value == null || value === false) return null;
  if (typeof value === 'string' || typeof value === 'number') {
    return (
      <Text weight={weight} className={className}>
        {value}
      </Text>
    );
  }
  return <>{value}</>;
}

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
  const shadowColor = useToken('shadow-color');
  const iconColor = useToken('foreground');
  const hasHeader = Boolean(title || description || action || Icon);

  return (
    <View
      className={cn('rounded-2xl border border-border bg-card', className)}
      style={{
        shadowColor,
        shadowOpacity: 0.1,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
      }}
    >
      {hasHeader ? (
        <View className="flex-row items-start justify-between gap-3 p-5">
          <View className="min-w-0 flex-1 flex-row items-start gap-3">
            {Icon ? (
              <View className="size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2">
                <Icon size={20} color={iconColor} strokeWidth={2} />
              </View>
            ) : null}
            <View className="min-w-0 flex-1">
              <HeaderText
                value={title}
                weight="semibold"
                className="text-lg tracking-tight text-foreground"
              />
              {description ? (
                <View className={title ? 'mt-0.5' : undefined}>
                  <HeaderText
                    value={description}
                    className="text-sm text-muted-foreground"
                  />
                </View>
              ) : null}
            </View>
          </View>
          {action ? (
            <View className="flex-row flex-wrap items-center justify-end gap-2">{action}</View>
          ) : null}
        </View>
      ) : null}
      <View
        className={cn(
          !flush && (hasHeader ? 'px-5 pb-5' : 'p-5'),
          contentClassName
        )}
      >
        {children}
      </View>
    </View>
  );
}

export type { SectionCardProps };
