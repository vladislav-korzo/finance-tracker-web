import * as React from 'react';
import {
  Pressable,
  View,
  type LayoutChangeEvent,
  type PressableProps,
  type ViewProps,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@components/ui/text';
import { cn } from '@/shared/lib/utils';

/**
 * Native counterpart to the web `Tabs` (src/components/ui/tabs.tsx), built as a
 * segmented control.
 *
 * Mirrors the Radix-flavoured web API — `Tabs` / `TabsList` / `TabsTrigger` /
 * `TabsContent`, with `value` + `onValueChange` (controlled) and an optional
 * `defaultValue` (uncontrolled) — but is implemented natively with
 * <Pressable>/<View>. The active pill slides between triggers on the UI thread
 * via reanimated (disabled under "reduce motion", where it snaps instead).
 *
 * Visuals track the web: list is `bg-muted rounded-xl p-1`; the active trigger
 * sits on a `bg-card` pill with a soft shadow and `text-foreground`, inactive
 * triggers are `text-muted-foreground`. Heavily used for income/expense toggles.
 */

interface TabsContextValue {
  value: string | undefined;
  setValue: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error(`<${component}> must be used within <Tabs>`);
  }
  return ctx;
}

export interface TabsProps extends Omit<ViewProps, 'children'> {
  /** Controlled active value. Pair with `onValueChange`. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  /** Fires with the next value on trigger press. */
  onValueChange?: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export const Tabs = React.forwardRef<View, TabsProps>(function Tabs(
  { value: valueProp, defaultValue, onValueChange, className, children, ...props },
  ref,
) {
  const isControlled = valueProp !== undefined;
  const [uncontrolled, setUncontrolled] = React.useState<string | undefined>(
    defaultValue,
  );
  const value = isControlled ? valueProp : uncontrolled;

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolled(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const ctx = React.useMemo<TabsContextValue>(
    () => ({ value, setValue }),
    [value, setValue],
  );

  return (
    <TabsContext.Provider value={ctx}>
      <View ref={ref} className={className} {...props}>
        {children}
      </View>
    </TabsContext.Provider>
  );
});

Tabs.displayName = 'Tabs';

/* -------------------------------------------------------------------------- */
/* TabsList — row track + the sliding active pill                              */
/* -------------------------------------------------------------------------- */

interface TabLayout {
  x: number;
  width: number;
}

interface TabsListContextValue {
  /** A trigger reports its measured frame within the list. */
  register: (value: string, layout: TabLayout) => void;
}

const TabsListContext = React.createContext<TabsListContextValue | null>(null);

/** Matches the web pill transition feel. */
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const DURATION = 250;

export interface TabsListProps extends Omit<ViewProps, 'children'> {
  className?: string;
  children?: React.ReactNode;
}

export const TabsList = React.forwardRef<View, TabsListProps>(function TabsList(
  { className, children, ...props },
  ref,
) {
  const { value } = useTabsContext('TabsList');
  const reduceMotion = useReducedMotion();

  // Measured frames per trigger value, used to position the sliding pill.
  const [layouts, setLayouts] = React.useState<Record<string, TabLayout>>({});

  const register = React.useCallback((tabValue: string, layout: TabLayout) => {
    setLayouts((prev) => {
      const existing = prev[tabValue];
      if (existing && existing.x === layout.x && existing.width === layout.width) {
        return prev;
      }
      return { ...prev, [tabValue]: layout };
    });
  }, []);

  const listCtx = React.useMemo<TabsListContextValue>(
    () => ({ register }),
    [register],
  );

  const active = value != null ? layouts[value] : undefined;
  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);
  // Hidden until the active trigger has been measured (avoids a flash at 0,0).
  const ready = useSharedValue(0);

  React.useEffect(() => {
    if (!active) return;
    if (reduceMotion || ready.value === 0) {
      pillX.value = active.x;
      pillW.value = active.width;
    } else {
      pillX.value = withTiming(active.x, { duration: DURATION, easing: EASE });
      pillW.value = withTiming(active.width, { duration: DURATION, easing: EASE });
    }
    ready.value = 1;
  }, [active, reduceMotion, pillX, pillW, ready]);

  const pillStyle = useAnimatedStyle(() => ({
    width: pillW.value,
    transform: [{ translateX: pillX.value }],
    opacity: ready.value,
  }));

  return (
    <TabsListContext.Provider value={listCtx}>
      <View
        ref={ref}
        accessibilityRole="tablist"
        className={cn(
          'h-11 flex-row items-center rounded-xl bg-muted p-1',
          className,
        )}
        {...props}
      >
        {/* Sliding pill sits behind the triggers. */}
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', top: 4, bottom: 4, left: 0 },
            pillStyle,
          ]}
          // Shadow mirrors the web's `shadow-card` on the active trigger.
          className="rounded-lg bg-card shadow-sm"
        />
        {children}
      </View>
    </TabsListContext.Provider>
  );
});

TabsList.displayName = 'TabsList';

/* -------------------------------------------------------------------------- */
/* TabsTrigger                                                                 */
/* -------------------------------------------------------------------------- */

export interface TabsTriggerProps
  extends Omit<PressableProps, 'children' | 'disabled'> {
  /** Identifies this tab; matched against the active `value`. */
  value: string;
  disabled?: boolean;
  className?: string;
  /** Extra label classes — applied only when children is a string. */
  textClassName?: string;
  /** A string renders as a styled label; nodes render as-is. */
  children?: React.ReactNode;
}

export const TabsTrigger = React.forwardRef<View, TabsTriggerProps>(
  function TabsTrigger(
    { value, disabled = false, className, textClassName, children, onPress, ...props },
    ref,
  ) {
    const { value: activeValue, setValue } = useTabsContext('TabsTrigger');
    const listCtx = React.useContext(TabsListContext);
    const isActive = activeValue === value;

    const handleLayout = React.useCallback(
      (e: LayoutChangeEvent) => {
        const { x, width } = e.nativeEvent.layout;
        listCtx?.register(value, { x, width });
      },
      [listCtx, value],
    );

    return (
      <Pressable
        ref={ref}
        onLayout={handleLayout}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive, disabled }}
        disabled={disabled}
        onPress={(e) => {
          if (disabled) return;
          setValue(value);
          onPress?.(e);
        }}
        className={cn(
          'h-full flex-1 flex-row items-center justify-center rounded-lg px-3',
          disabled && 'opacity-50',
          className,
        )}
        {...props}
      >
        {typeof children === 'string' ? (
          <Text
            weight="semibold"
            numberOfLines={1}
            className={cn(
              'text-sm',
              isActive ? 'text-foreground' : 'text-muted-foreground',
              textClassName,
            )}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);

TabsTrigger.displayName = 'TabsTrigger';

/* -------------------------------------------------------------------------- */
/* TabsContent                                                                 */
/* -------------------------------------------------------------------------- */

export interface TabsContentProps extends ViewProps {
  /** Renders its children only when this matches the active `value`. */
  value: string;
  className?: string;
  children?: React.ReactNode;
}

export const TabsContent = React.forwardRef<View, TabsContentProps>(
  function TabsContent({ value, className, children, ...props }, ref) {
    const { value: activeValue } = useTabsContext('TabsContent');
    if (activeValue !== value) return null;
    return (
      <View
        ref={ref}
        accessibilityRole="none"
        className={cn('mt-2', className)}
        {...props}
      >
        {children}
      </View>
    );
  },
);

TabsContent.displayName = 'TabsContent';
