import { AlertTriangle } from 'lucide-react-native';
import { View } from 'react-native';

import { useConfirmStore } from '@components/ConfirmDialog/confirmStore';
import { Button } from '@components/ui/button';
import {
  Modal,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@components/ui/modal';
import { useToken } from '@/shared/theme/tokens';

/**
 * Global, promise-based confirmation dialog. Mounted once at the app root.
 *
 * Native counterpart to the web `ConfirmDialog` (src/components/ConfirmDialog).
 * Same store-driven, imperative `confirm()` API — built on the native centered
 * <Modal> + <Button> primitives. Backdrop tap resolves the promise as `false`.
 */
export function ConfirmDialog() {
  const open = useConfirmStore((s) => s.open);
  const options = useConfirmStore((s) => s.options);
  const resolveWith = useConfirmStore((s) => s.resolveWith);
  const destructive = options?.destructive ?? true;

  // Lucide strokes can't be coloured via NativeWind `text-*` classes, so the
  // glyph colour is resolved from the active theme's tokens (mirrors EmptyState).
  const iconColor = useToken(destructive ? 'destructive' : 'primary');

  return (
    <Modal
      open={open}
      onOpenChange={(next) => (next ? null : resolveWith(false))}
      className="max-w-[420px] gap-4"
    >
      <ModalHeader>
        <View
          className={
            destructive
              ? 'mb-1 size-11 items-center justify-center rounded-xl bg-destructive/[0.12]'
              : 'mb-1 size-11 items-center justify-center rounded-xl bg-primary/15'
          }
        >
          <AlertTriangle size={20} color={iconColor} strokeWidth={2.2} />
        </View>
        <ModalTitle>{options?.title ?? 'Подтвердите действие'}</ModalTitle>
        {options?.description ? (
          <ModalDescription>{options.description}</ModalDescription>
        ) : null}
      </ModalHeader>
      <ModalFooter>
        <Button variant="outline" onPress={() => resolveWith(false)}>
          {options?.cancelText ?? 'Отмена'}
        </Button>
        <Button
          variant={destructive ? 'destructive' : 'default'}
          onPress={() => resolveWith(true)}
        >
          {options?.confirmText ?? 'Удалить'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
