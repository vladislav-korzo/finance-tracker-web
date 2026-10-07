import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useUnstableNativeVariable } from 'nativewind';

import { Text } from '@components/ui/text';
import { cn } from '@/shared/lib/utils';

/**
 * Native counterpart to the web `Button` (src/components/ui/button.tsx).
 *
 * Mirrors the web CVA API — same `variant` / `size` names and defaults — but is
 * implemented with a native <Pressable>. Styling uses semantic NativeWind tokens
 * so light/dark mode works automatically; web-only affordances (box-shadow glow,
 * brightness, hover) are dropped in favour of a press opacity + scale.
 */

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

export type ButtonSize = 'sm' | 'default' | 'lg' | 'xl' | 'icon';

/** Container (Pressable) classes per variant. */
const variantContainer: Record<ButtonVariant, string> = {
  default: 'bg-primary',
  destructive: 'bg-destructive',
  outline: 'border border-input bg-transparent',
  secondary: 'bg-secondary',
  ghost: 'bg-transparent',
  link: 'bg-transparent',
};

/** Label (Text) classes per variant. */
const variantLabel: Record<ButtonVariant, string> = {
  default: 'text-primary-foreground',
  destructive: 'text-destructive-foreground',
  outline: 'text-foreground',
  secondary: 'text-secondary-foreground',
  ghost: 'text-foreground',
  link: 'text-primary underline',
};

/**
 * Container sizing per size. Heights track the web rhythm but are bumped to keep
 * a >=44px touch target on the primary sizes. `rounded-*` mirrors the web radii.
 */
const sizeContainer: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-md px-3',
  default: 'h-11 rounded-lg px-4',
  lg: 'h-12 rounded-lg px-7',
  xl: 'h-12 rounded-xl px-8',
  icon: 'h-11 w-11 rounded-lg',
};

/** Label text size per size. */
const sizeLabel: Record<ButtonSize, string> = {
  sm: 'text-xs',
  default: 'text-sm',
  lg: 'text-[15px]',
  xl: 'text-base',
  icon: 'text-sm',
};

/**
 * Which design token the spinner color reads from, per variant, so it stays
 * legible against the container fill. The raw HSL channels are resolved at
 * runtime (theme-reactive) — never hardcoded — see `useSpinnerColor`.
 */
const spinnerToken: Record<ButtonVariant, string> = {
  default: '--primary-foreground',
  destructive: '--destructive-foreground',
  outline: '--foreground',
  secondary: '--secondary-foreground',
  ghost: '--foreground',
  link: '--primary',
};

/**
 * Resolve a variant's spinner color from the active theme's CSS variables.
 * Returns an `hsl(...)` string on native; `undefined` on web (and as a fallback),
 * letting ActivityIndicator use its platform default.
 */
function useSpinnerColor(variant: ButtonVariant): string | undefined {
  const channels = useUnstableNativeVariable(spinnerToken[variant]);
  return typeof channels === 'string' ? `hsl(${channels})` : undefined;
}

export interface ButtonProps
  extends Omit<PressableProps, 'children' | 'style' | 'disabled'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks presses while true. */
  loading?: boolean;
  disabled?: boolean;
  /** Fire a light haptic impact on press. Defaults to true. */
  haptic?: boolean;
  /** Extra container classes (merged + de-duped via cn). */
  className?: string;
  /** Extra label classes — applied only when children is a string. */
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
  /** A string is rendered as a styled label; nodes render as-is (e.g. an icon). */
  children?: React.ReactNode;
}

export const Button = React.forwardRef<View, ButtonProps>(function Button(
  {
    variant = 'default',
    size = 'default',
    loading = false,
    disabled = false,
    haptic = true,
    className,
    textClassName,
    style,
    onPress,
    children,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const spinnerColor = useSpinnerColor(variant);

  const handlePress = React.useCallback(
    (event: GestureResponderEvent) => {
      if (isDisabled) return;
      if (haptic) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress?.(event);
    },
    [isDisabled, haptic, onPress],
  );

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={handlePress}
      style={style}
      className={cn(
        'flex-row items-center justify-center gap-2 select-none',
        sizeContainer[size],
        variantContainer[variant],
        isDisabled && 'opacity-50',
        className,
      )}
      {...rest}
    >
      {({ pressed }) => (
        <View
          className={cn(
            'flex-row items-center justify-center gap-2',
            pressed && !isDisabled && 'opacity-90',
          )}
          style={pressed && !isDisabled ? PRESSED_SCALE : undefined}
        >
          {loading ? (
            <ActivityIndicator size="small" color={spinnerColor} />
          ) : typeof children === 'string' ? (
            <Text
              weight="semibold"
              numberOfLines={1}
              className={cn(variantLabel[variant], sizeLabel[size], textClassName)}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      )}
    </Pressable>
  );
});

Button.displayName = 'Button';

/** Subtle press feedback mirroring the web's `active:scale-[0.97]`. */
const PRESSED_SCALE: ViewStyle = { transform: [{ scale: 0.97 }] };
