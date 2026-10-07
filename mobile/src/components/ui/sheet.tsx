import * as React from 'react';
import { ScrollView, View, type ViewProps } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  type BottomSheetModalProps,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@components/ui/text';
import { cn } from '@/shared/lib/utils';
import { isWebPlatform, WebSheetSurface } from './_sheetSurface';

/* ----------------------------------------------------------------------------
 * Sheet — native replacement for the web Radix <Dialog> when used as a
 * slide-up surface (forms, pickers, detail panels). Backed by @gorhom's
 * <BottomSheetModal>, presented/dismissed imperatively in response to the
 * controlled `open` prop. Assumes a <BottomSheetModalProvider> is mounted at
 * the app root.
 *
 * The sheet background is rendered transparent and the visual chrome
 * (bg-popover, rounded-t-3xl) lives on the inner View so NativeWind drives
 * dark mode automatically via semantic classes.
 * ------------------------------------------------------------------------- */

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Snap points, e.g. ['50%', '90%']. Omit to size dynamically to content. */
  snapPoints?: Array<string | number>;
  /** Convenience title rendered in a default header. Compose <SheetHeader> for more control. */
  title?: string;
  /** Convenience footer pinned to the bottom above the safe area. */
  footer?: React.ReactNode;
  /** Extra classes for the inner content surface. */
  className?: string;
  /** Forwarded to BottomSheetModal for advanced tuning (keyboard, callbacks, etc.). */
  modalProps?: Partial<BottomSheetModalProps>;
};

function Backdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      // Visible while the sheet is at any snap point, gone once fully closed.
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
      opacity={0.3}
      // Matches the web overlay tint (bg-foreground/30): foreground is near-black
      // in light mode and near-white in dark — but a dark scrim reads correctly in
      // both, so we use a fixed dark scrim and let opacity carry it.
      style={[props.style, { backgroundColor: '#0b1220' }]}
    />
  );
}

function Sheet({
  open,
  onOpenChange,
  children,
  snapPoints,
  title,
  footer,
  className,
  modalProps,
}: SheetProps) {
  const ref = React.useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  // Guards onDismiss → onOpenChange from firing while we are the ones closing it.
  const isControlledClose = React.useRef(false);

  // Drive present/dismiss from the controlled `open` prop.
  React.useEffect(() => {
    if (open) {
      ref.current?.present();
    } else {
      isControlledClose.current = true;
      ref.current?.dismiss();
    }
  }, [open]);

  const handleDismiss = React.useCallback(() => {
    // If the user dragged/back-pressed the sheet away (not a controlled close),
    // notify the parent so its `open` state stays in sync.
    if (!isControlledClose.current) {
      onOpenChange(false);
    }
    isControlledClose.current = false;
    modalProps?.onDismiss?.();
  }, [onOpenChange, modalProps]);

  // Web fallback: @gorhom's BottomSheetModal doesn't present on react-native-web,
  // so render the same content in a plain RN <Modal>. The native path below is
  // untouched. SheetContent swaps its scroller per-platform too.
  if (isWebPlatform) {
    return (
      <WebSheetSurface open={open} onClose={() => onOpenChange(false)}>
        <View
          className={cn('rounded-t-3xl bg-popover', className)}
          style={{ maxHeight: '88%', paddingBottom: insets.bottom }}
        >
          <Grabber />
          {title ? (
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
          ) : null}
          {children}
          {footer ? <SheetFooter>{footer}</SheetFooter> : null}
        </View>
      </WebSheetSurface>
    );
  }

  return (
    <BottomSheetModal
      ref={ref}
      // Dynamic sizing when no snapPoints are given; otherwise honor them.
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      enablePanDownToClose
      // Keyboard-aware: lift the sheet so inputs in forms stay visible.
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      topInset={insets.top}
      backdropComponent={Backdrop}
      // Transparent native background — chrome is on the inner View below.
      backgroundStyle={styles.transparent}
      handleComponent={Grabber}
      onDismiss={handleDismiss}
      {...modalProps}
    >
      <BottomSheetView
        className={cn(
          'rounded-t-3xl bg-popover',
          // Bottom safe-area padding so content/footer clear the home indicator.
          className
        )}
        style={{ paddingBottom: insets.bottom }}
      >
        {title ? (
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
        ) : null}
        {children}
        {footer ? <SheetFooter>{footer}</SheetFooter> : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

/* --- Grabber (handle) ----------------------------------------------------- */

function Grabber() {
  return (
    <View className="items-center pb-2 pt-3">
      <View className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
    </View>
  );
}

/* --- Composable helpers --------------------------------------------------- */

function SheetHeader({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('gap-1.5 px-5 pb-2 pt-1', className)} {...props} />;
}
SheetHeader.displayName = 'SheetHeader';

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof Text>) {
  return (
    <Text
      weight="semibold"
      className={cn('text-lg leading-none text-popover-foreground', className)}
      {...props}
    />
  );
}
SheetTitle.displayName = 'SheetTitle';

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text>) {
  return (
    <Text
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
SheetDescription.displayName = 'SheetDescription';

/**
 * Scrollable body. Uses BottomSheetScrollView so gestures cooperate with the
 * sheet's pan (drag-to-dismiss only engages at the top of the scroll).
 */
function SheetContent({
  className,
  contentContainerClassName,
  children,
  ...props
}: React.ComponentProps<typeof BottomSheetScrollView> & {
  contentContainerClassName?: string;
}) {
  // On web the surrounding sheet is a plain RN Modal (no @gorhom context), so use
  // a regular ScrollView; on native keep the gesture-aware BottomSheetScrollView.
  const Scroller: any = isWebPlatform ? ScrollView : BottomSheetScrollView;
  return (
    <Scroller
      className={cn('px-5', className)}
      contentContainerClassName={cn('gap-4 py-2', contentContainerClassName)}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </Scroller>
  );
}
SheetContent.displayName = 'SheetContent';

function SheetFooter({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn(
        'flex-row justify-end gap-2 border-t border-border px-5 pb-2 pt-4',
        className
      )}
      {...props}
    />
  );
}
SheetFooter.displayName = 'SheetFooter';

const styles = {
  transparent: { backgroundColor: 'transparent' as const },
};

export {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetContent,
  SheetFooter,
};
export type { SheetProps };
