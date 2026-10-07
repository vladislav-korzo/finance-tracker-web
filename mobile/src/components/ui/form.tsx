import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerFieldState,
  type ControllerProps,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type UseFormStateReturn,
} from 'react-hook-form';

import { Text, type TextProps } from '@components/ui/text';
import { Label, type LabelProps } from '@components/ui/label';
import { cn } from '@/shared/lib/utils';

/**
 * Native counterpart to the web `form.tsx` (shadcn react-hook-form wrappers).
 *
 * react-hook-form is platform-agnostic (no DOM), so the integration mirrors the
 * web export surface — Form / FormField / FormItem / FormLabel / FormControl /
 * FormMessage / FormDescription / useFormField — and screen forms read almost
 * identically. The DOM/ARIA/Radix-Slot bits are replaced with RN-native pieces:
 *
 * - Layout uses <View> (web `space-y-2` -> `gap-2`).
 * - There is no `htmlFor`/focus association; <FormLabel> is just a styled label.
 * - <FormControl> has no Radix Slot. Instead it clones its single child field
 *   component (e.g. <Input>) and injects the RHF field handlers as RN props:
 *   `value`, `onChangeText`, `onBlur`, and `editable` (when the field is
 *   disabled). So screens can write `<FormControl><Input .../></FormControl>`
 *   without manually spreading `field`.
 *
 * To make `field`/`fieldState` available to <FormControl> without registering
 * the field twice, <FormField> renders the RHF <Controller> and publishes the
 * live `field`/`fieldState` to descendants via context.
 */

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldState: ControllerFieldState;
  formState: UseFormStateReturn<TFieldValues>;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

/**
 * Wraps RHF <Controller>. Unlike the web version (which only stored the field
 * name and let callers spread `field`), this also publishes the resolved
 * `field`/`fieldState` so <FormControl> can wire RN handlers automatically.
 *
 * `render` is optional: when omitted, children are rendered as-is (the common
 * `<FormField name="x"><FormItem>…</FormItem></FormField>` shape). Provide
 * `render` if you need the raw `field` for a fully custom control.
 */
type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<ControllerProps<TFieldValues, TName>, 'render'> & {
  render?: ControllerProps<TFieldValues, TName>['render'];
  children?: React.ReactNode;
};

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  render,
  children,
  ...props
}: FormFieldProps<TFieldValues, TName>) => {
  return (
    <Controller
      {...props}
      render={(renderProps) => {
        const { field, fieldState, formState } = renderProps;
        return (
          <FormFieldContext.Provider
            value={
              {
                name: props.name,
                field,
                fieldState,
                formState,
              } as FormFieldContextValue
            }
          >
            {render ? render(renderProps) : children}
          </FormFieldContext.Provider>
        );
      }}
    />
  );
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

/**
 * Reads the surrounding field + item context. Returns the field name, derived
 * ids (kept for parity with web / accessibility wiring), and the spread
 * `fieldState` (`error`, `invalid`, `isTouched`, …).
 */
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  if (!itemContext) {
    throw new Error('useFormField should be used within <FormItem>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    field: fieldContext.field,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldContext.fieldState,
  };
};

const FormItem = React.forwardRef<View, ViewProps>(
  ({ className, ...props }, ref) => {
    const id = React.useId();

    return (
      <FormItemContext.Provider value={{ id }}>
        <View ref={ref} className={cn('gap-2', className)} {...props} />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = 'FormItem';

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  LabelProps
>(({ className, ...props }, ref) => {
  const { error } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(error ? 'text-destructive' : undefined, className)}
      {...props}
    />
  );
});
FormLabel.displayName = 'FormLabel';

/**
 * Native analogue of the web Slot-based FormControl. Clones its single child
 * (an Input or other controlled field) and injects the RHF field handlers:
 *   value        <- field.value (coerced to string for TextInput)
 *   onChangeText <- field.onChange
 *   onBlur       <- field.onBlur (preserving any onBlur already on the child)
 *   editable     <- false when the field is disabled
 *
 * If a prop is already set on the child it is preserved (the child wins), so
 * callers can still override individual handlers when needed.
 */
const FormControl = React.forwardRef<
  React.ElementRef<typeof View>,
  { children: React.ReactElement }
>(({ children }, _ref) => {
  const { field } = useFormField();

  if (!React.isValidElement(children)) return children;

  const childProps = children.props as Record<string, unknown>;

  const injected: Record<string, unknown> = {
    value:
      childProps.value !== undefined
        ? childProps.value
        : field.value == null
          ? ''
          : String(field.value),
    onChangeText:
      childProps.onChangeText !== undefined ? childProps.onChangeText : field.onChange,
    onBlur: (...args: unknown[]) => {
      (childProps.onBlur as ((...a: unknown[]) => void) | undefined)?.(...args);
      field.onBlur();
    },
  };

  if (field.disabled !== undefined && childProps.editable === undefined) {
    injected.editable = !field.disabled;
  }

  return React.cloneElement(children, injected);
});
FormControl.displayName = 'FormControl';

const FormDescription = React.forwardRef<
  React.ElementRef<typeof Text>,
  TextProps
>(({ className, ...props }, ref) => {
  return (
    <Text
      ref={ref}
      className={cn('text-[13px] text-muted-foreground', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

const FormMessage = React.forwardRef<
  React.ElementRef<typeof Text>,
  TextProps
>(({ className, children, ...props }, ref) => {
  const { error } = useFormField();
  const body = error ? String(error?.message ?? '') : children;

  if (!body) {
    return null;
  }

  return (
    <Text
      ref={ref}
      weight="medium"
      className={cn('text-[13px] text-destructive', className)}
      {...props}
    >
      {body}
    </Text>
  );
});
FormMessage.displayName = 'FormMessage';

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
