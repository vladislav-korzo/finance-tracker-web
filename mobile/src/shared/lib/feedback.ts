import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

/**
 * Thin wrapper over `react-native-toast-message` that preserves the web
 * `toast` surface (`sonner`-style) used across the app.
 *
 * NOTE: a `<Toast />` root component must be mounted once near the navigation
 * root for these calls to render anything (see the navigation/app shell).
 */
/** sonner-compatible options subset used across the app (callers pass `{ description }`). */
export type ToastOptions = {
  description?: string;
  duration?: number;
};

function show(
  type: 'success' | 'error' | 'info',
  message: string,
  opts?: ToastOptions,
): void {
  Toast.show({
    type,
    text1: message,
    text2: opts?.description,
    visibilityTime: opts?.duration,
  });
}

export const toast = {
  success(message: string, opts?: ToastOptions): void {
    show('success', message, opts);
  },
  error(message: string, opts?: ToastOptions): void {
    show('error', message, opts);
  },
  info(message: string, opts?: ToastOptions): void {
    show('info', message, opts);
  },
  /** No dedicated "message" toast type on native; map to the neutral info toast. */
  message(message: string, opts?: ToastOptions): void {
    show('info', message, opts);
  },
};

/** A celebratory haptic burst for delightful moments (income, goal reached). */
export function celebrate(intensity: 'small' | 'big' = 'small'): void {
  if (intensity === 'big') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return;
  }
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
