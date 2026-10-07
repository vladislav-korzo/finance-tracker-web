import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Heading, Text } from '@components/ui/text';
import { cn } from '@/shared/lib/utils';

type ScreenHeaderProps = {
  title: string;
  /** Optional one-line subtitle under the title. */
  subtitle?: string;
  /** Trailing control(s) — e.g. an icon button. Right-aligned, vertically centered. */
  action?: ReactNode;
  className?: string;
};

/**
 * The one screen header used across every tab/section so the app reads as a
 * single app: a large left-aligned title, an optional muted subtitle, and an
 * optional trailing action. Sits inside each screen's `SafeAreaView edges={['top']}`
 * (it does not add safe-area padding itself).
 */
export function ScreenHeader({ title, subtitle, action, className }: ScreenHeaderProps) {
  return (
    <View
      className={cn('flex-row items-center justify-between gap-3 px-5 pb-4 pt-2', className)}
    >
      <View className="min-w-0 flex-1">
        <Heading className="text-[28px] leading-tight text-foreground" numberOfLines={1}>
          {title}
        </Heading>
        {subtitle ? (
          <Text className="mt-0.5 text-[13px] text-muted-foreground" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? <View className="shrink-0">{action}</View> : null}
    </View>
  );
}

export type { ScreenHeaderProps };
