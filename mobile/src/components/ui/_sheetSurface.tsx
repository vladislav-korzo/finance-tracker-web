import * as React from 'react';
import { Modal, Pressable, StyleSheet, View, Platform } from 'react-native';

/**
 * Platform flag. `@gorhom/bottom-sheet`'s BottomSheetModal does not present on
 * react-native-web (its children only mount on the imperative `present()`, which
 * is a no-op there). On web we fall back to a plain RN <Modal> so sheets/pickers
 * render and can be exercised in the browser preview. Native (iOS/Android) keeps
 * using @gorhom unchanged — this surface is only mounted when Platform.OS==='web'.
 */
export const isWebPlatform = Platform.OS === 'web';

/**
 * Bottom-anchored modal surface for the web fallback. Transparent RN Modal with a
 * dim backdrop (tap to close) and a slide-up container; the caller supplies the
 * actual panel chrome (bg-popover, rounded-t-3xl, maxHeight) as `children`, mirroring
 * how the native sheet keeps its background transparent and styles an inner View.
 */
export function WebSheetSurface({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      transparent
      visible={open}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.fill}>
        <Pressable
          style={[StyleSheet.absoluteFill, styles.backdrop]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Закрыть"
        />
        <View style={styles.anchor}>{children}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(8,12,20,0.5)' },
  anchor: { width: '100%' },
});
