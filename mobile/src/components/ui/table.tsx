import * as React from 'react';
import {
  ScrollView,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { Text } from '@components/ui/text';
import { cn } from '@/shared/lib/utils';

/**
 * Lightweight, View-based table primitives that mirror the web `table.tsx`
 * component names (Table / TableHeader / TableBody / TableFooter / TableRow /
 * TableHead / TableCell / TableCaption) so dense, structured data — e.g. the
 * Credits payment schedule — can reuse the same composition shape.
 *
 * There is no real <table> on native: layout is plain flexbox. Cells are sized
 * by the caller (give each TableHead / TableCell a width via `style` or a
 * NativeWind `w-*` / `flex-*` class). Header and body columns line up only when
 * the caller applies matching widths to both.
 *
 * For wide tables, set `scrollable` on <Table> to wrap rows in a horizontal
 * ScrollView. Prefer card/list layouts on mobile; reach for this when a true
 * grid (like a month-by-month schedule) is genuinely the clearest layout.
 */

type TableProps = ViewProps & {
  /**
   * Wrap the table in a horizontal ScrollView so wide content (many columns)
   * can scroll sideways instead of squashing. Cells then need explicit widths.
   */
  scrollable?: boolean;
  /** Props forwarded to the wrapping ScrollView when `scrollable` is set. */
  scrollViewProps?: ScrollViewProps;
};

const Table = React.forwardRef<View, TableProps>(
  ({ className, scrollable = false, scrollViewProps, children, ...props }, ref) => {
    const table = (
      <View ref={ref} className={cn('w-full', className)} {...props}>
        {children}
      </View>
    );

    if (!scrollable) return table;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        {...scrollViewProps}
        contentContainerStyle={[
          { flexGrow: 1 },
          scrollViewProps?.contentContainerStyle,
        ]}
      >
        {table}
      </ScrollView>
    );
  }
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<View, ViewProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn(className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<View, ViewProps>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn(className)} {...props} />
  )
);
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<View, ViewProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('border-t border-border bg-muted/50', className)}
      {...props}
    />
  )
);
TableFooter.displayName = 'TableFooter';

type TableRowProps = ViewProps & {
  /** Mirrors the web `data-[state=selected]` styling. */
  selected?: boolean;
};

const TableRow = React.forwardRef<View, TableRowProps>(
  ({ className, selected = false, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        'flex-row border-b border-border',
        selected && 'bg-muted',
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

/**
 * A cell renders a styled <Text> when given a plain string/number child, so the
 * common case (text in a cell) "just works". When given element children
 * (badges, icons, custom layout) it renders them inside a wrapper View so the
 * caller controls nesting and we never nest <Text> inside <Text>.
 */
function isTextChild(children: React.ReactNode): children is string | number {
  return typeof children === 'string' || typeof children === 'number';
}

type TableCellBaseProps = ViewProps & {
  /** Extra classes applied to the inner <Text> when children are text. */
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
};

const TableHead = React.forwardRef<View, TableCellBaseProps>(
  ({ className, textClassName, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('justify-center px-2 py-2.5', className)}
      {...props}
    >
      {isTextChild(children) ? (
        <Text
          weight="medium"
          className={cn('text-xs text-muted-foreground', textClassName)}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  )
);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<View, TableCellBaseProps>(
  ({ className, textClassName, children, ...props }, ref) => (
    <View ref={ref} className={cn('justify-center p-2', className)} {...props}>
      {isTextChild(children) ? (
        <Text className={cn('text-sm text-foreground', textClassName)}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  )
);
TableCell.displayName = 'TableCell';

type TableCaptionProps = ViewProps & {
  textClassName?: string;
};

const TableCaption = React.forwardRef<View, TableCaptionProps>(
  ({ className, textClassName, children, ...props }, ref) => (
    <View ref={ref} className={cn('mt-4', className)} {...props}>
      {isTextChild(children) ? (
        <Text className={cn('text-xs text-muted-foreground', textClassName)}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  )
);
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
