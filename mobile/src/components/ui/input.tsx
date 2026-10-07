import * as React from 'react';
import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useColorScheme } from 'nativewind';

import { cn } from '@/shared/lib/utils';

/** RN's focus/blur handler param types, derived so they track the RN version. */
type FocusHandler = NonNullable<TextInputProps['onFocus']>;
type BlurHandler = NonNullable<TextInputProps['onBlur']>;

/**
 * Native counterpart to the web `Input` (src/components/ui/input.tsx).
 *
 * Wraps RN <TextInput> with the same visual rhythm — h-11, rounded-lg, border,
 * card-coloured fill, comfortable horizontal padding — using semantic NativeWind
 * tokens so light/dark mode works automatically.
 *
 * Web affordances that don't translate to native are emulated:
 * - `focus-visible:ring`/`border-primary` -> a focus state that swaps the border
 *   to `border-primary` (RN has no box-shadow ring).
 * - `placeholder:text-muted-foreground/70` -> `placeholderTextColor` resolved at
 *   runtime from the `--muted-foreground` token (theme-aware), since RN needs a
 *   literal colour string here rather than a className.
 * - `disabled:opacity-50` -> applied via `editable={false}` + opacity.
 *
 * Optional `left` / `right` adornment slots (icons, affixes) render inside the
 * bordered container; when present the TextInput itself is borderless and the
 * container owns the border/height/focus styling.
 */

/** `--muted-foreground` HSL channels per theme (mirrors mobile/global.css). */
const MUTED_FOREGROUND_HSL: Record<'light' | 'dark', string> = {
  light: 'hsl(217 14% 46% / 0.7)',
  dark: 'hsl(217 16% 62% / 0.7)',
};

export interface InputProps extends TextInputProps {
  /** NativeWind classes merged onto the field (or the container when adorned). */
  className?: string;
  /** Element rendered before the text (e.g. a leading icon). */
  left?: React.ReactNode;
  /** Element rendered after the text (e.g. a trailing icon / unit). */
  right?: React.ReactNode;
  /** Container style escape hatch (rarely needed). */
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input = React.forwardRef<TextInput, InputProps>(function Input(
  {
    className,
    left,
    right,
    containerStyle,
    editable = true,
    onFocus,
    onBlur,
    placeholderTextColor,
    style,
    ...props
  },
  ref,
) {
  const { colorScheme } = useColorScheme();
  const [focused, setFocused] = React.useState(false);

  const resolvedPlaceholderColor =
    placeholderTextColor ?? MUTED_FOREGROUND_HSL[colorScheme === 'dark' ? 'dark' : 'light'];

  const handleFocus = React.useCallback<FocusHandler>(
    (e) => {
      setFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = React.useCallback<BlurHandler>(
    (e) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  const hasAdornment = left != null || right != null;

  // Border colour reacts to focus (focus ring emulation). `border-input` at rest,
  // `border-primary` when focused — disabled dims the whole control.
  const borderClass = focused ? 'border-primary' : 'border-input';
  const disabledClass = editable === false ? 'opacity-50' : undefined;

  const field = (
    <TextInput
      ref={ref}
      editable={editable}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholderTextColor={resolvedPlaceholderColor}
      style={style}
      className={cn(
        'text-base text-foreground',
        // When standalone, the TextInput owns the full bordered box. When inside
        // an adornment row, it is a borderless flex child and the row owns the box.
        hasAdornment
          ? 'flex-1 h-full bg-transparent'
          : cn('h-11 rounded-lg border bg-card px-3.5', borderClass, disabledClass),
        className,
      )}
      {...props}
    />
  );

  if (!hasAdornment) return field;

  return (
    <View
      style={containerStyle}
      className={cn(
        'h-11 flex-row items-center gap-2 rounded-lg border bg-card px-3.5',
        borderClass,
        disabledClass,
        className,
      )}
    >
      {left != null ? <View className="shrink-0">{left}</View> : null}
      {field}
      {right != null ? <View className="shrink-0">{right}</View> : null}
    </View>
  );
});

Input.displayName = 'Input';
