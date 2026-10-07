import * as React from 'react';
import { type Text as RNText } from 'react-native';

import { Text, type TextProps } from '@components/ui/text';
import { cn } from '@/shared/lib/utils';

/**
 * Native counterpart to the web `Label` (src/components/ui/label.tsx).
 *
 * The web version is a Radix <label> bound to an input via `htmlFor`. There is
 * no `htmlFor` / focus-association on native, so this is simply a medium-weight,
 * small caption built on the weight-aware <Text> primitive. Compose it above an
 * <Input> inside a <FormItem> (or pass it through <FormLabel>) for form fields.
 *
 * Matches the web's `text-sm font-medium` look. Colour is left to `className`
 * (default `text-foreground`) so callers — e.g. <FormLabel> when a field has an
 * error — can override it.
 */
export interface LabelProps extends Omit<TextProps, 'weight'> {
  /** Override the default `'medium'` weight if needed. */
  weight?: TextProps['weight'];
}

export const Label = React.forwardRef<RNText, LabelProps>(
  ({ className, weight = 'medium', ...props }, ref) => {
    return (
      <Text
        ref={ref}
        weight={weight}
        className={cn('text-sm text-foreground', className)}
        {...props}
      />
    );
  },
);

Label.displayName = 'Label';
