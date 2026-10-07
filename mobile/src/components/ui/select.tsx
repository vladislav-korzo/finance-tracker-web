import * as React from 'react';
import { Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { cn } from '@/shared/lib/utils';
import { Text } from '@components/ui/text';
import { isWebPlatform, WebSheetSurface } from './_sheetSurface';

/* ============================================================================
 * Native <Select> — replaces the web shadcn/Radix select (RN has no <select>).
 *
 * A Pressable trigger shows the current value (or placeholder) + a chevron, and
 * opens a @gorhom/bottom-sheet `BottomSheetModal` listing the options. Tapping
 * an option fires `onValueChange` and closes the sheet. The selected row is
 * highlighted (bg-accent) with a primary-colored check.
 *
 * Two ways to use it — prefer (a):
 *
 *   (a) PRIMARY — options-array API (screens use this):
 *       <Select
 *         value={currency}
 *         onValueChange={setCurrency}
 *         placeholder="Select currency"
 *         options={[
 *           { label: 'US Dollar', value: 'USD', icon: DollarSign },
 *           { label: 'Euro',      value: 'EUR' },
 *         ]}
 *       />
 *
 *   (b) shadcn-style composition (mirrors the web export names):
 *       <Select value={v} onValueChange={setV}>
 *         <SelectTrigger>
 *           <SelectValue placeholder="Pick one" />
 *         </SelectTrigger>
 *         <SelectContent title="Choose">
 *           <SelectItem value="a" label="Apple" />
 *           <SelectItem value="b" label="Banana" icon={Banana} />
 *         </SelectContent>
 *       </Select>
 *
 * Composition note: `SelectItem`s passed as `SelectContent` children are read
 * (their props become the options list) rather than rendered as-is, so the
 * native sheet owns the actual list rendering. Pass either `options` OR
 * `SelectContent`/`SelectItem` children — `options` wins if both are present.
 * ========================================================================== */

export type SelectOption = {
  /** Visible row label. */
  label: string;
  /** Stable value passed to `onValueChange` and matched against `value`. */
  value: string;
  /** Optional leading icon (a lucide-react-native component). */
  icon?: LucideIcon;
  /** Disables the row (dimmed, not tappable). */
  disabled?: boolean;
};

type SelectContextValue = {
  value?: string;
  onValueChange?: (value: string) => void;
  /** Options registered via `SelectContent`/`SelectItem` composition. */
  registerItem: (item: SelectOption) => void;
  /** Title rendered at the top of the sheet (set via `SelectContent`). */
  setSheetTitle: (title?: string) => void;
  open: () => void;
  close: () => void;
  /** Placeholder propagated from `SelectValue` up to the trigger. */
  setPlaceholder: (placeholder?: string) => void;
  placeholder?: string;
  selectedLabel?: string;
  disabled?: boolean;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext(component: string): SelectContextValue {
  const ctx = React.useContext(SelectContext);
  if (!ctx) {
    throw new Error(`<${component}> must be used inside <Select>.`);
  }
  return ctx;
}

export type SelectProps = {
  /** Controlled selected value. */
  value?: string;
  /** Fired with the chosen option's value when a row is tapped. */
  onValueChange?: (value: string) => void;
  /**
   * PRIMARY API: the list of options to render. When provided, any
   * `SelectContent`/`SelectItem` children are ignored.
   */
  options?: SelectOption[];
  /** Placeholder shown on the trigger when nothing is selected. */
  placeholder?: string;
  /** Title shown at the top of the bottom sheet. */
  title?: string;
  /** Disables the trigger. */
  disabled?: boolean;
  /** Extra classes for the default trigger (options-array API only). */
  triggerClassName?: string;
  /**
   * shadcn-style composition children (`SelectTrigger`, `SelectContent`).
   * Optional — omit when using the `options` array.
   */
  children?: React.ReactNode;
};

export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  title,
  disabled,
  triggerClassName,
  children,
}: SelectProps) {
  const modalRef = React.useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  // Web fallback open-state (the @gorhom modal can't present on web).
  const [webOpen, setWebOpen] = React.useState(false);

  // Options registered through composition (SelectItem children). Kept in a ref
  // so registration during render doesn't loop; mirrored into state so the open
  // sheet re-renders with the full set.
  const composedRef = React.useRef<SelectOption[]>([]);
  const [composedItems, setComposedItems] = React.useState<SelectOption[]>([]);
  const [composedTitle, setComposedTitle] = React.useState<string | undefined>(
    undefined,
  );
  const [composedPlaceholder, setComposedPlaceholder] = React.useState<
    string | undefined
  >(undefined);

  // A fresh registration pass each render: reset the buffer, let SelectItems
  // re-register, then flush. Using the options array short-circuits this.
  const usingOptionsArray = options != null;
  if (!usingOptionsArray) {
    composedRef.current = [];
  }

  const registerItem = React.useCallback(
    (item: SelectOption) => {
      if (usingOptionsArray) return;
      composedRef.current.push(item);
    },
    [usingOptionsArray],
  );

  // After children render, sync the buffered composition items into state once
  // per change (cheap deep-ish compare via value list).
  const composedKey = composedRef.current.map((o) => o.value).join('|');
  React.useEffect(() => {
    if (usingOptionsArray) return;
    setComposedItems(composedRef.current.slice());
    // composedKey captures membership changes; refs are intentionally read here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composedKey, usingOptionsArray]);

  const resolvedOptions = usingOptionsArray ? options! : composedItems;
  const resolvedTitle = title ?? composedTitle;
  const resolvedPlaceholder = placeholder ?? composedPlaceholder;

  const selectedOption = React.useMemo(
    () => resolvedOptions.find((o) => o.value === value),
    [resolvedOptions, value],
  );

  const open = React.useCallback(() => {
    if (disabled) return;
    void Haptics.selectionAsync();
    if (isWebPlatform) {
      setWebOpen(true);
      return;
    }
    modalRef.current?.present();
  }, [disabled]);

  const close = React.useCallback(() => {
    if (isWebPlatform) {
      setWebOpen(false);
      return;
    }
    modalRef.current?.dismiss();
  }, []);

  const handleSelect = React.useCallback(
    (option: SelectOption) => {
      if (option.disabled) return;
      void Haptics.selectionAsync();
      onValueChange?.(option.value);
      if (isWebPlatform) {
        setWebOpen(false);
        return;
      }
      modalRef.current?.dismiss();
    },
    [onValueChange],
  );

  const ctx = React.useMemo<SelectContextValue>(
    () => ({
      value,
      onValueChange,
      registerItem,
      setSheetTitle: setComposedTitle,
      open,
      close,
      setPlaceholder: setComposedPlaceholder,
      placeholder: resolvedPlaceholder,
      selectedLabel: selectedOption?.label,
      disabled,
    }),
    [
      value,
      onValueChange,
      registerItem,
      open,
      close,
      resolvedPlaceholder,
      selectedOption?.label,
      disabled,
    ],
  );

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.4}
      />
    ),
    [],
  );

  // The sheet container itself is transparent; we render our own tokenized
  // `bg-popover` panel (rounded-t-2xl) inside so NativeWind drives the surface
  // colour and dark mode automatically. The default handle is hidden in favour
  // of the grabber inside that panel.
  const sheetBackgroundStyle = React.useMemo<ViewStyle>(
    () => ({ backgroundColor: 'transparent' }),
    [],
  );

  return (
    <SelectContext.Provider value={ctx}>
      {/* Trigger: either the composed <SelectTrigger> children, or the default. */}
      {children ?? (
        <SelectTriggerDefault
          className={triggerClassName}
          placeholder={resolvedPlaceholder}
          selectedLabel={selectedOption?.label}
          selectedIcon={selectedOption?.icon}
          disabled={disabled}
          onPress={open}
        />
      )}

      {isWebPlatform ? (
        <WebSheetSurface open={webOpen} onClose={() => setWebOpen(false)}>
          <View style={{ maxHeight: '70%' }}>
            <SelectSheetBody
              title={resolvedTitle}
              options={resolvedOptions}
              value={value}
              bottomInset={insets.bottom}
              onSelect={handleSelect}
            />
          </View>
        </WebSheetSurface>
      ) : (
        <BottomSheetModal
          ref={modalRef}
          enableDynamicSizing
          enablePanDownToClose
          backgroundStyle={sheetBackgroundStyle}
          // We render our own grabber inside the panel, so hide the default handle.
          handleComponent={null}
          backdropComponent={renderBackdrop}
        >
          <SelectSheetBody
            title={resolvedTitle}
            options={resolvedOptions}
            value={value}
            bottomInset={insets.bottom}
            onSelect={handleSelect}
          />
        </BottomSheetModal>
      )}
    </SelectContext.Provider>
  );
}

/* ----------------------------------------------------------------------------
 * Sheet body — the tokenized popover panel: grabber, optional title, scrollable
 * option rows. Lives inside BottomSheetModal so it participates in dynamic
 * sizing; the ScrollView caps growth so long lists scroll within the sheet.
 * -------------------------------------------------------------------------- */

function SelectSheetBody({
  title,
  options,
  value,
  bottomInset,
  onSelect,
}: {
  title?: string;
  options: SelectOption[];
  value?: string;
  bottomInset: number;
  onSelect: (option: SelectOption) => void;
}) {
  // Web uses a plain ScrollView (no @gorhom context inside the RN Modal fallback).
  const Scroller: any = isWebPlatform ? ScrollView : BottomSheetScrollView;
  return (
    <View className="overflow-hidden rounded-t-2xl bg-popover">
      {/* Grabber */}
      <View className="items-center pb-1 pt-2.5">
        <View className="h-1 w-9 rounded-full bg-muted-foreground/30" />
      </View>

      {title ? (
        <View className="border-b border-border/60 px-5 pb-3 pt-1.5">
          <Text
            weight="semibold"
            className="text-base text-popover-foreground"
          >
            {title}
          </Text>
        </View>
      ) : null}

      <Scroller
        bounces={false}
        showsVerticalScrollIndicator
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: Math.max(bottomInset, 12) + 8,
          paddingHorizontal: 10,
        }}
      >
        {options.length === 0 ? (
          <View className="px-3.5 py-6">
            <Text className="text-center text-sm text-muted-foreground">
              No options
            </Text>
          </View>
        ) : (
          options.map((option) => (
            <SelectRow
              key={option.value}
              option={option}
              selected={option.value === value}
              onPress={onSelect}
            />
          ))
        )}
      </Scroller>
    </View>
  );
}

function SelectRow({
  option,
  selected,
  onPress,
}: {
  option: SelectOption;
  selected: boolean;
  onPress: (option: SelectOption) => void;
}) {
  const Icon = option.icon;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: option.disabled }}
      disabled={option.disabled}
      onPress={() => onPress(option)}
      className={cn(
        // >= 44px touch target via min-h + py.
        'min-h-[44px] flex-row items-center gap-3 rounded-lg px-3 py-2.5',
        'active:bg-accent/60',
        selected && 'bg-accent',
        option.disabled && 'opacity-40',
      )}
    >
      {Icon ? (
        <Icon
          size={18}
          className={cn(
            'text-muted-foreground',
            selected && 'text-accent-foreground',
          )}
        />
      ) : null}
      <Text
        weight={selected ? 'semibold' : 'regular'}
        numberOfLines={1}
        className={cn(
          'flex-1 text-[15px] text-popover-foreground',
          selected && 'text-accent-foreground',
        )}
      >
        {option.label}
      </Text>
      {selected ? <Check size={18} className="text-primary" /> : null}
    </Pressable>
  );
}

/* ----------------------------------------------------------------------------
 * Default trigger (options-array API). Visual intent ported from the web
 * SelectTrigger: h-11, rounded-lg, border-input, bg-background, chevron.
 * -------------------------------------------------------------------------- */

function SelectTriggerDefault({
  className,
  placeholder,
  selectedLabel,
  selectedIcon,
  disabled,
  onPress,
}: {
  className?: string;
  placeholder?: string;
  selectedLabel?: string;
  selectedIcon?: LucideIcon;
  disabled?: boolean;
  onPress: () => void;
}) {
  const Icon = selectedIcon;
  const hasValue = selectedLabel != null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'h-11 flex-row items-center justify-between gap-2 rounded-lg border border-input bg-background px-3.5',
        'active:border-muted-foreground/40',
        disabled && 'opacity-50',
        className,
      )}
    >
      <View className="flex-1 flex-row items-center gap-2.5">
        {hasValue && Icon ? (
          <Icon size={18} className="text-foreground" />
        ) : null}
        <Text
          weight={hasValue ? 'medium' : 'regular'}
          numberOfLines={1}
          className={cn(
            'flex-1 text-sm',
            hasValue ? 'text-foreground' : 'text-muted-foreground/70',
          )}
        >
          {hasValue ? selectedLabel : (placeholder ?? 'Select…')}
        </Text>
      </View>
      <ChevronDown size={16} className="text-muted-foreground" />
    </Pressable>
  );
}

/* ----------------------------------------------------------------------------
 * shadcn-style composition layer (optional). Mirrors web export names.
 * -------------------------------------------------------------------------- */

export type SelectTriggerProps = {
  className?: string;
  children?: React.ReactNode;
};

/**
 * Custom trigger surface for the composition API. Renders its children (usually
 * a <SelectValue />) and opens the sheet on press. Use the default trigger
 * (options-array API) unless you need a bespoke trigger layout.
 */
export function SelectTrigger({ className, children }: SelectTriggerProps) {
  const ctx = useSelectContext('SelectTrigger');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: ctx.disabled }}
      disabled={ctx.disabled}
      onPress={ctx.open}
      className={cn(
        'h-11 flex-row items-center justify-between gap-2 rounded-lg border border-input bg-background px-3.5',
        'active:border-muted-foreground/40',
        ctx.disabled && 'opacity-50',
        className,
      )}
    >
      <View className="flex-1 flex-row items-center">{children}</View>
      <ChevronDown size={16} className="text-muted-foreground" />
    </Pressable>
  );
}

export type SelectValueProps = {
  placeholder?: string;
  className?: string;
};

/**
 * Shows the selected option's label inside a <SelectTrigger>, or the placeholder
 * when nothing is selected. Registers its placeholder so the default trigger can
 * use it too.
 */
export function SelectValue({ placeholder, className }: SelectValueProps) {
  const ctx = useSelectContext('SelectValue');
  const { setPlaceholder } = ctx;
  React.useEffect(() => {
    setPlaceholder(placeholder);
  }, [placeholder, setPlaceholder]);

  const hasValue = ctx.selectedLabel != null;
  return (
    <Text
      weight={hasValue ? 'medium' : 'regular'}
      numberOfLines={1}
      className={cn(
        'flex-1 text-sm',
        hasValue ? 'text-foreground' : 'text-muted-foreground/70',
        className,
      )}
    >
      {hasValue ? ctx.selectedLabel : (placeholder ?? 'Select…')}
    </Text>
  );
}

export type SelectContentProps = {
  /** Title rendered at the top of the sheet. */
  title?: string;
  children?: React.ReactNode;
  /** Accepted for API parity with the web component; unused natively. */
  className?: string;
};

/**
 * Declarative container for <SelectItem>s. It does not render a popover itself —
 * the native sheet (owned by <Select>) does. Its children are read to build the
 * options list, and its `title` sets the sheet header.
 */
export function SelectContent({ title, children }: SelectContentProps) {
  const ctx = useSelectContext('SelectContent');
  const { setSheetTitle } = ctx;
  React.useEffect(() => {
    setSheetTitle(title);
  }, [title, setSheetTitle]);
  // Children register themselves; nothing is rendered inline.
  return <>{children}</>;
}

export type SelectItemProps = {
  /** Stable value for this option. */
  value: string;
  /** Visible label. Falls back to string children if omitted. */
  label?: string;
  /** Optional leading icon. */
  icon?: LucideIcon;
  /** Disables the option. */
  disabled?: boolean;
  /** Used as the label when `label` is not provided (must be a string). */
  children?: string;
};

/**
 * Declares one option for the composition API. Renders nothing — it registers
 * its props with the parent <Select>, which renders the actual sheet row.
 */
export function SelectItem({
  value,
  label,
  icon,
  disabled,
  children,
}: SelectItemProps) {
  const ctx = useSelectContext('SelectItem');
  const resolvedLabel = label ?? children ?? value;
  ctx.registerItem({ value, label: resolvedLabel, icon, disabled });
  return null;
}

/* Re-export the option type under a web-ish alias for convenience. */
export type { SelectOption as SelectItemData };
