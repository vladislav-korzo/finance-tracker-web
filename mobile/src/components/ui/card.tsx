import * as React from 'react';
import { View, type ViewProps } from 'react-native';

import { Text } from '@components/ui/text';
import { useToken } from '@/shared/theme/tokens';
import { cn } from '@/shared/lib/utils';

/**
 * Card surface — native port of the web `card.tsx`.
 *
 * Mirrors the shadcn export names (Card / CardHeader / CardTitle /
 * CardDescription / CardContent / CardFooter) so screens read the same, but the
 * web `shadow-card` utility doesn't exist in the mobile Tailwind config, so the
 * soft elevation is applied as a native RN shadow tinted by the `--shadow-color`
 * token (theme-aware).
 */

type CardProps = ViewProps & {
  className?: string;
  /** Drop the elevation shadow (e.g. when nested inside another surface). */
  flat?: boolean;
};

const Card = React.forwardRef<View, CardProps>(
  ({ className, flat, style, ...props }, ref) => {
    const shadowColor = useToken('shadow-color');
    return (
      <View
        ref={ref}
        className={cn(
          'rounded-2xl border border-border bg-card',
          className
        )}
        style={[
          flat
            ? null
            : {
                shadowColor,
                shadowOpacity: 0.1,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                elevation: 3,
              },
          style,
        ]}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn('gap-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

type CardTextProps = React.ComponentProps<typeof Text>;

const CardTitle = React.forwardRef<React.ElementRef<typeof Text>, CardTextProps>(
  ({ className, weight = 'semibold', ...props }, ref) => (
    <Text
      ref={ref}
      weight={weight}
      className={cn('text-base leading-tight tracking-tight text-card-foreground', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<React.ElementRef<typeof Text>, CardTextProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('flex-row items-center p-6 pt-0', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
export type { CardProps };
