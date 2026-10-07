import * as React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/shared/lib/utils';

/**
 * Kumbh Sans font weights. React Native loads each weight as a *distinct font
 * family* (custom fonts cannot be synthesized via `fontWeight`), so weight is
 * mapped to the exact family name registered in `app/_layout.tsx`.
 */
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

// Inter — full Cyrillic + tabular figures. Each weight is a distinct family
// (RN can't synthesize custom-font weights). Loaded in app/_layout.tsx.
const WEIGHT_TO_FAMILY: Record<TextWeight, string> = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

export interface TextProps extends RNTextProps {
  /** NativeWind utility classes. Colour/size/etc. are driven from here. */
  className?: string;
  /**
   * Maps to the matching Kumbh Sans family. Default `'regular'`.
   * Applied via `fontFamily` (not `fontWeight`) so custom faces render.
   */
  weight?: TextWeight;
}

/**
 * Weight-aware Text primitive. Use for ALL text in the app so Kumbh Sans
 * renders at the correct weight. Colour is intentionally not forced — let the
 * `className` (or parent) decide.
 */
export const Text = React.forwardRef<RNText, TextProps>(
  ({ className, weight = 'regular', style, ...props }, ref) => {
    return (
      <RNText
        ref={ref}
        className={className}
        // `fontFamily` first so it overrides any family coming from `font-sans`
        // in className; an explicit caller `style.fontFamily` still wins (later
        // in the array).
        style={[{ fontFamily: WEIGHT_TO_FAMILY[weight] }, style]}
        {...props}
      />
    );
  },
);

Text.displayName = 'Text';

export interface HeadingProps extends Omit<TextProps, 'weight'> {
  /** Override the default `'bold'` weight if a lighter heading is needed. */
  weight?: TextWeight;
}

/**
 * Convenience wrapper: bold weight + a larger default size. Any `className`
 * passed in is merged after the default size, so callers can override it
 * (e.g. `text-3xl`).
 */
export const Heading = React.forwardRef<RNText, HeadingProps>(
  ({ className, weight = 'bold', ...props }, ref) => {
    return <Text ref={ref} weight={weight} className={cn('text-2xl', className)} {...props} />;
  },
);

Heading.displayName = 'Heading';
