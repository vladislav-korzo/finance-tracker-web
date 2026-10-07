import * as React from 'react';
import {
  Modal as RNModal,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  type ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@components/ui/text';
import { cn } from '@/shared/lib/utils';

/* ----------------------------------------------------------------------------
 * Modal — small, CENTERED overlay for confirmations / alerts. Native
 * replacement for the centered Radix <Dialog>. Built on RN's <Modal>
 * (transparent + fade) with a backdrop that dismisses on touch.
 *
 * For slide-up forms and detail panels use <Sheet> (sheet.tsx) instead.
 * ConfirmDialog (built later) composes this.
 * ------------------------------------------------------------------------- */

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Set false to disable tap-on-backdrop dismissal (e.g. blocking confirms). */
  dismissOnBackdrop?: boolean;
  /** Extra classes for the centered card surface. */
  className?: string;
};

function Modal({
  open,
  onOpenChange,
  children,
  dismissOnBackdrop = true,
  className,
}: ModalProps) {
  const insets = useSafeAreaInsets();

  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);

  return (
    <RNModal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      // Android hardware back button.
      onRequestClose={close}
    >
      {/* Backdrop — mirrors the web overlay tint (bg-foreground/30). */}
      <Pressable
        className="flex-1 items-center justify-center bg-foreground/30 px-6"
        onPress={dismissOnBackdrop ? close : undefined}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full items-center"
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          {/* Card — stop propagation so taps inside don't dismiss. */}
          <Pressable
            // A no-op onPress swallows the press so it doesn't bubble to the backdrop.
            onPress={() => {}}
            className={cn(
              'w-full max-w-md gap-4 rounded-2xl border border-border bg-card p-6 shadow-lg',
              className
            )}
          >
            {children}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </RNModal>
  );
}

/* --- Composable helpers (mirror Sheet/Dialog naming) ---------------------- */

function ModalHeader({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('gap-1.5', className)} {...props} />;
}
ModalHeader.displayName = 'ModalHeader';

function ModalTitle({
  className,
  ...props
}: React.ComponentProps<typeof Text>) {
  return (
    <Text
      weight="semibold"
      className={cn('text-lg leading-none text-card-foreground', className)}
      {...props}
    />
  );
}
ModalTitle.displayName = 'ModalTitle';

function ModalDescription({
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
ModalDescription.displayName = 'ModalDescription';

function ModalFooter({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn('flex-row justify-end gap-2 pt-2', className)}
      {...props}
    />
  );
}
ModalFooter.displayName = 'ModalFooter';

export { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter };
export type { ModalProps };
