import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@components/ui/text';
import { useToken } from '@/shared/theme/tokens';
import { cn } from '@/shared/lib/utils';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Compact variant for inside cards/charts. */
  size?: 'default' | 'sm';
};

/** Friendly placeholder for empty lists, charts and screens. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = 'default',
}: EmptyStateProps) {
  const iconColor = useToken('primary');
  const sm = size === 'sm';

  // Spring-pop the icon on mount (mirrors the web framer-motion entrance).
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1, { stiffness: 300, damping: 20 });
    opacity.value = withTiming(1, { duration: 220 });
  }, [opacity, scale]);
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      className={cn(
        'items-center justify-center rounded-xl border border-dashed border-border bg-muted/30',
        sm ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-12',
        className
      )}
    >
      <Animated.View
        style={iconStyle}
        className={cn(
          'items-center justify-center rounded-2xl bg-primary/[0.12]',
          sm ? 'size-11' : 'size-14'
        )}
      >
        <Icon size={sm ? 20 : 28} color={iconColor} strokeWidth={2} />
      </Animated.View>
      <View className="items-center">
        <Text
          weight="semibold"
          className={cn('text-center text-foreground', sm ? 'text-sm' : 'text-base')}
        >
          {title}
        </Text>
        {description ? (
          <Text className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            {description}
          </Text>
        ) : null}
      </View>
      {action ? <View className="mt-1">{action}</View> : null}
    </View>
  );
}

export type { EmptyStateProps };
